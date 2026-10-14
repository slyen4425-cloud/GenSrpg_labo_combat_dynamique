import test from "node:test";
import assert from "node:assert/strict";
import {effectiveApproachTimingMs,advanceSkillCooldownDeadlinesV1} from "../../src/core/combat/combat-timing.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";

const fighter=id=>({id,maxHp:200,initialHp:200,maxEnergy:50,initialEnergy:50,
 energyChargeAmount:2,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0,
 statEffectRulesById:{electric:{damageChannel:"electric",resistanceChannel:"electric",
 damagePctPerPoint:1,resistancePctPerPoint:0,chargeTimeReductionPctPerPoint:0}}});
const s=(id,kind,modifierPct=null)=>({id,kind,polarity:"beneficial",durationMs:60000,
 stacking:"refresh",...(modifierPct!==null?{modifierPct}:{})});
const ultimate=normalizeSkillDefinition({id:"cap_electric_special_2",name:"Surcharge",category:"buff_debuff",
 form:"self",element:"electric",approachMode:"none",energyCost:3,
 preparationMs:2000,travelMs:0,recoveryMs:0,cooldownMs:0,maxUsesPerCombat:1,
 allowedDistances:["short","medium","long"],targetRelations:["self","ally"],
 effect:{damage:0,heal:0,tags:[]},
 effects:[
 {kind:"apply_status",targetScope:"target",status:s("status-1","approach_time_modifier",-100)},
 {kind:"apply_status",targetScope:"target",status:s("cap_electric_special_2:1","skill_cooldown_rate_modifier",-100)},
 {kind:"apply_status",targetScope:"target",status:s("status-2","energy_regen_modifier",50)},
 {kind:"apply_status",targetScope:"target",status:{...s("status-3","stat_modifier"),statId:"electric",deltaPoints:50,modifierMode:"points"}},
 {kind:"apply_status",targetScope:"target",status:{
 id:"status-4",kind:"triggered_buff",polarity:"beneficial",durationMs:60000,
 stacking:"refresh",onEvent:{event:"damage_dealt",effects:[{kind:"damage",targetScope:"target",amount:10,channel:null}]}
 }}
]});
const mobile=(approachMode,baseMs=900)=>normalizeSkillDefinition({id:"mobility-"+approachMode,
 name:"Attaque qui se déplace",category:"offensive",form:"contact",element:"electric",
 approachMode,energyCost:0,preparationMs:400,travelMs:baseMs,recoveryMs:0,cooldownMs:5000,
 allowedDistances:["short","medium","long"],targetRelations:["enemy"],effect:{damage:10,heal:0,tags:[]}});
function clock(){let at=0,queue=[],id=1;return {now:()=>at,setTime:t=>{at=t;},
 setTimer:(fn,delay)=>{const item={id:id++,fn};queue.push(item);return item.id;},
 clearTimer:token=>{queue=queue.filter(item=>item.id!==token);},
 fireNext:()=>{const item=queue.shift();item?.fn();},
 get queued(){return queue.length}}}
test("RED: -100% approach from author's Surcharge cannot collapse a real path to zero milliseconds",()=>{
 for(const mode of ["ground","aerial","burrow"]){
  const actor={definition:s("status-1","approach_time_modifier",-100),stacks:1,appliedAtMs:0,expiresAtMs:60000};
  assert.ok(effectiveApproachTimingMs({baseMs:900,approachMode:mode,statusEffects:[actor],atMs:1000})>=1,
   mode+" should have at least a single native tick separation");
 }
 assert.equal(effectiveApproachTimingMs({baseMs:0,approachMode:"ground"}),0,
  "explicit authored no-travel remains valid");
 assert.equal(effectiveApproachTimingMs({baseMs:900,approachMode:"none"}),900,
  "stationary projectile unaffected");
});
test("actual five-effect ultimate is valid and native Session gives an orderly release-then-impact interval",()=>{
 const c=createCombatSession({fighters:[fighter("voltige"),fighter("foe")]});
 const cast=c.useSkill({actorId:"voltige",targetId:"voltige",skill:ultimate});
 assert.equal(cast.ok,true,JSON.stringify(cast));
 const kinds=c.snapshot().fighters.voltige.statusEffects.map(x=>x.definition.kind);
 assert.deepEqual(kinds,["approach_time_modifier","skill_cooldown_rate_modifier","energy_regen_modifier","stat_modifier","triggered_buff"]);
 const attack=c.startSkill({actorId:"voltige",targetId:"foe",skill:mobile("ground")});
 assert.equal(attack.ok,true,JSON.stringify(attack));
 assert.ok(attack.action.travelMs>=1);
 assert.ok(attack.action.impactAtMs>attack.action.releaseAtMs);
});
test("real CombatRuntime: Surcharge -> approach charging full -> release -> resolved without freezing",()=>{
 const c=createCombatSession({fighters:[fighter("voltige"),fighter("foe")]});
 assert.equal(c.useSkill({actorId:"voltige",targetId:"voltige",skill:ultimate}).ok,true);
 const t=clock(),events={released:[],resolved:[]};
 const runtime=createCombatRuntime({session:c,now:t.now,tickMs:50,setTimer:t.setTimer,
 clearTimer:t.clearTimer,onRelease:x=>events.released.push(x),
 onResolved:x=>events.resolved.push(x)});
 runtime.start();
 const result=runtime.startSkill({actorId:"voltige",targetId:"foe",skill:mobile("ground")});
 assert.equal(result.ok,true);
 assert.ok(result.action.travelMs>=1);
 t.setTime(result.action.preparationMs);
 t.fireNext();
 assert.equal(events.released.length,1);
 assert.equal(events.resolved.length,0,"release is distinct from impact");
 t.setTime(result.action.impactAtMs);
 t.fireNext();
 assert.equal(events.resolved.length,1,"resolved on canonical deadline");
 assert.equal(events.resolved[0].ok,true);
 assert.equal(c.snapshot().fighters.foe.hp,180,"native attack 10 plus triggered 10");
 runtime.dispose();
 assert.equal(t.queued,0);
});
test("cooldown -100% is a pause, not faster recharge; energy +50 remains independent",()=>{
 const c=createCombatSession({fighters:[fighter("voltige"),fighter("foe")]});
 c.useSkill({actorId:"voltige",targetId:"voltige",skill:ultimate});
 const current=c.snapshot().fighters.voltige;
 const until=advanceSkillCooldownDeadlinesV1({cooldowns:{test:5000},atMs:0,deltaMs:1000,statusEffects:current.statusEffects});
 assert.equal(until.test,6000,"cooldown remaining 5000ms after 1000ms under -100% status");
});
