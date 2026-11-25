#!/usr/bin/env python3
"""Production idle-only candidates; all animation is native Rigby2D skeletal animation."""
import hashlib,json,math,os,subprocess,sys,zipfile,copy,urllib.request
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'projects/idles'; CFG=json.loads((P/'batch.json').read_text())
RIGBY=Path(os.environ.get('RIGBY_DIR',str(Path(os.environ['RUNNER_TEMP'])/'rigby2d')))/'bin/rigby.js'
OUT=ROOT/'idle-review'; N=CFG['frames']; FPS=CFG['fps']; S=512
def cli(*args): subprocess.run(['node',str(RIGBY),*map(str,args)],check=True)
def blob(p):
    b=p.read_bytes();return hashlib.sha1(('blob '+str(len(b))+'\0').encode()+b).hexdigest()
def smooth(x):
    x=max(0,min(1,x));return x*x*(3-2*x)
def region(x,y,shape,feather):
    if isinstance(shape[0],(int,float)):
        cx,cy,rx,ry=shape
        d=(1-math.hypot((x-cx)/rx,(y-cy)/ry))*min(rx,ry)
    else:
        inside=False;distance=1e9
        for (ax,ay),(bx,by) in zip(shape,shape[1:]+shape[:1]):
            dx,dy=bx-ax,by-ay
            t=max(0,min(1,((x-ax)*dx+(y-ay)*dy)/max(1e-9,dx*dx+dy*dy)))
            distance=min(distance,math.hypot(x-ax-t*dx,y-ay-t*dy))
            if (ay>y)!=(by>y) and x<(bx-ax)*(y-ay)/(by-ay)+ax:inside=not inside
        d=distance if inside else -distance
    return smooth(.5+d/(2*feather))
def make(v):
    bones=[{'name':'root'}];names=['root'];origins=[(0,0)]
    for p in v['parts']:
        name=p['name'];x,y=p['pivot']; x,y=x-256,256-y
        parent=p['parent'];ox,oy=origins[names.index(parent)]
        bones.append({'name':name,'parent':parent,'x':x-ox,'y':y-oy});names.append(name);origins.append((x,y))
    step=8;m=S//step
    border=[(x,0) for x in range(m+1)]+[(m,y) for y in range(1,m+1)]+[(x,m) for x in range(m-1,-1,-1)]+[(0,y) for y in range(m-1,0,-1)]
    grid=border+[(x,y) for y in range(1,m) for x in range(1,m)]
    ids={xy:i for i,xy in enumerate(grid)};uv=[];vertices=[];tri=[]
    for gx,gy in grid:
        px,py=gx*step,gy*step;x,y=px-256,256-py;uv.extend([px/S,py/S])
        weights={0:1.}
        for i,p in enumerate(v['parts'],1):
            w=region(px,py,p['region'],p['feather'])
            if w<=1e-6:continue
            weights={i:a*(1-w) for i,a in weights.items() if a*(1-w)>1e-7};weights[i]=weights.get(i,0)+w
        top=sorted(weights.items(),key=lambda p:p[1],reverse=True)[:4];total=sum(w for _,w in top);vertices.append(len(top))
        for i,w in top:
            ox,oy=origins[i];vertices.extend([i,x-ox,y-oy,w/total])
    for y in range(m):
        for x in range(m):
            a,b,c,d=[ids[t] for t in [(x,y),(x+1,y),(x,y+1),(x+1,y+1)]];tri.extend([a,c,b,b,c,d])
    mesh={'type':'mesh','path':'master','uvs':uv,'triangles':tri,'vertices':vertices,'hull':len(border),'width':S,'height':S}
    return bones,names,mesh
def timeline(v):
    out={}
    def keys(fn):return [dict(time=i/FPS,**fn(i)) for i in range(N+1)]
    def pulse(k,lag=0):return (math.cos(lag)-math.cos(2*math.pi*k/N-lag))/2
    def wave(k,lag=0):return math.sin(2*math.pi*k/N-lag)+math.sin(lag)
    if v.get('hover',0):out['root']={'translate':keys(lambda k:{'x':0,'y':v['hover']*pulse(k)})}
    for p in v['parts']:
        mot=p['motion'];lag=mot.get('phase',0);d={}
        if 'sx' in mot or 'sy' in mot:
            d['scale']=keys(lambda k:{'x':1+mot.get('sx',0)*pulse(k,lag),'y':1+mot.get('sy',0)*pulse(k,lag)})
        if 'rot' in mot:d['rotate']=keys(lambda k:{'value':mot['rot']*wave(k,lag)})
        if 'dy' in mot or 'dx' in mot:
            d['translate']=keys(lambda k:{'x':mot.get('dx',0)*pulse(k,lag),'y':mot.get('dy',0)*pulse(k,lag)})
        out[p['name']]=d
    return out
