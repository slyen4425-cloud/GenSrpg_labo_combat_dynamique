#!/usr/bin/env python3
"""Importe le ZIP utilisateur du gorille des glaces dans l'autorité unique global-assets.

Aucune modification artistique, ni auto-affectation aux compétences ou créatures.
"""
from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import zipfile

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SOURCE_NAME = "gorille_des_glaces_canalisation_corrigee_12f.zip"
SOURCE = ROOT / "_incoming" / SOURCE_NAME
SOURCE_SIZE = 11535714
SOURCE_SHA = "379afd5861977a636059dd8453e67fb3d622fe78d52830a08f58562f6dba390b"
SOURCE_GIT_SHA = "5891b83b944b9d7735d118fdc0e90c2367b4a91c"
ASSET_ID = "pack:capture:creature-gorille-des-glaces-attack-player-12-charge-v1"
DEST = ROOT / "assets/library/capture/creatures/gorille_des_glaces/animations/attack/player"
CAT = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
JOURNAL = ROOT / "docs/LAB_CURRENT_WORK.md"
PNG_PREFIX = "frames/gorille_des_glaces_canalisation_corrigee_"
ATLAS_4X3 = "gorille_des_glaces_canalisation_corrigee_atlas_4x3.png"
PLANCHE = "gorille_des_glaces_canalisation_corrigee_planche_4x3.png"
PREVIEW = "gorille_des_glaces_canalisation_corrigee_preview_canalisation.webp"
PREVIEW_MOTION = "gorille_des_glaces_canalisation_corrigee_preview_mouvement.webp"
INPUT_MANIFEST = "gorille_des_glaces_canalisation_corrigee_manifest.json"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    raw = SOURCE.read_bytes()
    assert len(raw) == SOURCE_SIZE, "Source ZIP size changed"
    assert digest(raw) == SOURCE_SHA, "Source ZIP SHA256 mismatch"
    git_blob = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    assert git_blob == SOURCE_GIT_SHA, "GitHub source blob mismatch"

    pending: dict[Path, bytes] = {}
    names_expected = {ATLAS_4X3, PLANCHE, PREVIEW, PREVIEW_MOTION, INPUT_MANIFEST}
    names_expected |= {f"{PNG_PREFIX}{i:02}.png" for i in range(1, 13)}
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names)) == 17, "Wrong or duplicate ZIP entries"
        assert set(names) == names_expected, "ZIP contains unexpected files"
        assert all(not x.startswith("/") and ".." not in PurePosixPath(x).parts
                   for x in names), "Unsafe path"
        assert archive.testzip() is None, "ZIP CRC verification failed"
        source_manifest = json.loads(archive.read(INPUT_MANIFEST))
        assert source_manifest["frame_count"] == 12
        assert source_manifest["anchor"]["y"] == 462
        durations = source_manifest["duration_ms"]
        assert len(durations) == 12 and all(60 <= x <= 250 for x in durations)

        original_atlas = Image.open(io.BytesIO(archive.read(ATLAS_4X3))).convert("RGBA")
        assert original_atlas.size == (2048, 1536)
        sheet = Image.open(io.BytesIO(archive.read(PLANCHE)))
        assert sheet.mode == "RGBA" and sheet.size == (2768, 2096)
        pending[DEST / "previews/controle_4x3.png"] = archive.read(PLANCHE)
        pending[DEST / "sources/source_manifest.json"] = archive.read(INPUT_MANIFEST)
        pending[DEST / "sources/original_atlas_4x3.png"] = archive.read(ATLAS_4X3)

        strip = Image.new("RGBA", (6144, 512), (0, 0, 0, 0))
        frames = []
        hashes = set()
        for i in range(12):
            original_name = f"{PNG_PREFIX}{i+1:02}.png"
            data = archive.read(original_name)
            with Image.open(io.BytesIO(data)) as img:
                assert img.mode == "RGBA" and img.size == (512, 512), original_name
                assert img.getchannel("A").getextrema() == (0, 255), original_name
                mask = img.getchannel("A").point(lambda v: 255 if v >= 8 else 0)
                bbox = mask.getbbox()
                assert bbox is not None, "Empty frame"
                margins = [bbox[0], bbox[1], 512 - bbox[2], 512 - bbox[3]]
                assert min(margins) >= 30, "Frame cropped or too close to edge"
                tile = original_atlas.crop(((i % 4) * 512, (i // 4) * 512,
                                            ((i % 4) + 1) * 512, ((i // 4) + 1) * 512))
                assert ImageChops.difference(tile, img).getbbox() is None, "Atlas vs frame mismatch"
                strip.paste(img, (i * 512, 0))
            frame_name = f"frames/gorille_des_glaces_charge_player_{i+1:02}.png"
            h = digest(data)
            hashes.add(h)
            frames.append({"index": i, "file": frame_name, "sha256": h,
                           "marginsLTRB": margins})
            pending[DEST / frame_name] = data
        assert len(hashes) == 12, "Duplicated pose"

        for archive_name, output_name in [(PREVIEW, "previews/canalisation.webp"),
                                           (PREVIEW_MOTION, "previews/mouvement.webp")]:
            data = archive.read(archive_name)
            with Image.open(io.BytesIO(data)) as preview:
                assert preview.format == "WEBP" and preview.n_frames == 12
                assert preview.size == (512, 512)
                for i in range(12):
                    preview.seek(i)
                    preview.load()
            pending[DEST / output_name] = data

        atlas_stream = io.BytesIO()
        strip.save(atlas_stream, "WEBP", lossless=True, method=6)
        atlas_bytes = atlas_stream.getvalue()
        with Image.open(io.BytesIO(atlas_bytes)) as decoded:
            assert decoded.size == (6144, 512)
            assert decoded.convert("RGBA").tobytes() == strip.tobytes(), "Lossless atlas pixel mismatch"

        atlas_file = "atlases/gorille_des_glaces_charge_player_12_atlas.webp"
        pending[DEST / atlas_file] = atlas_bytes
        manifest = {
            "schema": "capture-creature-animation-v1",
            "assetId": ASSET_ID,
            "creatureId": "gorille_des_glaces",
            "action": "attack",
            "variant": "charge-canalisation",
            "view": "player",
            "frameCount": 12,
            "frameSize": [512, 512],
            "frameMs": 110,
            "frameDurationsMs": durations,
            "playbackMode": "once",
            "holdLastFrame": True,
            "persistentFrameIndex": 11,
            "anchor": source_manifest["anchor"],
            "sourceArchive": SOURCE_NAME,
            "sourceArchiveSha256": SOURCE_SHA,
            "sourceGitBlob": SOURCE_GIT_SHA,
            "atlas": {"file": atlas_file, "format": "sprite-strip",
                      "frameCount": 12, "frameWidth": 512, "frameHeight": 512,
                      "sha256": digest(atlas_bytes), "lossless": True},
            "frames": frames,
            "previews": {"canalisation": "previews/canalisation.webp",
                         "mouvement": "previews/mouvement.webp",
                         "planche": "previews/controle_4x3.png"},
            "approvalStatus": "artist_requested_import",
            "notes": "Final pose held by engine during charging/channeling, not looped. No automatic binding."
        }
        pending[DEST / "attack.manifest.json"] = (json.dumps(manifest, ensure_ascii=False,
                                                          indent=2) + "\n").encode()

    cat = json.loads(CAT.read_text(encoding="utf8"))
    assert len(cat["assets"]) == cat["counts"]["assets"]
    ids = [a["id"] for a in cat["assets"]]
    assert len(ids) == len(set(ids)) and ASSET_ID not in ids
    assert all(not p.exists() for p in pending), "An official media file already exists"
    cat["assets"].append({
        "id": ASSET_ID,
        "label": "Gorille des glaces — charge / canalisation, attaque joueur dos (12 frames)",
        "assetType": "sprite", "mediaType": "image", "category": "creature",
        "tags": ["capture", "creature", "gorille-des-glaces", "ice", "animated",
                 "attack", "charge", "channeling", "dos", "player"],
        "source": {"scope": "pack", "packId": "capture",
                   "author": "GenSrpG / poses approuvees 2026-11-02",
                   "license": "project-internal"},
        "resource": {"file": str((DEST / atlas_file).relative_to(ROOT / "assets/library")),
                     "format": "sprite-strip", "mime": "image/webp",
                     "frameCount": 12, "frameMs": 110, "playbackMode": "once",
                     "holdLastFrame": True, "persistentFrameIndex": 11},
        "compatibility": {"uses": ["combat", "capture", "editor"]}
    })
    for key in ("assets", "sprites", "creatures"):
        cat["counts"][key] += 1
    assert cat["counts"]["assets"] == len(cat["assets"])

    for path, data in pending.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    CAT.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    journal_entry = (
        "## 2026-11-02 — Gorille des glaces : attaque chargee/canalisee joueur 12f\n"
        "- Source: global-assets:_incoming/" + SOURCE_NAME + "; source SHA256 " + SOURCE_SHA +
        "; Git blob " + SOURCE_GIT_SHA + ".\n"
        "- BASE global-assets@bef5aaed06bc823ecafc43e2249310cb4c2ccfce; "
        "checkpoint/lab-start-gorille-glaces-charge-player-2026-11-02; "
        "work/lab-gorille-glaces-charge-player-2026-11-02.\n"
        "- Périmètre : 12 PNG 512×512, atlas horizontal WebP lossless 6144×512, previews, manifeste, "
        "catalogue +1 asset. Hold frame 12; autre bras en retrait. Aucun auto-binding.\n"
        "- Protégés : runtime, autres créatures, gameplay, compétences, main et gh-pages. "
        "Tests source réels + CI obligatoires avant GREEN.\n\n---\n\n"
    )
    original = JOURNAL.read_text(encoding="utf8")
    assert not original.startswith("## 2026-11-02 — Gorille des glaces : attaque")
    JOURNAL.write_text(journal_entry + original, encoding="utf8")
    print("PASS: 12 PNG exacts, atlas horizontal lossless, previews animées, catalogue +1, journal.")


if __name__ == "__main__":
    main()
