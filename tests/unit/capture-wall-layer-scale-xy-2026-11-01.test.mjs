import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";
import {exportCaptureSkillTransferJsonV1,importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
const source=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const base={kind:"summon_entity",targetScope:"self",entityKind:"barrier",statId:"glace",hpPerStatPoint:1,
 interceptKinds:["projectile","beam","contact"],placementMode:"arena",arenaXPct:42,arenaYPct:68};
test("RED: wall scale beyond 4, independent X/Y and bounds validated in canonical SkillEffect",()=>{
 const e=normalizeSkillEffectV1({...base,visualScale:8,visualScaleX:1.75,visualScaleY:0.65});
 assert.equal(e.visualScale,8);assert.equal(e.visualScaleX,1.75);assert.equal(e.visualScaleY,0.65);
 assert.throws(()=>normalizeSkillEffectV1({...base,visualScale:13}),/visualScale/);
 assert.throws(()=>normalizeSkillEffectV1({...base,visualScaleX:9}),/visualScaleX/);
 assert.throws(()=>normalizeSkillEffectV1({...base,visualScaleY:0}),/visualScaleY/);
 const old=normalizeSkillEffectV1(base);assert.equal(old.visualScale,undefined);
 assert.equal(old.visualScaleX,undefined);assert.equal(old.visualScaleY,undefined);
});
test("RED: native CombatEntity stores X/Y scale independently without changing HP or placement",()=>{
 const e=normalizeSkillEffectV1({...base,visualScale:6,visualScaleX:2,visualScaleY:0.5});
 const initial=createCombatState({fighters:[
 {id:"player",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:50}},
 {id:"opponent",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10}]});
 const wall=createCombatBarrierV1({state:initial,sourceActorId:"player",protectedActorId:"player",sourceSkillId:"wall",effect:e});
 assert.equal(wall.record.hp,50);assert.equal(wall.record.visualScale,6);
 assert.equal(wall.record.visualScaleX,2);assert.equal(wall.record.visualScaleY,0.5);
 assert.equal(wall.record.arenaXPct,42);assert.equal(wall.record.arenaYPct,68);
});
test("RED: author skill transfer preserves unequal X/Y scale, no second wall",()=>{
 const original=JSON.parse(source("data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json"));
 const draft={...original.draft,definition:{...original.draft.definition,effects:[
  normalizeSkillEffectV1({...original.draft.definition.effects[0],placementMode:"arena",
   arenaXPct:45,arenaYPct:64,visualScale:7,visualScaleX:1.5,visualScaleY:0.75})
 ]}};
 const round=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft));
 const actual=round.value.draft.definition.effects[0];
 assert.equal(actual.visualScale,7);assert.equal(actual.visualScaleX,1.5);assert.equal(actual.visualScaleY,0.75);
 assert.equal(actual.placementMode,"arena");assert.equal(round.value.draft.definition.effects.length,1);
 assert.equal(original.draft.definition.effects[0].visualScaleX,1.5);
});
test("RED: one arena wall renderer exposes cross-team layering, x/y geometry and authored editor fields",()=>{
 const renderer=source("src/adapters/renderer/combat-entity-overlay-v1.js");
 const human=source("src/ui/capture-editor-human-v2.js");
 assert.match(renderer,/arenaOverlay\.style\.zIndex\s*=\s*["']3["']/,
  "arena overlay must paint after opponent at layer 3 but below player at layer 4");
 assert.match(renderer,/visualScaleX/);assert.match(renderer,/visualScaleY/);
 assert.match(human,/data-skill-barrier-visual-scale-x|skillBarrierVisualScaleX/);
 assert.match(human,/data-skill-barrier-visual-scale-y|skillBarrierVisualScaleY/);
});
