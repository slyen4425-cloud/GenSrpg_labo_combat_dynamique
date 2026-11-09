#!/usr/bin/env python3
"""Import only 80 approved future-skill WebPs from the author's exact two ZIPs."""
from __future__ import annotations
import hashlib, io, json, re, stat, unicodedata, zipfile
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "assets/library/capture/icons/skills"
CAT = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
PROV = DIR / "capture_future_80_icons_2026_11_09.provenance.json"
SOURCE = [
    ("Monster_Capture_40_icones_futures_capacites.zip", "manifest_40_capacites.json", "2921d374bbe3f782f12115d4200f6c20623b563d4c1af5eb098297b20c3bf110", "633f3183db2f04dc77290f878225668608d58059", 1),
    ("Monster_Capture_Serie_2_40_icones.zip", "manifest_serie_2_40.json", "891dea383160d05424f569046e7414baf4a6638740f8dbbab473e55fd4460351", "9513b6c08172cb2525c3c5e1994a3776255e2da6", 2),
]
def digest(data): return hashlib.sha256(data).hexdigest()
def git_blob(data): return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\x00" + data).hexdigest()
def tag(s): return re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()).strip("-")
def main():
    cat = json.loads(CAT.read_text(encoding="utf8"))
    assert cat["storage"]["branch"] == "global-assets" and cat["storage"]["libraryRoot"] == "assets/library/"
    assert cat["counts"]["assets"] == len(cat["assets"])
    assert cat["counts"]["icons"] == sum(a["assetType"] == "icon" for a in cat["assets"])
    old_ids = {a["id"] for a in cat["assets"]}
    old_paths = {a.get("resource", {}).get("file") for a in cat["assets"]}
    assert len(old_ids) == len(cat["assets"])
    assert not PROV.exists(), "no reimport or silent overwrite"
    records, output, seen_ids, seen_paths, seen_hash = [], [], set(), set(), set()
    sources = []
    for filename, manifest_name, expected_sha, expected_git, series in SOURCE:
        raw = (DIR / filename).read_bytes()
        assert digest(raw) == expected_sha and git_blob(raw) == expected_git, "source zip bytes changed: " + filename
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            members = z.infolist()
            assert z.testzip() is None, "ZIP CRC failure"
            assert sum(i.file_size for i in members) < 90000000, "expanded ZIP too large"
            names = [i.filename for i in members]
            assert len(names) == len(set(names)), "duplicate ZIP member"
            for member in members:
                assert not member.is_dir() and not member.filename.startswith("/") and ".." not in Path(member.filename).parts
                assert not stat.S_ISLNK((member.external_attr >> 16) & 0xffff), "symlink in ZIP"
            items = json.loads(z.read(manifest_name))["items"]
            assert len(items) == 40
            assert sorted(i["number"] for i in items) == (list(range(1, 41)) if series == 1 else list(range(41, 81)))
            assert len([name for name in names if name.startswith("icones_webp_128/")]) == 40
            for i in sorted(items, key=lambda x: x["number"]):
                ident = i["id_propose"]
                m = re.fullmatch(r"pack:capture:icon-skill-([a-z0-9-]+)-01", ident)
                assert m, "invalid proposed canonical ID: " + ident
                slug = m.group(1)
                icon_filename = "icon_skill_" + slug.replace("-", "_") + "_01.webp"
                resource = "capture/icons/skills/" + icon_filename
                assert ident not in old_ids | seen_ids, "ID collision: " + ident
                assert resource not in old_paths | seen_paths, "path collision: " + resource
                source_name = "icones_webp_128/" + i["file_webp"]
                blob = z.read(source_name)
                expected = i["webp_sha256"] if series == 1 else i["sha256_webp"]
                assert digest(blob) == expected, "altered WebP source: " + source_name
                with Image.open(io.BytesIO(blob)) as im:
                    assert im.format == "WEBP" and im.size == (128, 128)
                    assert im.mode in ("RGB", "RGBA")
                    assert len(im.getcolors(maxcolors=128 * 128) or []) > 12, "blank image"
                assert blob[:4] == b"RIFF" and blob[8:12] == b"WEBP" and blob[12:16] == b"VP8 "
                assert digest(blob) not in seen_hash, "duplicate image among 80"
                seen_ids.add(ident); seen_paths.add(resource); seen_hash.add(digest(blob))
                output.append((DIR / icon_filename, blob))
                cat["assets"].append({
                    "id": ident, "label": i["name"], "assetType": "icon", "mediaType": "image", "category": "skill",
                    "tags": ["skill", "capture", "future", "series-" + str(series), tag(i["element"])],
                    "source": {"scope": "pack", "packId": "capture", "author": "GenSrpG / ChatGPT (two user-validated icon series)", "license": "project-internal"},
                    "resource": {"file": resource, "mime": "image/webp"},
                    "compatibility": {"uses": ["combat", "capture", "editor"]}
                })
                records.append({"number": i["number"], "series": series, "label": i["name"], "element": i["element"],
                                "assetId": ident, "resource": resource, "bytes": len(blob), "sha256": digest(blob),
                                "gitBlobSHA": git_blob(blob), "sourceName": source_name})
        sources.append({"zip": filename, "sha256": expected_sha, "gitBlobSHA": expected_git})
    assert len(records) == 80 and [i["number"] for i in records] == list(range(1, 81))
    assert len({a["id"] for a in cat["assets"]}) == len(cat["assets"])
    cat["counts"]["assets"] = len(cat["assets"])
    cat["counts"]["icons"] = sum(a["assetType"] == "icon" for a in cat["assets"])
    for dest, data in output:
        assert not dest.exists(), "refuse to overwrite " + str(dest)
        dest.write_bytes(data)
    PROV.write_text(json.dumps({
        "schema": "capture-future-80-icons-v1", "date": "2026-11-09", "owner": "global-assets", "userValidated": True,
        "note": "80 user-approved WebP 128px copied without re-encoding from two original ZIPs; PNG masters remain inside ZIPs. No skill definitions or automatic bindings.",
        "sources": sources, "assets": records
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    CAT.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(f"SUCCESS: 80 real WebP 128px; catalog now {cat['counts']['assets']} assets / {cat['counts']['icons']} icons")
if __name__ == "__main__": main()