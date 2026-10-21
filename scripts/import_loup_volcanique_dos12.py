#!/usr/bin/env python3
"""Import strict des 2 animations DOS 12 frames du loup volcanique.
Ne modifie jamais les vues officielles ni les moteurs du labo.
Usage : placer le ZIP exact dans _incoming, puis exécuter ce script.
"""
import hashlib
import json
import pathlib
import struct
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
NAME = "LOUP_VOLCANIQUE_DOS_12_COURSE_ATTAQUE_PREVIEW.zip"
SRC = ROOT / "_incoming" / NAME
EXPECTED_SHA256 = "bebd0e3735eccc6e33e510b1daf9657682081f7997e4b1304f42b3376c47eafe"
BASE = ROOT / "assets/library/capture/creatures/loup_volcanique/animations"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
ACTIONS = {
    "movement": {"frameMs": 80, "playbackMode": "loop", "approval": "approved_for_ingame_trial"},
    "attack": {"frameMs": 100, "playbackMode": "once", "approval": "approved"},
}

def sha256(data):
    return hashlib.sha256(data).hexdigest()

def verify_png(data):
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "PNG signature"
    assert data[12:16] == b"IHDR", "IHDR absent"
    w, h, depth, mode, _, _, _ = struct.unpack(">IIBBBBB", data[16:29])
    assert (w, h, depth, mode) == (512, 512, 8, 6), (w, h, depth, mode)

def verify_webp(data):
    assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", "WebP invalide"

def main():
    assert SRC.is_file(), "Archive absente : " + str(SRC)
    source_bytes = SRC.read_bytes()
    assert sha256(source_bytes) == EXPECTED_SHA256, "SHA256 archive incorrect"
    cat = json.loads(CATALOG.read_text(encoding="utf-8"))
    ids = {a["id"] for a in cat["assets"]}
    assert len(ids) == len(cat["assets"]), "Doublons déjà présents"
    files_to_write = {}
    assets_to_add = []
    with zipfile.ZipFile(SRC) as z:
        assert z.testzip() is None, "CRC zip erroné"
        names = z.namelist()
        assert len(names) == len(set(names)), "Entrées ZIP dupliquées"
        for n in names:
            p = pathlib.PurePosixPath(n)
            assert n and not n.startswith("/") and ".." not in p.parts, "Chemin ZIP dangereux"

        for action, opts in ACTIONS.items():
            folder = action + "/"
            src_manifest = json.loads(z.read(folder + action + ".manifest.json"))
            asset_id = "pack:capture:creature-loup-volcanique-" + action + "-dos-12-v1"
            assert asset_id not in ids, "AssetId existe : " + asset_id
            assert src_manifest["creatureId"] == "loup_volcanique"
            assert src_manifest["action"] == action and src_manifest["view"] == "dos"
            assert src_manifest["frameCount"] == 12 and src_manifest["frameSize"] == [512, 512]
            assert src_manifest["frameMs"] == opts["frameMs"]
            assert src_manifest["playbackMode"] == opts["playbackMode"]
            assert len(src_manifest["frames"]) == 12
            seen = set()
            base_path = BASE / action / "dos"
            for i, frame in enumerate(src_manifest["frames"]):
                assert frame["index"] == i
                filename = "frames/loup_volcanique_" + action + "_dos_" + str(i + 1).zfill(2) + ".png"
                assert frame["file"] == filename
                data = z.read(folder + filename)
                verify_png(data)
                digest = sha256(data)
                assert digest == frame["sha256"], "Frame modifiée : " + filename
                seen.add(digest)
                assert min(frame["marginsLTRB"]) >= 40, "Marge insuffisante " + filename
                files_to_write[base_path / filename] = data
            assert len(seen) == 12, "Frames répétées : " + action

            atlas = src_manifest["atlas"]
            assert atlas["format"] == "sprite-strip" and atlas["frameCount"] == 12
            assert [atlas["frameWidth"], atlas["frameHeight"]] == [384,384]
            atlas_data = z.read(folder + atlas["file"])
            verify_webp(atlas_data)
            assert sha256(atlas_data) == atlas["sha256"], "Atlas altéré"
            files_to_write[base_path / atlas["file"]] = atlas_data

            preview_path = src_manifest["previews"]["gif"]
            preview = z.read(folder + preview_path)
            assert preview[:6] in (b"GIF87a", b"GIF89a")
            files_to_write[base_path / preview_path] = preview

            webp_path = src_manifest["previews"]["webp"]
            preview_webp = z.read(folder + webp_path)
            verify_webp(preview_webp)
            files_to_write[base_path / webp_path] = preview_webp

            # Garder la planche de contrôle, sans l'utiliser comme atlas runtime.
            sheet_path = src_manifest["previews"]["planche"]
            sheet_data = z.read(folder + sheet_path)
            assert sheet_data.startswith(b"\xff\xd8\xff")
            files_to_write[base_path / sheet_path] = sheet_data

            src_manifest["schema"] = "capture-creature-animation-v1"
            src_manifest["assetId"] = asset_id
            src_manifest["sourceArchive"] = NAME
            src_manifest["sourceArchiveSha256"] = EXPECTED_SHA256
            src_manifest["authorApproved"] = True
            src_manifest["approvalStatus"] = opts["approval"]
            src_manifest["status"] = ("ingame_trial_pending" if action == "movement" else "asset_approved")
            src_manifest["preview"] = preview_path
            manifest_bytes = (json.dumps(src_manifest, ensure_ascii=False, indent=2) + "\n").encode()
            files_to_write[base_path / (action + ".manifest.json")] = manifest_bytes

            assets_to_add.append({
                "id": asset_id,
                "label": "Loup volcanique — " + ("course dos" if action == "movement" else "attaque dos") + " (12 frames)",
                "assetType": "sprite",
                "mediaType": "image",
                "category": "creature",
                "tags": ["capture", "creature", "loup-volcanique", "fire", "lava",
                         action, "animated", "dos", "player"],
                "source": {"scope": "pack", "packId": "capture",
                           "author": "GenSrpG / animation approuvée 2026-10-21",
                           "license": "project-internal"},
                "resource": {
                    "file": "capture/creatures/loup_volcanique/animations/" + action + "/dos/" + atlas["file"],
                    "format": "sprite-strip", "mime": "image/webp",
                    "frameCount": 12, "frameMs": opts["frameMs"],
                    "playbackMode": opts["playbackMode"]
                },
                "compatibility": {"uses": ["combat", "capture", "editor"]}
            })
    for output in files_to_write:
        assert not output.exists(), "Refus d'écraser : " + str(output)
    cat["assets"].extend(assets_to_add)
    cat["counts"]["assets"] += 2
    cat["counts"]["sprites"] += 2
    cat["counts"]["creatures"] += 2
    assert len({a["id"] for a in cat["assets"]}) == len(cat["assets"])
    assert cat["counts"]["assets"] == len(cat["assets"])
    for output, data in files_to_write.items():
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(data)
    CATALOG.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("DOS import OK: 24 PNG, 2 WebP strip, 4 previews, 2 sheets, 2 manifests; catalogue +2")
    print("Course DOS: publication pour essai en jeu, validation définitive en attente.")

if __name__ == "__main__":
    main()
