#!/usr/bin/env python3
"""Append-only importer for the approved Monster Capture face/dos/icon triplet."""
import io
import json
import sys
from pathlib import Path
from zipfile import ZipFile
from PIL import Image

archive_path = Path(sys.argv[1])
library = Path(sys.argv[2])
slug = "creature_pourpre"
label = "Créature pourpre (modèle visuel)"
prefix = "pack:capture:creature-pourpre"
target = library / "assets/library/capture/creatures" / slug
catalog_path = library / "data/assets/catalog/global-visual-assets.v1.json"
roles = {"face": "opponent", "dos": "player", "icone": "icon"}

assert archive_path.is_file(), "ZIP auteur absent"
assert catalog_path.is_file(), "catalogue absent"
assert not target.exists(), "dossier cible déjà présent : import bloqué sans écrasement"
catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
assert catalog["storage"]["branch"] == "global-assets"
assert catalog["rules"]["bindingsUseAssetId"] is True
assert len(catalog["assets"]) == catalog["counts"]["assets"]
ids = {asset["id"] for asset in catalog["assets"]}
outputs = {}
records = []

with ZipFile(archive_path) as zip_file:
    source_files = set(zip_file.namelist())
    for source_role, role in roles.items():
        source_name = f"sources_hd/{source_role}.png"
        assert source_name in source_files, f"source manquante: {source_name}"
        image = Image.open(io.BytesIO(zip_file.read(source_name))).convert("RGBA")
        assert image.getchannel("A").getextrema() == (0, 255), source_name
        bounds = image.getchannel("A").getbbox()
        assert bounds, f"image vide: {source_name}"
        cropped = image.crop(bounds)
        cropped.thumbnail((416, 416), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
        x = (512 - cropped.width) // 2
        y = (512 - cropped.height) // 2 if role == "icon" else 464 - cropped.height
        canvas.alpha_composite(cropped, (x, y))
        alpha = canvas.getchannel("A")
        assert alpha.getextrema() == (0, 255)
        bounds = alpha.getbbox()
        assert bounds and min(bounds[0], bounds[1], 512-bounds[2], 512-bounds[3]) >= 42, (source_name, bounds)
        filename = f"{slug}_{source_role}.png"
        buffer = io.BytesIO()
        canvas.save(buffer, "PNG", optimize=True)
        outputs[filename] = buffer.getvalue()

        asset_id = f"{prefix}-{role}-01"
        assert asset_id not in ids, f"collision asset ID: {asset_id}"
        ids.add(asset_id)
        records.append({
            "id": asset_id,
            "label": f"{label} — {role}",
            "assetType": "portrait" if role == "icon" else "sprite",
            "mediaType": "image",
            "category": "ui" if role == "icon" else "creature",
            "tags": ["capture", "creature", "pourpre", role],
            "source": {"scope": "pack", "packId": "capture", "author": "GenSRPG / validé 2026-11-12", "license": "project-internal"},
            "resource": {"file": f"capture/creatures/{slug}/runtime/{filename}", "mime": "image/png"},
            "compatibility": {"uses": ["combat", "capture", "editor"]}
        })

metadata = {
    "id": slug,
    "name": label,
    "status": "approved-artwork-only-no-bestiary-creature",
    "profile": "massive",
    "views": {role: f"runtime/{slug}_{source_role}.png" for source_role, role in roles.items()},
    "runtimePreview": {role: f"runtime/{slug}_{source_role}.png" for source_role, role in roles.items()},
    "defaultFacing": {"opponent": "left", "player": "right"},
    "canvas": {"combat": [512, 512], "icon": [512, 512]},
    "transformOrigin": {"x": "50%", "y": "88%"},
    "assetIds": {record["id"].split("-")[-2]: record["id"] for record in records},
    "source": {
        "scope": "pack", "packId": "capture", "library": "global-assets",
        "authorArchive": archive_path.name,
        "archiveGitBlob": "e87f02d060d4da2871f803904cfe716004229ffb"
    },
    "visualRevision": "approved-transparent-centered-tail-2026-11-12",
    "notes": "3 vues validées: face, dos queue centrée, icône ronde. Aucune fiche gameplay ni bestiaire ajoutée. PNG RGBA 512px, marge >=42px."
}
assert set(metadata["assetIds"]) == {"opponent", "player", "icon"}
for field, count in [("assets", 3), ("sprites", 2), ("portraits", 1), ("creatures", 2)]:
    catalog["counts"][field] += count
catalog["assets"].extend(records)
assert catalog["counts"]["assets"] == len(catalog["assets"])
assert len({a["id"] for a in catalog["assets"]}) == len(catalog["assets"])
(target / "runtime").mkdir(parents=True, exist_ok=False)
for filename, payload in outputs.items():
    (target / "runtime" / filename).write_bytes(payload)
(target / f"{slug}.meta.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("PASS: 3 PNG 512 RGBA, marges >=42, IDs uniques, catalogue canonique augmenté")
