#!/usr/bin/env python3
"""Import only real user-authored Light Shield media from an inspected GitHub ZIP."""
import csv, hashlib, io, json, zipfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
UPLOAD = ROOT / "_incoming/bouclier_lumiere_40_frames_github.zip"
RELROOT = "assets/library/capture/sprites/skills/light_shield/"
DEST = ROOT / RELROOT
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
TEST = ROOT / "tests/unit/capture-light-shield-assets-v1.test.mjs"
REPORT = ROOT / "docs/LAB_LIGHT_SHIELD_SPRITES_V1.md"
CURRENT = ROOT / "docs/LAB_CURRENT_WORK.md"
KIND = {"cast": ("release",70), "barrier": ("skill",80)}

def digest(b):
    return hashlib.sha256(b).hexdigest()

def require(test, msg):
    if not test:
        raise ValueError(msg)

def main():
    require(UPLOAD.is_file(), "Actual user ZIP missing; cannot publish placeholders")
    require(not DEST.exists(), "Destination already exists; refusing asset overwrite")
    with zipfile.ZipFile(UPLOAD, "r") as z:
        info = z.infolist()
        names = z.namelist()
        require(len(names) == 45 and len(names) == len(set(names)), "Exactly 45 unique files required")
        require(all(not i.is_dir() and not (i.external_attr >> 16) & 0o170000 == 0o120000 for i in info), "No directories or symlinks")
        require(all(n.startswith(RELROOT) and ".." not in Path(n).parts for n in names), "Unsafe ZIP path")
        require(sum(i.file_size for i in info) < 50_000_000, "Oversize decompressed pack")
        require(z.testzip() is None, "ZIP CRC validation failed")
        data = {n[len(RELROOT):]: z.read(n) for n in names}
    manifest_name = "sprite_skill_light_shield_sequences_01.json"
    require(manifest_name in data and "provenance.csv" in data and "README.md" in data, "Missing pack metadata")
    m = json.loads(data[manifest_name])
    require(m.get("id") == "pack:capture:sprite-light-shield-01", "Wrong pack ID")
    require(m.get("frame_size") == [512,512] and m.get("source_grid") == [5,4], "Incorrect source grid or output size")
    require(set(m.get("sequences", {})) == set(KIND), "Cast and Barrier sequences required")
    provenance = list(csv.DictReader(io.StringIO(data["provenance.csv"].decode("utf-8"))))
    require(len(provenance) == 40, "40 provenance records required")
    hashes = {r["output"]: r for r in provenance}
    require(len(hashes) == 40, "Duplicate provenance")
    expected = {manifest_name,"provenance.csv","README.md"}
    for kind, (_, ms) in KIND.items():
        seq = m["sequences"][kind]
        require(seq.get("frame_count") == 20 and seq.get("frame_ms") == ms, "Wrong sequence timing/count: "+kind)
        require(seq.get("loop") is False and seq.get("playback_mode") == "once", "Looping forbidden: "+kind)
        require(len(seq.get("frames", [])) == 20, "Missing frames: "+kind)
        if kind == "barrier":
            require(seq.get("hold_last_frame") is True and seq.get("hold_frame_index") == 19, "Frame 20 hold required")
        last = None
        for n in range(1,21):
            fn = "frames/sprite_skill_light_shield_%s_%02d.png" % (kind,n)
            require(seq["frames"][n-1] == fn, "Frame order mismatch "+fn)
            require(fn in data and fn in hashes, "Missing media or provenance "+fn)
            im = Image.open(io.BytesIO(data[fn]))
            im.load()
            require(im.format == "PNG" and im.mode == "RGBA" and im.size == (512,512), "Not a true 512 RGBA PNG "+fn)
            lo,hi = im.getchannel("A").getextrema()
            require(lo == 0 and hi > 150, "Missing real transparency/art "+fn)
            require(digest(data[fn]) == hashes[fn]["output_sha256"], "Frame SHA mismatch "+fn)
            require(hashes[fn]["source_sha256"] == seq["source"]["sha256"], "Source provenance mismatch "+fn)
            if kind == "barrier" and n == 20:
                require(data[fn] != last, "Frame 20 must be independently saved")
                require(im.getchannel("A").getbbox() is not None, "Empty finished shield")
            last = data[fn]
            expected.add(fn)
        atlas = seq.get("atlas", {})
        aname = "atlases/sprite_skill_light_shield_%s_atlas_01.webp" % kind
        require(atlas.get("file") == aname and atlas.get("frameCount") == 20 and atlas.get("frameWidth") == 384 and atlas.get("frameHeight") == 384,"Atlas metadata invalid")
        require(aname in data, "Missing atlas bytes "+aname)
        img = Image.open(io.BytesIO(data[aname])); img.load()
        require(img.format == "WEBP" and img.size == (7680,384) and "A" in img.getbands(), "Invalid WebP alpha atlas "+aname)
        expected.add(aname)
    require(set(data) == expected, "Unexpected or missing ZIP entries")
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    require(catalog["storage"]["branch"] == "global-assets", "Wrong catalog authority")
    ids = {v["id"] for v in catalog["assets"]}
    for kind,(category,ms) in KIND.items():
        aid="pack:capture:sprite-light-shield-%s-01" % kind
        require(aid not in ids,"Duplicate asset ID: "+aid)
        ids.add(aid)
        catalog["assets"].append({
            "id":aid,
            "label":"Bouclier de lumière — "+("Cast lumière" if kind=="cast" else "Barrière de lumière"),
            "assetType":"sprite","mediaType":"image","category":category,
            "tags":["skill","light","magic","shield","capture","animated",kind],
            "source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},
            "resource":{"file":"capture/sprites/skills/light_shield/atlases/sprite_skill_light_shield_%s_atlas_01.webp" % kind,
                "format":"sprite-strip","mime":"image/webp","frameCount":20,"frameMs":ms,
                "playbackMode":"once",**({"holdLastFrame":True} if kind=="barrier" else {})},
            "compatibility":{"uses":["combat","capture","editor"]}
        })
    require(len(ids)==len(catalog["assets"]),"Catalog collision")
    catalog["counts"]["assets"]=len(catalog["assets"])
    catalog["counts"]["sprites"]=sum(a["assetType"]=="sprite" for a in catalog["assets"])
    for name, blob in data.items():
        target = DEST / name
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(blob)
    CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    TEST.write_text(TEST_CONTENT,encoding="utf-8")
    REPORT.write_text(REPORT_CONTENT,encoding="utf-8")
    header = "# Laboratoire Combat Dynamique — Current Work\n\n"
    current = CURRENT.read_text(encoding="utf-8")
    require(current.startswith(header),"Unexpected CURRENT_WORK header")
    note = ("### Oct 17 — Bouclier lumière: MEDIA BINAIRES IMPORTES; CI et validation UI en attente\n"
            "- ZIP réel importé avec vérification SHA-256 / dimensions / alpha et 2 atlas WebP. "
            "Deux assetId insérés dans le catalogue unique, après contrôle des collisions.\n"
            "- Compétence, dommages, runtime, main et gh-pages non modifiés. "
            "Aucune validation de preview en combat revendiquée tant que le test utilisateur n'est pas fait.\n\n")
    CURRENT.write_text(header+note+current[len(header):],encoding="utf-8")
    UPLOAD.unlink()
    print("IMPORTED: 40 actual RGBA PNG 512x512, 2 WebP atlases; cataloged two assets, generated test")

