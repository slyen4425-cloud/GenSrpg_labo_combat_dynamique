#!/usr/bin/env python3
"""Import immuable des animations du Golem moussu (face, 12 frames par action).

L'archive est fournie et validée par l'auteur via _incoming.
Aucune modification des modèles runtime, du moteur ou de la fiche créature.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import struct
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "_incoming" / "GOLEM_MOUSSU_FACE_12_COURSE_ATTAQUE_GITHUB.zip"
ARCHIVE_SHA256 = "ad9f4717721346a99a9c6a5a469a7e1ef81e930353204dc7273fda87e615a42c"
BASE = ROOT / "assets/library/capture/creatures/golem_moussu/animations"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
ACTIONS = {"movement": (85, "loop"), "attack": (100, "once")}

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def verify_png(data: bytes) -> None:
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    assert data[12:16] == b"IHDR"
    width, height, bit_depth, color_type, *_ = struct.unpack(">IIBBBBB", data[16:29])
    assert (width, height, bit_depth, color_type) == (512, 512, 8, 6)

def verify_webp(data: bytes) -> None:
    assert data[:4] == b"RIFF" and data[8:12] == b"WEBP"

def main() -> None:
    assert ARCHIVE.is_file(), f"Archive absente : {ARCHIVE}"
    assert digest(ARCHIVE.read_bytes()) == ARCHIVE_SHA256, "ZIP SHA-256 mismatch"
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    existing_ids = {asset["id"] for asset in catalog["assets"]}
    assert len(existing_ids) == len(catalog["assets"]), "Catalogue dupliqué avant import"
    pending: dict[pathlib.Path, bytes] = {}
    entries = []
    with zipfile.ZipFile(ARCHIVE) as z:
        assert z.testzip() is None, "Archive CRC"
        names = z.namelist()
        assert len(names) == 36 and len(set(names)) == len(names), "Structure archive inattendue"
        for filename in names:
            p = pathlib.PurePosixPath(filename)
            assert filename and not filename.startswith("/") and ".." not in p.parts, filename
            assert p.parts[0] in {"movement", "attack"} or filename in {
                "RELEASE_README.md", "golem_moussu_double_preview.gif"
            }, filename
        for action, (frame_ms, playback_mode) in ACTIONS.items():
            src_folder = action + "/"
            manifest_filename = action + ".manifest.json"
            meta = json.loads(z.read(src_folder + manifest_filename))
            asset_id = f"pack:capture:creature-golem-moussu-{action}-face-12-v1"
            assert asset_id not in existing_ids
            assert meta["schema"] == "capture-creature-animation-v1"
            assert meta["creatureId"] == "golem_moussu"
            assert meta["action"] == action and meta["view"] == "face"
            assert meta["assetId"] == asset_id
            assert meta["frameCount"] == 12 and meta["frameSize"] == [512, 512]
            assert (meta["frameMs"], meta["playbackMode"]) == (frame_ms, playback_mode)
            assert len(meta["frames"]) == 12
            output = BASE / action / "face"
            frame_hashes = set()
            for index, frame in enumerate(meta["frames"]):
                expected_name = f"frames/golem_moussu_{action}_face_{index+1:02d}.png"
                assert (frame["index"], frame["file"]) == (index, expected_name)
                data = z.read(src_folder + expected_name)
                verify_png(data)
                assert digest(data) == frame["sha256"]
                assert len(frame["marginsLTRB"]) == 4
                assert min(frame["marginsLTRB"]) >= 40
                frame_hashes.add(frame["sha256"])
                pending[output / expected_name] = data
            assert len(frame_hashes) == 12, "Frames identiques"
            atlas = meta["atlas"]
            assert atlas["format"] == "sprite-strip" and atlas["frameCount"] == 12
            assert [atlas["frameWidth"], atlas["frameHeight"]] == [384,384]
            atlas_data = z.read(src_folder + atlas["file"])
            verify_webp(atlas_data)
            assert digest(atlas_data) == atlas["sha256"]
            pending[output / atlas["file"]] = atlas_data

            preview = meta["previews"]
            assert meta["preview"] == preview["gif"]
            gif = z.read(src_folder + preview["gif"])
            assert gif[:6] in (b"GIF87a", b"GIF89a")
            pending[output / preview["gif"]] = gif
            prev_webp = z.read(src_folder + preview["webp"])
            verify_webp(prev_webp)
            pending[output / preview["webp"]] = prev_webp
            sheet = z.read(src_folder + preview["planche"])
            verify_png_signature = sheet[:8] == b"\x89PNG\r\n\x1a\n"
            assert verify_png_signature
            pending[output / preview["planche"]] = sheet

            meta["sourceArchive"] = ARCHIVE.name
            meta["sourceArchiveSha256"] = ARCHIVE_SHA256
            pending[output / manifest_filename] = (
                json.dumps(meta, ensure_ascii=False, indent=2) + "\n"
            ).encode("utf8")

            entries.append({
                "id": asset_id,
                "label": ("Golem moussu — course face (12 frames)" if action == "movement"
                          else "Golem moussu — attaque face (12 frames)"),
                "assetType": "sprite",
                "mediaType": "image",
                "category": "creature",
                "tags": ["capture","creature","golem_moussu","earth","nature",
                         action,"animated","face"],
                "source": {
                    "scope": "pack","packId": "capture",
                    "author": "GenSrpG / animations visuelles approuvées 2026-10-21",
                    "license": "project-internal"
                },
                "resource": {
                    "file": f"capture/creatures/golem_moussu/animations/{action}/face/{atlas['file']}",
                    "format": "sprite-strip", "mime": "image/webp",
                    "frameCount": 12, "frameMs": frame_ms, "playbackMode": playback_mode
                },
                "compatibility": {"uses": ["combat","capture","editor"]}
            })
        expected_paths = set()
        for action in ACTIONS:
            prefix = action + "/"
            expected_paths.update(
                str(p.relative_to(BASE / action / "face")).replace("\\","/")
                for p in pending if p.is_relative_to(BASE / action / "face")
            )
        # Validate all future writes before creating any file.
        for output in pending:
            assert not output.exists(), "Overwriting is forbidden: " + str(output)
        catalog["assets"].extend(entries)
        catalog["counts"]["assets"] += 2
        catalog["counts"]["sprites"] += 2
        catalog["counts"]["creatures"] += 2
        assert len({asset["id"] for asset in catalog["assets"]}) == len(catalog["assets"])
        assert catalog["counts"]["assets"] == len(catalog["assets"])
        for dest, data in pending.items():
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
        CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("Golem moussu FACE: import validé, 24 PNG, 2 atlas, 2 manifestes, 6 previews, 2 IDs.")

if __name__ == "__main__":
    main()
