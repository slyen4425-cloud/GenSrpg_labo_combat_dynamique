#!/usr/bin/env python3
"""Import already-authored four wolf animations into REVIEW ONLY, never runtime.

No image generation or modification. Only ZIP assets from the author-approved
local preview V3 are copied. The two previously approved movement frame binaries
remain byte-identical to V2. No catalog mutation, and no mixing with skill FX.
"""
from __future__ import annotations
from pathlib import Path, PurePosixPath
from PIL import Image, ImageSequence
from io import BytesIO
import hashlib, json, os, shutil, zipfile

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "_incoming" / "Loup_volcanique_4_animations_PREVIEW_V3_sans_generation.zip"
EXPECTED_SHA256 = "606a67e161f9fb1186e2a29b6d90aa415d050de9033c1ede83b5cefb18a7dc80"
DEST = ROOT / "assets/library/capture/creatures/loup_volcanique/animation_previews_v3"
ACTIONS = ("deplacement_face", "deplacement_dos", "attaque_face", "attaque_dos")

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def main() -> None:
    if not PACK.is_file():
        raise SystemExit("Missing reviewed input ZIP in _incoming/")
    data = PACK.read_bytes()
    if digest(data) != EXPECTED_SHA256:
        raise SystemExit("Input mismatch: bad ZIP SHA256. Refuse unpublished replacement.")

    with zipfile.ZipFile(BytesIO(data)) as z:
        members = z.namelist()
        if any(PurePosixPath(x).is_absolute() or ".." in PurePosixPath(x).parts for x in members):
            raise SystemExit("Unsafe ZIP entry")
        if len(members) > 120:
            raise SystemExit("Unexpected number of entries")
        for action in ACTIONS:
            frame_files = [f"{action}/frames/{action}_{i:02d}.png" for i in range(1,21)]
            for name in frame_files:
                if name not in members:
                    raise SystemExit("Missing frame " + name)
                pixels = z.read(name)
                with Image.open(BytesIO(pixels)) as im:
                    if im.size != (512,512) or im.mode != "RGBA":
                        raise SystemExit("Incorrect frame format " + name)
                    if im.getextrema()[3][0] != 0:
                        raise SystemExit("Transparent frame required " + name)
            for suffix in ("_preview.gif","_preview.webp","_poses.jpg","_atlas.png"):
                if f"{action}/{action}{suffix}" not in members:
                    raise SystemExit("Missing preview/atlas for " + action)
        report=json.loads(z.read("rapport_qualite.json"))
        if not report.get("no_new_generation") or not report.get("movement_frames_copied_byte_identical_from_V2"):
            raise SystemExit("Input did not preserve accepted movement")
        if report.get("no_game_integration") is not True:
            raise SystemExit("Accidental game integration prohibited")

        DEST.mkdir(parents=True,exist_ok=True)
        for name in members:
            if name.endswith("/"):
                continue
            target=DEST/name
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(z.read(name))
    # Preserve exact original wolf player/opponent canonical files and catalog.
    index = {"creatureId":"loup_volcanique","version":"V3-existing-sprites-no-generation",
       "status":"PREVIEW_READY_AWAITING_EXPLICIT_ART_REVIEW",
       "noNewGeneration":True,"frameCountPerAction":20,
       "views":{"movement_face":"deplacement_face","movement_dos":"deplacement_dos",
                "attack_face":"attaque_face","attack_dos":"attaque_dos"},
       "uncertainty":"Attaque FACE frame 12 may have a source-cell border cut; verify before approval",
       "catalogChanged":False,"runtimeIntegrated":False,"sourceZipSha256":EXPECTED_SHA256}
    (DEST/"review_manifest.json").write_text(json.dumps(index,ensure_ascii=False,indent=2)+"\n")
    print("OK: 4 x 20 RGBA frames, 4 animations + atlases, review only")

if __name__ == "__main__":
    main()
