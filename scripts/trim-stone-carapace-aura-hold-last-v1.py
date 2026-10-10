#!/usr/bin/env python3
"""Asset-only surgical trim: aura frames 1..12, remove reversal 13..16.
No regeneration or repaint: the original 16-frame source sheet stays archived.
"""
from __future__ import annotations
import csv, hashlib, io, json
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "assets/library/capture/sprites/skills/stone_carapace"
ATLAS = PACK / "atlases/sprite_skill_stone_carapace_aura_atlas_01.webp"
SEQUENCE = PACK / "sprite_skill_stone_carapace_sequences_01.json"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
PROVENANCE = PACK / "provenance.json"
MANIFEST = PACK / "manifest.csv"
README = PACK / "README.md"
BUILDER = ROOT / "scripts/build-stone-carapace-vfx-pack-v1.py"
DOC = ROOT / "docs/LAB_STONE_CARAPACE_VFX_ASSETS_V1.md"
KEEP, ORIGINAL = 12, 16
ASSET_ID = "pack:capture:sprite-stone-carapace-aura-01"

def dump(path, object_):
    path.write_text(json.dumps(object_, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    original = Image.open(ATLAS)
    if original.size != (512 * ORIGINAL, 512):
        raise AssertionError("Expected original 16-frame aura before trimming")
    source = ROOT / "assets/library/capture/sprites/source/stone_carapace_v1/stone_carapace_aura_source_01.webp"
    source_sha = sha(source)
    original_atlas_sha = sha(ATLAS)

    images = []
    for i in range(1, ORIGINAL + 1):
        filename = PACK / "frames" / f"sprite_skill_stone_carapace_aura_{i:02d}.png"
        with Image.open(filename) as image:
            if image.size != (512,512) or image.mode != "RGBA":
                raise AssertionError(f"Unexpected frame format: {filename}")
            if i <= KEEP:
                images.append(image.copy())
    # Retain original pixel data; do not alpha-mask RGBA paste a second time.
    trimmed = Image.new("RGBA",(512*KEEP,512),(0,0,0,0))
    for index, frame in enumerate(images):
        trimmed.paste(frame,(512*index,0))
    trimmed.save(ATLAS,"WEBP",lossless=True,quality=100,method=6)
    with Image.open(ATLAS) as readback:
        if readback.size != (6144,512):
            raise AssertionError("Trimmed atlas dimensions mismatch")
        assert readback.getchannel("A").getextrema() == (0,255)
        for index,frame in enumerate(images):
            actual = readback.crop((512*index,0,512*(index+1),512)).convert("RGBA")
            # WebP lossless may canonicalize invisible RGB. Verify alpha and
            # every visible RGB value instead of comparing transparent RGB.
            mask = frame.getchannel("A").point(lambda value: 255 if value else 0)
            original_channels = frame.split()
            readback_channels = actual.split()
            if ImageChops.difference(original_channels[3],readback_channels[3]).getbbox():
                raise AssertionError(f"Frame {index+1} alpha changed")
            for channel in range(3):
                diff = ImageChops.difference(original_channels[channel],readback_channels[channel])
                if ImageChops.multiply(diff,mask).getbbox():
                    raise AssertionError(f"Frame {index+1} visible RGB changed")

    sequence = json.loads(SEQUENCE.read_text(encoding="utf-8"))
    aura = sequence["sequences"]["aura"]
    if aura["frame_count"] != ORIGINAL or len(aura["frames"]) != ORIGINAL:
        raise AssertionError("Unexpected source sequence")
    aura["frame_count"] = KEEP
    aura["frames"] = aura["frames"][:KEEP]
    # Playback policy still belongs to the capability: keep existing loop default.
    dump(SEQUENCE, sequence)

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    matches=[x for x in catalog["assets"] if x["id"] == ASSET_ID]
    if len(matches)!=1 or matches[0]["resource"]["frameCount"]!=ORIGINAL:
        raise AssertionError("Wrong catalogue owner or original frameCount")
    matches[0]["resource"]["frameCount"]=KEEP
    dump(CATALOG,catalog)

    rows=list(csv.DictReader(io.StringIO(MANIFEST.read_text(encoding="utf-8"))))
    if len(rows)!=32: raise AssertionError("Unexpected original manifest")
    rows=[row for row in rows if row["sequence"]!="aura" or int(row["frame"])<=KEEP]
    with MANIFEST.open("w",newline="",encoding="utf-8") as out:
        writer=csv.DictWriter(out,fieldnames=["sequence","frame","file","width","height","sha256"],lineterminator="\n")
        writer.writeheader();writer.writerows(rows)

    data=json.loads(PROVENANCE.read_text(encoding="utf-8"))
    p=data["results"]["aura"]
    if p["frame_count"]!=ORIGINAL: raise AssertionError("Unexpected original provenance")
    p["frame_count"]=KEEP
    p["frame_sha256"]=p["frame_sha256"][:KEEP]
    p["alpha_extrema"]=p["alpha_extrema"][:KEEP]
    p["atlas_size"]=[6144,512]
    p["atlas_sha256"]=sha(ATLAS)
    data["hold_last_trim_v1"]={
      "cutoff_frame":KEEP,"original_frame_count":ORIGINAL,
      "omitted_frames":[13,14,15,16],
      "reason":"frames 13..16 progressively dismantle stone armor; 12 is the last complete shell",
      "source_sheet_sha256":source_sha,
      "original_atlas_sha256":original_atlas_sha,
      "trimmed_atlas_sha256":sha(ATLAS),
      "original_source_preserved":True
    }
    dump(PROVENANCE,data)

    # Keep historical source, remove only obsolete *derived* output frames.
    for index in range(KEEP+1,ORIGINAL+1):
        (PACK/"frames"/f"sprite_skill_stone_carapace_aura_{index:02d}.png").unlink()
    readme=README.read_text(encoding="utf-8")
    readme=readme.replace("aura protectrice : 16 PNG", "aura protectrice : 12 PNG")
    readme=readme.replace("32 frames individuelles au total", "28 frames individuelles au total")
    readme=readme.replace("2 atlas WebP horizontaux 8192×512","1 atlas charge 8192×512 ; 1 atlas aura 6144×512")
    readme += "\nCorrection 2026-10-10 : aura coupée après frame 12 (dernière carapace entière), frames de retrait 13–16 retirées de l'asset actif. Source 16 frames inchangée.\n"
    README.write_text(readme,encoding="utf-8")

    builder=BUILDER.read_text(encoding="utf-8")
    needle='"aura":{"source_archive":"stone_carapace_aura_source_01.webp","source_name":"stone_carapace_aura_source_01.webp","source_sha256":"ee27569ec15d6010383d7bf781c72d5bd687a09355e82669238b07e7c4ad8e88","count":16'
    if builder.count(needle)!=1: raise AssertionError("Original source builder signature changed")
    builder=builder.replace(needle,needle[:-2]+'12',1)
    builder=builder.replace('charge/cast : 16 PNG RGBA 512×512\\n- aura protectrice : 16 PNG RGBA 512×512\\n- 32 frames individuelles au total\\n- 2 atlas WebP horizontaux 8192×512', 'charge/cast : 16 PNG RGBA 512×512\\n- aura protectrice : 12 PNG RGBA 512×512\\n- 28 frames individuelles au total\\n- charge atlas 8192×512 ; aura atlas 6144×512')
    builder=builder.replace('{"id":"pack:capture:sprite-stone-carapace-aura-01"', '{"id":"pack:capture:sprite-stone-carapace-aura-01"', 1)
    builder=builder.replace('"frameCount":16,"frameMs":90', '"frameCount":12,"frameMs":90')
    BUILDER.write_text(builder,encoding="utf-8")

    doc=DOC.read_text(encoding="utf-8")
    doc += "\n## 2026-10-10 — Retrait de l'animation finale inverse\n\nInspection directe des frames aura : la carapace est complète sur la frame 12, puis se défait progressivement de 13 à 16. La version active conserve 12 frames 512×512 (90 ms chacune), un atlas WebP 6144×512, et le même assetId canonique. Cast reste 16 frames. Les sources historiques originales 16 frames sont inchangées. Le mode de gel sur la dernière image reste configuré sur le visuel du statut dans l'éditeur, pas dans le gameplay.\n"
    DOC.write_text(doc,encoding="utf-8")
    print("STONE_CARAPACE_AURA_TRIM_SUCCESS")
    print(f"active aura frames={KEEP}; removed=13,14,15,16; final=12; frameMs=90")
    print(f"atlas={ATLAS.relative_to(ROOT)} size=6144x512 sha256={sha(ATLAS)}")
    print(f"original source preserved sha256={source_sha}")

if __name__ == "__main__":
    main()
