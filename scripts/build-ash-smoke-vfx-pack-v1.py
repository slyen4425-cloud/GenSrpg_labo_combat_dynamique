#!/usr/bin/env python3
from __future__ import annotations

import base64
import csv
import hashlib
import io
import json
import shutil
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / ".tmp" / "ash-smoke-vfx-v1"
PACK = ROOT / "assets/library/capture/sprites/skills/ash_smoke"
SOURCE = ROOT / "assets/library/capture/sprites/source/ash_smoke_v1"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
TEST = ROOT / "tests/unit/ash-smoke-vfx-pack-v1.test.mjs"
WORKFLOW = ROOT / ".github/workflows/build-ash-smoke-vfx-pack-v1.yml"

ZIP_SHA256 = "50ee1a0af98a2fec27ef092aa02510a836ce1b85e0c42fb0f25659f16837b806"

SPECS = {
    "cast": {
        "source_archive": "a_high_resolution_sprite_sheet_style_image_on_a_tr_5.png",
        "source_name": "ash_smoke_cast_source_01.png",
        "source_sha256": "80e6c139de6a61242cbc627a20bee5f93592d651d7b2a90a565fcc7003538224",
        "cols": 4, "rows": 4, "count": 16, "frame_ms": 60,
    },
    "projectile": {
        "source_archive": "a_high_resolution_transparent_background_sprite_sh_2_batch_2.png",
        "source_name": "ash_smoke_projectile_source_01.png",
        "source_sha256": "0087e33f2fdfc8b2fce5cab9436a607237262f9c3dd1cff4de6a83803715858b",
        "cols": 4, "rows": 3, "count": 12, "frame_ms": 45,
    },
    "impact": {
        "source_archive": "a_high_resolution_png_sprite_sheet_style_image_on_3_batch_3.png",
        "source_name": "ash_smoke_impact_source_01.png",
        "source_sha256": "ec9144e5be91e603ed97955b14c06e381bb50efb24f9178e956f72430f72d56c",
        "cols": 4, "rows": 3, "count": 12, "frame_ms": 45,
    },
    "status_aura": {
        "source_archive": "a_high_resolution_sprite_sheet_style_image_on_a_tr_4_batch_4.png",
        "source_name": "ash_smoke_status_aura_source_01.png",
        "source_sha256": "87f1aec33945dfb4e4cb970e50866bd57aa50ea588f6220987a02a7ef27c91b4",
        "cols": 4, "rows": 4, "count": 16, "frame_ms": 90,
    },
}

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())

def reconstruct_sources_if_needed() -> None:
    SOURCE.mkdir(parents=True, exist_ok=True)
    if all((SOURCE / s["source_name"]).exists() for s in SPECS.values()):
        for s in SPECS.values():
            p = SOURCE / s["source_name"]
            if sha256_file(p) != s["source_sha256"]:
                raise RuntimeError(f"source SHA mismatch: {p}")
        return

    parts = sorted(TMP.glob("source_b64/part_*.txt"))
    if not parts:
        raise RuntimeError("source transfer parts are missing and canonical sources do not exist")

    encoded = "".join("".join(p.read_text(encoding="ascii").split()) for p in parts)
    archive = base64.b64decode(encoded, validate=True)
    if sha256_bytes(archive) != ZIP_SHA256:
        raise RuntimeError("source archive SHA mismatch")

    with zipfile.ZipFile(io.BytesIO(archive), "r") as zf:
        for s in SPECS.values():
            data = zf.read(s["source_archive"])
            if sha256_bytes(data) != s["source_sha256"]:
                raise RuntimeError(f"source member SHA mismatch: {s['source_archive']}")
            (SOURCE / s["source_name"]).write_bytes(data)

def frame_path(role: str, index: int) -> Path:
    return PACK / "frames" / f"sprite_skill_ash_smoke_{role}_{index:02d}.png"

def atlas_path(role: str) -> Path:
    return PACK / "atlases" / f"sprite_skill_ash_smoke_{role}_atlas_01.webp"

