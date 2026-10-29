#!/usr/bin/env python3
"""Import unmodified thorn-vine beam art from the author's uploaded ZIP to the canonical Capture library."""
from __future__ import annotations

import hashlib
import io
import json
import stat
import zipfile
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ZIP_NAME = "GENSRPG_LIANE_EPINEUSE_RAYON_12F_WEBP.zip"
ZIP_SHA = "59e6ad68defadd3ef9d187665fb345aeb8c11ddeebc24d34124e539677aabec3"
GIT_BLOB_SHA = "f45b36716e92ff779383f91eee10d34c60e96378"
ZIP_SIZE = 5636465
INPUT = ROOT / "_incoming" / ZIP_NAME
DEST = ROOT / "assets/library/capture/sprites/skills/liane_epineuse_rayon"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
ASSET_ID = "pack:capture:sprite-liane-epineuse-rayon-01"
FRAME_NAMES = [f"frames/liane_epineuse_rayon_{n:02d}.webp" for n in range(1,13)]
ATLAS = "liane_epineuse_rayon_atlas_12f.webp"
PREVIEW = "preview_liane_epineuse_rayon_12f.webp"
EXPECTED = {
    "README.txt", "manifest.json", "sha256.json", "apercu_12_etapes_fond_sombre.png",
    "planche_liane_epineuse_12f.png", "source/sprite_sheet_d_attaque_de_liane_magique.png",
    ATLAS, PREVIEW, *FRAME_NAMES,
}

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def git_hash(data: bytes) -> str:
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

def decode_webp(data: bytes, dimensions: tuple[int,int], nframes: int=1) -> Image.Image:
    image=Image.open(io.BytesIO(data))
    assert image.format == "WEBP" and image.size == dimensions, (image.format,image.size,dimensions)
    assert getattr(image,"n_frames",1) == nframes, "Wrong number of WebP frames"
    for n in range(nframes):
        if nframes > 1:
            image.seek(n)
        assert image.mode == "RGBA", "WebP does not preserve original RGBA"
        lo,hi=image.getchannel("A").getextrema()
        assert lo == 0 and hi > 0, "Transparent background and visible FX both required"
    return image

def inspect_zip() -> tuple[dict,dict[str,bytes],dict]:
    raw=INPUT.read_bytes()
    assert len(raw) == ZIP_SIZE and sha256(raw) == ZIP_SHA and git_hash(raw) == GIT_BLOB_SHA, "Wrong ZIP bytes"
    files={}
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        infos=archive.infolist()
        assert len(infos)==20 and archive.testzip() is None, "Bad archive CRC or count"
        assert sum(info.file_size for info in infos)<30_000_000, "Excessive expanded ZIP size"
        for info in infos:
            name=info.filename
            parts=Path(name).parts
            assert not info.is_dir() and name and not name.startswith("/") and ".." not in parts, "Unsafe ZIP path"
            assert len(parts)<=2 and not stat.S_ISLNK((info.external_attr>>16)&0xffff), "Invalid archive entry"
            assert name not in files, "Duplicate entry"
            files[name]=archive.read(info)
    assert set(files)==EXPECTED, ("Unexpected ZIP contents",set(files)^EXPECTED)
    provided=json.loads(files["sha256.json"])
    # The source-supplied sha256.json cannot reliably hash itself and omits
    # the added source PNG. Verify ALL digests it actually advertises, and
    # independently hash every ZIP member in authoritative provenance.json.
    assert set(provided) == (set(files) - {"source/sprite_sheet_d_attaque_de_liane_magique.png"}), "Unexpected source manifest coverage"
    for name,data in files.items():
        if name not in {"sha256.json","source/sprite_sheet_d_attaque_de_liane_magique.png"}:
            assert provided[name]==sha256(data), ("Source file SHA mismatch",name)
    assert sha256(files["source/sprite_sheet_d_attaque_de_liane_magique.png"]), "Source PNG digest missing"
    manifest=json.loads(files["manifest.json"])
    assert manifest["packId"]=="pack:capture:liane-epineuse-rayon-v1"
    assert manifest["assetId"]==ASSET_ID
    assert manifest["intendedEditorVisualRole"]=="beam"
    assert manifest["format"]=="webp" and manifest["background"]=="transparent"
    assert manifest["frameCount"]==12 and manifest["frameSize"]==[512,512]
    assert manifest["frames"]==FRAME_NAMES
    assert manifest["playbackMode"]=="once"
    assert manifest["frameDurationsMs"]==[150]*7+[190]*4+[650]
    assert manifest["atlas"]=={"file":ATLAS,"frameWidth":512,"frameHeight":512,
                                "frameCount":12,"layout":"horizontal"}
    assert manifest["animatedPreview"]==PREVIEW
    assert manifest["phases"]=={"extensionFrames":[1,7],"wrapFrames":[8,12]}
    v=manifest["visualIntent"]
    assert v["origin"]=="caster" and v["target"]=="opponent" and v["stretchesBetweenActors"] is True
    assert v["end"]=="thorny vine coils around target"
    assert "gameplay-only" in v["affectsEnemyReserve"]
    individual=[]
    for name in FRAME_NAMES:
        img=decode_webp(files[name],(512,512))
        individual.append(img.copy())
    assert len({sha256(files[n]) for n in FRAME_NAMES})==12, "Duplicate animation frames"
    atlas=decode_webp(files[ATLAS],(6144,512))
    for k,frame in enumerate(individual):
        crop=atlas.crop((k*512,0,(k+1)*512,512))
        assert ImageChops.difference(frame,crop).getbbox() is None, ("Atlas differs from real source frame",k+1)
    decode_webp(files[PREVIEW],(512,512),12)
    for png in ("apercu_12_etapes_fond_sombre.png","planche_liane_epineuse_12f.png",
                "source/sprite_sheet_d_attaque_de_liane_magique.png"):
        img=Image.open(io.BytesIO(files[png]))
        assert img.format=="PNG" and img.width>0 and img.height>0
        img.verify()
    provenance={
        "sourceArchive":ZIP_NAME,"sourceArchiveSha256":ZIP_SHA,
        "sourceGitBlobSha":GIT_BLOB_SHA,"sourceArchiveBytes":len(raw),
        "sourceFileSha256":{name:sha256(data) for name,data in files.items()},
        "sourceContentsNote":"20 original ZIP members retained byte-for-byte. Self-digest in sha256.json is not authoritative.",
    }
    return manifest,files,provenance

