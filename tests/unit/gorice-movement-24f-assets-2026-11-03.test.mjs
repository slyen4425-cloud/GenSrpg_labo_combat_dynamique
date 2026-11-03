// Sentinelle de l'import officiel des deux déplacements Gorice validés, sans autorité parallèle.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = process.cwd();
const catalog = JSON.parse(readFileSync(resolve(root, "data/assets/catalog/global-visual-assets.v1.json"), "utf8"));
const hash = b => createHash("sha256").update(b).digest("hex");
const idFor = view => "pack:capture:creature-gorille-des-glaces-movement-" + view + "-12-v1";
const base = view => resolve(root, "assets/library/capture/creatures/gorille_des_glaces/animations/movement", view);

test("gorice: 2 movements registered exactly once, no new authority", () => {
  assert.equal(catalog.storage.branch, "global-assets");
  assert.equal(new Set(catalog.assets.map(x => x.id)).size, catalog.assets.length);
  for (const view of ["player", "opponent"]) {
    const matches = catalog.assets.filter(a => a.id === idFor(view));
    assert.equal(matches.length, 1, view + " missing/duplicate asset");
    const asset = matches[0];
    assert.equal(asset.category, "creature");
    assert.equal(asset.assetType, "sprite");
    assert.deepEqual({count:asset.resource.frameCount, mode:asset.resource.playbackMode, format:asset.resource.format}, {count:12,mode:"loop",format:"sprite-strip"});
    assert.equal(asset.resource.file, "capture/creatures/gorille_des_glaces/animations/movement/"+view+"/atlases/gorice_deplacement_"+(view==="player"?"joueur":"adversaire")+"_12f.webp");
    assert.ok(existsSync(resolve(root,"assets/library",asset.resource.file)));
  }
});
test("gorice: the 24 author frames, source and atlas are preserved", () => {
  for (const view of ["player", "opponent"]) {
    const dir = base(view);
    const manifest = JSON.parse(readFileSync(resolve(dir,"movement.manifest.json"),"utf8"));
    assert.equal(manifest.schema,"capture-creature-animation-v1");
    assert.equal(manifest.creatureId,"gorille_des_glaces");
    assert.equal(manifest.action,"movement");
    assert.equal(manifest.view,view);
    assert.equal(manifest.frameCount,12);
    assert.equal(manifest.playbackMode,"loop");
    assert.equal(manifest.safeMarginMinPx,42);
    assert.equal(manifest.sourceGitBlob,"1db42e0a4339bc6dfa3c5c0306fa251a5c7d68d1");
    assert.equal(manifest.frames.length,12);
    assert.equal(manifest.frameDurationsMs.length,12);
    for(const [i,f] of manifest.frames.entries()){
      assert.equal(f.index,i);
      assert.ok(f.marginsLTRB.every(v=>v>=42));
      const bytes=readFileSync(resolve(dir,f.file));
      assert.equal(hash(bytes),f.sha256);
      assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
      assert.equal(bytes.readUInt32BE(16),512);
      assert.equal(bytes.readUInt32BE(20),512);
    }
    const a=readFileSync(resolve(dir,manifest.atlas.file));
    assert.equal(hash(a),manifest.atlas.sha256);
    assert.equal(a.subarray(0,4).toString("ascii"),"RIFF");
    for(const f of Object.values(manifest.previews))assert.ok(existsSync(resolve(dir,f)));
  }
});
