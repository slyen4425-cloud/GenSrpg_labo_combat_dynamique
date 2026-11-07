import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {mountCaptureCombatPreviewV1} from "../../src/ui/capture-combat-preview-v1.js";

const creature=JSON.parse(readFileSync(new URL("../../data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json",import.meta.url),"utf8"));
test("official main Moussado has exactly the approved defensive reaction",()=>{
 assert.deepEqual(creature.draft.combat.reaction,{type:"defense",maxCharges:2,rechargeMs:30000,activeWindowMs:250,damageReductionPct:50});
 assert.equal(creature.loadout.slots[1].skillId,"lib_earth_guard");
});
test("embedded Battle host delegates to native Lab owner and disposes exactly once",async()=>{
 const provided={initialHpByActor:{player:33,opponent:40}};
 let combatArgs=null, visualDisposed=0,combatDisposed=0;
 const mounted=await mountCaptureCombatPreviewV1({root:{},nativeCombatSource:{},nativeVisualSource:{},embeddedBattle:provided,
  mountVisuals:()=>({dispose(){visualDisposed++}}),
  mountCombat:args=>(combatArgs=args,{dispose(){combatDisposed++}})
 });
 assert.equal(combatArgs.embeddedBattle,provided);
 mounted.dispose();mounted.dispose();
 assert.equal(visualDisposed,1);assert.equal(combatDisposed,1);
});
