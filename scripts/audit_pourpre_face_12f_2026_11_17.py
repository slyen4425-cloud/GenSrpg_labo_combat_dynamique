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
