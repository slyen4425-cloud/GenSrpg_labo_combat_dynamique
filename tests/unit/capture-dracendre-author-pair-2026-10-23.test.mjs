import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as presets} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";

const active="data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json";
const variant="data/capture/source-exports/gensrpg-capture-creature-crea_dracendre-2026-10-23-repeat.json";
const base="data/capture/source-exports/gensrpg-capture-creature-crea_dracendre-2026-10-23-base.json";
const historical="data/capture/source-exports/gensrpg-capture-creature-crea_dracendre-original-before-2026-10-23.json";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url));
const sha=p=>createHash("sha256").update(read(p)).digest("hex");
const json=p=>JSON.parse(read(p).toString("utf8"));
const registry=normalizeCaptureStatRegistryV1(json("data/capture/monster-capture-stat-registry.v1.json"));

test("both exact author uploads are archived, active points to the newest fully configured version",()=>{
  assert.equal(sha(variant),"b83a7982874bdfa8c2f10983f46576c2d6c2f2faf2e308af7008b617b7e81469");
  assert.equal(sha(base),"760a206a7abb632a6fc24a6da5e526038404db5ed1e71339ae45c731441c82b9");
  assert.equal(sha(historical),"cdc0d760eddc2558ff8542ec975e5b699af1bd7f41c34ef1ca2b0c76a6ed398e");
  const latest=json(active),previous=json(variant);
  assert.deepEqual(latest.draft.presentation.visual.movementScaleByView,{player:1.7,opponent:1.7});
  latest.draft.presentation.visual.movementScaleByView=previous.draft.presentation.visual.movementScaleByView;
  assert.deepEqual(latest,previous,"archived Dracendre unchanged except the 2 newer author movement scales");
  assert.equal(presets.filter(p=>p===active).length,1);
  const original=json(base),repeat=json(variant);
  assert.deepEqual(repeat.draft.presentation.audio.movement,
    {...original.draft.presentation.audio.movement,mode:"repeat",repeatIntervalMs:400});
  const c={...repeat,draft:{...repeat.draft,presentation:{
    ...repeat.draft.presentation,audio:{...repeat.draft.presentation.audio,movement:original.draft.presentation.audio.movement}
  }}};
  assert.deepEqual(c,original,"the second file changes ONLY the movement audio loop");
});

test("actual editor importer accepts V9 Dragon front/back movement and attack sprite bindings",()=>{
  const transfer=importCaptureTransferJsonV1(read(active).toString("utf8"),{statRegistry:registry});
  assert.equal(transfer.kind,"creature");
  const c=transfer.value;
  assert.equal(c.draft.id,"crea_dracendre");
  assert.equal(c.draft.presentation.version,9);
  assert.equal(c.draft.presentation.profileId,"flying");
  const v=c.draft.presentation.visual;
  assert.equal(v.movement.assetId,"pack:capture:creature-braisombre-movement-face-12-v1");
  assert.equal(v.movementBack.assetId,"pack:capture:creature-braisombre-movement-dos-12-v1");
  assert.equal(v.rangedAttack.assetId,"pack:capture:creature-braisombre-attack-face-12-v1");
  assert.equal(v.rangedAttackBack.assetId,"pack:capture:creature-braisombre-attack-dos-12-v1");
  assert.equal(v.movementPlayback.mode,"loop");
  assert.equal(c.draft.presentation.audio.movement.repeatIntervalMs,400);
  assert.equal(c.loadout.slots.length,5);
  assert.equal(c.draft.skillIds.length,20);
  assert.equal(c.statValues.values.speed,15);
});
