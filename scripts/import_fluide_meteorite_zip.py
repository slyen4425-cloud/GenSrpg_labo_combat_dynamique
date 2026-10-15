#!/usr/bin/env python3
"""Validate and import the user-uploaded Fluide Meteorite ZIP; no placeholder media."""
import csv, hashlib, io, json, zipfile
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
UP=ROOT/"_incoming/fluide_meteorite_upload_github.zip"
PREFIX="assets/library/capture/sprites/skills/fluide_meteorite/"
DEST=ROOT/PREFIX

def main():
    if not UP.is_file(): raise SystemExit("Missing ZIP; import not performed")
    with zipfile.ZipFile(UP) as z:
        names=z.namelist()
        if z.testzip() is not None or len(names)!=66 or len(names)!=len(set(names)): raise ValueError("Invalid ZIP")
        if any(not n.startswith(PREFIX) or ".." in Path(n).parts for n in names): raise ValueError("Unexpected ZIP path")
        if sum(i.file_size for i in z.infolist()) > 75*1024*1024: raise ValueError("Oversized ZIP")
        data={n[len(PREFIX):]:z.read(n) for n in names}
    manifest=json.loads(data["sprite_skill_fluide_meteorite_sequences_01.json"])
    if manifest["id"]!="pack:capture:sprite-fluide-meteorite-01": raise ValueError("Wrong asset ID")
    if set(manifest["sequences"])!={"cast","projectile","impact"}: raise ValueError("Missing animation category")
    frames=set()
    atlases=set()
    for part in manifest["sequences"].values():
        if len(part["frames"])!=20 or part["frame_count"]!=20: raise ValueError("20 frames per category required")
        for name in part["frames"]:
            if name in frames or not name.startswith("frames/") or name not in data: raise ValueError("Missing/duplicate frame")
            frames.add(name)
            im=Image.open(io.BytesIO(data[name]))
            if im.format!="PNG" or im.mode!="RGBA" or im.size!=(512,512): raise ValueError("Invalid PNG: "+name)
            lo,hi=im.getchannel("A").getextrema()
            if lo!=0 or hi<=128: raise ValueError("Invalid transparency: "+name)
        name=part["atlas"]["file"]
        if name not in data or not name.startswith("atlases/"): raise ValueError("Missing atlas")
        im=Image.open(io.BytesIO(data[name]))
        if im.format!="WEBP" or im.size!=(7680,384): raise ValueError("Invalid WEBP atlas")
        atlases.add(name)
    allowed=frames|atlases|{"sprite_skill_fluide_meteorite_sequences_01.json","README.md","provenance.csv"}
    if set(data)!=allowed or len(frames)!=60 or len(atlases)!=3: raise ValueError("Unexpected pack contents")
    rows=list(csv.DictReader(io.StringIO(data["provenance.csv"].decode())))
    if len(rows)!=60: raise ValueError("Missing provenance")
    for row in rows:
        if row["output"] not in frames or hashlib.sha256(data[row["output"]]).hexdigest()!=row["output_sha256"]:
            raise ValueError("SHA-256 mismatch")
    if DEST.exists(): raise ValueError("Refusing to overwrite existing asset")
    for name,content in data.items():
        target=DEST/name
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(content)
    UP.unlink()
    print("Verified and imported 60 512x512 RGBA PNG, 3 atlas WebP, actual original image bytes.")

if __name__=="__main__": main()
