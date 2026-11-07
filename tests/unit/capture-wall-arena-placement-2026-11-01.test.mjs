import {readFileSync} from "node:fs";
import {exportCaptureSkillTransferJsonV1,importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import test from "node:test";
import assert from "node:assert/strict";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";
const base={kind:"summon_entity",targetScope:"self",entityKind:"barrier",statId:"glace",hpPerStatPoint:2,
  interceptKinds:["projectile","beam","contact"]};
test("arena wall placement is native SkillEffect data with bounded percent coordinates",()=>{
 const free=normalizeSkillEffectV1({...base,placementMode:"arena",arenaXPct:24,arenaYPct:71});
 assert.equal(free.placementMode,"arena");
 assert.equal(free.arenaXPct,24);assert.equal(free.arenaYPct,71);
 assert.throws(()=>normalizeSkillEffectV1({...base,placementMode:"arena",arenaXPct:105,arenaYPct:50}),/arenaXPct/);
 assert.throws(()=>normalizeSkillEffectV1({...base,placementMode:"arena",arenaXPct:-1,arenaYPct:50}),/arenaXPct/);
 assert.throws(()=>normalizeSkillEffectV1({...base,placementMode:"arena",arenaXPct:50,arenaYPct:Infinity}),/arenaYPct/);
 assert.throws(()=>normalizeSkillEffectV1({...base,placementMode:"elsewhere"}),/placementMode/);
 assert.throws(()=>normalizeSkillEffectV1({...base,arenaXPct:30}),/placementMode|arenaXPct/);
});
test("summon snapshots arena coordinates without changing statistics, roster or legacy placement",()=>{
 const s=createCombatState({fighters:[
 {id:"hero",maxHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:40}},
 {id:"enemy",maxHp:100,maxEnergy:10,initialEnergy:10}
 ]});
 const legacy=normalizeSkillEffectV1(base);
 assert.equal(legacy.placementMode,undefined,"old author export remains unchanged");
 const normal=createCombatBarrierV1({state:s,sourceActorId:"hero",protectedActorId:"hero",sourceSkillId:"old",effect:legacy});
 assert.equal(normal.record.maxHp,80);
 assert.equal(normal.record.placementMode,undefined);
 const free=createCombatBarrierV1({state:normal.state,sourceActorId:"hero",protectedActorId:"hero",
  sourceSkillId:"new",effect:normalizeSkillEffectV1({...base,placementMode:"arena",arenaXPct:24,arenaYPct:71})});
 assert.equal(free.record.maxHp,80);
 assert.equal(free.record.placementMode,"arena");
 assert.equal(free.record.arenaXPct,24);assert.equal(free.record.arenaYPct,71);
 assert.equal(free.state.fighters.hero.hp,100);
 assert.equal(free.state.combatEntities.length,2);
});

test("official skill JSON transfer preserves arena positions without mutating legacy preset",()=>{
 const source=JSON.parse(readFileSync(new URL("../../data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json",import.meta.url),"utf8"));
 const originalEffect=source.draft.definition.effects[0];
 assert.equal(originalEffect.placementMode,"arena");
 assert.equal(originalEffect.arenaXPct,47);assert.equal(originalEffect.arenaYPct,55);
 const authored={...source.draft,definition:{...source.draft.definition,
   effects:[normalizeSkillEffectV1({...originalEffect,placementMode:"arena",arenaXPct:24,arenaYPct:71})]}};
 const exported=exportCaptureSkillTransferJsonV1(authored);
 const imported=importCaptureTransferJsonV1(exported);
 assert.equal(imported.kind,"skill");
 assert.equal(imported.value.draft.definition.effects[0].placementMode,"arena");
 assert.equal(imported.value.draft.definition.effects[0].arenaXPct,24);
 assert.equal(imported.value.draft.definition.effects[0].arenaYPct,71);
 assert.equal(imported.value.draft.definition.effects[0].hpPerStatPoint,2);
 const unmodified=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(source.draft));
 assert.equal(unmodified.value.draft.definition.effects[0].placementMode,"arena");
 assert.equal(unmodified.value.draft.definition.effects[0].arenaXPct,47);
});
