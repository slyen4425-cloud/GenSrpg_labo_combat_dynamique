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
TMP = ROOT / ".tmp" / "pressurized-jet-vfx-v1"
PACK = ROOT / "assets/library/capture/sprites/skills/pressurized_jet"
SOURCE = ROOT / "assets/library/capture/sprites/source/pressurized_jet_v1"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
WORKFLOW = ROOT / ".github/workflows/build-pressurized-jet-vfx-pack-v1.yml"

ARCHIVE_SHA256 = "dd2393ebb156b2a537cccb42ada6828af290b4b6711dcbc1c92b6e245605d300"

SPECS = {
    "cast": {
        "source_name": "pressurized_jet_cast_source_01.webp",
        "source_sha256": "8d6cbba4ae709c646da74e3de11b5e40c58f2585df7bc5ca71d56190e3fc27a4",
        "count": 20,
        "cols": 5,
        "rows": 4,
        "frame_ms": 60,
        "playback": "once",
    },
    "beam_start": {
        "source_name": "pressurized_jet_beam_start_source_01.webp",
        "source_sha256": "026ca2aafae746a18d5726eb80dea89639515d0c48db4e0496945f1d54a92c9d",
        "count": 12,
        "cols": 4,
        "rows": 3,
        "frame_ms": 45,
        "playback": "once",
    },
    "beam_body": {
        "source_name": "pressurized_jet_beam_body_source_01.webp",
        "source_sha256": "82be065c95e1b2d5289e3354e9fa6f738528045d6757aedc7648826f36857206",
        "count": 12,
        "cols": 4,
        "rows": 3,
        "frame_ms": 45,
        "playback": "loop",
    },
    "impact": {
        "source_name": "pressurized_jet_impact_source_01.webp",
        "source_sha256": "ffa47b255f9e9dd7ad7206e647cae65a565439039a39bc153ab034f3f6b9f0de",
        "count": 12,
        "cols": 4,
        "rows": 3,
        "frame_ms": 45,
        "playback": "once",
    },
}

GENERATION_IDS = {
    "cast": "16b89c4c-f236-4461-9153-b6051f57ab40",
    "beam_start": "fa49ab68-4878-45cf-bf8a-e2fe90e3cd97",
    "beam_body": "b7302874-0982-413e-8fdc-f6e32fe0769e",
    "impact": "411f5ccb-a087-4248-9a73-4f78f5ba7c65",
}


def sha_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha_file(path: Path) -> str:
    return sha_bytes(path.read_bytes())


def reconstruct_sources() -> None:
    parts = sorted((TMP / "source_b64").glob("part_*.txt"))
    if len(parts) != 12:
        raise RuntimeError(f"expected 12 transfer parts, found {len(parts)}")

    encoded = "".join(
        "".join(path.read_text(encoding="ascii").split())
        for path in parts
    )
    archive = base64.b64decode(encoded, validate=True)

    if sha_bytes(archive) != ARCHIVE_SHA256:
        raise RuntimeError("pressurized jet source archive SHA mismatch")

    SOURCE.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(archive), "r") as zf:
        expected = {spec["source_name"] for spec in SPECS.values()}
        if set(zf.namelist()) != expected:
            raise RuntimeError(
                f"archive members mismatch: {sorted(zf.namelist())}"
            )

        for spec in SPECS.values():
            data = zf.read(spec["source_name"])
            if sha_bytes(data) != spec["source_sha256"]:
                raise RuntimeError(
                    "source SHA mismatch: " + spec["source_name"]
                )
            (SOURCE / spec["source_name"]).write_bytes(data)


def frame_path(role: str, index: int) -> Path:
    return PACK / "frames" / (
        f"sprite_skill_pressurized_jet_{role}_{index:02d}.png"
    )


def atlas_path(role: str) -> Path:
    return PACK / "atlases" / (
        f"sprite_skill_pressurized_jet_{role}_atlas_01.webp"
    )