def main() -> None:
    assert INPUT.is_file(), "Uploaded author ZIP missing from work branch"
    assert not DEST.exists(), "Refusing to replace existing media"
    manifest,files,provenance=inspect_zip()
    cat=json.loads(CATALOG.read_text(encoding="utf-8"))
    assert cat["storage"]["branch"]=="global-assets"
    assert cat["storage"]["libraryRoot"]=="assets/library/"
    ids=[item["id"] for item in cat["assets"]]
    assert len(set(ids))==len(ids) and ASSET_ID not in ids, "Existing catalog ID collision"
    sequence={
        "id":ASSET_ID,"role":"beam","frameSize":[512,512],
        "frame_count":12,"frame_ms":150,"frame_durations_ms":manifest["frameDurationsMs"],
        "playback_mode":"once","frames":FRAME_NAMES,
        "phases":manifest["phases"],"visualIntent":manifest["visualIntent"],
        "atlas":{"file":ATLAS,"format":"sprite-strip","frameCount":12,"frameWidth":512,"frameHeight":512},
        "preview":PREVIEW,
        "note":"Authored beam intent only; FX/runtime owns presentation, target selection, reserve swaps, and phase timing.",
    }
    cat["assets"].append({
        "id":ASSET_ID,
        "label":"Rayon — Liane épineuse (extension et enroulement cible, 12f)",
        "assetType":"sprite","mediaType":"image","category":"travel",
        "tags":["capture","skill","nature","plant","vine","liane","thorn","epine","beam","rayon","travel","wrap","animated"],
        "source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},
        "resource":{"file":"capture/sprites/skills/liane_epineuse_rayon/"+ATLAS,
                    "format":"sprite-strip","mime":"image/webp","frameCount":12,
                    "frameMs":150,"playbackMode":"once","headingRad":0},
        "compatibility":{"uses":["combat","capture","editor"]},
    })
    for name,data in files.items():
        target=DEST/name
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(data)
    (DEST/"sprite_skill_liane_epineuse_rayon_sequence_01.json").write_text(
        json.dumps(sequence,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    (DEST/"provenance.json").write_text(
        json.dumps(provenance,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    (DEST/"README.md").write_text(
        "# Liane épineuse — Rayon Nature (Monster Capture)\n\n"
        "Original author ZIP: 20 files kept byte-for-byte, including 12 transparent RGBA 512×512 WebP "
        "frames, strip atlas 6144×512, animated 12f preview, source image and control sheets. "
        "Phases 1–7: caster-to-target thorny vine extends; 8–12: coils around the target. "
        "The editor uses the existing beam/travel visual selector. Authored variable frame durations "
        "are in the sequence manifest; atlas catalog exposes the 150ms default. "
        "No game rules, reserve-switching logic, skills, characters or renderer were changed. "
        "Gameplay review in the smartphone preview is separate from asset library validation.\n",
        encoding="utf-8",
    )
    cat["counts"]["assets"]=len(cat["assets"])
    cat["counts"]["sprites"]=sum(a["assetType"]=="sprite" for a in cat["assets"])
    CATALOG.write_text(json.dumps(cat,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    INPUT.unlink() # Original ZIP still exists in prior Git commit for unmodified provenance.
    print("SUCCESS: 20 real approved source files + 3 metadata, 12 WebP 512², strip atlas 6144×512, preview 12f, sole catalog assetId")

if __name__=="__main__":
    main()
