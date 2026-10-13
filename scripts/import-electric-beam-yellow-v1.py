#!/usr/bin/env python3
"""One-shot, branch-scoped extraction of the author's three electric beam ZIP archives."""
import csv, hashlib, json, pathlib, struct, zipfile
root=pathlib.Path.cwd()
folder=pathlib.Path("assets/library/capture/sprites/skills/electric_beam_yellow")
archive_names=["rayon_electrique_jaune_01_cast.zip","rayon_electrique_jaune_02_corps.zip","rayon_electrique_jaune_03_impact.zip"]
planned={}
for archive_name in archive_names:
    with zipfile.ZipFile(root/archive_name) as archive:
        for item in archive.infolist():
            if item.is_dir() or item.filename.startswith("previews/"):
                continue
            name=item.filename
            if not name.startswith(folder.as_posix()+"/") or ".." in pathlib.PurePosixPath(name).parts or item.file_size>12000000 or name in planned:
                raise SystemExit(f"Unexpected or duplicate ZIP item: {name}")
            data=archive.read(item)
            if len(data)!=item.file_size: raise SystemExit(f"Truncated ZIP item: {name}")
            planned[name]=data.replace(b"\r\n",b"\n") if name.endswith("manifest.csv") else data
if len(planned)!=73: raise SystemExit(f"Expected 73 canonical files; got {len(planned)}")
for name,data in planned.items():
    dst=root/name
    if dst.exists(): raise SystemExit(f"Refusing existing target: {name}")
    dst.parent.mkdir(parents=True,exist_ok=True)
    dst.write_bytes(data)
base=root/folder
rows=list(csv.DictReader((base/"manifest.csv").open(encoding="utf-8",newline="")))
if len(rows)!=60: raise SystemExit(f"Expected 60 frames; got {len(rows)}")
for row in rows:
    p=base/row["file"];b=p.read_bytes()
    assert b[:8]==b"\x89PNG\r\n\x1a\n" and b[12:16]==b"IHDR",str(p)
    assert struct.unpack(">II",b[16:24])==(512,512),str(p)
    assert hashlib.sha256(b).hexdigest()==row["sha256"],str(p)
seq=json.loads((base/"sprite_skill_electric_beam_sequences_01.json").read_text())["sequences"]
assert {k:v["frame_count"] for k,v in seq.items()}=={"cast":20,"beam_body":12,"impact":12}
assert {k:v["frame_ms"] for k,v in seq.items()}=={"cast":60,"beam_body":45,"impact":45}
for key,v in seq.items():
    assert len(v["frames"])==v["frame_count"]
    assert all((base/f).is_file() for f in v["frames"])
pro=json.loads((base/"provenance.json").read_text())
for group in pro["sequences"].values():
    for k in ("atlas_runtime","atlas_full20"):
        info=group.get(k)
        if not info: continue
        b=(base/info["file"]).read_bytes()
        assert b[:4]==b"RIFF" and b[8:12]==b"WEBP"
        assert len(b)==info["bytes"]
        assert hashlib.sha256(b).hexdigest()==info["sha256"]
print(f"PASS: {len(planned)} verified media/config files, 60 PNG frames, 5 WebP atlases")
