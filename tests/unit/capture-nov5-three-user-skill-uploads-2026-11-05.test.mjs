import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
const source={
 coupe_feuille:{sha256:"7012425c6f69d71b436453deb87c3ef33b4d75f5957762a4c4f711510ac60539",bytes:4582,version:11},
 sangsue:{sha256:"5afcd8493028eec52736bc32cd6ba131295d550c6c30ebb8644bac8065d15502",bytes:2509,version:2},
 "armure-de-pointe":{sha256:"5dd9ff195ca6225af740dcc8118923bdd96856823464182d1e7cc90c3f5069bb",bytes:3472,version:9}
};
for(const [id,ref] of Object.entries(source)){
 test("the Nov 5 user uploaded "+id+" exactly once, byte-identical and importable",()=>{
  const path="data/capture/showcase/"+id+".capture-skill-transfer-v1.json";
  const raw=readFileSync(new URL("../../"+path,import.meta.url));
  assert.equal(raw.length,ref.bytes);
  assert.equal(createHash("sha256").update(raw).digest("hex"),ref.sha256,
    "do not reformat or modify the user's uploaded author transfer");
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===path).length,1);
  const parsed=JSON.parse(raw);
  assert.equal(parsed.schema,"capture-skill-transfer-v1");
  assert.equal(parsed.draft.id,id);
  assert.equal(parsed.draft.definition.id,id);
  assert.equal(parsed.draft.presentation.version,ref.version);
  const imported=importCaptureTransferJsonV1(raw.toString("utf8"));
  assert.equal(imported.kind,"skill");
  assert.equal(imported.value.draft.id,id);
  assert.deepEqual(imported.value.draft,parsed.draft);
 });
}
test("Coupe feuille retains beam damage and gains only user-provided three sound bindings",()=>{
 const d=JSON.parse(readFileSync(new URL("../../data/capture/showcase/coupe_feuille.capture-skill-transfer-v1.json",import.meta.url))).draft;
 assert.equal(d.definition.form,"beam");
 assert.equal(d.definition.approachMode,"none");
 assert.equal(d.definition.projectileClash.power,1);
 assert.equal(d.definition.effects[0].amount,15);
 assert.deepEqual(Object.keys(d.presentation.audio),["cast","travel","impact"]);
 assert.equal(d.presentation.audio.cast.assetId,"gensrpg:sound:conflux-43060f16");
 assert.equal(d.presentation.audio.travel.assetId,"gensrpg:sound:genrpg-pack2-9320854b");
 assert.equal(d.presentation.audio.travel.loop,true);
 assert.equal(d.presentation.audio.impact.assetId,"gensrpg:sound:effect-7b158ebd");
});
test("Sangsue retains native one-second 6 Nature/100% life steal and gains icon + impact sound",()=>{
 const d=JSON.parse(readFileSync(new URL("../../data/capture/showcase/sangsue.capture-skill-transfer-v1.json",import.meta.url))).draft;
 assert.equal(d.definition.contactHold.tickIntervalMs,1000);
 assert.equal(d.definition.contactHold.effects[0].amount,6);
 assert.equal(d.definition.contactHold.effects[1].percent,100);
 assert.equal(d.presentation.visual.icon.assetId,"pack:capture:icon-skill-drain-de-vie-01");
 assert.equal(d.presentation.audio.impact.assetId,"gensrpg:sound:effect-ee93278c");
});
test("Armure de pointe keeps native reflection and two distinct author sprites for player/opponent",()=>{
 const d=JSON.parse(readFileSync(new URL("../../data/capture/showcase/armure-de-pointe.capture-skill-transfer-v1.json",import.meta.url))).draft;
 assert.equal(d.definition.effects[0].status.percent,100);
 assert.deepEqual(d.definition.effects[0].status.incomingKinds,["contact"]);
 assert.equal(d.definition.effects[0].status.durationMs,10000);
 const art=d.presentation.statusVisuals["status-1"].sprite;
 assert.equal(art.assetId,"pack:capture:sprite-armure-ronces-plante-carnivore-back-01");
 assert.equal(art.opponentAssetId,"pack:capture:sprite-armure-ronces-plante-carnivore-01");
 assert.equal(art.playbackMode,"hold-last");
 assert.equal(art.offsetMode,"custom");
 assert.deepEqual([art.offsetX,art.offsetY,art.opponentOffsetX,art.opponentOffsetY],[19,0,-18,-30]);
 assert.equal(d.presentation.audio.impact.assetId,"gensrpg:sound:genrpg-pack2-a3d02c0f");
});
