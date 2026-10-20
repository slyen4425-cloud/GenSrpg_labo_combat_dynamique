#!/usr/bin/env python3
"""Import existing wolf V3 sprite-review ZIPs into review-only GitHub media.

Never generate/reinterpret creature drawings, never change asset catalog/runtime.
Four ZIP files are supplied in _incoming on the dedicated review branch.
"""
from __future__ import annotations

from hashlib import sha256
from pathlib import Path
from PIL import Image, ImageDraw
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
INCOMING = ROOT / "_incoming"
OUT = ROOT / "assets/library/capture/creatures/loup_volcanique/animation_previews_v3"
KEYS = ("attaque_face", "attaque_dos", "deplacement_face", "deplacement_dos")
FILES = {k: INCOMING / f"Loup_volcanique_V3_{k.upper()}_POUR_GITHUB.zip" for k in KEYS}
WOLF = "loup_volcanique"
FRAME_COUNT = 20

def digest(p: Path) -> str:
    return sha256(p.read_bytes()).hexdigest()

def install_zip(key: str, path: Path) -> dict:
    wanted = {f"{key}/frames/{key}_{n:02d}.png" for n in range(1, 21)}
    wanted |= {
        f"{key}/{key}_preview.gif",
        f"{key}/{key}_preview.webp",
        f"{key}/{key}_poses.jpg",
        f"{key}/{key}_atlas.png"
    }
    with zipfile.ZipFile(path) as z:
        actual = set(z.namelist())
        if actual != wanted:
            raise ValueError(f"{path.name}: unexpected/missing paths: {sorted(actual^wanted)}")
        for item in z.infolist():
            if item.is_dir() or item.filename.startswith("/") or ".." in Path(item.filename).parts:
                raise ValueError(f"Unsafe archive member {item.filename}")
            destination = OUT / item.filename
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(z.read(item))
    frames = []
    hashes = []
    for i in range(1, FRAME_COUNT + 1):
        p = OUT / key / "frames" / f"{key}_{i:02d}.png"
        with Image.open(p) as im:
            if im.size != (512, 512) or im.mode != "RGBA" or im.getextrema()[3][0] != 0:
                raise ValueError(f"Invalid RGBA frame {key} {i}: {im.mode} {im.size}")
            frames.append(im.copy())
        hashes.append(digest(p))
    atlas = OUT / key / f"{key}_atlas.png"
    with Image.open(atlas) as im:
        if im.size != (2560, 2048) or im.mode != "RGBA":
            raise ValueError(f"Bad atlas {key}: {im.size}, {im.mode}")
    with Image.open(OUT / key / f"{key}_preview.webp") as im:
        if getattr(im, "n_frames", 1) != FRAME_COUNT:
            raise ValueError(f"Bad animated preview frame count for {key}")
    return dict(key=key, frames=20, sha256=hashes, input_zip=path.name,
                zip_sha256=digest(path), frames_are_RGBA_512=True,
                notes="Movement images author-accepted" if key.startswith("deplacement") else
                      "Attack preview pending explicit author reapproval")

def combined() -> None:
    # Render a contact preview from the 80 supplied PNGs (no new sprite generation).
    cells = []
    for key in KEYS:
        seq = []
        for i in range(1, 21):
            p = OUT / key / "frames" / f"{key}_{i:02d}.png"
            with Image.open(p) as img:
                seq.append(img.convert("RGBA").resize((252, 252), Image.Resampling.LANCZOS))
        cells.append(seq)
    final = []
    for i in range(FRAME_COUNT):
        canvas = Image.new("RGB", (560, 604), (18, 24, 35))
        draw = ImageDraw.Draw(canvas)
        for j, key in enumerate(KEYS):
            x = 18 + (j % 2) * 272
            y = 25 + (j // 2) * 284
            # Checkerboard exists on preview only. Production sprites keep their alpha.
            for cy in range(0, 252, 21):
                for cx in range(0, 252, 21):
                    fill = (40, 47, 58) if (cx//21+cy//21)%2 else (56, 63, 74)
                    draw.rectangle((x+cx,y+cy,x+cx+20,y+cy+20),fill=fill)
            canvas.paste(cells[j][i], (x,y), mask=cells[j][i].getchannel("A"))
            draw.text((x+8,y+254),key.upper().replace("_", " "),fill=(240,245,250))
        draw.text((235,590),f"POSE {i+1:02d}/20",fill=(240,245,250))
        final.append(canvas)
    final[0].save(OUT/"loup_volcanique_V3_quatre_previews.gif",
                  save_all=True,append_images=final[1:],duration=85,
                  loop=0,optimize=True,disposal=2)

def main():
    missing = [p.name for p in FILES.values() if not p.is_file()]
    if missing:
        print("WAITING_FOR_4_AUTHOR_ARCHIVES:", ", ".join(missing))
        return
    OUT.mkdir(parents=True, exist_ok=True)
    report = [install_zip(k, FILES[k]) for k in KEYS]
    combined()
    index = """# Loup volcanique — V3 — PREVISUALISATIONS UNIQUEMENT

**Statut : PREVIEW_READY, PAS DE RACCORDEMENT AU JEU.**

Ces médias proviennent des planches préexistantes, sans génération supplémentaire.
Les animations de déplacement face et dos ont été conservées depuis la V2 validée.
**Limite connue : la frame 12 de l'attaque face peut contenir une troncature
issue de la planche source. Une coupe absente de l'image ne peut pas être recréée
par une simple opération de détourage.**

Les quatre aperçus GIF/WebP et les 80 frames sources sont dans les dossiers
attaque_face/, attaque_dos/, deplacement_face/ et deplacement_dos/.
Ouvrir le GIF combiné :
[loup_volcanique_V3_quatre_previews.gif](loup_volcanique_V3_quatre_previews.gif).

Ne pas changer le catalogue d'assets ni intégrer au jeu avant validation explicite
de l'auteur pour les deux attaques.
"""
    (OUT/"README.md").write_text(index,encoding="utf-8")
    (OUT/"review_manifest.json").write_text(json.dumps({
        "creature": WOLF,
        "status": "PREVIEW_READY_AWAITING_AUTHOR_APPROVAL_FOR_ATTACKS",
        "assetCatalogChanged": False, "runtimeIntegrated": False,
        "fourAnimations": report,
        "knownUnresolvedRisk": "Attaque face frame 12 may be clipped in source",
        "generation": "NO_NEW_IMAGE_GENERATION",
        "protected": ["deplacement_face", "deplacement_dos"],
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("READY: 80 RGBA frames + 4 atlases + 4 GIF/WebP + combo")

if __name__ == "__main__":
    main()