def square_contain(crop: Image.Image) -> Image.Image:
    width, height = crop.size
    scale = min(512 / width, 512 / height)
    new_width = max(1, round(width * scale))
    new_height = max(1, round(height * scale))
    resized = crop.resize(
        (new_width, new_height),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    canvas.alpha_composite(
        resized,
        ((512 - new_width) // 2, (512 - new_height) // 2),
    )
    return canvas


def build_role(role: str, spec: dict) -> dict:
    source_path = SOURCE / spec["source_name"]
    image = Image.open(source_path).convert("RGBA")
    width, height = image.size

    if image.getchannel("A").getextrema()[0] >= 255:
        raise RuntimeError(f"{role}: source has no transparent pixels")

    frames = []
    alpha_extrema = []

    for index in range(spec["count"]):
        row, col = divmod(index, spec["cols"])
        x0 = round(col * width / spec["cols"])
        x1 = round((col + 1) * width / spec["cols"])
        y0 = round(row * height / spec["rows"])
        y1 = round((row + 1) * height / spec["rows"])

        frame = square_contain(
            image.crop((x0, y0, x1, y1))
        )
        alpha_min, alpha_max = frame.getchannel("A").getextrema()
        if alpha_min >= 255 or alpha_max <= 0:
            raise RuntimeError(
                f"{role} frame {index + 1}: invalid alpha "
                f"{alpha_min}..{alpha_max}"
            )

        path = frame_path(role, index + 1)
        path.parent.mkdir(parents=True, exist_ok=True)
        frame.save(path, "PNG", optimize=True)
        frames.append(path)
        alpha_extrema.append([alpha_min, alpha_max])

    atlas = Image.new(
        "RGBA",
        (512 * spec["count"], 512),
        (0, 0, 0, 0),
    )
    for index, path in enumerate(frames):
        frame = Image.open(path).convert("RGBA")
        atlas.alpha_composite(frame, (index * 512, 0))

    atlas_file = atlas_path(role)
    atlas_file.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(
        atlas_file,
        "WEBP",
        lossless=True,
        quality=100,
        method=6,
    )

    reopened = Image.open(atlas_file).convert("RGBA")
    if reopened.size != atlas.size:
        raise RuntimeError(f"{role}: atlas size mismatch")
    if reopened.getchannel("A").getextrema()[0] >= 255:
        raise RuntimeError(f"{role}: atlas transparency lost")

    return {
        "source_size": [width, height],
        "source_sha256": sha_file(source_path),
        "frame_count": spec["count"],
        "frame_size": [512, 512],
        "frame_sha256": [sha_file(path) for path in frames],
        "alpha_extrema": alpha_extrema,
        "atlas": str(atlas_file.relative_to(PACK)).replace("\\", "/"),
        "atlas_size": list(atlas.size),
        "atlas_sha256": sha_file(atlas_file),
    }


def write_metadata(results: dict) -> None:
    PACK.mkdir(parents=True, exist_ok=True)

    (PACK / "README.md").write_text(
        "# Jet pressurisé — sprites Capture HD\n\n"
        "Pack visuel additif pour une compétence eau de type rayon continu.\n"
        "Aucun changement de dégâts, énergie, cooldown, résistances ou collision n'est porté par ce pack.\n\n"
        "- charge/cast : 20 PNG RGBA 512×512\n"
        "- départ du rayon : 12 PNG RGBA 512×512\n"
        "- corps du rayon : 12 PNG RGBA 512×512\n"
        "- impact : 12 PNG RGBA 512×512\n"
        "- 56 frames individuelles au total\n"
        "- 4 atlas WebP horizontaux avec alpha\n"
        "- sources de transport WebP Q90 conservées sous "
        "'assets/library/capture/sprites/source/pressurized_jet_v1/'\n\n"
        "Le corps du rayon est un asset de trajet continu destiné au renderer générique 'beam'. "
        "Il ne doit pas être traité comme un projectile mobile.\n",
        encoding="utf-8",
    )

    with (PACK / "manifest.csv").open(
        "w",
        newline="",
        encoding="utf-8",
    ) as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(
            ["sequence", "frame", "file", "width", "height", "sha256"]
        )
        for role, spec in SPECS.items():
            for index in range(1, spec["count"] + 1):
                path = frame_path(role, index)
                writer.writerow(
                    [
                        role,
                        index,
                        str(path.relative_to(PACK)).replace("\\", "/"),
                        512,
                        512,
                        sha_file(path),
                    ]
                )

    sequences = {
        "frame_size": [512, 512],
        "sequences": {},
    }
    for role, spec in SPECS.items():
        sequences["sequences"][role] = {
            "frame_count": spec["count"],
            "frame_ms": spec["frame_ms"],
            "frames": [
                f"frames/sprite_skill_pressurized_jet_{role}_{index:02d}.png"
                for index in range(1, spec["count"] + 1)
            ],
            "atlas": (
                f"atlases/sprite_skill_pressurized_jet_{role}_atlas_01.webp"
            ),
            "playback_mode": spec["playback"],
        }

    (PACK / "sprite_skill_pressurized_jet_sequences_01.json").write_text(
        json.dumps(sequences, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    provenance = {
        "version": 1,
        "source": (
            "OpenAI image generation, user-approved Jet pressurisé sheets"
        ),
        "transport": (
            "Q90 WebP with alpha, derived from generated transparent PNG sheets "
            "before GitHub transfer"
        ),
        "source_archive_sha256": ARCHIVE_SHA256,
        "generation_ids": GENERATION_IDS,
        "crop_policy": (
            "cast: proportional 5x4 grid; beam_start/beam_body/impact: "
            "proportional 4x3 grids; row-major; contain-resize centered to 512x512"
        ),
        "results": results,
    }
    (PACK / "provenance.json").write_text(
        json.dumps(provenance, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def update_catalog() -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    ids = {asset["id"] for asset in catalog["assets"]}

    entries = [
        {
            "id": "pack:capture:sprite-pressurized-jet-cast-01",
            "label": "Jet pressurisé — charge",
            "assetType": "sprite",
            "mediaType": "image",
            "category": "release",
            "tags": ["skill", "water", "beam", "cast", "capture", "hd"],
            "source": {
                "scope": "pack",
                "packId": "capture",
                "author": "GenSrpG",
                "license": "project-internal",
            },
            "resource": {
                "file": (
                    "capture/sprites/skills/pressurized_jet/atlases/"
                    "sprite_skill_pressurized_jet_cast_atlas_01.webp"
                ),
                "format": "sprite-strip",
                "mime": "image/webp",
                "frameCount": 20,
                "frameMs": 60,
                "playbackMode": "once",
            },
            "compatibility": {"uses": ["combat", "capture", "editor"]},
        },
        {
            "id": "pack:capture:sprite-pressurized-jet-beam-start-01",
            "label": "Jet pressurisé — départ du rayon",
            "assetType": "sprite",
            "mediaType": "image",
            "category": "release",
            "tags": ["skill", "water", "beam", "start", "capture", "hd"],
            "source": {
                "scope": "pack",
                "packId": "capture",
                "author": "GenSrpG",
                "license": "project-internal",
            },
            "resource": {
                "file": (
                    "capture/sprites/skills/pressurized_jet/atlases/"
                    "sprite_skill_pressurized_jet_beam_start_atlas_01.webp"
                ),
                "format": "sprite-strip",
                "mime": "image/webp",
                "frameCount": 12,
                "frameMs": 45,
                "playbackMode": "once",
            },
            "compatibility": {"uses": ["combat", "capture", "editor"]},
        },
        {
            "id": "pack:capture:sprite-pressurized-jet-beam-body-01",
            "label": "Jet pressurisé — corps du rayon",
            "assetType": "sprite",
            "mediaType": "image",
            "category": "travel",
            "tags": [
                "skill",
                "water",
                "beam",
                "continuous",
                "travel",
                "capture",
                "hd",
            ],
            "source": {
                "scope": "pack",
                "packId": "capture",
                "author": "GenSrpG",
                "license": "project-internal",
            },
            "resource": {
                "file": (
                    "capture/sprites/skills/pressurized_jet/atlases/"
                    "sprite_skill_pressurized_jet_beam_body_atlas_01.webp"
                ),
                "format": "sprite-strip",
                "mime": "image/webp",
                "frameCount": 12,
                "frameMs": 45,
                "playbackMode": "loop",
                "headingRad": 0,
            },
            "compatibility": {"uses": ["combat", "capture", "editor"]},
        },
        {
            "id": "pack:capture:sprite-pressurized-jet-impact-01",
            "label": "Jet pressurisé — impact",
            "assetType": "sprite",
            "mediaType": "image",
            "category": "impact",
            "tags": ["skill", "water", "beam", "impact", "capture", "hd"],
            "source": {
                "scope": "pack",
                "packId": "capture",
                "author": "GenSrpG",
                "license": "project-internal",
            },
            "resource": {
                "file": (
                    "capture/sprites/skills/pressurized_jet/atlases/"
                    "sprite_skill_pressurized_jet_impact_atlas_01.webp"
                ),
                "format": "sprite-strip",
                "mime": "image/webp",
                "frameCount": 12,
                "frameMs": 45,
                "playbackMode": "once",
            },
            "compatibility": {"uses": ["combat", "capture", "editor"]},
        },
    ]

    for entry in entries:
        if entry["id"] in ids:
            raise RuntimeError("catalog id already exists: " + entry["id"])
        catalog["assets"].append(entry)
        ids.add(entry["id"])

    catalog["counts"]["assets"] = len(catalog["assets"])
    catalog["counts"]["sprites"] = sum(
        1
        for asset in catalog["assets"]
        if asset.get("assetType") == "sprite"
    )
    CATALOG.write_text(
        json.dumps(catalog, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def cleanup_transport() -> None:
    shutil.rmtree(TMP, ignore_errors=True)
    if WORKFLOW.exists():
        WORKFLOW.unlink()


def main() -> None:
    reconstruct_sources()
    if PACK.exists():
        shutil.rmtree(PACK)

    results = {
        role: build_role(role, spec)
        for role, spec in SPECS.items()
    }

    write_metadata(results)
    update_catalog()
    cleanup_transport()

    print(
        "pressurized jet vfx pack built:",
        sum(spec["count"] for spec in SPECS.values()),
        "frames",
    )


if __name__ == "__main__":
    main()