def split_role(role: str, spec: dict) -> dict:
    src = SOURCE / spec["source_name"]
    image = Image.open(src).convert("RGBA")
    w, h = image.size
    cols, rows = spec["cols"], spec["rows"]
    frames = []
    alpha_extrema = []

    for idx in range(spec["count"]):
        row, col = divmod(idx, cols)
        x0 = round(col * w / cols)
        x1 = round((col + 1) * w / cols)
        y0 = round(row * h / rows)
        y1 = round((row + 1) * h / rows)
        crop = image.crop((x0, y0, x1, y1)).resize((512, 512), Image.Resampling.LANCZOS)

        alpha = crop.getchannel("A")
        amin, amax = alpha.getextrema()
        if amin >= 255:
            raise RuntimeError(f"{role} frame {idx+1}: no transparent pixels")
        if amax <= 0:
            raise RuntimeError(f"{role} frame {idx+1}: fully transparent frame")
        alpha_extrema.append([amin, amax])

        # Avoid hidden RGB color on fully transparent pixels.
        rgba = crop.load()
        for yy in range(crop.height):
            for xx in range(crop.width):
                r, g, b, a = rgba[xx, yy]
                if a == 0 and (r or g or b):
                    rgba[xx, yy] = (0, 0, 0, 0)

        out = frame_path(role, idx + 1)
        out.parent.mkdir(parents=True, exist_ok=True)
        crop.save(out, "PNG", optimize=True)
        frames.append(out)

    atlas = Image.new("RGBA", (512 * len(frames), 512), (0, 0, 0, 0))
    for i, fp in enumerate(frames):
        atlas.paste(Image.open(fp).convert("RGBA"), (512 * i, 0))
    ap = atlas_path(role)
    ap.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(ap, "WEBP", quality=92, method=4, exact=True)

    decoded = Image.open(ap).convert("RGBA")
    if decoded.size != (512 * len(frames), 512):
        raise RuntimeError(f"{role}: invalid atlas dimensions {decoded.size}")

    return {
        "source_size": [w, h],
        "source_sha256": sha256_file(src),
        "frame_count": len(frames),
        "frame_size": [512, 512],
        "frame_sha256": [sha256_file(p) for p in frames],
        "alpha_extrema": alpha_extrema,
        "atlas": str(ap.relative_to(PACK)),
        "atlas_size": list(decoded.size),
        "atlas_sha256": sha256_file(ap),
    }

