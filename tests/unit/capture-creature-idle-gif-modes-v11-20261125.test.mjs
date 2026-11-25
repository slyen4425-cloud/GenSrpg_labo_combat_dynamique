import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  normalizeCreaturePresentationBinding
} from "../../src/contracts/creature-presentation-binding.js";
import {normalizeCreatureIdleVisualV1} from "../../src/contracts/creature-presentation-binding-v11.js";
import {createCreatorVisualAssetSessionV1} from "../../src/assets/creator-visual-asset-session-v1.js";
import {captureEditorAssetMatchesRoleV1,buildHumanCreatureDraftV3} from "../../src/ui/capture-editor-human-v2.js";

const author=JSON.parse(readFileSync(new URL("../../data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json",import.meta.url),"utf8"));
const old=author.draft.presentation;

test("idle uses engine by default and accepts GIF only, combined, and dual-view author modes",()=>{
 assert.equal(normalizeCreaturePresentationBinding(old).version,10);
 assert.equal(normalizeCreaturePresentationBinding(old).visual.idle,undefined);
 for(const mode of ["engine","gif","both"]){
  const idle={mode,frontAssetId:"user:idle-front",backAssetId:"user:idle-back"};
  const normalized=normalizeCreaturePresentationBinding({...old,version:11,visual:{...old.visual,idle}});
  assert.equal(normalized.version,11);
  assert.deepEqual(normalized.visual.idle,idle);
  assert.equal(normalized.visual.movement?.assetId,old.visual.movement.assetId);
  assert.equal(normalized.shadowOffset.y,old.shadowOffset.y);
  assert.deepEqual(normalizeCreaturePresentationBinding(normalized),normalized);
 }
 assert.throws(()=>normalizeCreatureIdleVisualV1({mode:"gif"}),/GIF idle/);
 assert.throws(()=>normalizeCreatureIdleVisualV1({mode:"pause",frontAssetId:"user:idle-front"}),/unknown idle mode/);
});

test("idle creator importer is limited to GIF/WebP and reuses canonical asset chooser",()=>{
 const session=createCreatorVisualAssetSessionV1({
  createId:()=>"idle-custom",createObjectURL:()=>"blob:idle-custom",revokeObjectURL:()=>{}
 });
 const asset=session.importImage({file:{name:"idle.gif",type:"image/gif",size:8000},role:"idle"});
 assert.equal(asset.resource.mime,"image/gif");
 assert.equal(asset.category,"creature");
 assert.equal(captureEditorAssetMatchesRoleV1(asset,"idle"),true);
 assert.equal(captureEditorAssetMatchesRoleV1(asset,"attack"),false);
 assert.equal(captureEditorAssetMatchesRoleV1(asset,"movement"),false);
 assert.throws(()=>session.importImage({file:{name:"wrong.gif",type:"image/gif",size:50},role:"attack"}),/Unsupported image type/);
 session.dispose();
});

test("real editor saves two-view idle selection without reauthoring the existing movement/attack",()=>{
 const d=author.draft,v=d.presentation.visual;
 const fields={
  id:d.id,displayName:d.displayName,description:d.description,level:d.level,
  sourceStats:d.sourceStats,elements:d.elements,
  resistances:Object.fromEntries(d.resistances.map(x=>[x.kind.slice(8),x.value])),
  capture:d.capture,combat:d.combat,linkedSkillIds:d.skillIds,profileId:d.presentation.profileId,
  displayScale:d.presentation.displayScale,position:d.presentation.position,
  viewOverrides:d.presentation.viewOverrides,shadowOffset:d.presentation.shadowOffset,
  sockets:d.presentation.sockets,audio:d.presentation.audio,
  visual:{
   frontAssetId:v.front.assetId,backAssetId:v.back.assetId,iconAssetId:v.icon.assetId,
   idleMode:"both",idleFrontAssetId:"user:idle-front",idleBackAssetId:"user:idle-back",
   dodgeAssetId:v.dodge.assetId,dodgeDisplayScale:v.dodge.displayScale,
   dodgeDurationMs:v.dodge.durationMs,dodgeOffsetX:v.dodge.offsetX,dodgeOffsetY:v.dodge.offsetY,
   movementAssetId:v.movement.assetId,movementBackAssetId:v.movementBack.assetId,
   movementMode:v.movement.mode,movementDisplayScale:v.movement.displayScale,
   movementRotationTurns:v.movement.rotationTurns,movementFrameCount:v.movement.frameCount,
   movementTransitionMs:v.movement.transitionMs,movementFrameMs:v.movementPlayback.frameMs,
   movementPlaybackMode:v.movementPlayback.mode,movementPlayerScale:v.movementScaleByView.player,
   movementOpponentScale:v.movementScaleByView.opponent,
   rangedAttackAssetId:"",rangedAttackBackAssetId:v.rangedAttackBack.assetId,
   rangedAttackMode:v.rangedAttackBack.mode,rangedAttackDisplayScale:v.rangedAttackBack.displayScale,
   rangedAttackRotationTurns:v.rangedAttackBack.rotationTurns,rangedAttackFrameCount:v.rangedAttackBack.frameCount,
   rangedAttackTransitionMs:v.rangedAttackBack.transitionMs,
   rangedAttackPlayerScale:v.rangedAttackScaleByView.player,
   rangedAttackOpponentScale:v.rangedAttackScaleByView.opponent
  }
 };
 const draft=buildHumanCreatureDraftV3(fields);
 assert.equal(draft.presentation.version,11);
 assert.deepEqual(draft.presentation.visual.idle,{mode:"both",frontAssetId:"user:idle-front",backAssetId:"user:idle-back"});
 assert.equal(draft.presentation.visual.movement.assetId,v.movement.assetId);
 assert.equal(draft.presentation.visual.movementBack.assetId,v.movementBack.assetId);
 assert.equal(draft.presentation.visual.rangedAttackBack.assetId,v.rangedAttackBack.assetId);
});

test("the native editor and single battle visual controller expose the idle controls",()=>{
 const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 const code=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 const demo=readFileSync(new URL("../../src/ui/demo-app.js",import.meta.url),"utf8");
 for(const key of ["data-creature-idle-mode","data-creature-idle-front-visual","data-creature-idle-back-visual"]){
  assert.ok(html.includes(key));
  assert.ok(code.includes(key));
 }
 assert.match(html,/value="engine"/);
 assert.match(html,/value="gif"/);
 assert.match(html,/value="both"/);
 assert.match(demo,/idleFxByView/);
 assert.match(demo,/slot\.cancelMovementAppearance\(\)/);
 assert.ok(!demo.includes("rigby2d"));
});
