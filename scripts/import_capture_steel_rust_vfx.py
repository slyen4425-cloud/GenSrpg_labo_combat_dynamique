#!/usr/bin/env python3
"""Deterministic import of five real Capture steel/rust VFX strips; no gameplay changes."""
import csv, hashlib, io, json, os
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE_DIR=ROOT/'assets/library/capture/sprites/source/steel_rust_vfx_20261018'
SKILLS_DIR=ROOT/'assets/library/capture/sprites/skills'
CATALOG=ROOT/'data/assets/catalog/global-visual-assets.v1.json'

SPECS=[
 ('steel_carapace','fade','Carapace d’acier — formation puis dissipation','skill',85,'pack:capture:sprite-steel-carapace-fade-01',False,'steel','defense'),
 ('steel_carapace','hold','Carapace d’acier — formation et maintien','skill',85,'pack:capture:sprite-steel-carapace-hold-01',True,'steel','defense'),
 ('steel_wing_impact','impact','Aile acier — Impact','impact',65,'pack:capture:sprite-steel-wing-impact-01',False,'steel','impact'),
 ('rust_whirlwind','cast','Tourbillon de rouille — Cast','release',75,'pack:capture:sprite-rust-whirlwind-cast-01',False,'steel','cast'),
 ('steel_wing_projectile','projectile','Aile acier — Projectile','travel',65,'pack:capture:sprite-steel-wing-projectile-01',False,'steel','projectile'),
]


def sha256(b):return hashlib.sha256(b).hexdigest()

def verify_image(source,record):
    data=source.read_bytes()
    assert sha256(data)==record['transportSha256'], f'Input source checksum mismatch: {source.name}'
    im=Image.open(io.BytesIO(data));im.load()
    assert im.format=='WEBP' and im.size==(1402,1122) and 'A' in im.getbands(),f'Wrong sheet: {source.name}'
    return im.convert('RGBA'),data

def crop_sheet_frame(src,frame_index):
    col=frame_index%5; row=frame_index//5
    width,height=src.size
    # Unequal fractional columns/rows distributed by nearest integer boundaries.
    x0=round(col*width/5);x1=round((col+1)*width/5)
    y0=round(row*height/4);y1=round((row+1)*height/4)
    # Remove thin drawing separators and bleed at each cell edge.
    patch=src.crop((x0+3,y0+3,x1-3,y1-3))
    patch=patch.resize((512,512),Image.Resampling.LANCZOS)
    # Clear compressor-produced near-zero alpha haze; retain real translucent VFX.
    alpha=patch.getchannel("A").point(lambda a:0 if a<6 else a)
    patch.putalpha(alpha)
    # Ghost pixel cleanup only: fully invisible pixels must not carry a semi-opaque dark line.
    # Keep meaningful black/shadow pixels inside the effect; strips are removed geometrically above.
    return patch