def write_pack_metadata(results: dict) -> None:
    rows = []
    sequences = {}
    for role, spec in SPECS.items():
        frame_files = []
        for i in range(1, spec["count"] + 1):
            fp = frame_path(role, i)
            rel = str(fp.relative_to(PACK))
            frame_files.append(rel)
            rows.append({
                "sequence": role,
                "frame": i,
                "file": rel,
                "width": 512,
                "height": 512,
                "sha256": sha256_file(fp),
            })
        sequences[role] = {
            "frame_count": spec["count"],
            "frame_ms": spec["frame_ms"],
            "frames": frame_files,
            "atlas": str(atlas_path(role).relative_to(PACK)),
            "playback_mode": "loop" if role in ("projectile", "status_aura") else "once",
        }

    with (PACK / "manifest.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["sequence", "frame", "file", "width", "height", "sha256"], lineterminator="\\n")
        writer.writeheader()
        writer.writerows(rows)

    (PACK / "sprite_skill_ash_smoke_sequences_01.json").write_text(
        json.dumps({"frame_size": [512, 512], "sequences": sequences}, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    provenance = {
        "version": 1,
        "source": "OpenAI image generation, user-approved transparent ash/smoke sheets",
        "source_archive_sha256": ZIP_SHA256,
        "crop_policy": "proportional grid boundaries, row-major, LANCZOS resize to native 512x512 frame",
        "results": results,
    }
    (PACK / "provenance.json").write_text(json.dumps(provenance, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    (PACK / "README.md").write_text(
        """# Fumée cendre — sprites Capture HD

Pack visuel Capture ajouté sans modifier le gameplay ni le moteur.

- charge/cast : 16 PNG RGBA 512×512
- projectile : 12 PNG RGBA 512×512
- impact : 12 PNG RGBA 512×512
- aura négative/status : 16 PNG RGBA 512×512
- 56 frames individuelles au total
- 4 atlas WebP horizontaux, alpha réel
- sources transparentes originales conservées dans `assets/library/capture/sprites/source/ash_smoke_v1/`
- découpe et provenance reproductibles via `scripts/build-ash-smoke-vfx-pack-v1.py`

Les atlas sont les ressources runtime du catalogue. Les PNG individuels sont les frames HD découpées et nommées.
Aucun remplacement automatique de Cendre aveuglante ni d'une autre capacité : le pack est additif.
""",
        encoding="utf-8",
    )

def catalog_entry(role: str) -> dict:
    if role == "cast":
        return {
            "id": "pack:capture:sprite-ash-smoke-cast-01",
            "label": "Fumée cendre — charge",
            "assetType": "sprite", "mediaType": "image", "category": "release",
            "tags": ["skill", "ash", "smoke", "cinder", "cast", "capture", "hd"],
            "source": {"scope": "pack", "packId": "capture", "author": "GenSrpG", "license": "project-internal"},
            "resource": {
                "file": "capture/sprites/skills/ash_smoke/atlases/sprite_skill_ash_smoke_cast_atlas_01.webp",
                "format": "sprite-strip", "mime": "image/webp", "frameCount": 16, "frameMs": 60,
            },
            "compatibility": {"uses": ["combat", "capture", "editor"]},
        }
    if role == "projectile":
        return {
            "id": "pack:capture:sprite-ash-smoke-projectile-01",
            "label": "Fumée cendre — projectile",
            "assetType": "sprite", "mediaType": "image", "category": "travel",
            "tags": ["skill", "ash", "smoke", "cinder", "projectile", "capture", "hd"],
            "source": {"scope": "pack", "packId": "capture", "author": "GenSrpG", "license": "project-internal"},
            "resource": {
                "file": "capture/sprites/skills/ash_smoke/atlases/sprite_skill_ash_smoke_projectile_atlas_01.webp",
                "format": "sprite-strip", "mime": "image/webp", "frameCount": 12, "frameMs": 45,
                "headingRad": 0, "coreAnchor": {"x": 0.75, "y": 0.5}, "playbackMode": "loop",
            },
            "compatibility": {"uses": ["combat", "capture", "editor"]},
        }
    if role == "impact":
        return {
            "id": "pack:capture:sprite-ash-smoke-impact-01",
            "label": "Fumée cendre — impact",
            "assetType": "sprite", "mediaType": "image", "category": "impact",
            "tags": ["skill", "ash", "smoke", "cinder", "impact", "capture", "hd"],
            "source": {"scope": "pack", "packId": "capture", "author": "GenSrpG", "license": "project-internal"},
            "resource": {
                "file": "capture/sprites/skills/ash_smoke/atlases/sprite_skill_ash_smoke_impact_atlas_01.webp",
                "format": "sprite-strip", "mime": "image/webp", "frameCount": 12, "frameMs": 45,
            },
            "compatibility": {"uses": ["combat", "capture", "editor"]},
        }
    return {
        "id": "pack:capture:sprite-ash-smoke-status-aura-01",
        "label": "Fumée cendre — aura négative",
        "assetType": "sprite", "mediaType": "image", "category": "skill",
        "tags": ["skill", "status", "aura", "negative", "ash", "smoke", "cinder", "animated", "capture", "hd"],
        "source": {"scope": "pack", "packId": "capture", "author": "GenSrpG", "license": "project-internal"},
        "resource": {
            "file": "capture/sprites/skills/ash_smoke/atlases/sprite_skill_ash_smoke_status_aura_atlas_01.webp",
            "format": "sprite-strip", "mime": "image/webp", "frameCount": 16, "frameMs": 90, "playbackMode": "loop",
        },
        "compatibility": {"uses": ["combat", "capture", "editor"]},
    }

def update_catalog() -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    ids = [catalog_entry(r)["id"] for r in SPECS]
    if any(sum(1 for a in catalog["assets"] if a["id"] == asset_id) > 1 for asset_id in ids):
        raise RuntimeError("duplicate ash-smoke asset ID already present")

    catalog["assets"] = [a for a in catalog["assets"] if a["id"] not in ids]
    catalog["assets"].extend(catalog_entry(r) for r in SPECS)
    all_ids = [a["id"] for a in catalog["assets"]]
    if len(all_ids) != len(set(all_ids)):
        raise RuntimeError("catalog contains duplicate IDs")

    catalog["counts"]["assets"] = len(catalog["assets"])
    catalog["counts"]["sprites"] = sum(1 for a in catalog["assets"] if a.get("assetType") == "sprite")
    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def write_test() -> None:
    TEST.parent.mkdir(parents=True, exist_ok=True)
    TEST.write_text(r'''import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const base = "assets/library/capture/sprites/skills/ash_smoke/";

function pngHeader(path) {
  const bytes = readFileSync(new URL(path, root));
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType: bytes[25]
  };
}

test("ash smoke pack exposes 56 native RGBA 512 frames", () => {
  const seq = JSON.parse(readFileSync(new URL(base + "sprite_skill_ash_smoke_sequences_01.json", root), "utf8"));
  const prov = JSON.parse(readFileSync(new URL(base + "provenance.json", root), "utf8"));
  assert.deepEqual(seq.frame_size, [512, 512]);

  const expected = { cast: 16, projectile: 12, impact: 12, status_aura: 16 };
  let total = 0;
  for (const [name, count] of Object.entries(expected)) {
    const def = seq.sequences[name];
    assert.equal(def.frame_count, count);
    assert.equal(def.frames.length, count);
    total += count;
    for (const frame of def.frames) {
      const h = pngHeader(base + frame);
      assert.deepEqual([h.width, h.height], [512, 512]);
      assert.equal(h.bitDepth, 8);
      assert.equal(h.colorType, 6, "RGBA PNG required");
    }
    assert.equal(prov.results[name].alpha_extrema.length, count);
    assert.ok(prov.results[name].alpha_extrema.every(([min, max]) => min < 255 && max > 0));
    const atlas = readFileSync(new URL(base + def.atlas, root));
    assert.equal(atlas.toString("ascii", 0, 4), "RIFF");
    assert.equal(atlas.toString("ascii", 8, 12), "WEBP");
  }
  assert.equal(total, 56);
});

test("ash smoke pack is additive and owns exactly four unique catalogue IDs", () => {
  const c = JSON.parse(readFileSync(new URL("data/assets/catalog/global-visual-assets.v1.json", root), "utf8"));
  const wanted = [
    ["pack:capture:sprite-ash-smoke-cast-01", "release", 16],
    ["pack:capture:sprite-ash-smoke-projectile-01", "travel", 12],
    ["pack:capture:sprite-ash-smoke-impact-01", "impact", 12],
    ["pack:capture:sprite-ash-smoke-status-aura-01", "skill", 16]
  ];
  for (const [id, category, count] of wanted) {
    const defs = c.assets.filter(a => a.id === id);
    assert.equal(defs.length, 1);
    assert.equal(defs[0].assetType, "sprite");
    assert.equal(defs[0].category, category);
    assert.equal(defs[0].resource.format, "sprite-strip");
    assert.equal(defs[0].resource.mime, "image/webp");
    assert.equal(defs[0].resource.frameCount, count);
    assert.ok(defs[0].resource.file.startsWith("capture/sprites/skills/ash_smoke/atlases/"));
  }
  assert.equal(c.counts.assets, c.assets.length);
  assert.equal(c.counts.sprites, c.assets.filter(a => a.assetType === "sprite").length);
});
''', encoding="utf-8")

def cleanup_bootstrap() -> None:
    if TMP.exists():
        shutil.rmtree(TMP)
    if WORKFLOW.exists():
        WORKFLOW.unlink()

def main() -> None:
    reconstruct_sources_if_needed()
    if PACK.exists():
        shutil.rmtree(PACK)
    PACK.mkdir(parents=True, exist_ok=True)

    results = {}
    for role, spec in SPECS.items():
        results[role] = split_role(role, spec)

    write_pack_metadata(results)
    update_catalog()
    write_test()
    cleanup_bootstrap()

    print("ash-smoke-vfx-v1 built successfully")
    print("frames:", sum(v["frame_count"] for v in results.values()))
    print("catalog assets added: 4")

if __name__ == "__main__":
    main()