TEST_CONTENT = r"""import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const base=resolve(root,'assets/library/capture/sprites/skills/light_shield');
const m=JSON.parse(readFileSync(resolve(base,'sprite_skill_light_shield_sequences_01.json'),'utf8'));
const catalog=JSON.parse(readFileSync(resolve(root,'data/assets/catalog/global-visual-assets.v1.json'),'utf8'));
test('Light shield: actual source images, 40 alpha 512x512 PNG frames, 2 atlas, hold frame 20',()=>{
  assert.equal(m.id,'pack:capture:sprite-light-shield-01');
  assert.equal(readdirSync(resolve(base,'frames')).length,40);
  assert.equal(readdirSync(resolve(base,'atlases')).length,2);
  const rows=readFileSync(resolve(base,'provenance.csv'),'utf8').trim().split(/\r?\n/);
  assert.equal(rows.length,41);
  const hashes=new Map(rows.slice(1).map(l=>{const v=l.split(',');return [v[5],v[6]];}));
  for(const kind of ['cast','barrier']){
    const seq=m.sequences[kind];
    assert.equal(seq.frame_count,20);
    assert.equal(seq.playback_mode,'once');
    assert.equal(seq.frames.length,20);
    if(kind==='barrier'){assert.equal(seq.hold_last_frame,true);assert.equal(seq.hold_frame_index,19);}
    for(let i=1;i<=20;i++){
      const f='frames/sprite_skill_light_shield_'+kind+'_'+String(i).padStart(2,'0')+'.png';
      assert.equal(seq.frames[i-1],f);
      const b=readFileSync(resolve(base,f));
      assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
      assert.equal(b.readUInt32BE(16),512);assert.equal(b.readUInt32BE(20),512);
      assert.equal(b[25],6);
      assert.equal(createHash('sha256').update(b).digest('hex'),hashes.get(f),'real frame checksum');
    }
    const f=resolve(base,seq.atlas.file);assert.ok(existsSync(f));
    const b=readFileSync(f);
    assert.equal(b.toString('ascii',0,4),'RIFF'); assert.equal(b.toString('ascii',8,12),'WEBP');
    assert.equal(b.toString('ascii',12,16),'VP8X'); assert.equal(b[20]&16,16);
    assert.equal(1+b.readUIntLE(24,3),7680);assert.equal(1+b.readUIntLE(27,3),384);
  }
});
test('Light shield: assetIds resolve through the one canonical catalog',()=>{
  assert.equal(catalog.storage.branch,'global-assets');
  assert.equal(catalog.counts.assets,catalog.assets.length);
  assert.equal(catalog.counts.sprites,catalog.assets.filter(x=>x.assetType==='sprite').length);
  assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
  for(const kind of ['cast','barrier']){
    const id='pack:capture:sprite-light-shield-'+kind+'-01';
    const entries=catalog.assets.filter(x=>x.id===id);
    assert.equal(entries.length,1);
    const a=entries[0];assert.equal(a.assetType,'sprite');
    assert.equal(a.resource.frameCount,20);assert.equal(a.resource.playbackMode,'once');
    if(kind==='barrier')assert.equal(a.resource.holdLastFrame,true);
    assert.ok(a.compatibility.uses.includes('editor'));
    assert.ok(existsSync(resolve(root,catalog.storage.libraryRoot,a.resource.file)));
  }
});
"""

