#!/usr/bin/env python3
"""Backgrounds Monster InvoC, based ONLY on original global-assets art.
Output is an isolated distributable pack, never an alternative asset authority.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from pathlib import Path
import random, math, json, zipfile
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"_monster_invo_wallpaper_output"
OUT.mkdir(exist_ok=True)
A=ROOT/"assets/library/capture/creatures"
ARENAS=ROOT/"assets/library/core/arenas"
SETS=[
 ("01_clairiere_des_esprits","forest/arena_forest_01.png",
  [(A/"renard_lunaire/runtime/renard_lunaire_face.webp",.035,.37,.60,(175,115,255)),
   (A/"raiiven/runtime/raiiven_face.png",.72,.34,.62,(152,65,240)),
   (A/"ephemus/runtime/ephemus_face.png",.63,.08,.28,(219,142,255))],
  [(A/"renard_lunaire/runtime/renard_lunaire_face.webp",.06,.57,.37,(175,115,255)),
   (A/"raiiven/runtime/raiiven_face.png",.30,.74,.28,(152,65,240)),
   (A/"ephemus/runtime/ephemus_face.png",.51,.10,.22,(219,142,255))],
  (30,13,83),"Kitsune Lunaire, Raiiven, Ephemus"),
 ("02_terres_de_polocendre","lava/arena_lava_01.webp",
  [(A/"cheval-de-feu/runtime/face.webp",.07,.16,.74,(255,108,25))],
  [(A/"cheval-de-feu/runtime/face.webp",.08,.56,.38,(255,112,12))],
  (90,12,4),"Polocendre"),
 ("03_sentinelles_des_glaces","snow/arena_snow_01.webp",
  [(A/"gorille_des_glaces/runtime/gorille_des_glaces_face.png",.08,.19,.74,(47,184,249)),
   (A/"veldra/runtime/veldra_face.png",.74,.09,.38,(255,209,104))],
  [(A/"gorille_des_glaces/runtime/gorille_des_glaces_face.png",.02,.53,.45,(59,181,245)),
   (A/"veldra/runtime/veldra_face.png",.50,.08,.35,(255,204,86))],
  (22,65,105),"Gorice, Veldra"),
]
def open_rgba(fp):
    img=Image.open(fp).convert("RGBA")
    box=img.getchannel("A").getbbox()
    return img.crop(box) if box else img
def cover(fp, size, pos=(.5,.55)):
    return ImageOps.fit(open_rgba(fp),size,Image.Resampling.LANCZOS,centering=pos)
def light_at(im,x,y,rad,col,amp=130):
    w,h=im.size
    ly=Image.new("RGBA",(w,h),(0,0,0,0))
    d=ImageDraw.Draw(ly)
    for i in range(10,0,-1):
        r=max(1,int(rad*i/10))
        al=int((amp/10)*(1-i/12))
        d.ellipse((x-r,y-r,x+r,y+r),fill=(*col,al))
    im.alpha_composite(ly)
def scene_background(fp,size,tint,portrait,seed):
    W,H=size
    bg=cover(fp,size,((.50,.52) if not portrait else (.52,.5)))
    # Do not duplicate or stretch creature art when rotating.
    if portrait:
        soft=bg.filter(ImageFilter.GaussianBlur(5))
        bg=Image.blend(bg,soft,.23)
    # Theme-specific screen color grade.
    sheet=Image.new("RGBA",size,tint+(75 if tint[0]<50 else 37,))
    bg=Image.alpha_composite(bg,sheet)
    # Slight deep blue gradient behind the menu region, no text burned in.
    shade=Image.new("RGBA",size,(0,0,0,0))
    dr=ImageDraw.Draw(shade)
    for y in range(H):
        xx=y/H
        if portrait:
            amount=int(58*max(0,1-abs(xx-.43)/.26))
        else:
            amount=int(38*max(0,1-abs(xx-.40)/.30))
        dr.line((0,y,W,y),fill=(6,10,26,amount),width=1)
    bg.alpha_composite(shade)
    rng=random.Random(seed)
    # Diegetic embers, luminous motes, or ice dust.
    p=Image.new("RGBA",size)
    pd=ImageDraw.Draw(p)
    if tint[0]>75:
        cols=[(255,161,48),(255,212,89),(246,99,28)]
    elif tint[1]>45:
        cols=[(193,243,255),(205,226,255),(255,244,207)]
    else:
        cols=[(187,131,255),(139,230,255),(255,176,246)]
    for i in range(140 if not portrait else 170):
        x=rng.randrange(W);y=rng.randrange(H)
        rr=rng.choice([1,1,2,2,3,4])
        c=cols[rng.randrange(len(cols))]
        pd.ellipse((x-rr,y-rr,x+rr,y+rr),fill=(*c,rng.randrange(70,175)))
    bg.alpha_composite(p)
    return bg
def put_model(base,filename,nx,ny,nh,glow,portrait):
    W,H=base.size
    src=open_rgba(filename)
    # Original sprites, their pixels, colors, and silhouettes stay unchanged.
    ht=int(nh*H)
    wd=int(ht*src.width/src.height)
    if not portrait and wd>W*.33:
        wd=int(W*.33);ht=int(wd*src.height/src.width)
    if portrait and wd>W*.82:
        wd=int(W*.82);ht=int(wd*src.height/src.width)
    src=src.resize((wd,ht),Image.Resampling.LANCZOS)
    x=int(nx*W);y=int(ny*H)
    x=min(x,W-wd-4); y=min(y,H-ht-4)
    a=src.getchannel("A")
    # Colored rim glow on an independent layer, never edits the game model.
    halo=Image.new("RGBA",src.size,(*glow,0))
    halo.putalpha(a)
    blur=halo.filter(ImageFilter.GaussianBlur(36 if not portrait else 28))
    glow_sheet=Image.new("RGBA",base.size,(0,0,0,0))
    glow_sheet.paste(blur,(x,y),blur.getchannel("A"))
    base.alpha_composite(glow_sheet)
    # Contact shadow gives the official model grounding in the arena.
    shadow=Image.new("RGBA",base.size,(0,0,0,0))
    d=ImageDraw.Draw(shadow)
    ey=y+ht*.95;ew=wd*.38
    d.ellipse((x+wd*.50-ew/2,ey-12,x+wd*.50+ew/2,ey+16),fill=(6,7,14,115))
    base.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    base.paste(src,(x,y),a)
def generate(group,background,wmodels,pmodels,tint,names):
    for orientation,size,models in [("paysage",(2400,1080),wmodels),
                                    ("portrait",(1080,2400),pmodels)]:
        pic=scene_background(ARENAS/background,size,tint,orientation=="portrait",sum(map(ord,group))+len(orientation))
        for path,nx,ny,nh,glow in models:put_model(pic,path,nx,ny,nh,glow,orientation=="portrait")
        path=OUT/f"{group}_{orientation}.png"
        pic.convert("RGB").save(path,format="PNG",optimize=True)
        print(path.relative_to(ROOT),path.stat().st_size)
    return {"theme":group,"original_creatures":names,"sources":str(background),"resolutions":["2400x1080","1080x2400"]}
def main():
    catalog=[generate(*v) for v in SETS]
    (OUT/"README.txt").write_text(
      "Genesis RPG / Monster InvoC - 3 fonds avec les VRAIS modèles du Labo Combat.\n"
      "Fichiers paysage 2400x1080, portrait 1080x2400.\n"
      "Source de chaque creature: branche global-assets du Labo Combat.\n"
      "Arènes officielles foret/lave/neige; zéro sprite inventé; aucune modification runtime.\n"
      "Aucune installation ni fusion PWA realisee.\n",encoding="utf-8")
    (OUT/"sources.json").write_text(json.dumps(catalog,indent=2,ensure_ascii=False),encoding="utf-8")
    with zipfile.ZipFile(OUT/"MonsterInvoC_3_fonds_creatures_officielles.zip","w",compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for f in OUT.iterdir():
            if f.is_file() and f.suffix!=".zip":z.write(f,f.name)
if __name__=="__main__":main()
