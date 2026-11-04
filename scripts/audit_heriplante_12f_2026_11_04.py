#!/usr/bin/env python3
"""Read-only audit: inspect the two exact user-deposited Hériplante 12f archives."""
from __future__ import annotations
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
from hashlib import sha1, sha256
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/"assets/library/capture/creatures/heriplante"
SOURCES=[
    ("attack","heriplante_attaque_joueur_dos_12f.zip","b5ccd543d708808b5b9c0555dd0a8adfdd41f63f"),
    ("movement","HERIPLANTE_COURSE_JOUEUR_12F_VALIDEE.zip","e32b4735c4cd84a7c63e8620b10f96e97e190f38"),
]
for action,name,blob in SOURCES:
    b=(FOLDER/name).read_bytes()
    found=sha1(b"blob "+str(len(b)).encode()+b"\\0"+b).hexdigest()
    assert blob==found,(name,found,blob)
    print(f"SOURCE {action} {name}: size={len(b)}, sha256={sha256(b).hexdigest()}, git_blob={found}",flush=True)
    with ZipFile(BytesIO(b)) as z:
        assert z.testzip() is None,"Corrupted archive"
        infos=z.infolist()
        assert len(infos)<150
        total=sum(x.file_size for x in infos)
        assert total<150_000_000,total
        for info in infos:
            assert not info.filename.startswith("/") and ".." not in Path(info.filename).parts
            if info.is_dir():continue
            print("FILE",info.filename,"size",info.file_size,flush=True)
            if info.filename.lower().endswith((".png",".webp",".gif")):
                with Image.open(BytesIO(z.read(info))) as im:
                    print(" IMAGE",im.format,im.size,im.mode,"frames",getattr(im,"n_frames",1),flush=True)
                    if im.size==(512,512):
                        bb=im.convert("RGBA").getchannel("A").point(lambda a:255 if a>=8 else 0).getbbox()
                        if bb: print("  MARGINS", [bb[0],bb[1],512-bb[2],512-bb[3]],flush=True)
            elif info.filename.endswith(".json") and info.file_size<50000:
                try:
                    obj=json.loads(z.read(info))
                    print(" JSON",json.dumps(obj,ensure_ascii=False)[:2500],flush=True)
                except (ValueError,UnicodeError): print("  unreadable json",flush=True)
print("PASS: original verified GitHub ZIP bytes and archive inspection",flush=True)