def prepare(work,v):
    master=work/'images/master.png'
    if 'sourcePath' not in v:
        assert blob(master)==v['blob'],master
        return master,v
    # Only source preparation, before native rendering. Preserve complete source canvas and alpha.
    work.mkdir(parents=True,exist_ok=True)
    source=work/('source'+Path(v['sourcePath']).suffix)
    url='https://raw.githubusercontent.com/'+CFG['source']['repository']+'/'+CFG['source']['ref']+'/'+v['sourcePath']
    source.write_bytes((Path(os.environ['CANONICAL_ROOT'])/v['sourcePath']).read_bytes())
    assert blob(source)==v['blob'],source
    with Image.open(source) as im:
        assert im.width==im.height and 'A' in im.getbands(),(source,im.size,im.mode)
        side=v['normalizedSize']; offset=(S-side)//2
        normalized=Image.new('RGBA',(S,S))
        normalized.paste(im.convert('RGBA').resize((side,side),Image.Resampling.LANCZOS),(offset,offset))
        master.parent.mkdir(parents=True,exist_ok=True);normalized.save(master)
    copyv=copy.deepcopy(v);factor=side/v['coordCanvas']
    def point(p):return [offset+p[0]*factor,offset+p[1]*factor]
    for part in copyv['parts']:
        part['pivot']=point(part['pivot']);r=part['region']
        if isinstance(r[0],(int,float)):part['region']=point(r[:2])+[r[2]*factor,r[3]*factor]
        else:part['region']=[point(p) for p in r]
        part['feather']*=factor
    return master,copyv
def render(id,side,c,v):
    work=P/id/side; master,v=prepare(work,v)
    with Image.open(master) as im:
        assert im.size==(S,S) and im.mode=='RGBA',(master,im.size,im.mode)
        bb=im.getchannel('A').getbbox();assert bb and min(bb[0],bb[1],S-bb[2],S-bb[3])>=CFG['margin'],(master,bb)
    bones,names,mesh=make(v); animated=timeline(v)
    doc={'skeleton':{'spine':'4.2','images':'./images/'},'bones':bones,'slots':[{'name':'creature','bone':'root','attachment':'master'}],'skins':[{'name':'default','attachments':{'creature':{'master':mesh}}}],'animations':{'idle':{'bones':animated}}}
    raw=work/'candidate.json';raw.write_text(json.dumps(doc));converted=work/'converted.rigby';rig=work/'idle.rigby'
    cli('convert',raw,converted,'--force')
    with zipfile.ZipFile(converted) as z,zipfile.ZipFile(rig,'w',zipfile.ZIP_DEFLATED) as dest:
        for n in z.namelist():
            data=z.read(n)
            if n=='project.json':
                native=json.loads(data);native.setdefault('settings',{}).update({'width':S,'height':S,'fps':FPS,'background':None,'frame':{'x':0,'y':0,'scale':1}});data=json.dumps(native).encode()
            dest.writestr(n,data)
    cli('validate',rig);target=OUT/id/side;target.mkdir(parents=True,exist_ok=True)
    ins=subprocess.check_output(['node',str(RIGBY),'animation',str(rig),'idle','--json'],text=True)
    parsed=json.loads(ins);assert set(a['bone'] for a in parsed['bones'])==set(animated)
    (target/'animation.json').write_text(ins);(target/'idle.rigby').write_bytes(rig.read_bytes());(target/'master.png').write_bytes(master.read_bytes())
    frames=target/'frames';frames.mkdir(exist_ok=True)
    cli('render',rig,'--animation','idle','--out',str(frames)+'/', '--format','png','--width',S,'--height',S,'--fps',FPS,'--start',0,'--end',N-1,'--background','none','--engine','chromium','--allow-software')
    subprocess.run([sys.executable,str(ROOT/'scripts/package.py'),'--out',str(target),'--master',str(master),'--count',str(N),'--margin',str(CFG['margin']),'--fps',str(FPS)],check=True)
    paths=sorted(frames.glob('*.png')); assert len({hashlib.sha256(p.read_bytes()).hexdigest() for p in paths})==N
    if not v.get('hover',0):
        # Grounded creatures: never animate root or move the contact points globally.
        assert 'root' not in animated
    report=json.loads((target/'manifest.json').read_text())
    report.update({'creature':id,'view':side,'sourceBlob':v['blob'],'morphology':c['morphology'],'engine':'Rigby2D 0.6.1','action':'idle','playback':'loop','animatedBones':len(animated),'candidate':True,'normalizedMaster':bool(v.get('sourcePath'))})
    (target/'manifest.json').write_text(json.dumps(report,indent=2))
    print('IDLE PASS',id,side,len(animated),flush=True)
if __name__=='__main__':
    errors=[]
    for id,c in CFG['creatures'].items():
        for side,v in c['views'].items():
            try:render(id,side,c,v)
            except Exception as e:
                errors.append({'id':id,'side':side,'error':repr(e)})
                print('IDLE FAILED',id,side,repr(e),flush=True)
    OUT.mkdir(exist_ok=True);(OUT/'batch-status.json').write_text(json.dumps(errors,indent=2))
    if errors:raise SystemExit(f'{len(errors)} clips failed; no technical GREEN')
