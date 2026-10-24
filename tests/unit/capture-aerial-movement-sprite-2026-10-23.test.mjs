import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  creatureMovementAppearanceForApproachV1,
  creatureMovementAppearanceForViewV1
} from "../../src/ui/demo-app.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";

const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const registry=normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));
const transfer=importCaptureTransferJsonV1(
  read("data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json"),
  {statRegistry:registry}
);
const creature=transfer.value.draft;

test("Dracendre V9 provides both ground and aerial face/back movement appearances",()=>{
  assert.equal(creature.presentation.profileId,"flying");
  const v=creature.presentation.visual;
  const fronts={assetId:v.movement.assetId,url:"https://assets.test/movement-face-atlas.png",frameCount:12,playbackMode:"loop"};
  const backs={assetId:v.movementBack.assetId,url:"https://assets.test/movement-dos-atlas.png",frameCount:12,playbackMode:"loop"};
  const meta={movementFxByView:{player:backs,opponent:fronts}};
  for(const approach of ["ground","aerial"]){
    assert.equal(creatureMovementAppearanceForApproachV1(meta,"player",approach),backs);
    assert.equal(creatureMovementAppearanceForApproachV1(meta,"opponent",approach),fronts);
  }
  assert.equal(creatureMovementAppearanceForViewV1(meta,"player"),backs);
  assert.equal(creatureMovementAppearanceForViewV1(meta,"opponent"),fronts);
});

test("teleport and burrow retain their own visual movement without false dragon sprite",()=>{
  const movement={url:"https://assets.test/movement.png"};
  const meta={movementFxByView:{player:movement}};
  for(const kind of ["teleport","burrow","none"])
    assert.equal(creatureMovementAppearanceForApproachV1(meta,"player",kind),null);
  assert.equal(creatureMovementAppearanceForApproachV1({}, "player","aerial"),null);
  assert.throws(()=>creatureMovementAppearanceForApproachV1(meta,"invalid","aerial"),/unknown creature view/);
});

test("real mounted demo routes the aerial movement visual through the same sprite shell and cancels at the flight end",()=>{
  const src=read("src/ui/demo-app.js");
  const block=src.slice(src.indexOf("  function playApproachFor("),src.indexOf("  function playApproachFor(")+10500);
  assert.match(block,/creatureMovementAppearanceForApproachV1\(/);
  assert.match(block,/slot\.playMovementAppearance\(/);
  assert.match(block,/approachMode === "aerial" \? planDurationMs : travelMs/);
  // The original single-movement handle is now the phase-owned active handle;
  // it cancels whichever creature sprite (movement or attack) is still visible.
  assert.match(block,/activeAppearance\\?\\.cancel\\?\\.\\(\\)/);
  assert.match(block,/const handle = slot\.renderer\.play\(plan\)/);
  assert.match(block,/watchVisibleModelContact\(/);
});
