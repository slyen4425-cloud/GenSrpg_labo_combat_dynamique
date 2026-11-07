import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";
import {projectCombatArenaBarrierVisualSizeV1, resolveCombatArenaBarrierPlacementForSideV1} from "../../src/adapters/renderer/combat-entity-overlay-v1.js";
import {exportCaptureSkillTransferJsonV1,importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
const source=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const base={kind:"summon_entity",targetScope:"self",entityKind:"barrier",statId:"glace",hpPerStatPoint:2,
 interceptKinds:["projectile","beam","contact"],spriteAssetId:"test:wall",placementMode:"arena",arenaXPct:47,arenaYPct:55,
 visualScale:4,visualScaleX:1.5,visualScaleY:1};
const customized={...base,opponentSpriteAssetId:"test:wall-opponent",opponentVisualScale:2,opponentVisualScaleX:0.8,
 opponentVisualScaleY:1.25,opponentPlacementMode:"arena",opponentArenaXPct:83,opponentArenaYPct:31,
 opponentOffsetForwardPx:12,opponentOffsetUpPx:-8};

test("RED: optional enemy wall geometry is canonical, bounded and preserves legacy authored values",()=>{
 const effect=normalizeSkillEffectV1(customized);
 for(const field of ["opponentVisualScale","opponentVisualScaleX","opponentVisualScaleY",
  "opponentArenaXPct","opponentArenaYPct","opponentOffsetForwardPx","opponentOffsetUpPx","opponentPlacementMode"])
   assert.equal(effect[field],customized[field],field);
 assert.throws(()=>normalizeSkillEffectV1({...customized,opponentVisualScale:13}),/opponentVisualScale/);
 assert.throws(()=>normalizeSkillEffectV1({...customized,opponentVisualScaleY:9}),/opponentVisualScaleY/);
 assert.throws(()=>normalizeSkillEffectV1({...customized,opponentArenaXPct:101}),/opponentArenaXPct/);
 assert.throws(()=>normalizeSkillEffectV1({...customized,opponentOffsetUpPx:151}),/opponentOffsetUpPx/);
 const old=normalizeSkillEffectV1(base);
 assert.equal(old.opponentVisualScale,undefined);
 assert.equal(old.opponentArenaXPct,undefined);
});

test("RED: same entity supports distinct team rectangles and author placements, HP unchanged",()=>{
 const state=createCombatState({fighters:[
  {id:"player",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:50}},
  {id:"opponent",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:50}}]});
 const effect=normalizeSkillEffectV1(customized);
 const wall=createCombatBarrierV1({state,sourceActorId:"player",protectedActorId:"player",sourceSkillId:"icewall",effect});
 assert.equal(wall.record.hp,100);
 assert.equal(wall.record.visualScale,4);
 assert.equal(wall.record.opponentVisualScale,2);
 assert.equal(wall.record.opponentArenaXPct,83);
 assert.deepEqual(projectCombatArenaBarrierVisualSizeV1(wall.record,1,false),
  {width:420,height:368,artHeight:280});
 assert.deepEqual(projectCombatArenaBarrierVisualSizeV1(wall.record,1,true),
  {width:112,height:230,artHeight:175});
 assert.deepEqual(resolveCombatArenaBarrierPlacementForSideV1(wall.record,true),{
  placementMode:"arena",arenaXPct:83,arenaYPct:31,offsetForwardPx:12,offsetUpPx:-8,explicitOpponentArenaX:true
 });
 assert.deepEqual(resolveCombatArenaBarrierPlacementForSideV1(wall.record,false),{
  placementMode:"arena",arenaXPct:47,arenaYPct:55,offsetForwardPx:0,offsetUpPx:0,explicitOpponentArenaX:false
 });
});

test("RED: old enemy placement still inherits legacy auto projection; optional enemy values survive JSON transfer",()=>{
 const old=normalizeSkillEffectV1(base);
 assert.equal(resolveCombatArenaBarrierPlacementForSideV1(old,true).explicitOpponentArenaX,false);
 assert.equal(resolveCombatArenaBarrierPlacementForSideV1(old,true).arenaXPct,47);
 const original=JSON.parse(source("data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json"));
 const draft={...original.draft,definition:{...original.draft.definition,effects:[normalizeSkillEffectV1(customized)]}};
 const result=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft));
 assert.equal(result.value.draft.definition.effects[0].opponentVisualScaleX,0.8);
 assert.equal(result.value.draft.definition.effects[0].opponentArenaXPct,83);
 assert.equal(result.value.draft.definition.effects.length,1);
});

test("RED: editor gives each team a readable group and compact interception toggles",()=>{
 const editor=source("src/ui/capture-editor-human-v2.js");
 const css=source("examples/dom-demo/capture-editor-v2.css");
 assert.match(editor,/skill-barrier-config/);
 assert.match(editor,/skillBarrierOpponentVisualScale/);
 assert.match(editor,/skillBarrierOpponentArenaX/);
 assert.match(editor,/skill-barrier-section/);
 assert.match(css,/skill-barrier-intercepts/);
 assert.match(css,/skill-barrier-fields/);
});
