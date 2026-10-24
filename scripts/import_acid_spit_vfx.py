#!/usr/bin/env python3
"""Import approved Crachat acide ZIP media without recreating any source frames."""
from __future__ import annotations

import hashlib
import io
import json
import stat
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INCOMING = ROOT / "_incoming/crachat-acide"
DEST = ROOT / "assets/library/capture/sprites/skills/acid_spit"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
TEST = ROOT / "tests/unit/capture-acid-spit-assets-2026-10-24.test.mjs"
ROLES = {
    "cast": (
        "GENSRPG_FX_CRACHAT_ACIDE_01_CAST_ACIDE_20F.zip",
        "ba3555f9da905b95c313e7a892d43bf37b75ef274c57032927272cbfc4b1205a",
        "01_CAST_ACIDE",
        "release", 70, "once"
    ),
    "projectile": (
        "GENSRPG_FX_CRACHAT_ACIDE_02_PROJECTILE_ACIDE_20F.zip",
        "c48d1b50ea1e64f26cd3bfa5faf80293937a07a5eb114b0e94c3cd10d480bb4e",
        "02_PROJECTILE_ACIDE",
        "travel", 60, "loop"
    ),
    "impact": (
        "GENSRPG_FX_CRACHAT_ACIDE_03_IMPACT_ACIDE_20F.zip",
        "277d62d9c57a8c8896f867f6a65796a30a3f14cb355002783baf51430d2a26e8",
        "03_IMPACT_ACIDE",
        "impact", 65, "once"
    ),
    "aura": (
        "GENSRPG_FX_CRACHAT_ACIDE_04_AURA_ACIDE_20F.zip",
        "c7fa42f436f1736b6d4545e10a322ad63ed935b7e09794acc9a6fd53d0334ba5",
        "04_AURA_ACIDE",
        "skill", 85, "loop"
    )
}


def sha(binary: bytes) -> str:
    return hashlib.sha256(binary).hexdigest()


def check_png(data: bytes, size: tuple[int, int]) -> None:
    im = Image.open(io.BytesIO(data))
    im.load()
    assert im.format == "PNG" and im.mode == "RGBA" and im.size == size, ("Invalid transparent PNG", im.mode, im.size)
    mn, mx = im.getchannel("A").getextrema()
    assert mn == 0 and mx > 0, ("PNG missing transparent pixels or visible effect", mn, mx)


def inspect_archive(role: str, spec: tuple) -> tuple[dict, dict[str, bytes], dict]:
    filename, required_hash, source_folder, category, frame_ms, playback = spec
    archive = INCOMING / filename
    assert archive.is_file(), "Missing real author archive: " + str(archive)
    data = archive.read_bytes()
    assert 0 < len(data) < 30_000_000 and sha(data) == required_hash, "Original ZIP changed: " + filename
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        info = z.infolist()
        assert len(info) == 26 and z.testzip() is None, "ZIP entries/CRC mismatch: " + filename
        assert sum(i.file_size for i in info) < 60_000_000, "ZIP decompression limit"
        files: dict[str, bytes] = {}
        for entry in info:
            name = entry.filename
            parts = Path(name).parts
            assert not entry.is_dir() and not (".." in parts or name.startswith("/")), "Unsafe ZIP path"
            assert not stat.S_ISLNK((entry.external_attr >> 16) & 0xFFFF), "ZIP symlink forbidden"
            assert len(parts) >= 2 and parts[0] == source_folder, "Unexpected archive prefix"
            rel = str(Path(*parts[1:]))
            assert rel and rel not in files
            files[rel] = z.read(name)
    source_manifest = json.loads(files["manifest.json"])
    m = source_manifest
    assert m["id"] == "pack:capture:sprite-crachat-acide-" + role + "-01"
    assert m["frameCount"] == 20 and m["frameSize"] == [512, 512]
    assert m["atlasFrameSize"] == [256, 256] and m["frameMs"] == frame_ms
    assert m["playbackMode"] == playback and m["element"] == "poison"
    assert m["sourceSheet"] == "PLANCHE_SOURCE.png"
    assert m["assetType"] == "sprite" and m["mediaType"] == "image"
    assert set(m["compatibility"]["uses"]) >= {"combat", "capture", "editor"}
    expected_frames = ["frames/gensrpg_crachat_acide_" + role + "_" + f"{n:02}.png" for n in range(1, 21)]
    assert m["frameFiles"] == expected_frames, "Frames not in author order"
    expected_misc = {
        "README.txt",
        "PREVIEW_20_FRAMES_" + role.upper() + ".png",
        "PREVIEW_ANIMEE_" + role.upper() + ".gif",
        "PLANCHE_SOURCE.png",
        "manifest.json",
        "gensrpg_crachat_acide_" + role + "_atlas.webp",
    }
    assert set(files) == expected_misc | set(expected_frames), "Unexpected missing or added archive content"
    hashes = []
    for f in expected_frames:
        check_png(files[f], (512, 512))
        hashes.append(sha(files[f]))
    assert len(set(hashes)) == 20, "Duplicate frames in approved animation " + role
    check_png(files["PLANCHE_SOURCE.png"], (1402, 1122))
    check_png(files["PREVIEW_20_FRAMES_" + role.upper() + ".png"], (1360, 1088))
    atlas_file = m["atlasFile"]
    img = Image.open(io.BytesIO(files[atlas_file]))
    img.load()
    assert img.format == "WEBP" and img.size == (5120, 256) and "A" in img.getbands(), "Invalid authored strip atlas"
    alpha_range = img.getchannel("A").getextrema()
    assert alpha_range[0] == 0 and alpha_range[1] > 0, "Invalid authored atlas alpha"
    return source_manifest, files, {
        "originalArchive": filename,
        "originalArchiveSha256": required_hash,
        "originalArchiveBytes": len(data),
        "frameSha256": hashes,
        "atlasSha256": sha(files[atlas_file]),
        "sourceSheetSha256": sha(files["PLANCHE_SOURCE.png"]),
        "sourceManifestSha256": sha(files["manifest.json"]),
    }


