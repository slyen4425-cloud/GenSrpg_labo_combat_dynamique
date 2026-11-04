import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const base=resolve("assets/library/capture/creatures/renard_magique_dore/animations/movement/player");
const catalog=JSON.parse(readFileSync("data/assets/catalog/global-visual-assets.v1.json","utf8"));
const sha=x=>createHash("sha256").update(x).digest("hex");
const id="pack:capture:creature-renard-magique-dore-movement-player-12-v1";

test("Renard dore: stable player ID reclassified for attacks in canonical global-assets",()=>{
  assert.equal(catalog.storage.branch,"global-assets");
  assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length);
  assert.equal(catalog.counts.assets,catalog.assets.length);
  const matched=catalog.assets.filter(a=>a.id===id);
  assert.equal(matched.length,1);
  const media=matched[0];
  assert.equal(media.category,"creature");
  assert.ok(media.tags.includes("attack"));
  assert.ok(!media.tags.includes("movement"));
  assert.equal(media.resource.file,"capture/creatures/renard_magique_dore/animations/movement/player/atlases/renard_magique_dore_mouvement_joueur_12f.webp");
  assert.equal(media.resource.format,"sprite-strip");
  assert.equal(media.resource.frameCount,12);
  assert.equal(media.resource.frameMs,120);
  assert.equal(media.resource.playbackMode,"loop");
  assert.ok(existsSync(resolve("assets/library",media.resource.file)));
});
test("Renard dore: exactly 12 approved RGBA frames, safety margins, atlas and previews",()=>{
  const m=JSON.parse(readFileSync(resolve(base,"movement.manifest.json"),"utf8"));
  assert.equal(m.schema,"capture-creature-animation-v1");
  assert.equal(m.creatureId,"renard_magique_dore");
  assert.equal(m.action,"attack");
  assert.equal(m.view,"player");
  assert.equal(m.assetId,id);
  assert.equal(m.orientation,"right");
  assert.equal(m.frameCount,12);
  assert.deepEqual(m.frameSize,[512,512]);
  assert.equal(m.playbackMode,"loop");
  assert.equal(m.sourceGitBlob,"88fe0398f9856580fa63f2aa96a4ed12703904b2");
  assert.equal(m.sourceArchiveSha256,"58f2869f7bfde8faea1f339d998eae8d2833a88d3bd89e9ca94e65adb1542d8a");
  assert.equal(m.frames.length,12);
  assert.deepEqual(m.frameDurationsMs,Array(12).fill(120));
  const distinct=new Set();
  for(const [i,f] of m.frames.entries()){
    assert.equal(f.index,i);
    assert.ok(f.marginsLTRB.every(x=>x>=42));
    const png=readFileSync(resolve(base,f.file));
    assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16),512);
    assert.equal(png.readUInt32BE(20),512);
    assert.equal(png[25],6); // PNG color type RGBA
    assert.equal(sha(png),f.sha256);
    distinct.add(f.sha256);
  }
  assert.equal(distinct.size,12);
  const atlas=readFileSync(resolve(base,m.atlas.file));
  assert.equal(sha(atlas),m.atlas.sha256);
  assert.equal(atlas.toString("ascii",0,4),"RIFF");
  assert.equal(atlas.toString("ascii",8,12),"WEBP");
  for(const file of Object.values(m.previews))assert.ok(existsSync(resolve(base,file)));
});
