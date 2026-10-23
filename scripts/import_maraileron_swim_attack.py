#!/usr/bin/env python3
"""Import original Maraileron swimming/attack images from authored ZIP."""
import io,json,hashlib,pathlib,zipfile
from PIL import Image
R=pathlib.Path(__file__).resolve().parents[1]
ZIP="CREATURE_AQUATIQUE_2_ANIMATIONS_NAGE_ATTAQUE.zip"
ZSHA="397e5435260bbb48f0c33591c1a2eb15c51942e4857a552e4e38e70ad018ea2a"
ROOT=R/"assets/library/capture/creatures/maraileron/animations"
CAT=R/"data/assets/catalog/global-visual-assets.v1.json"
PARAM={"movement":("NAGE_ONDULATION_6_FRAMES","ondulation_fluide",6,90,"loop",90),
       "attack":("ATTAQUE_12_FRAMES","attaque_aquatique",12,100,"once",56)}
def sha(b):return hashlib.sha256(b).hexdigest()
def encode(im,format,**kw):
 b=io.BytesIO();im.save(b,format=format,**kw);return b.getvalue()
def main():
 data=(R/"_incoming"/ZIP).read_bytes()
 assert sha(data)==ZSHA
 cat=json.loads(CAT.read_text(encoding="utf8"))
 assert cat["counts"]["assets"]==len(cat["assets"])
 old={a["id"] for a in cat["assets"]}
 assert len(old)==len(cat["assets"])
 pending={};added=[]
 with zipfile.ZipFile(io.BytesIO(data)) as z:
  assert z.testzip() is None
  source_manifest=json.loads(z.read("ATTAQUE_12_FRAMES/manifest.json"))
  assert source_manifest["frameCount"]==12
  for action,(folder,stem,n,ms,mode,minmargin) in PARAM.items():
   out=ROOT/action/"player"
   assetid=f"pack:capture:creature-maraileron-{action}-player-{n}-v1"
   assert assetid not in old
   m={"schema":"capture-creature-animation-v1","creatureId":"maraileron","action":action,
      "view":"player","profile":"serpentine","assetId":assetid,"frameCount":n,
      "frameSize":[512,512],"frameMs":ms,"playbackMode":mode,"authorApproved":True,
      "sourceArchive":"_incoming/"+ZIP,"sourceArchiveSha256":ZSHA,"frames":[]}
   strip=Image.new("RGBA",(384*n,384))
   images=[];seen=set()
   for i in range(1,n+1):
    source=f"{folder}/{stem}_{i:02d}.png"
    framebytes=z.read(source)
    img=Image.open(io.BytesIO(framebytes))
    assert img.size==(512,512) and img.mode=="RGBA",source
    alpha=img.getchannel("A")
    bbox=alpha.point(lambda a:255 if a>8 else 0).getbbox()
    assert bbox and alpha.getextrema()==(0,255),source
    margins=[bbox[0],bbox[1],512-bbox[2],512-bbox[3]]
    assert min(margins)>=minmargin,(source,margins)
    h=sha(framebytes);assert h not in seen;seen.add(h)
    if action=="attack":assert source_manifest["frames"][i-1]["sha256"]==h
    target=f"frames/maraileron_{action}_player_{i:02d}.png"
    pending[out/target]=framebytes
    m["frames"].append({"index":i-1,"file":target,"sha256":h,
                        "marginsLTRB":margins,"zipPath":source})
    strip.paste(img.resize((384,384),Image.Resampling.LANCZOS),((i-1)*384,0))
    images.append(img)
   stripname=f"atlases/maraileron_{action}_player_{n}_atlas.webp"
   stripbytes=encode(strip,"WEBP",quality=90,method=4)
   pending[out/stripname]=stripbytes
   m["atlas"]={"file":stripname,"format":"sprite-strip","frameCount":n,
               "frameWidth":384,"frameHeight":384,"sha256":sha(stripbytes)}
   sources=({"gif":"NAGE_ONDULATION_6_FRAMES/ONDULATION_AQUATIQUE_BOUCLE_FLUIDE_6_FRAMES.gif",
             "planche":"NAGE_ONDULATION_6_FRAMES/PLANCHE_ONDULATION_AQUATIQUE_BOUCLE_FLUIDE_6_FRAMES.png"}
            if action=="movement" else
            {"gif":"ATTAQUE_12_FRAMES/CREATURE_AQUATIQUE_ATTAQUE_12_FRAMES_PREVIEW.gif",
             "webp":"ATTAQUE_12_FRAMES/CREATURE_AQUATIQUE_ATTAQUE_12_FRAMES_PREVIEW.webp",
             "planche":"ATTAQUE_12_FRAMES/CREATURE_AQUATIQUE_ATTAQUE_PLANCHE_12_FRAMES_ESPACEE.png"})
   m["previews"]={}
   for kind,source in sources.items():
    ext="png" if kind=="planche" else kind
    dest=f"previews/maraileron_{action}_player_{n}_{kind}.{ext}"
    pending[out/dest]=z.read(source)
    m["previews"][kind]=dest
   if action=="movement":
    small=[im.resize((320,320),Image.Resampling.LANCZOS) for im in images]
    dest=f"previews/maraileron_{action}_player_{n}_webp.webp"
    pending[out/dest]=encode(small[0],"WEBP",save_all=True,
        append_images=small[1:],duration=ms,loop=0,quality=90,method=4)
    m["previews"]["webp"]=dest
   m["preview"]=m["previews"]["gif"]
   pending[out/(action+".manifest.json")]=(json.dumps(m,ensure_ascii=False,indent=2)+"\n").encode()
   added.append({"id":assetid,
     "label":"Maraileron — "+("nage ondulante" if action=="movement" else "attaque")+" côté joueur ("+str(n)+" frames)",
     "assetType":"sprite","mediaType":"image","category":"creature",
     "tags":["capture","creature","maraileron","water","serpentine",action,"animated","player"]+
            (["swim","swimming"] if action=="movement" else []),
     "source":{"scope":"pack","packId":"capture","author":"GenSrpG / visuels validés 2026-10-23","license":"project-internal"},
     "resource":{"file":f"capture/creatures/maraileron/animations/{action}/player/{stripname}",
       "format":"sprite-strip","mime":"image/webp","frameCount":n,"frameMs":ms,"playbackMode":mode},
     "compatibility":{"uses":["combat","capture","editor"]}})
  pending[ROOT/"sources"/"attack_author_manifest.json"]=z.read("ATTAQUE_12_FRAMES/manifest.json")
  pending[ROOT/"sources"/"original_readme.txt"]=z.read("README.txt")
 assert len(pending)==30,len(pending)
 assert all(not p.exists() for p in pending),"Would overwrite existing media"
 for p,b in pending.items():
  p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
 cat["assets"].extend(added)
 for key in ("assets","sprites","creatures"):cat["counts"][key]+=2
 assert cat["counts"]["assets"]==len(cat["assets"])
 CAT.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 test=R/"tests/unit/maraileron-swim-attack-assets.test.mjs"
 assert not test.exists()
 test.write_text((R/"scripts/maraileron-swim-attack.test.template.mjs").read_text(),encoding="utf8")
 print("Imported: 18 real PNG / 2 WebP atlases / 6 previews / 2 manifests / 2 sources, +2 catalog assets")
if __name__=="__main__":main()