def main():
    SOURCES=json.loads((SOURCE_DIR/'sources.json').read_text('utf-8'))
    assert len(SOURCES['sheets'])==5
    bykey={r['key']:r for r in SOURCES['sheets']}
    expected_keys={folder+'_'+role for folder,role,*_ in SPECS}
    assert set(bykey)==expected_keys
    existing_catalog=CATALOG.exists()
    if existing_catalog:
        catalog=json.loads(CATALOG.read_text('utf-8'))
        assert catalog['storage']['branch']=='global-assets'
        existing={a['id'] for a in catalog['assets']}
        assert all(s[5] not in existing for s in SPECS), 'Existing canonical assetId; do not overwrite'
    created=[]; manifest_by_folder={}; hash_by_key={}
    for folder,role,label,category,ms,assetid,hold,element,kind in SPECS:
        key=folder+'_'+role
        source_entry=bykey[key]
        src,source_bytes=verify_image(SOURCE_DIR/source_entry['file'],source_entry)
        outbase=SKILLS_DIR/folder
        framesdir=outbase/'frames';atlasesdir=outbase/'atlases'
        framesdir.mkdir(parents=True,exist_ok=True)
        atlasesdir.mkdir(parents=True,exist_ok=True)
        frames=[];frame_hashes=[];atlas=Image.new('RGBA',(7680,384),(0,0,0,0))
        for n in range(20):
            crop=crop_sheet_frame(src,n)
            assert crop.getchannel('A').getextrema()[0]==0 and crop.getchannel('A').getextrema()[1]>100
            rel=f'frames/sprite_skill_{key}_{n+1:02d}.png'
            dest=outbase/rel
            crop.save(dest,'PNG',compress_level=6)
            b=dest.read_bytes()
            assert b[:8]==b'\x89PNG\r\n\x1a\n'
            frames.append(rel);frame_hashes.append(sha256(b));created.append(dest)
            atlas.alpha_composite(crop.resize((384,384),Image.Resampling.LANCZOS),(n*384,0))
        atlas_rel=f'atlases/sprite_skill_{key}_atlas_01.webp'
        atlasfile=outbase/atlas_rel
        atlas.save(atlasfile,'WEBP',quality=82,method=2,exact=True)
        with Image.open(atlasfile) as check:
            assert check.size==(7680,384) and 'A' in check.getbands()
        created.append(atlasfile)
        sig=sha256(atlasfile.read_bytes())
        seq={
            'assetId':assetid,'label':label,'category':category,'sourceSheet':source_entry['file'],
            'sourcePngSha256':source_entry['originalPngSha256'],'sourceWebpSha256':source_entry['transportSha256'],
            'sourceGrid':[5,4],'nativeSourceSize':[1402,1122],
            'frameSize':[512,512],'native512':False,
            'frameCount':20,'frameMs':ms,'playbackMode':'once',
            'holdLastFrame':hold,'holdFrameIndex':19 if hold else None,
            'frames':frames,'frameSha256':frame_hashes,
            'atlas':{'file':atlas_rel,'format':'sprite-strip','frameCount':20,'frameWidth':384,'frameHeight':384,'sha256':sig},
        }
        manifest_by_folder.setdefault(folder,{'schema':'capture-steel-rust-sprite-sequences-v1','sequences':{}})['sequences'][role]=seq
        hash_by_key[key]=seq
    for folder,m in manifest_by_folder.items():
        p=SKILLS_DIR/folder/('sprite_skill_'+folder+'_sequences_01.json')
        p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');created.append(p)
        p=SKILLS_DIR/folder/'provenance.csv'
        with p.open('w',newline='',encoding='utf-8') as f:
            w=csv.writer(f);w.writerow(['key','frame','file','sha256','source_webp_sha256'])
            for role,seq in m['sequences'].items():
                for i,(file,h) in enumerate(zip(seq['frames'],seq['frameSha256']),1):w.writerow([folder+'_'+role,i,file,h,seq['sourceWebpSha256']])
        created.append(p)
    if existing_catalog:
        for folder,role,label,category,ms,assetid,hold,element,kind in SPECS:
            key=folder+'_'+role;seq=hash_by_key[key]
            resource={
                'file':f'capture/sprites/skills/{folder}/{seq["atlas"]["file"]}',
                'format':'sprite-strip','mime':'image/webp','frameCount':20,
                'frameMs':ms,'playbackMode':'once',
            }
            if hold:resource['holdLastFrame']=True
            catalog['assets'].append({
                'id':assetid,'label':label,'assetType':'sprite','mediaType':'image',
                'category':category,'tags':['capture','skill',element,kind,'animated','hd'],
                'source':{'scope':'pack','packId':'capture','author':'GenSrpG','license':'project-internal'},
                'resource':resource,'compatibility':{'uses':['combat','capture','editor']},
            })
        catalog['counts']['assets']=len(catalog['assets'])
        catalog['counts']['sprites']=sum(x['assetType']=='sprite' for x in catalog['assets'])
        assert len(set(a['id'] for a in catalog['assets']))==len(catalog['assets'])
        CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    import shutil
    template=ROOT/'scripts/capture_steel_rust.test.template.mjs'
    assert template.is_file()
    finaltest=ROOT/'tests/unit/capture-steel-rust-vfx-20261018.test.mjs'
    finaltest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(template,finaltest)
    print(json.dumps({'testsWritten':str(finaltest.relative_to(ROOT))}))
    print(json.dumps({'sequences':len(SPECS),'frames':sum(len(x['frames']) for x in hash_by_key.values()),
                     'atlases':len(SPECS),'files':len(created),'keySha':{k:v['atlas']['sha256'] for k,v in hash_by_key.items()}},ensure_ascii=False))
if __name__=='__main__':main()