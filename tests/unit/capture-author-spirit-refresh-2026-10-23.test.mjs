import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {normalizeCaptureMarkerLibraryV1,normalizeCaptureMarkerV1} from "../../src/contracts/capture-marker-v1.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
const load=path=>readFileSync(new URL("../../"+path,import.meta.url));
const skillEntries=[
  ["fleche_spirituel","fleche-spirituel","239933c58c9620d8b070f5a19ab248913b569648d413e6f8b6037c0360f494b9"],
  ["Onde Spirituel","onde-spirituel","ae0b511f7c109c999b7996d20e6f887e7dbc0c1e08a5d39c6a134064246a615d"]
];
const sha=data=>createHash("sha256").update(data).digest("hex");

test("exact new author JSON replaces only two existing active showcase skills",()=>{
  for(const [id,slug,expectedSha] of skillEntries){
    const active="data/capture/showcase/"+id+".capture-skill-transfer-v1.json";
    const source="data/capture/source-exports/gensrpg-capture-skill-"+slug+"-2026-10-23.json";
    assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===active).length,1);
    assert.deepEqual(load(active),load(source));
    assert.equal(sha(load(source)),expectedSha);
    const parsed=JSON.parse(load(active));
    assert.equal(normalizeCaptureSkillTransferV1(parsed).draft.id,id);
    assert.equal(importCaptureTransferJsonV1(load(active).toString()).value.draft.id,id);
    assert.equal(parsed.draft.definition.id,id);
  }
});

test("the three uploaded markers are active and preserve canonical Eclat on arrow",()=>{
  const active="data/capture/showcase/markers.capture-markers-v1.json";
  const source="data/capture/source-exports/gensrpg-capture-markers-2026-10-23.json";
  assert.deepEqual(load(active),load(source));
  assert.equal(sha(load(source)),"c8e2ade953e2abcbfa965d7016e45687103493a5e2ee2b2d17ead788af0998d4");
  const markers=JSON.parse(load(active));
  assert.equal(markers.schema,"capture-markers-v1");
  assert.deepEqual(markers.markers.map(x=>x.id),["venin-static","eclat-spirituel","peste"]);
  const normal=normalizeCaptureMarkerLibraryV1(markers.markers);
  assert.equal(normal.length,3);
  const arrow=JSON.parse(load("data/capture/showcase/fleche_spirituel.capture-skill-transfer-v1.json")).draft;
  const inline=arrow.definition.effects.find(x=>x.kind==="apply_marker").marker;
  assert.deepEqual(normalizeCaptureMarkerV1(inline),normal.find(x=>x.id==="eclat-spirituel"));
  assert.equal(inline.onStackThreshold,undefined);
  assert.equal(inline.onStackAdded.effects[0].status.modifierPct,10);
  assert.equal(inline.maxStacks,3);
  const venin=normal.find(x=>x.id==="venin-static");
  const peste=normal.find(x=>x.id==="peste");
  assert.equal(venin.periodic.channel,"electric");
  assert.equal(venin.onStackThreshold.count,20);
  assert.equal(peste.periodic.channel,"shadow");
  assert.equal(peste.periodic.intervalMs,30000);
});

test("author shield and arrow visuals/audio are retained, not fabricated",()=>{
  const mirror=JSON.parse(load("data/capture/showcase/Onde Spirituel.capture-skill-transfer-v1.json")).draft;
  const status=mirror.definition.effects[0].status;
  assert.equal(status.kind,"projectile_mirror");
  assert.equal(status.durationMs,2000);
  assert.equal(mirror.presentation.visual.icon.assetId,"pack:capture:icon-skill-miroir-magique-01");
  assert.equal(mirror.presentation.statusVisuals["status-1"].sprite.assetId,"pack:capture:sprite-kitsune-lunaire-spirit-shield-01");
  assert.equal(mirror.presentation.statusVisuals["status-1"].sprite.playbackMode,"hold-last");
  assert.equal(mirror.presentation.audio.cast.assetId,"gensrpg:sound:genrpg-pack2-cc66c3dd");
  const arrow=JSON.parse(load("data/capture/showcase/fleche_spirituel.capture-skill-transfer-v1.json")).draft;
  assert.equal(arrow.definition.form,"projectile");
  assert.equal(arrow.definition.effects[1].amount,9);
  assert.equal(arrow.presentation.visual.cast.assetId,"pack:capture:sprite-kitsune-lunaire-cast-01");
  assert.equal(arrow.presentation.visual.travel.assetId,"pack:capture:sprite-kitsune-lunaire-projectile-01");
  assert.equal(arrow.presentation.visual.impact.assetId,"pack:capture:sprite-kitsune-lunaire-impact-01");
  assert.equal(arrow.presentation.audio.impact.assetId,"gensrpg:sound:tower-d4a4ecd5");
});
