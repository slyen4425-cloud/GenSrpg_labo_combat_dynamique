import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";

const root=path=>new URL("../../"+path,import.meta.url);
const load=async path=>readFile(root(path));
const digest=buffer=>createHash("sha256").update(buffer).digest("hex");
const base="assets/library/";
const specs=[
 ["movementOpponent","movement","opponent",5,120,"loop","bb6bf4f23ba0cd52c54f82c7b511ce541c9832b111315f2a4298e1fa863187a3"],
 ["attackOpponent","attack","opponent",6,150,"once","56251c9487d318ed8ba86aad0f423b1278d762352eaba01f4c9a529ea74e7e2c"],
 ["movementPlayer","movement","player",6,140,"loop","af0e7898b1fed998a3793719db9109e6b3b2460948f4620a8be2b1dd2a8592df"],
 ["attackPlayer","attack","player",9,90,"once","1143a3de8495e992fa99b72c4ce82ab7eb55a1e78d35cfb37899c760c1ef89fd"],
];

test("Veuve jaune: four real validated WebP strips, original models untouched, exact SHA and canonical bindings",async()=>{
 const catalog=JSON.parse((await load("data/assets/catalog/global-visual-assets.v1.json")).toString("utf8"));
 const dir="assets/library/capture/creatures/veuve_jaune/";
 const meta=JSON.parse((await load(dir+"veuve_jaune.meta.json")).toString("utf8"));
 const provenance=JSON.parse((await load(dir+"veuve_jaune.animations.provenance.json")).toString("utf8"));
 assert.equal(catalog.storage.branch,"global-assets");
 assert.ok(catalog.counts.assets>=553,'new idle creatures must be additive');
 assert.ok(catalog.counts.sprites>=303);
 assert.equal(catalog.assets.length,catalog.counts.assets);
 assert.equal(new Set(catalog.assets.map(a=>a.id)).size,catalog.assets.length,'preserve unique asset IDs');
 assert.equal(meta.id,"veuve_jaune");
 assert.deepEqual(meta.views,{
  opponent:"runtime/veuve_jaune_face.png",
  player:"runtime/veuve_jaune_dos.png",
  icon:"runtime/veuve_jaune_icone.png",
 });
 assert.equal(meta.assetIds.opponent,"pack:capture:creature-veuve-jaune-opponent-01");
 assert.equal(meta.assetIds.player,"pack:capture:creature-veuve-jaune-player-01");
 assert.equal(meta.assetIds.icon,"pack:capture:creature-veuve-jaune-icon-01");
 assert.equal(provenance.items.length,4);
 for(const [key,action,side,frames,ms,mode,sourceSha] of specs){
  const id=`pack:capture:creature-veuve-jaune-${action}-${side}-${frames}-20261125`;
  const entries=catalog.assets.filter(x=>x.id===id);
  assert.equal(entries.length,1);
  const a=entries[0],e=provenance.items.find(x=>x.id===id);
  assert.ok(e,`provenance missing ${id}`);
  assert.equal(meta.assetIds[key],id);
  assert.equal(a.assetType,"sprite");
  assert.equal(a.category,"creature");
  assert.equal(a.resource.frameCount,frames);
  assert.equal(a.resource.frameMs,ms);
  assert.equal(a.resource.playbackMode,mode);
  assert.equal(a.resource.format,"sprite-strip");
  assert.equal(a.resource.file,e.file);
  assert.equal(e.sourceSha256,sourceSha);
  assert.equal(e.runtimeFrames,frames);
  const raw=await load(base+e.file);
  assert.ok(raw.length>1000);
  assert.equal(raw.subarray(0,4).toString("latin1"),"RIFF");
  assert.equal(raw.subarray(8,12).toString("latin1"),"WEBP");
  assert.equal(raw.length,e.bytes);
  assert.equal(digest(raw),e.sha256);
 }
 assert.deepEqual(provenance.items.map(x=>x.sourceFrames),[6,6,6,9]);
 assert.deepEqual(provenance.items.map(x=>x.runtimeFrames),[5,6,6,9]);
 assert.equal(provenance.items[0].sourceFrameSha256[0],provenance.items[0].sourceFrameSha256[5],"closing movement face duplicate must match original");
});
