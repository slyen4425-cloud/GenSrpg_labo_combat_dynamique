from pathlib import Path
import csv, json, math
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

ROOT=Path("assets/library/capture/sprites/skills/fireball_2")
FRAME=512
COUNT=12
SEED=75205
Y,X=np.mgrid[0:FRAME,0:FRAME].astype(np.float32)
x=(X-FRAME/2)/(FRAME/2)
y=(Y-FRAME/2)/(FRAME/2)
r=np.sqrt(x*x+y*y)+1e-6
theta=np.arctan2(y,x)

def smooth_noise(seed, scale=9):
    rng=np.random.default_rng(seed)
    small=max(12,FRAME//scale)
    arr=(rng.random((small,small))*255).astype(np.uint8)
    im=Image.fromarray(arr,"L").resize((FRAME,FRAME),Image.Resampling.BICUBIC)
    im=im.filter(ImageFilter.GaussianBlur(max(1,FRAME/80)))
    return np.asarray(im,dtype=np.float32)/255.0

def angle_diff(a,b):
    return np.angle(np.exp(1j*(a-b)))

def fire_rgba(field, alpha_field=None, core_boost=0.0):
    f=np.clip(field,0,1.35)
    rr=np.clip(3.2*f,0,1)
    gg=np.clip((f-.10)*2.0,0,1)
    bb=np.clip((f-.55)*2.7,0,1)
    core=np.clip((f-.88)*5.0+core_boost,0,1)
    rr=np.maximum(rr,core); gg=np.maximum(gg,core*.98); bb=np.maximum(bb,core*.82)
    a=np.clip((alpha_field if alpha_field is not None else f)*1.35,0,1)
    a=np.power(a,.75)
    out=np.dstack([rr,gg,bb,a])*255
    return Image.fromarray(out.astype(np.uint8),"RGBA")

def glow(base, radius=20, opacity=.72):
    a=base.getchannel("A").filter(ImageFilter.GaussianBlur(radius))
    layer=Image.new("RGBA",base.size,(255,92,0,0))
    layer.putalpha(a.point(lambda v:int(v*opacity)))
    return Image.alpha_composite(layer,base)

def particles(im, seed, count, spread=.28, outward=0.0, fade=1.0):
    rng=np.random.default_rng(seed)
    layer=Image.new("RGBA",im.size,(0,0,0,0)); d=ImageDraw.Draw(layer,"RGBA")
    c=FRAME/2
    for _ in range(count):
        ang=rng.uniform(0,2*math.pi)
        rr=abs(rng.normal(spread*.55,spread*.32))*FRAME+outward*FRAME*rng.uniform(.2,1)
        px=c+math.cos(ang)*rr; py=c+math.sin(ang)*rr
        rad=rng.uniform(2.5,10)*fade
        d.ellipse((px-rad,py-rad,px+rad,py+rad),
                  fill=(255,int(rng.uniform(80,190)),0,int(rng.uniform(80,210)*fade)))
    return Image.alpha_composite(im,layer.filter(ImageFilter.GaussianBlur(1.1)))

def cast_frame(i):
    t=i/(COUNT-1); n=smooth_noise(SEED+100+i,10)
    radius=.12+.40*(t**.82)
    radial=np.exp(-((r/(radius+1e-5))**2)*2.15)
    phase=1.1*t+.13*math.sin(i)
    arm=np.zeros_like(r)
    for k in range(5):
        arm+=np.exp(-(angle_diff(theta,phase+k*2*math.pi/5+2.45*r)/.22)**2)
    arm=np.clip(arm,0,1)*np.exp(-((r/(radius*1.14+1e-5))**2)*1.35)
    ring=np.exp(-((r-radius*.82)/(.025+.035*t))**2)*(.35+.55*t)
    flick=.72+.36*n
    field=(radial*.78+arm*.72+ring*.35)*flick*(.42+.72*t)
    field+=np.exp(-(r/(.035+.055*t))**2)*(.55+.95*t)
    alpha=(radial*.75+arm*.65+ring*.2)*flick
    im=glow(fire_rgba(field,alpha,.04*t),18+10*t,.75)
    return particles(im,SEED+1000+i,int(7+34*t),.09+.25*t,.02*t,.45+.55*t)

def projectile_frame(i):
    t=i/(COUNT-1); phase=2*math.pi*t
    hx=.18+.035*math.sin(phase); xx=x-hx; yy=y*1.05
    rr=np.sqrt(xx*xx+yy*yy)+1e-6; th=np.arctan2(yy,xx)
    n=smooth_noise(SEED+200+i,9)
    head=np.exp(-((rr/.28)**2)*2.2)
    arms=np.zeros_like(r)
    for k in range(4):
        arms+=np.exp(-(angle_diff(th,phase*.35+k*math.pi/2+2.8*rr)/.25)**2)
    arms=np.clip(arms,0,1)*np.exp(-((rr/.34)**2)*1.35)
    tx=np.clip(-(xx+.05),0,.9); tw=.055+.15*tx
    tail=np.exp(-(yy/(tw+1e-5))**2)*np.exp(-tx/.47)*(tx>0)
    wave=np.zeros_like(r)
    for k in range(3):
        center=.07*np.sin(7*(xx+.3)+phase+k*1.7)
        wave+=np.exp(-((yy-center)/(.025+.035*tx))**2)*np.exp(-tx/.55)*(tx>0)
    field=(head*.9+arms*.72+tail*.72+wave*.28)*(.72+.38*n)
    field+=np.exp(-((rr/.09)**2)*2.1)*1.25
    alpha=(head*.85+arms*.7+tail*.85+wave*.25)*(.65+.4*n)
    im=glow(fire_rgba(field,alpha,.05),22,.78)
    rng=np.random.default_rng(SEED+2100+i)
    layer=Image.new("RGBA",im.size,(0,0,0,0)); d=ImageDraw.Draw(layer,"RGBA")
    for _ in range(32):
        px=(.50+hx/2-rng.uniform(.02,.38))*FRAME
        py=(.5+rng.normal(0,.10))*FRAME; rad=rng.uniform(2,8)
        d.ellipse((px-rad,py-rad,px+rad,py+rad),
                  fill=(255,int(rng.uniform(80,180)),0,int(rng.uniform(80,190))))
    return Image.alpha_composite(im,layer.filter(ImageFilter.GaussianBlur(1.0)))

def impact_frame(i):
    t=i/(COUNT-1); n=smooth_noise(SEED+300+i,10)
    radius=.07+.55*(t**.70); sigma=.045+.09*t
    ring=np.exp(-((r-radius)/sigma)**2)
    burst=np.exp(-((r/(.10+.30*t))**2)*1.55)*max(0,1-.70*t)
    spokes=np.zeros_like(r)
    for k in range(9):
        target=k*2*math.pi/9+.18*math.sin(i*.45+k)
        spokes+=np.exp(-(angle_diff(theta,target)/(.045+.025*t))**2)
    spokes=np.clip(spokes,0,1)*np.exp(-r/(.28+.35*t))
    decay=(1-t)**.58
    field=(ring*(.95-.28*t)+burst*1.15+spokes*.52)*(.65+.42*n)*decay
    field+=np.exp(-(r/(.035+.08*t))**2)*max(0,1-1.5*t)*1.55
    alpha=(ring*.9+burst*.78+spokes*.65)*(.62+.42*n)*max(.17,decay)
    im=glow(fire_rgba(field,alpha,.12*max(0,1-2*t)),24+8*t,.8*max(.35,decay))
    im=particles(im,SEED+3000+i,int(18+50*t),.12+.22*t,.18*t,max(.18,decay))
    if t>.55:
        layer=Image.new("RGBA",im.size,(0,0,0,0)); d=ImageDraw.Draw(layer,"RGBA")
        rng=np.random.default_rng(SEED+4000+i)
        for _ in range(15):
            ang=rng.uniform(0,2*math.pi); rr0=rng.uniform(.15,.55)*FRAME
            px=FRAME/2+math.cos(ang)*rr0; py=FRAME/2+math.sin(ang)*rr0; rad=rng.uniform(18,55)
            d.ellipse((px-rad,py-rad,px+rad,py+rad),fill=(120,35,10,int(55*(1-t)+12)))
        im=Image.alpha_composite(im,layer.filter(ImageFilter.GaussianBlur(25)))
    return im

def save_sequence(name, fn):
    fdir=ROOT/"frames"; adir=ROOT/"atlases"
    fdir.mkdir(parents=True,exist_ok=True); adir.mkdir(parents=True,exist_ok=True)
    images=[]
    for i in range(COUNT):
        im=fn(i)
        p=fdir/f"sprite_skill_fireball_2_{name}_{i+1:02d}.png"
        im.save(p,compress_level=6); images.append(im)
    atlas=Image.new("RGBA",(FRAME*COUNT,FRAME),(0,0,0,0))
    for i,im in enumerate(images): atlas.alpha_composite(im,(i*FRAME,0))
    ap=adir/f"sprite_skill_fireball_2_{name}_atlas_01.webp"
    atlas.save(ap,"WEBP",quality=88,method=5)

def write_metadata():
    rows=[]
    seq={}
    for name,ms in [("cast",60),("projectile",45),("impact",45)]:
        frames=[f"frames/sprite_skill_fireball_2_{name}_{i:02d}.png" for i in range(1,13)]
        for i,f in enumerate(frames,1): rows.append([name,i,Path(f).name,512,512])
        seq[name]={"frame_count":12,"frame_ms":ms,"loop":False,"frames":frames,
                   "atlas":f"atlases/sprite_skill_fireball_2_{name}_atlas_01.webp"}
    with (ROOT/"manifest.csv").open("w",newline="",encoding="utf-8") as f:
        w=csv.writer(f); w.writerow(["sequence","frame","file","width","height"]); w.writerows(rows)
    (ROOT/"sprite_skill_fireball_2_sequences_01.json").write_text(
        json.dumps({"frame_size":[512,512],"sequences":seq},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (ROOT/"README.md").write_text("""# Boule de feu 2 — sprites Capture HD

Pack visuel séparé de l'ancienne Boule de feu.

- 12 frames cast + 12 projectile + 12 impact
- 36 PNG RGBA natifs 512×512
- 3 atlas WebP 6144×512, 12 frames chacun
- transparence alpha réelle
- génération déterministe du lot : seed 75205
- aucun changement gameplay, collision, dégâts, énergie, cooldown ou trajectoire

Les atlas sont les ressources runtime du catalogue. Les PNG individuels sont conservés comme frames sources découpées et nommées.
""",encoding="utf-8")

def update_catalog():
    p=Path("data/assets/catalog/global-visual-assets.v1.json")
    cat=json.loads(p.read_text(encoding="utf-8"))
    defs=[
      ("pack:capture:sprite-fireball-2-cast-01","Boule de feu 2 — cast","release","cast",60),
      ("pack:capture:sprite-fireball-2-projectile-01","Boule de feu 2 — projectile","travel","projectile",45),
      ("pack:capture:sprite-fireball-2-impact-01","Boule de feu 2 — impact","impact","impact",45),
    ]
    existing={a["id"] for a in cat["assets"]}
    for aid,label,category,name,ms in defs:
        if aid in existing: raise SystemExit(f"duplicate asset id: {aid}")
        cat["assets"].append({
          "id":aid,"label":label,"assetType":"sprite","mediaType":"image","category":category,
          "tags":["skill","fire","magic",name,"capture","hd"],
          "source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},
          "resource":{"file":f"capture/sprites/skills/fireball_2/atlases/sprite_skill_fireball_2_{name}_atlas_01.webp",
                      "format":"sprite-strip","mime":"image/webp","frameCount":12,"frameMs":ms},
          "compatibility":{"uses":["combat","capture","editor"]}
        })
    cat["counts"]["assets"]+=3; cat["counts"]["sprites"]+=3
    p.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

def validate():
    for name in ("cast","projectile","impact"):
        for i in range(1,13):
            p=ROOT/"frames"/f"sprite_skill_fireball_2_{name}_{i:02d}.png"
            im=Image.open(p)
            assert im.size==(512,512) and im.mode=="RGBA" and im.getchannel("A").getextrema()[0]<255
        a=Image.open(ROOT/"atlases"/f"sprite_skill_fireball_2_{name}_atlas_01.webp")
        assert a.size==(6144,512) and a.mode=="RGBA"
    cat=json.loads(Path("data/assets/catalog/global-visual-assets.v1.json").read_text())
    ids=[a["id"] for a in cat["assets"]]
    assert len(ids)==len(set(ids))
    for s in ("cast","projectile","impact"):
        assert f"pack:capture:sprite-fireball-2-{s}-01" in ids

if __name__=="__main__":
    save_sequence("cast",cast_frame)
    save_sequence("projectile",projectile_frame)
    save_sequence("impact",impact_frame)
    write_metadata(); update_catalog(); validate()
    print("Boule de feu 2: 36 frames 512x512 + 3 atlases + catalog OK")
