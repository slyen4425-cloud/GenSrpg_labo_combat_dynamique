#!/usr/bin/env python3
"""Importer sans substitution les 24 frames dos du Golem moussu.

Chantier isolé : bibliothèque visuelle Capture uniquement.
Ne remplace aucune image 'runtime', ne change aucun moteur ou fiche de créature.
La course est autorisée pour essai en jeu, sans validation artistique définitive.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path, PurePosixPath
import shutil
import struct
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE_NAME = "GOLEM_MOUSSU_DOS_12_COURSE_ATTAQUE_PREVIEW.zip"
ARCHIVE = ROOT / "_incoming" / SOURCE_NAME
ARCHIVE_SHA256 = "e8045798cfaa6c8b1eb73b09687e8fb4792d8536387de407bf8c89fdc6433155"
SOURCE_PREFIX = "GOLEM_MOUSSU_DOS_12_PREVIEW/"
ANIMATIONS = ROOT / "assets/library/capture/creatures/golem_moussu/animations"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
SENTINEL_TEMPLATE = ROOT / "scripts/golem-moussu-dos12.test.template.mjs"
SENTINEL = ROOT / "tests/unit/golem-moussu-dos12-assets.test.mjs"
ACTIONS = {"movement": (90, "loop"), "attack": (110, "once")}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def verify_png(data: bytes) -> None:
    assert data[:8] == b"\x89PNG\r\n\x1a\n" and data[12:16] == b"IHDR", "Invalid PNG"
    w, h, depth, color_type, *_ = struct.unpack(">IIBBBBB", data[16:29])
    assert (w, h, depth, color_type) == (512, 512, 8, 6), (w, h, depth, color_type)


def verify_webp(data: bytes) -> None:
    assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", "Invalid WebP"


def main() -> None:
    assert ARCHIVE.is_file(), f"Source ZIP absent: {ARCHIVE}"
    source_data = ARCHIVE.read_bytes()
    assert digest(source_data) == ARCHIVE_SHA256, "ZIP source SHA256 mismatch"
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    current_ids = {asset["id"] for asset in catalog["assets"]}
    assert len(current_ids) == len(catalog["assets"]), "Catalog already has duplicate IDs"
    assert catalog["counts"]["assets"] == len(catalog["assets"])
    pending: dict[Path, bytes] = {}
    entries: list[dict] = []

    with zipfile.ZipFile(ARCHIVE) as z:
        names = z.namelist()
        assert z.testzip() is None, "ZIP CRC mismatch"
        assert len(names) == 36 and len(set(names)) == len(names), "Incorrect ZIP entries"
        assert all(PurePosixPath(name).parts[0] == SOURCE_PREFIX.rstrip("/")
                   and not name.startswith("/") and ".." not in PurePosixPath(name).parts
                   for name in names), "ZIP path traversal"
        for action, (frame_ms, mode) in ACTIONS.items():
            prefix = SOURCE_PREFIX + action + "/"
            manifest = json.loads(z.read(prefix + action + ".manifest.json"))
            asset_id = f"pack:capture:creature-golem-moussu-{action}-dos-12-v1"
            assert asset_id not in current_ids
            assert manifest["schema"] == "capture-creature-animation-v1"
            assert manifest["creatureId"] == "golem_moussu"
            assert manifest["action"] == action and manifest["view"] == "dos"
            assert manifest["assetId"] == asset_id
            assert manifest["frameCount"] == 12 and manifest["frameSize"] == [512, 512]
            assert (manifest["frameMs"], manifest["playbackMode"]) == (frame_ms, mode)
            assert len(manifest["frames"]) == 12
            base = ANIMATIONS / action / "dos"
            unique_hashes = set()
            for i, frame in enumerate(manifest["frames"]):
                expected = f"frames/golem_moussu_{action}_dos_{i+1:02d}.png"
                assert (frame["index"], frame["file"]) == (i, expected)
                data = z.read(prefix + expected)
                verify_png(data)
                assert digest(data) == frame["sha256"], "Frame SHA mismatch " + expected
                assert len(frame["marginsLTRB"]) == 4
                assert min(frame["marginsLTRB"]) >= 40, "Frame too close to edge"
                unique_hashes.add(frame["sha256"])
                pending[base / expected] = data
            assert len(unique_hashes) == 12, "Repeated frame(s)"

            atlas = manifest["atlas"]
            assert atlas["format"] == "sprite-strip" and atlas["frameCount"] == 12
            assert (atlas["frameWidth"], atlas["frameHeight"]) == (384,384)
            data = z.read(prefix + atlas["file"])
            verify_webp(data)
            assert digest(data) == atlas["sha256"], "Atlas SHA mismatch"
            pending[base / atlas["file"]] = data

            previews = manifest["previews"]
            assert manifest["preview"] == previews["gif"]
            gif = z.read(prefix + previews["gif"])
            assert gif[:6] in (b"GIF87a", b"GIF89a"), "Bad GIF preview"
            pending[base / previews["gif"]] = gif
            webp = z.read(prefix + previews["webp"])
            verify_webp(webp)
            pending[base / previews["webp"]] = webp
            sheet = z.read(prefix + previews["planche"])
            assert sheet[:8] == b"\x89PNG\r\n\x1a\n", "Invalid sprite sheet"
            pending[base / previews["planche"]] = sheet

            manifest["authorApproved"] = True
            manifest["approvalStatus"] = (
                "approved_for_ingame_trial" if action == "movement" else "approved"
            )
            manifest["status"] = (
                "ingame_trial_pending" if action == "movement" else "asset_approved"
            )
            manifest["sourceArchive"] = SOURCE_NAME
            manifest["sourceArchiveSha256"] = ARCHIVE_SHA256
            pending[base / (action + ".manifest.json")] = (
                json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
            ).encode("utf-8")

            entries.append({
                "id": asset_id,
                "label": "Golem moussu — " + ("mouvement" if action == "movement" else "attaque") + " dos (12 frames)",
                "assetType": "sprite",
                "mediaType": "image",
                "category": "creature",
                "tags": ["capture", "creature", "golem_moussu", "earth",
                         "nature", action, "animated", "dos", "player"],
                "source": {
                    "scope": "pack", "packId": "capture",
                    "author": "GenSrpG / validation visuelle 2026-10-21",
                    "license": "project-internal"
                },
                "resource": {
                    "file": f"capture/creatures/golem_moussu/animations/{action}/dos/{atlas['file']}",
                    "format": "sprite-strip", "mime": "image/webp",
                    "frameCount": 12, "frameMs": frame_ms, "playbackMode": mode
                },
                "compatibility": {"uses": ["combat", "capture", "editor"]}
            })

    for dest in pending:
        assert not dest.exists(), "Overwrite forbidden: " + str(dest)
    assert not SENTINEL.exists(), "Test already exists"
    assert SENTINEL_TEMPLATE.is_file(), "Test template missing"
    catalog["assets"].extend(entries)
    catalog["counts"]["assets"] += 2
    catalog["counts"]["sprites"] += 2
    catalog["counts"]["creatures"] += 2
    assert len({x["id"] for x in catalog["assets"]}) == len(catalog["assets"])
    assert catalog["counts"]["assets"] == len(catalog["assets"])

    for dest, data in pending.items():
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
    SENTINEL.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SENTINEL_TEMPLATE, SENTINEL)
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
                       encoding="utf-8")
    print("OK: 24 PNG RGBA 512px, 2 WebP sprite-strips, 2 GIF, 2 preview WebP, 2 sheets, 2 manifests.")
    print("Golem movement dos: published for in-game trial; attack dos: visually approved.")
    print("Catalog: 2 new unique asset IDs; originals unchanged.")


if __name__ == "__main__":
    main()
