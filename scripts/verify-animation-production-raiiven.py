#!/usr/bin/env python3
"""Contrôle immuable de l'atelier CHEVAL / Raiiven. Sans dépendance externe."""
import hashlib
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "atelier-animations/styles/cheval/references/raiiven/manifest.json"

def git_blob_sha(raw: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()

def png_header(raw: bytes):
    assert raw.startswith(b"\x89PNG\r\n\x1a\n"), "Signature PNG invalide"
    assert raw[12:16] == b"IHDR", "IHDR absent"
    width, height, bit_depth, color_type = struct.unpack(">IIBB", raw[16:26])
    assert bit_depth == 8 and color_type == 6, f"PNG non RGBA 8-bit: {bit_depth}/{color_type}"
    return width, height

def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf8"))
    assert manifest["styleId"] == "cheval" and manifest["referenceCreature"] == "raiiven"
    assert len(manifest["assets"]) == 10
    atlas = []
    for entry in manifest["assets"]:
        dest = ROOT / entry["copyPath"]
        assert dest.is_file(), f"Référence absente: {dest}"
        blob = dest.read_bytes()
        assert git_blob_sha(blob) == entry["sourceGitBlobSha"], f"Référence modifiée: {dest}"
        if entry["kind"] in ("master", "atlas"):
            size = png_header(blob)
            assert tuple(entry["size"]) == size, f"Dimensions: {dest} {size}"
        if entry["kind"] == "atlas":
            assert size == (512 * entry["frameCount"], 512), dest
            atlas.append(entry)
        if entry["kind"] == "source-manifest":
            source = json.loads(blob.decode("utf8"))
            assert source["creatureId"] == "raiiven" and source["frameSize"] == [512,512], dest
    assert sorted((x["action"], x["view"], x["frameCount"]) for x in atlas) == [
        ("attaque", "dos", 5), ("attaque", "face", 5),
        ("course", "dos", 7), ("course", "face", 6),
    ], "Les quatre références officielles ne correspondent plus"
    print("PASS atelier CHEVAL : 6 PNG binaires identiques (4 atlas + 2 maîtres), 4 manifestes sources, dimensions et ordres vérifiés")
    print("Référence artistique uniquement : aucune publication runtime ni retouche des médias")

if __name__ == "__main__":
    main()
