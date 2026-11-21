#!/usr/bin/env python3
"""Inventory uploaded author ZIP members without extracting or changing canonical assets."""
from pathlib import Path
from zipfile import ZipFile
import io, hashlib
from PIL import Image
FILES = [
"raiiven_assets_for_deposit.zip",
"face_cheval_feu.zip","dos_cheval_feu.zip","modeles_cheval_feu.zip",
"Colonne_Spectrale_12_Frames_PNG_512.zip",
"MC_FX_Cristaux_Telluriques_12Frames_V2_PROPOSITION.zip",
"MC_FX_Floraison_Epineuse_12Frames_V1.zip",
"MC_FX_Geyser_Magma_12Frames_V2_CLEAN.zip",
"MC_FX_Grele_de_Cristal_Chute_8Frames.zip",
"MC_FX_Grele_de_Cristal_Impact_8Frames.zip",
"MC_FX_Lance_Celeste_12Frames_V1.zip",
"MC_FX_Meteore_12Frames.zip",
"MC_FX_Pluie_de_Foudre_12Frames_V2.zip",
"MC_FX_RacinesPerforantes_8Frames_TEST.zip",
"MC_FX_Vortex_des_Abysses_12Frames_V1.zip",
]
for name in FILES:
    raw = Path(name).read_bytes()
    with ZipFile(io.BytesIO(raw)) as z:
        error = z.testzip()
        assert error is None,(name,error)
        data=[]
        for entry in z.infolist():
            if entry.is_dir(): continue
            desc = ""
            if entry.filename.lower().endswith((".png",".webp",".jpg",".jpeg")):
                try:
                    im=Image.open(io.BytesIO(z.read(entry)))
                    desc=f"{im.width}x{im.height} {im.mode}"
                except Exception as ex:
                    desc=f"IMAGE-ERROR {type(ex).__name__}"
            data.append((entry.filename,entry.file_size,desc))
    print(f"ARCHIVE {name} zip_members={len(data)} sha256={hashlib.sha256(raw).hexdigest()}",flush=True)
    for n,size,desc in data[:130]:
        print(f"  MEMBER {n!r} bytes={size} {desc}",flush=True)
    if len(data)>130: print(f"  ... {len(data)-130} further members",flush=True)
print("ARCHIVE INSPECTION COMPLETE",flush=True)
