#!/usr/bin/env python3
"""Import author-approved Veuve jaune media into the ONE global-assets catalog.

Read the exact uploaded ZIP from Combat main, validate each source member,
publish only 5 icons and 8 sprite-strip WebP assets. No other media, skill
definitions, saved games or gameplay engine is modified.
"""
import io
import json
from pathlib import Path
from hashlib import sha1, sha256
from zipfile import ZipFile
from PIL import Image

ARCHIVE = Path("assets/library/capture/sprites/skills/Veuve_Jaune_5_icones_spritesheets_mur_diagonal_miroir_v2.zip")
EXPECTED_BLOB = "ec0197e01226db1c035d41c8370a78748eb38971"
ICONS = {
    "fil-foudroyant": "01_fil_foudroyant.png",
    "toile-paralysante": "02_toile_paralysante.png",
    "morsure-neuroelectrique": "03_morsure_neuroelectrique.png",
    "emprise-de-soie": "04_emprise_de_soie.png",
    "domaine-de-la-veuve": "05_domaine_de_la_veuve.png",
}
SHEETS = {
    "fil-foudroyant-projectile": ("fil_foudroyant_projectile", 768, 384, 80, "loop"),
    "fil-foudroyant-impact": ("fil_foudroyant_impact", 512, 512, 80, "once"),
    "toile-paralysante-mur-apparition": ("toile_paralysante_mur_apparition", 768, 512, 115, "once"),
    "toile-paralysante-mur-boucle": ("toile_paralysante_mur_boucle", 768, 512, 150, "loop"),
    "morsure-neuroelectrique-impact": ("morsure_neuroelectrique_impact", 512, 512, 80, "once"),
    "emprise-de-soie-projectile": ("emprise_soie_projectile", 768, 384, 95, "loop"),
    "emprise-de-soie-entrave-sur-cible": ("emprise_soie_entrave_sur_cible", 512, 640, 120, "once"),
    "domaine-de-la-veuve-impact-zone": ("domaine_veuve_impact_zone", 768, 512, 115, "once"),
}
SOURCE = {"scope":"pack","packId":"capture","author":"GenSRPG / Veuve jaune V2 validée le 2026-11-18","license":"project-internal"}
COMPAT = {"uses":["combat","capture","editor"]}

def main(source_root, canonical_root):
    source_root = Path(source_root)
    canonical_root = Path(canonical_root)
    src = source_root / ARCHIVE
    raw = src.read_bytes()
    blob = sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    assert blob == EXPECTED_BLOB, ("ZIP author bytes changed", blob)

    cat_path = canonical_root / "data/assets/catalog/global-visual-assets.v1.json"
    catalog = json.loads(cat_path.read_text(encoding="utf-8"))
    assert catalog["storage"]["branch"] == "global-assets"
    assert len(catalog["assets"]) == catalog["counts"]["assets"]
    ids = {a["id"] for a in catalog["assets"]}
    assert len(ids) == len(catalog["assets"]), "Existing duplicate catalog IDs"
    new_records = []
    with ZipFile(io.BytesIO(raw)) as zip_file:
        assert zip_file.testzip() is None, "Corrupt author ZIP"
        manifest = json.loads(zip_file.read("manifest.json"))
        assert manifest["creatureId"] == "veuve-jaune"
        assert len(manifest["authoritativeSkills"]) == 5
        assert len(manifest["sequences"]) == 8
        for short, name in ICONS.items():
            member = "icons/" + name
            img = Image.open(io.BytesIO(zip_file.read(member)))
            img.load()
            assert img.format == "PNG" and img.mode == "RGBA"
            assert img.size == (512,512)
            assert img.getchannel("A").getextrema()[0] == 0
            dest = "capture/icons/skills/veuve_jaune/" + short + ".webp"
            file_path = canonical_root / "assets/library" / dest
            assert not file_path.exists(), ("Do not overwrite canonical image", file_path)
            asset_id = "pack:capture:icon-skill-veuve-jaune-" + short + "-v1"
            assert asset_id not in ids, ("Duplicate ID", asset_id)
            ids.add(asset_id)
            file_path.parent.mkdir(parents=True, exist_ok=True)
            img.save(file_path, format="WEBP", lossless=True, method=6)
            new_records.append({
                "id":asset_id, "label":"Veuve jaune — "+short.replace("-"," "),
                "assetType":"icon","mediaType":"image","category":"skill",
                "tags":["capture","skill","veuve-jaune","electric","web","author-approved"],
                "source":SOURCE,"resource":{"file":dest,"mime":"image/webp"},
                "compatibility":COMPAT
            })

        for short,(stem,width,height,frame_ms,playback) in SHEETS.items():
            member = "sheets/" + stem + ".png"
            img = Image.open(io.BytesIO(zip_file.read(member)))
            img.load()
            assert img.format == "PNG" and img.mode == "RGBA", member
            assert img.size == (8*width,height), ("sprite strip frame geometry",member,img.size)
            assert img.getchannel("A").getextrema()[0] == 0
            assert manifest["sequences"][stem]["frameCount"] == 8
            assert manifest["sequences"][stem]["frameWidth"] == width
            assert manifest["sequences"][stem]["frameHeight"] == height
            if stem.startswith("toile_paralysante"):
                assert manifest["sequences"][stem]["mirroredX"] is True
                assert manifest["sequences"][stem]["view"] == "diagonal-3/4"
            dest = "capture/sprites/skills/veuve_jaune/" + short + ".webp"
            file_path = canonical_root / "assets/library" / dest
            assert not file_path.exists(), ("Do not overwrite canonical atlas",file_path)
            asset_id = "pack:capture:sprite-skill-veuve-jaune-" + short + "-v1"
            assert asset_id not in ids, ("Duplicate ID",asset_id)
            ids.add(asset_id)
            file_path.parent.mkdir(parents=True, exist_ok=True)
            img.save(file_path, format="WEBP", lossless=True, method=6)
            new_records.append({
                "id":asset_id,"label":"Veuve jaune — "+short.replace("-"," ")+" (8 frames)",
                "assetType":"sprite","mediaType":"image","category":"skill",
                "tags":["capture","skill","veuve-jaune","electric","web","sprite","animated","author-approved"],
                "source":SOURCE,
                "resource":{
                    "file":dest,"mime":"image/webp","format":"sprite-strip",
                    "frameCount":8,"frameMs":frame_ms,"playbackMode":playback,
                    **({"holdLastFrame":True} if stem=="toile_paralysante_mur_apparition" else {})
                },"compatibility":COMPAT
            })
    assert len(new_records) == 13
    catalog["assets"].extend(new_records)
    catalog["counts"]["assets"] += 13
    catalog["counts"]["icons"] += 5
    catalog["counts"]["sprites"] += 8
    assert len(catalog["assets"]) == catalog["counts"]["assets"]
    assert len({a["id"] for a in catalog["assets"]}) == len(catalog["assets"])
    assert all((canonical_root / "assets/library" / a["resource"]["file"]).is_file() for a in new_records)
    cat_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PASS Veuve jaune V2: exact ZIP git blob",blob,
          "/ 5 icons / 8 sprites / 13 canonical webp files; original ZIP remains unchanged",flush=True)

if __name__ == "__main__":
    import sys
    if len(sys.argv)!=3:
        raise SystemExit("Usage: import-veuve-jaune-media-v2.py SOURCE_CHECKOUT CANONICAL_CHECKOUT")
    main(sys.argv[1],sys.argv[2])
