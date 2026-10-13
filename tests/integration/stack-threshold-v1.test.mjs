import test from "node:test";
import assert from "node:assert/strict";
import { normalizeStatusEffectV1 } from "../../src/contracts/status-effect-v1.js";
import { createCombatState } from "../../src/core/combat/combat-state.js";
import { applyStatusEffectV1, advanceStatusEffectsV1 } from "../../src/core/combat/status-effect-runtime-v1.js";

const fighter=id=>({id,maxHp:100,initialHp:70,maxEnergy:30,initialEnergy:20,
 energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const start=(ids=["a","b"])=>createCombatState({fighters:ids.map(fighter)});
const amount=(kind,amount,targetScope="target")=>({kind,amount,targetScope});
const status=(config={})=>normalizeStatusEffectV1({
 id:"charge-status",kind:"stun",polarity:"detrimental",durationMs:6000,
 stacking:"stack",maxStacks:5,
 onStackThreshold:{count:3,consume:"reset",effects:[amount("damage",15)]},...config
});
const add=(state,definition,sourceActorId="a",targetActorId="b")=>
 applyStatusEffectV1({state,status:definition,sourceActorId,targetActorId,sourceSkillId:"stacking-skill"});

test("optional stack threshold contract normalizes native effects and rejects invalid thresholds/scopes",()=>{
 const s=status();assert.equal(s.maxStacks,5);assert.equal(s.onStackThreshold.count,3);
 assert.deepEqual(s.onStackThreshold.effects[0].kind,"damage");
 assert.equal(normalizeStatusEffectV1({...s,onStackThreshold:undefined}).onStackThreshold,undefined);
 assert.throws(()=>status({stacking:"refresh"}),/stack|threshold/i);
 assert.throws(()=>status({onStackThreshold:{count:6,consume:"reset",effects:[amount("heal",5)]}}),/threshold|count|maxStacks/i);
 assert.throws(()=>status({onStackThreshold:{count:2,consume:"reset",effects:[]}}),/effects/i);
 assert.throws(()=>status({onStackThreshold:{count:2,consume:"reset",effects:[amount("damage",5,"all_enemies")]}}),/targetScope|scope/i);
});
test("exact threshold only: reset, then re-arm; no early damage and no double trigger",()=>{
 const s=status();
 let game=start();
 game=add(game,s);assert.equal(game.fighters.b.hp,70);assert.equal(game.fighters.b.statusEffects[0].stacks,1);
 game=add(game,s);assert.equal(game.fighters.b.hp,70);assert.equal(game.fighters.b.statusEffects[0].stacks,2);
 game=add(game,s);assert.equal(game.fighters.b.hp,55);
 assert.equal(game.fighters.b.statusEffects.some(x=>x.definition.id==="charge-status"),false);
 game=add(game,s);game=add(game,s);game=add(game,s);
 assert.equal(game.fighters.b.hp,40);assert.equal(game.fighters.a.damageDealtTotal,30);
});
test("keep mode fires on crossing only, never repeats at stack cap",()=>{
 const s=status({maxStacks:3,onStackThreshold:{count:2,consume:"keep",effects:[amount("heal",12)]}});
 let game=start();for(let i=0;i<7;i++)game=add(game,s);
 assert.equal(game.fighters.b.hp,82);
 assert.equal(game.fighters.b.statusEffects[0].stacks,3);
});
test("heal, energy restore/drain and statuses can mix at a threshold, on friendly or enemy stacks",()=>{
 const buff={id:"reward",kind:"shield",polarity:"beneficial",durationMs:2000,amount:14,stacking:"replace"};
 const curse={id:"penalty",kind:"silence",polarity:"detrimental",durationMs:2000,stacking:"replace"};
 const s=status({polarity:"beneficial",onStackThreshold:{count:2,consume:"reset",effects:[
    amount("heal",8),amount("energy_restore",4),
    amount("energy_drain",5,"self"),
    {kind:"apply_status",targetScope:"target",status:buff},
    {kind:"apply_status",targetScope:"self",status:curse}
 ]}});
 let game=start();game=add(game,s);game=add(game,s);
 assert.equal(game.fighters.b.hp,78);assert.equal(game.fighters.b.energy,24);
 assert.equal(game.fighters.a.energy,15);
 assert.equal(game.fighters.b.statusEffects.some(x=>x.definition.id==="reward"),true);
 assert.equal(game.fighters.a.statusEffects.some(x=>x.definition.id==="penalty"),true);
});
test("threshold damage cannot bypass immunity, shields or KO credit, with intact team members",()=>{
 const s=status({onStackThreshold:{count:2,consume:"reset",effects:[amount("damage",150)]}});
 let game=start(["a","b","ally","foe"]);
 const immune=normalizeStatusEffectV1({id:"immune",kind:"immunity",polarity:"beneficial",durationMs:2000,
  stacking:"replace",domains:["damage","negative_status"]});
 game=applyStatusEffectV1({state:game,status:immune,sourceActorId:"b",targetActorId:"b"});
 for(let i=0;i<2;i++)game=add(game,s);
 assert.equal(game.fighters.b.hp,70);assert.equal(game.fighters.a.knockoutsTotal,0);
 assert.equal(game.fighters.ally.hp,70);
 game=advanceStatusEffectsV1({state:game,deltaMs:2100});
 for(let i=0;i<2;i++)game=add(game,s);
 assert.equal(game.fighters.b.hp,0);
 assert.equal(game.fighters.a.knockoutsTotal,1);
 assert.equal(game.fighters.ally.hp,70);
});
test("expiry clears partial stacks, next application starts from one",()=>{
 const s=status({durationMs:1000});
 let game=add(start(),s);game=add(game,s);
 game=advanceStatusEffectsV1({state:game,deltaMs:1100});
 game=add(game,s);
 assert.equal(game.fighters.b.statusEffects.find(x=>x.definition.id===s.id).stacks,1);
 assert.equal(game.fighters.b.hp,70);
});
test("zero-effect old stack status remains compatible",()=>{
 const s=normalizeStatusEffectV1({id:"old",kind:"shield",amount:3,
 polarity:"beneficial",durationMs:3000,stacking:"stack",maxStacks:4});
 let game=start();for(let i=0;i<3;i++)game=add(game,s);
 assert.equal(game.fighters.b.statusEffects[0].stacks,3);
 assert.equal(game.fighters.b.statusEffects[0].shieldRemaining,9);
});
