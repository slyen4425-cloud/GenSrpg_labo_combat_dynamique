from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageStat
import argparse, hashlib, json, shutil, zipfile

def digest(im): return hashlib.sha256(im.tobytes()).hexdigest()
def margins(im):
    x0,y0,x1,y1=im.getchannel('A').getbbox()
    return [x0,y0,512-x1,512-y1]
def premult(im):
    a=im.getchannel('A')
    return Image.merge('RGBA',tuple(ImageChops.multiply(c,a) for c in im.split()[:3])+(a,))

def package(out, master=None, count=None, margin=0, fps=12):
    paths=sorted((out/'frames').glob('*.png'))
    if len(paths)<2 or count is not None and len(paths)!=count:
        raise SystemExit(f'Nombre de frames incorrect: {len(paths)}')
    frames=[]
    for path in paths:
        with Image.open(path) as src:
            if src.size!=(512,512) or 'A' not in src.getbands():
                raise SystemExit(f'Format incorrect : {path}')
            im=src.convert('RGBA')
            lo,hi=im.getchannel('A').getextrema()
            if lo!=0 or hi==0:
                raise SystemExit(f'PNG vide ou sans fond transparent : {path}')
            if min(margins(im))<margin:
                raise SystemExit(f'Marge insuffisante : {path} {margins(im)}')
            frames.append(im)
    if len(set(map(digest,frames)))<2:
        raise SystemExit('Animation immobile')
    report={'frames':len(frames),'size':[512,512],'fps':fps,'status':'technical-check-only','visual_approval':False,'margins':[margins(im) for im in frames]}
    if master:
        with Image.open(master) as src:
            original=src.convert('RGBA')
        # GPU premultiplication may round translucent colors. Gate on raw pose BEFORE exact master.
        raw=frames[0]
        diff=ImageChops.difference(premult(original),premult(raw))
        mean=ImageStat.Stat(diff).mean
        box_delta=max(abs(a-b) for a,b in zip(original.getchannel('A').getbbox(),raw.getchannel('A').getbbox()))
        if max(mean)>1.0 or box_delta>1:
            raise SystemExit(f'Premiere pose Rigby2D non conforme au master: MAE={mean} delta bbox={box_delta}')
        if min(margins(original))<margin:
            raise SystemExit('Master hors marges')
        # Preserve the exact approved bytes as frame 01, not a resampled reconstruction.
        shutil.copyfile(paths[0],out/'raw_rigby_frame_01.png')
        shutil.copyfile(master,paths[0])
        frames[0]=original
        report.update({'frame01_exact':digest(frames[0])==digest(original),'raw_pose_mean_difference':mean,'raw_pose_bbox_delta':box_delta,'master_file_sha256':hashlib.sha256(master.read_bytes()).hexdigest()})
        # Independently verify movement on both sides; the unchanged master cannot satisfy this test.
        for box in [(40,90,145,460),(365,90,472,460)]:
            if not any(ImageChops.difference(premult(original).crop(box),premult(im).crop(box)).convert('RGB').getbbox() for im in frames[1:]):
                raise SystemExit('Aile sans mouvement')
        # Numbered contact sheet and exact model comparison for review only.
        sheet=Image.new('RGB',(4*256,((len(frames)+3)//4)*280),(32,35,45))
        draw=ImageDraw.Draw(sheet)
        for i,im in enumerate(frames):
            x,y=(i%4)*256,(i//4)*280
            thumb=im.resize((256,256),Image.Resampling.LANCZOS)
            sheet.paste(thumb,(x,y),thumb)
            draw.text((x+8,y+258),f'Frame {i+1:02d}',fill='white')
        sheet.save(out/'contact.png')
        compare=Image.new('RGB',(1024,540),(32,35,45))
        for i,im in enumerate([original,raw]):
            compare.paste(im,(512*i,0),im)
            ImageDraw.Draw(compare).text((512*i+12,516),['Master officiel','Pose 01 brute Rigby2D'][i],fill='white')
        compare.save(out/'comparison.png')
    frames[0].save(out/'preview.png',save_all=True,append_images=frames[1:],duration=round(1000/fps),loop=0,disposal=1,blend=0)
    frames[0].save(out/'preview.gif',save_all=True,append_images=frames[1:],duration=round(1000/fps/10)*10,loop=0,disposal=2)
    (out/'manifest.json').write_text(json.dumps(report,indent=2))
    extras=[out/'manifest.json',out/'preview.gif',out/'preview.png']
    if master: extras.extend([out/'contact.png',out/'comparison.png',out/'raw_rigby_frame_01.png'])
    with zipfile.ZipFile(out/'sprites.zip','w',zipfile.ZIP_DEFLATED) as z:
        for path in paths+extras: z.write(path,path.relative_to(out))
    print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--out',type=Path,default=Path('output'))
    p.add_argument('--master',type=Path)
    p.add_argument('--count',type=int)
    p.add_argument('--margin',type=int,default=0)
    p.add_argument('--fps',type=int,default=12)
    a=p.parse_args()
    package(a.out,a.master,a.count,a.margin,a.fps)
