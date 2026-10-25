import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {captureCreatureEditorVisualSlotForSettingsV1,buildHumanCreatureDraftV3} from "../../src/ui/capture-editor-human-v2.js";

const author=JSON.parse(readFileSync(new URL("../../data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json",import.meta.url),"utf8"));
const visual=author.draft.presentation.visual;

test("Freclairions V10 back-only movement/attack sprites drive the common animation-mode controls",()=>{
  assert.equal(visual.movement,undefined);
  assert.equal(visual.rangedAttack,undefined);
  assert.equal(visual.movementBack.mode,"sprite");
  assert.equal(visual.rangedAttackBack.mode,"sprite");
  assert.equal(captureCreatureEditorVisualSlotForSettingsV1(visual,"movement"),visual.movementBack);
  assert.equal(captureCreatureEditorVisualSlotForSettingsV1(visual,"attack"),visual.rangedAttackBack);
  assert.equal(captureCreatureEditorVisualSlotForSettingsV1(visual,"movement").rotationTurns,3);
  assert.equal(captureCreatureEditorVisualSlotForSettingsV1(visual,"attack").transitionMs,80);
});

test("generic projection honors front when configured, back when only back, and empty for new creatures",()=>{
  const front={assetId:"pack:test:front",mode:"static",frameCount:1,rotationTurns:0,transitionMs:40};
  const back={assetId:"pack:test:back",mode:"sprite",frameCount:12,rotationTurns:3,transitionMs:80};
  const attackFront={assetId:"pack:test:attack-front",mode:"static",frameCount:1,rotationTurns:0,transitionMs:30};
  const attackBack={assetId:"pack:test:attack-back",mode:"sprite",frameCount:12,rotationTurns:0,transitionMs:80};
  for(const [v,role,expected] of [
    [{movement:front,movementBack:back},"movement",front],
    [{movementBack:back},"movement",back],
    [{movement:front},"movement",front],
    [{rangedAttack:attackFront,rangedAttackBack:attackBack},"attack",attackFront],
    [{rangedAttackBack:attackBack},"attack",attackBack],
    [{rangedAttack:attackFront},"attack",attackFront],
    [{}, "movement",null],
    [{}, "attack",null],
    [null, "movement",null]
  ]) assert.equal(captureCreatureEditorVisualSlotForSettingsV1(v,role),expected);
  assert.throws(()=>captureCreatureEditorVisualSlotForSettingsV1({},"unknown"),RangeError);
});

test("rebuilding the real back-only visual from displayed settings does not introduce the ball-roll default",()=>{
  const slot=captureCreatureEditorVisualSlotForSettingsV1(visual,"movement");
  const ranged=captureCreatureEditorVisualSlotForSettingsV1(visual,"attack");
  const d=author.draft;
  const fields={
    id:d.id,displayName:d.displayName,description:d.description,level:d.level,
    sourceStats:d.sourceStats,elements:d.elements,
    resistances:Object.fromEntries(d.resistances.map(x=>[x.kind.slice(8),x.value])),
    capture:d.capture,combat:d.combat,linkedSkillIds:d.skillIds,profileId:d.presentation.profileId,
    displayScale:d.presentation.displayScale,position:d.presentation.position,
    viewOverrides:d.presentation.viewOverrides,shadowOffset:d.presentation.shadowOffset,
    sockets:d.presentation.sockets,audio:d.presentation.audio,
    visual:{
      frontAssetId:visual.front.assetId,backAssetId:visual.back.assetId,
      iconAssetId:visual.icon.assetId,
      dodgeAssetId:visual.dodge.assetId,
      dodgeDisplayScale:visual.dodge.displayScale,dodgeDurationMs:visual.dodge.durationMs,
      dodgeOffsetX:visual.dodge.offsetX,dodgeOffsetY:visual.dodge.offsetY,
      movementAssetId:"",movementBackAssetId:visual.movementBack.assetId,
      movementMode:slot.mode,movementDisplayScale:slot.displayScale,
      movementRotationTurns:slot.rotationTurns,movementFrameCount:slot.frameCount,
      movementTransitionMs:slot.transitionMs,movementFrameMs:visual.movementPlayback.frameMs,
      movementPlaybackMode:visual.movementPlayback.mode,
      movementPlayerScale:visual.movementScaleByView.player,
      movementOpponentScale:visual.movementScaleByView.opponent,
      rangedAttackAssetId:"",rangedAttackBackAssetId:visual.rangedAttackBack.assetId,
      rangedAttackMode:ranged.mode,rangedAttackDisplayScale:ranged.displayScale,
      rangedAttackRotationTurns:ranged.rotationTurns,rangedAttackFrameCount:ranged.frameCount,
      rangedAttackTransitionMs:ranged.transitionMs,
      rangedAttackPlayerScale:visual.rangedAttackScaleByView.player,
      rangedAttackOpponentScale:visual.rangedAttackScaleByView.opponent
    }
  };
  const rebuilt=buildHumanCreatureDraftV3(fields);
  assert.equal(rebuilt.presentation.visual.movementBack.mode,"sprite");
  assert.equal(rebuilt.presentation.visual.rangedAttackBack.mode,"sprite");
  assert.equal(rebuilt.presentation.visual.movement,undefined);
  assert.equal(rebuilt.presentation.visual.rangedAttack,undefined);
  assert.equal(rebuilt.presentation.visual.movementBack.assetId,visual.movementBack.assetId);
  assert.equal(rebuilt.presentation.visual.rangedAttackBack.assetId,visual.rangedAttackBack.assetId);
});
