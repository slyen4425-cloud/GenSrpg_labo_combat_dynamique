#!/usr/bin/env python3
"""Byte-preserving importer of user-approved spherical spore Cloud V2 media."""
from __future__ import annotations
import hashlib
import io
import json
import stat
import zipfile
from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = "GENSRPG_NUAGE_SPORES_SPHERIQUE_AUTOUR_CREATURE_V2_12F_WEBP.zip"
SOURCE_SHA = "c7929d95dbbd1d456d81db1d3eb941a4fe0e77569448fd509d7cb7bd5073aa79"
GIT_SHA = "f9aa7dc0b0668ca3c2d61ef3a65d39ee56960efc"
PREFIX = "GENSRPG_NUAGE_SPORES_SPHERIQUE_AUTOUR_CREATURE_V2_12F/"
INCOMING = ROOT / "_incoming" / ARCHIVE
DEST = ROOT / "assets/library/capture/sprites/skills/spores_spheriques_v2"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
ASSET_ID = "pack:capture:sprite-spores-expansives-projectile-sphere-02"
ATLAS = "spores_spheriques_autour_creature_atlas_12f.webp"
PREVIEW = "preview_spores_spheriques_autour_creature_12f.webp"
FRAME_FILES = [f"frames/spores_spheriques_autour_creature_{n:02}.webp" for n in range(1,13)]

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def git_blob(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

def verify_image(data: bytes, size: tuple[int,int], count: int = 1):
    image=Image.open(io.BytesIO(data))
    assert image.format == "WEBP" and image.size == size, ("WebP size",image.format,image.size)
    assert getattr(image,"n_frames",1) == count, ("Wrong animation length",image.n_frames)
    for n in range(count):
        image.seek(n)
        assert image.mode == "RGBA", ("Not RGBA",image.mode,n)
        a=image.getchannel("A").getextrema()
        assert a[0] == 0 and a[1] > 0, ("No transparent and visible pixels",n,a)
    image.seek(0)
    return image

def source_media():
    assert INCOMING.is_file(), f"Approved ZIP missing: {INCOMING}"
    raw=INCOMING.read_bytes()
    assert len(raw) == 5632585 and sha(raw) == SOURCE_SHA and git_blob(raw) == GIT_SHA, "Approved author ZIP bytes differ"
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        members=archive.infolist()
        assert len(members) == 18 and archive.testzip() is None, "ZIP CRC/list mismatch"
        assert sum(info.file_size for info in members) < 50_000_000, "ZIP expansion guard"
        files={}
        for item in members:
            name=item.filename
            parts=Path(name).parts
            assert not item.is_dir() and name.startswith(PREFIX) and ".." not in parts and not name.startswith("/")
            assert not stat.S_ISLNK((item.external_attr>>16)&0xffff), "Symlink forbidden"
            relative=name[len(PREFIX):]
            assert relative and len(Path(relative).parts)<=2 and relative not in files, "Invalid/duplicate media name"
            files[relative]=archive.read(item)
    expected={"README.md","manifest.json",ATLAS,PREVIEW,"planche_source_spores_spheriques.png","planche_spores_spheriques_12f.png",*FRAME_FILES}
    assert set(files) == expected, ("Missing or unknown media",set(files)^expected)
    metadata=json.loads(files["manifest.json"])
    assert metadata["id"] == ASSET_ID
    assert metadata["role"] == "projectile" and metadata["category"] == "skill"
    assert metadata["presentationType"] == "radial-caster-cloud"
    assert metadata["behavior"] == "expansion-radiale-autour-du-lanceur"
    assert metadata["centerOnCaster"] is True and metadata["travelsToTarget"] is False
    assert metadata["frameCount"] == 12 and metadata["frameSize"] == [512,512]
    assert metadata["frameDurationMs"] == 100 and metadata["playbackMode"] == "once"
    assert metadata["frameFiles"] == FRAME_FILES
    assert metadata["atlas"] == {"file":ATLAS,"format":"sprite-strip","frameCount":12,"frameWidth":512,"frameHeight":512}
    assert metadata["preview"] == PREVIEW and metadata["alpha"] is True
    frame_hashes=set()
    original=[]
    for name in FRAME_FILES:
        frame=verify_image(files[name],(512,512))
        frame_hashes.add(sha(files[name]))
        original.append(frame.copy().convert("RGBA"))
    assert len(frame_hashes)==12, "Repeated frames instead of actual animation"
    atlas=verify_image(files[ATLAS],(6144,512)).convert("RGBA")
    for index,frame in enumerate(original):
        tile=atlas.crop((index*512,0,(index+1)*512,512))
        assert ImageChops.difference(frame,tile).getbbox() is None, ("Atlas pixel mismatch",index)
    verify_image(files[PREVIEW],(512,512),12)
    for png in ["planche_source_spores_spheriques.png","planche_spores_spheriques_12f.png"]:
        img=Image.open(io.BytesIO(files[png]))
        assert img.format == "PNG" and img.width>0 and img.height>0
        img.verify()
    provenance={"sourceArchive":ARCHIVE,"sourceArchiveSha256":SOURCE_SHA,
                "sourceGitBlobSha":GIT_SHA,"sourceArchiveBytes":len(raw),
                "sourceFileSha256":{name:sha(data) for name,data in files.items()}}
    return metadata,files,provenance

def main():
    assert not DEST.exists(), "Refuse overwrite of existing media pack"
    original,files,provenance=source_media()
    catalog=json.loads(CATALOG.read_text(encoding="utf8"))
    assert catalog["storage"]["branch"]=="global-assets"
    assert catalog["storage"]["libraryRoot"]=="assets/library/"
    ids=[a["id"] for a in catalog["assets"]]
    assert len(ids)==len(set(ids)) and ASSET_ID not in ids, "Duplicate/collision asset ID"
    sequence={
        "id":ASSET_ID,"label":original["label"],"element":original["element"],
        "frameSize":[512,512],"frame_count":12,"frame_ms":100,
        "playback_mode":"once","loop":False,
        "presentationType":"radial-caster-cloud","centerOnCaster":True,
        "travelsToTarget":False,"behavior":"expansion-radiale-autour-du-lanceur",
        "frames":FRAME_FILES,"preview":PREVIEW,"atlas":original["atlas"],
    }
    catalog["assets"].append({
        "id":ASSET_ID,"label":original["label"],
        "assetType":"sprite","mediaType":"image","category":"skill",
        "tags":["capture","skill","nature","poison","spore","expansion","radial","caster-centered","non-travel","animated"],
        "source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},
        "resource":{"file":"capture/sprites/skills/spores_spheriques_v2/"+ATLAS,
                    "format":"sprite-strip","mime":"image/webp","frameCount":12,
                    "frameMs":100,"playbackMode":"once"},
        "compatibility":{"uses":["combat","capture","editor"]},
    })
    assert len({a["id"] for a in catalog["assets"]}) == len(catalog["assets"])
    for relative,data in files.items():
        dest=DEST/relative
        dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_bytes(data)
    (DEST/"sprite_skill_spores_spheriques_sequence_v2.json").write_text(
        json.dumps(sequence,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    (DEST/"provenance.json").write_text(
        json.dumps(provenance,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    (DEST/"README_LIBRARY.md").write_text(
        "# Nuage de spores sphérique V2 — Capture\n\n"
        "18 original author ZIP members preserved exactly byte-for-byte, including "
        "12 transparent RGBA 512x512 frames, original 6144x512 sprite strip, "
        "animated 12-frame preview and source sheets. One canonical global-assets "
        "assetId. Role is radial caster-centered skill, not a traveling projectile. "
        "No automatic gameplay binding, FX radius/collision change, or skill reconfiguration.\n",encoding="utf8")
    catalog["counts"]["assets"]=len(catalog["assets"])
    catalog["counts"]["sprites"]=sum(a["assetType"]=="sprite" for a in catalog["assets"])
    CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    INCOMING.unlink() # Source remains in immutable git parent history.
    print("SUCCESS: 12 original spherical-spore RGBA frames, atlas, preview and canonical asset registered")

if __name__=="__main__":
    main()
