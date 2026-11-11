import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {scheduledMineContainsTargetV1} from "../../src/core/combat/scheduled-effect-runtime-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";

const mine=normalizeSkillDefinition(JSON.parse(readFileSync(new URL("../../data/capture/showcase/sylvorne-vrilles-du-sous-bois.capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft.definition);
const make=()=>createCombatSession({fighters:[
 {id:"hero",maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,energyChargeAmount:0},
 {id:"enemy",maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,energyChargeAmount:0}
],battleFormat:{actors:[{actorId:"hero"},{actorId:"enemy"}],teamOf:id=>id==="hero"?"player":"opponent"}});
const within={left:90,top:70,width:20,height:30};
const away={left:180,top:70,width:20,height:30};
const mineBounds={left:80,top:85,width:40,height:30};
const advance=(targetBounds)=>{const s=make();assert.equal(s.useSkill({actorId:"hero",targetId:"enemy",skill:mine}).ok,true);
 const entry=s.snapshot().scheduledEffects[0];
 s.advanceMs(2000,{zoneSpatialContext:{visibleMines:[{mineId:entry.id,targetActorId:"enemy",mineBounds,targetBounds}]}});
 return s.snapshot();};

test("mine deals damage only when the target's feet are in the ground ring at explosion",()=>{
 assert.equal(scheduledMineContainsTargetV1({mineBounds,targetBounds:within}),true);
 assert.equal(scheduledMineContainsTargetV1({mineBounds,targetBounds:away}),false);
 assert.equal(advance(within).fighters.enemy.hp,85);
 const escaped=advance(away);assert.equal(escaped.fighters.enemy.hp,100);
 assert.equal(escaped.scheduledEffects.length,0);
});
test("spatially known mine with absent target or missing ring cannot deal damage",()=>{
 const s=make();s.useSkill({actorId:"hero",targetId:"enemy",skill:mine});
 s.advanceMs(2000,{zoneSpatialContext:{visibleMines:[]}});
 assert.equal(s.snapshot().fighters.enemy.hp,100);
 assert.equal(s.snapshot().scheduledEffects.length,0);
});
test("mine preview and Bestiary use real data instead of duplicating clocks or conditions",()=>{
 const renderer=readFileSync(new URL("../../src/adapters/renderer/dom-skill-fx.js",import.meta.url),"utf8");
 const bestiary=readFileSync(new URL("../../examples/dom-demo/bestiary.js",import.meta.url),"utf8");
 assert.match(renderer,/item\.node\.textContent=seconds\+" s"/);
 assert.match(renderer,/sampleMineSpatialContext/);
 assert.match(bestiary,/Déblocage : niveau /);
 assert.match(bestiary,/skill\.explanation\?\.sentences/);
});