REPORT_CONTENT = """# Bouclier de lumière — Sprite Cast et Barrière (2026-10-17)

## Sources et réalisation
Deux planches générées dans la conversation utilisateur (PNG RGBA 1402x1122, grilles 5x4).
Export de 40 vrais PNG RGBA 512x512 et 2 atlas WebP 7680x384; cadre source
d'environ 280x280 agrandi en 512x512, pas natif. Le contenu et la frame 20 ont
été inspectés visuellement avant export; le ZIP réel est vérifié lors de l'import.

## Identification
- Cast: pack:capture:sprite-light-shield-cast-01 (release, 20 x 70ms).
- Barrière: pack:capture:sprite-light-shield-barrier-01 (skill, 20 x 80ms).
- La dernière frame de la barrière est une image complète à figer : manifeste
  hold_last_frame=true (index 19); le renderer interprète normalement
  playbackMode=once, et le réglage garder dernière frame du skill reste configurable.
- Propriétaire canonique: global-assets, catalogue global-visual-assets.v1.json.
- Ressources: assets/library/capture/sprites/skills/light_shield/
- Aucune nouvelle règle gameplay; ne pas remplacer les autres sorts.

## Gouvernance
Checkpoint initial checkpoint/lab-start-light-shield-sprites-2026-10-17,
base a4f8604d339ecc8ab4951d6affa92a6a57f0a698,
branche work/lab-light-shield-sprites-2026-10-17.
Automate d'import et sentinelle capture-light-shield-assets-v1.test.mjs.
Après import et CI, le comportement réel de l'option garder la dernière frame
dans l'éditeur Combat doit encore être confirmé en preview mobile.
"""

if __name__ == "__main__":
    main()
