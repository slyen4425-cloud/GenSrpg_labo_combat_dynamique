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
   idleFront:{displayScale:1.4,offsetX:12,offsetY:-23,frameSpeedMultiplier:1.5},
   idleBack:{displayScale:0.85,offsetX:-7,offsetY:18,frameSpeedMultiplier:0.75},
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
 assert.deepEqual(draft.presentation.visual.idle,{
   mode:"both",frontAssetId:"user:idle-front",backAssetId:"user:idle-back",
   front:{displayScale:1.4,offsetX:12,offsetY:-23,frameSpeedMultiplier:1.5},
   back:{displayScale:0.85,offsetX:-7,offsetY:18,frameSpeedMultiplier:0.75}
 });
 assert.equal(draft.presentation.visual.movement.assetId,v.movement.assetId);
 assert.equal(draft.presentation.visual.movementBack.assetId,v.movementBack.assetId);
 assert.equal(draft.presentation.visual.rangedAttackBack.assetId,v.rangedAttackBack.assetId);
});

test("the native editor and single battle visual controller expose the idle controls",()=>{
 const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 const code=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 const demo=readFileSync(new URL("../../src/ui/demo-app.js",import.meta.url),"utf8");
 for(const key of ["data-creature-idle-mode","data-creature-idle-front-visual","data-creature-idle-back-visual",
  ..."front back".split(" ").flatMap(view=>["scale","offset-x","offset-y","speed"].map(part=>"data-creature-idle-"+view+"-"+part))]){
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

test("idle FACE and DOS settings are validated without breaking previous V11 exports",()=>{
 const legacy=normalizeCreatureIdleVisualV1({mode:"gif",frontAssetId:"pack:capture:idle-front"});
 assert.deepEqual(legacy,{mode:"gif",frontAssetId:"pack:capture:idle-front",backAssetId:null});
 const settings={displayScale:1.5,offsetX:24,offsetY:-42,frameSpeedMultiplier:2};
 const current=normalizeCreatureIdleVisualV1({mode:"both",frontAssetId:"pack:capture:idle-front",
  front:settings,back:{displayScale:1,offsetX:0,offsetY:0,frameSpeedMultiplier:0.5}});
 assert.deepEqual(current.front,settings);
 assert.equal(current.back.frameSpeedMultiplier,0.5);
 for(const bad of [
  {displayScale:0.05},{offsetX:1000},{offsetY:Infinity},{frameSpeedMultiplier:0},
  {frameSpeedMultiplier:5},{frameSpeedMultiplier:"fast"},{unexpected:1}]){
  assert.throws(()=>normalizeCreatureIdleVisualV1({mode:"gif",frontAssetId:"pack:capture:idle-front",front:bad}));
 }
});
test("one battle presentation renderer owns authored idle transforms and frame decoding",()=>{
 const adapter=readFileSync(new URL("../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js",import.meta.url),"utf8");
 const renderer=readFileSync(new URL("../../src/adapters/renderer/dom-creature-movement-visual-v1.js",import.meta.url),"utf8");
 assert.match(adapter,/frameSpeedMultiplier:settings\?\.frameSpeedMultiplier/);
 assert.match(adapter,/animatedGif:resource\.mime==="image\/gif"/);
 assert.match(renderer,/win\.ImageDecoder/);
 assert.match(renderer,/await gifFrames\(visual\)/);
 assert.match(renderer,/frameSpeedMultiplier/);
 assert.match(renderer,/applySpriteVisual\(sprite/);
 assert.match(renderer,/decodedGifByUrl\.clear\(\)/);
});
test("submitted Veuve jaune animation references are preserved in one canonical showcase",()=>{
 const value=JSON.parse(readFileSync(new URL("../../data/capture/showcase/veuve-jaune.capture-creature-transfer-v1.json",import.meta.url),"utf8"));
 assert.equal(value.draft.presentation.subjectId,"veuve-jaune");
 assert.equal(value.draft.presentation.visual.movement.assetId,"pack:capture:creature-veuve-jaune-movement-opponent-5-20261125");
 assert.equal(value.draft.presentation.visual.movementBack.assetId,"pack:capture:creature-veuve-jaune-movement-player-6-20261125");
 assert.equal(value.draft.presentation.visual.rangedAttack.assetId,"pack:capture:creature-veuve-jaune-attack-opponent-6-20261125");
 assert.equal(value.draft.presentation.visual.rangedAttackBack.assetId,"pack:capture:creature-veuve-jaune-attack-player-9-20261125");
 assert.deepEqual(value.draft.presentation.visual.rangedAttackPlacement.back,{x:0,y:-20});
 assert.equal(value.draft.presentation.profileId,"serpentine");
 assert.equal(value.draft.combat.maxHp,110);
});

test("Dracendre idle binds both original Rigby views without changing four validated action strips",()=>{
 const d=JSON.parse(readFileSync(new URL("../../data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json",import.meta.url),"utf8")).draft;
 assert.equal(d.id,"crea_dracendre");
 assert.equal(d.presentation.version,11);
 const visual=d.presentation.visual;
 assert.deepEqual(visual.idle,{
  mode:"gif",
  frontAssetId:"pack:capture:creature-braisombre-idle-opponent-gif-v1",
  backAssetId:"pack:capture:creature-braisombre-idle-player-gif-v1",
  front:{displayScale:1,offsetX:0,offsetY:0,frameSpeedMultiplier:1},
  back:{displayScale:1,offsetX:0,offsetY:0,frameSpeedMultiplier:1}
 });
 assert.equal(visual.movement.assetId,"pack:capture:creature-braisombre-movement-face-12-v1");
 assert.equal(visual.movementBack.assetId,"pack:capture:creature-braisombre-movement-dos-12-v1");
 assert.equal(visual.rangedAttack.assetId,"pack:capture:creature-braisombre-attack-face-12-v1");
 assert.equal(visual.rangedAttackBack.assetId,"pack:capture:creature-braisombre-attack-dos-12-v1");
 assert.deepEqual(normalizeCreaturePresentationBinding(d.presentation).visual.idle,visual.idle);
});
