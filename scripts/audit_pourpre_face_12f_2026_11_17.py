#!/usr/bin/env python3
"""Read-only inspection of the author's approved pourpre opponent archive."""
import zipfile, hashlib, json, struct
from pathlib import Path
p=Path("_incoming/creature_pourpre_face_mouvement_attaque_12f_valide.zip")
raw=p.read_bytes()
print("archive",p,"bytes",len(raw),"sha256",hashlib.sha256(raw).hexdigest())
print("git-blob",hashlib.sha1(b"blob "+str(len(raw)).encode()+b"\x00"+raw).hexdigest())
with zipfile.ZipFile(p) as z:
    print("zip CRC",z.testzip(),"members",len(z.infolist()))
    for i in z.infolist():
        if i.is_dir():continue
        extra=""
        try:
            if i.filename.lower().endswith((".json",".txt",".md")) and i.file_size<50000:
                extra=" METADATA="+z.read(i.filename).decode("utf-8")[:500].replace("\n"," ")
            if i.filename.lower().endswith(".png"):
                s=z.read(i.filename)[:26]
                if s[:8]==b"\x89PNG\r\n\x1a\n": extra=" PNG WH="+str(struct.unpack(">II",s[16:24]))+" colortype="+str(s[25])
        except Exception as e:extra=" metadata_error:"+repr(e)
        print(f"{i.filename} ({i.file_size} bytes){extra}")

from PIL import Image, ImageChops
import io
with zipfile.ZipFile(p) as z:
    manifest=json.loads(z.read("manifest.json"))
    print("===FULL_MANIFEST===", json.dumps(manifest,ensure_ascii=False,indent=2))
    print("===README===", z.read("LIRE_AVANT_INTEGRATION.txt").decode("utf-8"))
    master=Image.open(io.BytesIO(z.read("master/creature_pourpre_face_modele_original.png"))).convert("RGBA")
    runtime=Image.open("assets/library/capture/creatures/creature_pourpre/runtime/creature_pourpre_face.png").convert("RGBA")
    print("MASTER versus RUNTIME",master.size,runtime.size,"EXACT",master.tobytes()==runtime.tobytes(),"BBOX",master.getchannel("A").getbbox(),runtime.getchannel("A").getbbox())
    for kind in ("mouvement_face","attaque_face"):
        prev=None
        for k in range(1,13):
            name=f"{kind}/frames/creature_pourpre_{'mouvement' if kind=='mouvement_face' else 'attaque'}_face_{k:02d}.png"
            im=Image.open(io.BytesIO(z.read(name))).convert("RGBA")
            bbox=im.getchannel("A").getbbox()
            margins=(bbox[0],bbox[1],512-bbox[2],512-bbox[3])
            print("FRAME_AUDIT",kind,k,"alpha_bbox",bbox,"margins",margins,"sha",hashlib.sha256(z.read(name)).hexdigest(),"same_previous", im.tobytes()==prev.tobytes() if prev else None,"same_master",im.tobytes()==master.tobytes(),"same_runtime",im.tobytes()==runtime.tobytes())
            prev=im
