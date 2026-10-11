#!/usr/bin/env python3
"""Reproducible extraction of transparent Air VFX 20f from verified source atlas."""
from pathlib import Path
from PIL import Image
import hashlib, json, csv

ROOT=Path(__file__).resolve().parents[1]
ITEMS=[
  {
    "slug": "wind_charge",
    "label": "Charge de vent",
    "category": "release",
    "frameMs": 80,
    "playback": "once",
    "sourceHash": "2b87e3d35b70d17564de8395be3957005914cbd6fb3e4604fe9501f22caf709a"
  },
  {
    "slug": "wind_bolt",
    "label": "Projectile — Rafale de vent",
    "category": "travel",
    "frameMs": 65,
    "playback": "loop",
    "sourceHash": "82436f328c67acc854d64af6aba14d9e633fafbc5e517d58211acb5977f0fee7"
  },
  {
    "slug": "wind_tornado",
    "label": "Projectile — Tornade",
    "category": "travel",
    "frameMs": 70,
    "playback": "loop",
    "sourceHash": "de9ccc4584c67f81db0fa441e5c3c4586fc8dbf74e3184948927891492c6f273"
  },
  {
    "slug": "wind_impact",
    "label": "Impact de vent",
    "category": "impact",
    "frameMs": 65,
    "playback": "once",
    "sourceHash": "128a2417bfafa13068325d5b1e86f65a18bb8a68c5babf41fffb88db9ef5a4c4"
  }
]
for item in ITEMS:
    slug=item["slug"]
    base=ROOT/"assets/library/capture/sprites/skills"/("air_"+slug)
    source=base/"sources"/("sprite_air_"+slug+"_source_512.webp")
    assert source.is_file(),source
    assert hashlib.sha256(source.read_bytes()).hexdigest()==item["sourceHash"],"source checksum "+slug
    with Image.open(source) as atlas:
        assert atlas.size==(10240,512), (slug,atlas.size)
        atlas=atlas.convert("RGBA")
        out_frames=base/"frames";out_atlas=base/"atlases"
        out_frames.mkdir(parents=True,exist_ok=True)
        out_atlas.mkdir(parents=True,exist_ok=True)
        runtime=Image.new("RGBA",(7680,384),(0,0,0,0))
        frame_refs=[]
        for idx in range(20):
            frame=atlas.crop((idx*512,0,(idx+1)*512,512))
            assert frame.getchannel("A").getextrema()[0]<255,"opaque frame "+slug
            fname="sprite_air_"+slug+"_"+str(idx+1).zfill(2)+".png"
            frame.save(out_frames/fname,optimize=True)
            smaller=frame.resize((384,384),Image.Resampling.LANCZOS)
            runtime.paste(smaller,(idx*384,0))
            frame_refs.append({"frame":idx+1,"file":"frames/"+fname})
        atlas_name="sprite_air_"+slug+"_atlas_01.webp"
        runtime.save(out_atlas/atlas_name,"WEBP",quality=76,method=2)
        check=Image.open(out_atlas/atlas_name)
        assert check.size==(7680,384) and "A" in check.getbands()
        manifest={"version":1,"assetId":"pack:capture:sprite-air-"+slug.replace("_","-")+"-01","label":item["label"],"category":item["category"],"frameCount":20,"frameWidth":512,"frameHeight":512,"runtimeFrameWidth":384,"runtimeFrameHeight":384,"frameMs":item["frameMs"],"playbackMode":item["playback"],"frames":frame_refs,"atlas":"atlases/"+atlas_name,"atlasWidth":7680,"atlasHeight":384,"sourceSHA256":item["sourceHash"]}
        (base/("sprite_air_"+slug+"_sequence.json")).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\\n",encoding="utf8")
        with (base/"provenance.csv").open("w",encoding="utf8",newline="") as stream:
            writer=csv.writer(stream);writer.writerow(["frame","file","sha256","author","license"])
            for f in frame_refs:
                fp=base/f["file"];writer.writerow([f["frame"],f["file"],hashlib.sha256(fp.read_bytes()).hexdigest(),"GenSrpG + OpenAI image generation","project-internal"])
        (base/"README.md").write_text("# "+item["label"]+"\\n\\n20 frames PNG 512x512 RGBA, atlas runtime 20x384 WebP RGBA (7680x384), source 20x512 WebP (10240x512). Les frames originales provenaient d'une grille 1402x1122 (5x4), cellules 280x280 agrandies à 512; la résolution 512 n'est pas native.\\n\\nPropriétaire: global-assets. Usage: présentation Capture uniquement; pas de règle gameplay.\\n",encoding="utf8")
    print("Validated:",slug, "20x512 PNG plus 7680x384 WebP",flush=True)