def main() -> None:
    assert not DEST.exists(), "Refuse to overwrite an existing acid spit asset pack"
    cat = json.loads(CATALOG.read_text(encoding="utf-8"))
    assert cat["storage"]["branch"] == "global-assets"
    used = {asset["id"] for asset in cat["assets"]}
    assert len(used) == len(cat["assets"]), "Catalog IDs already duplicated"
    all_data = {role: inspect_archive(role, specs) for role, specs in ROLES.items()}
    manifest = {
        "id": "pack:capture:acid-spit-vfx-v1",
        "frame_size": [512, 512],
        "sequences": {}
    }
    provenance = {}
    for role, (m, files, prov) in all_data.items():
        asset_id = m["id"]
        assert asset_id not in used, "ID collision " + asset_id
        used.add(asset_id)
        category, frame_ms, playback = ROLES[role][3:]
        atlas_rel = role + "/" + m["atlasFile"]
        manifest["sequences"][role] = {
            "id": asset_id,
            "label": m["label"],
            "frame_count": 20,
            "frame_ms": frame_ms,
            "loop": playback == "loop",
            "playback_mode": playback,
            "frames": [role + "/" + f for f in m["frameFiles"]],
            "atlas": {
                "file": atlas_rel,
                "format": "sprite-strip",
                "frameCount": 20,
                "frameWidth": 256,
                "frameHeight": 256
            }
        }
        cat["assets"].append({
            "id": asset_id,
            "label": m["label"],
            "assetType": "sprite",
            "mediaType": "image",
            "category": category,
            "tags": m["tags"] + (["debuff", "negative", "status"] if role == "aura" else []),
            "source": {
                "scope": "pack",
                "packId": "capture",
                "author": "GenSrpG",
                "license": "project-internal"
            },
            "resource": {
                "file": "capture/sprites/skills/acid_spit/" + atlas_rel,
                "format": "sprite-strip",
                "mime": "image/webp",
                "frameCount": 20,
                "frameMs": frame_ms,
                "playbackMode": playback
            },
            "compatibility": {"uses": ["combat", "capture", "editor"]}
        })
        provenance[role] = prov
    assert len(used) == len(cat["assets"])
    for role, (_, files, _) in all_data.items():
        for rel, raw in files.items():
            dst = DEST / role / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_bytes(raw)  # All originals preserved byte-for-byte.
    (DEST / "sprite_skill_crachat_acide_sequences_01.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (DEST / "provenance.json").write_text(
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (DEST / "README.md").write_text(
        "# Crachat acide — Capture FX\n\nFour approved author ZIPs, 80 ORIGINAL RGBA PNG frames 512px, "
        "four ORIGINAL WebP sprite-strip atlases 5120x256 (256px per frame), author manifests "
        "and source/preview files preserved. Cast/impact play once; projectile/debuff aura loop. "
        "Single catalog authority; no automatic change to configuredSkills or gameplay.\n",
        encoding="utf-8"
    )
    cat["counts"]["assets"] = len(cat["assets"])
    cat["counts"]["sprites"] = sum(a["assetType"] == "sprite" for a in cat["assets"])
    CATALOG.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    TEST.write_text(TEST_CODE, encoding="utf-8")
    for spec in ROLES.values():
        (INCOMING / spec[0]).unlink()  # Original blobs remain in the checkpoint/commit history.
    print("SUCCESS: four original acid-spit atlases + 80 original PNG; unique catalog IDs and sentinels written")


TEST_CODE = r'''import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const base=resolve(root,"assets/library/capture/sprites/skills/acid_spit");
const cat=JSON.parse(readFileSync(resolve(root,"data/assets/catalog/global-visual-assets.v1.json")));
const manifest=JSON.parse(readFileSync(resolve(base,"sprite_skill_crachat_acide_sequences_01.json")));
const provenance=JSON.parse(readFileSync(resolve(base,"provenance.json")));
const definitions=[["cast","release",70,"once"],["projectile","travel",60,"loop"],["impact","impact",65,"once"],["aura","skill",85,"loop"]];
const sha=b=>createHash("sha256").update(b).digest("hex");
test("real 80 acid-spit PNG and four atlas files are wired by unique asset IDs",()=>{
  assert.equal(cat.storage.branch,"global-assets");
  assert.equal(cat.counts.assets,cat.assets.length);
  assert.equal(cat.counts.sprites,cat.assets.filter(x=>x.assetType==="sprite").length);
  assert.equal(new Set(cat.assets.map(x=>x.id)).size,cat.assets.length);
  assert.deepEqual(Object.keys(manifest.sequences).sort(),definitions.map(x=>x[0]).sort());
  for(const [role,category,ms,mode] of definitions){
    const id="pack:capture:sprite-crachat-acide-"+role+"-01";
    const results=cat.assets.filter(x=>x.id===id);
    assert.equal(results.length,1,id);
    const a=results[0];
    const seq=manifest.sequences[role], prov=provenance[role];
    assert.equal(seq.id,id);
    assert.equal(a.category,category);
    assert.equal(a.resource.frameCount,20);
    assert.equal(a.resource.frameMs,ms);
    assert.equal(a.resource.playbackMode,mode);
    assert.equal(seq.frames.length,20);
    assert.equal(seq.atlas.frameWidth,256);
    assert.equal(seq.atlas.frameHeight,256);
    assert.ok(a.compatibility.uses.includes("combat"));
    assert.ok(a.compatibility.uses.includes("editor"));
    assert.equal(a.resource.file,"capture/sprites/skills/acid_spit/"+seq.atlas.file);
    const atlas=readFileSync(resolve(root,cat.storage.libraryRoot,a.resource.file));
    assert.equal(atlas.toString("ascii",0,4),"RIFF");
    assert.equal(atlas.toString("ascii",8,12),"WEBP");
    assert.equal(sha(atlas),prov.atlasSha256);
    assert.ok(prov.originalArchiveSha256.match(/^[a-f0-9]{64}$/));
    for(let i=1;i<=20;i++){
      const frameRel=role+"/frames/gensrpg_crachat_acide_"+role+"_"+String(i).padStart(2,"0")+".png";
      assert.equal(seq.frames[i-1],frameRel);
      const b=readFileSync(resolve(base,frameRel));
      assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
      assert.equal(b.readUInt32BE(16),512);
      assert.equal(b.readUInt32BE(20),512);
      assert.equal(b[25],6);
      assert.equal(sha(b),prov.frameSha256[i-1]);
    }
    const authorManifest=JSON.parse(readFileSync(resolve(base,role,"manifest.json")));
    assert.equal(authorManifest.id,id);
    assert.equal(authorManifest.frameCount,20);
    assert.equal(authorManifest.frameMs,ms);
    assert.equal(authorManifest.playbackMode,mode);
    assert.equal(authorManifest.atlasFrameSize[0],256);
    assert.equal(authorManifest.atlasFrameSize[1],256);
    assert.ok(existsSync(resolve(base,role,authorManifest.sourceSheet)));
  }
});
'''


if __name__ == "__main__":
    main()
