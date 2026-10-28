import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureMarkerLibraryV1, markerStatusDefinitionV1} from "../../src/contracts/capture-marker-v1.js";
import {captureMarkerSeedLibraryV1} from "../../src/ui/capture-marker-library-v1.js";

const read=path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
const skillPath="data/capture/showcase/graine_sansue_cap.capture-skill-transfer-v1.json";
const markerPath="data/capture/showcase/markers.capture-markers-v1.json";
const skillSourcePath="data/capture/source-exports/gensrpg-capture-skill-graine_sansue_cap-2026-10-28.json";
const markerSourcePath="data/capture/source-exports/gensrpg-marqueurs-2026-10-28.json";

test("Graine sansue has one canonical registered skill and preserves the full author V11",async()=>{
  const paths=CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1;
  assert.equal(paths.filter(x=>x===skillPath).length,1);
  assert.equal(paths.length,new Set(paths).size,"one registered path per skill");
  const historicalRaw=await read(skillSourcePath);
  assert.equal(createHash("sha256").update(historicalRaw).digest("hex"),
    "b74b469b12c0f6206467ce7a1272eef1a5a0768643616e00a7eeefe6e12ef1da",
    "the first 2026-10-28 skill source stays immutable");
  const original=JSON.parse(await read("data/capture/source-exports/gensrpg-capture-skill-graine_sansue_cap-2026-10-28-r2.json"));
  const active=JSON.parse(await read(skillPath));
  assert.deepEqual(active,original,"active skill must equal latest author export, no rewriting");
  const transfer=importCaptureTransferJsonV1(await read(skillPath));
  assert.equal(transfer.kind,"skill");
  const d=transfer.value.draft;
  assert.equal(d.id,"graine_sansue_cap");
  assert.equal(d.definition.name,"Graine sansue");
  assert.equal(d.definition.element,"nature");
  assert.equal(d.requiredLevel,5);
  assert.equal(d.definition.energyCost,5);
  assert.equal(d.definition.preparationMs,900);
  assert.equal(d.definition.travelMs,900);
  assert.equal(d.definition.cooldownMs,10000);
  assert.equal(d.definition.projectileClash.power,1);
  assert.equal(d.presentation.visual.icon.assetId,"pack:capture:icon-skill-graine-sangsue-01");
  assert.equal(d.presentation.visual.travel.assetId,"pack:capture:sprite-graine-sangsue-projectile-01");
  assert.equal(d.presentation.visual.impact.assetId,"pack:capture:sprite-graine-sangsue-debuff-01");
  assert.equal(d.definition.effects.length,1);
  assert.equal(d.definition.effects[0].kind,"apply_marker");
  assert.equal(d.definition.effects[0].charges,1);
});

test("both uploaded sources share ONE native marker definition without rewriting prior library",async()=>{
  const published=JSON.parse(await read(markerPath));
  const source=JSON.parse(await read(markerSourcePath));
  assert.equal(published.schema,"capture-markers-v1");
  assert.deepEqual(published,source,"published marker library differs from uploaded source");
  const normalized=normalizeCaptureMarkerLibraryV1(published.markers);
  assert.deepEqual(normalized.map(m=>m.id),[
    "poison","venin-static","eclat-spirituel","peste","graine-sansue"
  ]);
  const fromSkill=JSON.parse(await read(skillPath)).draft.definition.effects[0].marker;
  const fromLibrary=normalized.find(m=>m.id==="graine-sansue");
  assert.deepEqual(fromSkill,fromLibrary,"same ID must have identical authoritative data");
  assert.equal(markerStatusDefinitionV1(fromLibrary).kind,"stack_counter");
  assert.deepEqual(fromLibrary.periodic,{
    kind:"life_steal",amount:5,intervalMs:3000,damageMode:"combat",channel:"nature",percent:100
  });
  const map=new Map(normalized.map(m=>[m.id,m]));
  assert.equal(captureMarkerSeedLibraryV1(map,[fromSkill]),0,"no duplicate marker created from skill");
  assert.equal(map.size,5);
  for(const [path,id] of [
    ["data/capture/showcase/cap_poison_atk_2.capture-skill-transfer-v1.json","poison"],
    ["data/capture/showcase/lib_paralyze.capture-skill-transfer-v1.json","venin-static"],
    ["data/capture/showcase/fleche_spirituel.capture-skill-transfer-v1.json","eclat-spirituel"]
  ]){
    const transfer=JSON.parse(await read(path));
    const marker=transfer.draft.definition.effects.find(e=>e.kind==="apply_marker").marker;
    assert.deepEqual(marker,map.get(id),"existing skill must not diverge from shared marker "+id);
  }
});

test("editor uses one showcase skill catalog and fetches the canonical marker library",async()=>{
  const owner=await read("src/ui/capture-editor-human-v2.js");
  assert.ok(owner.includes("data/capture/showcase/markers.capture-markers-v1.json"));
  assert.ok(owner.includes("CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1"));
  const html=await read("examples/dom-demo/capture-editor-v2.html");
  assert.ok(html.includes("capture-editor-v2.js?v="));
  const entry=await read("examples/dom-demo/capture-editor-v2.js");
  assert.match(entry,/capture-editor-human-v2\.js\?v=/);
  assert.match(owner,/capture-showcase-skill-presets-v1\.js\?v=/);
});
