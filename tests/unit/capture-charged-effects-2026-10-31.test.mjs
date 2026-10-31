import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {buildHumanSkillDraftV1,humanSkillEditorFieldsFromDraftV1} from "../../src/ui/capture-editor-human-v2.js";

const json=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const base=json("data/combat/skills/fireball.skill.json");
const chargedEffects={maxCharges:2,reactivationWindowMs:400,sizeIncreasePct:10,potencyIncreasePct:50};
const vulnerable={id:"test-vulnerability",kind:"incoming_effect_modifier",polarity:"detrimental",
  durationModel:"time_ms",durationMs:20000,stacking:"refresh",maxStacks:1,tags:[],
  modifierPct:20,affectedPolarity:"detrimental"};
function spell(overrides={}){
  return normalizeSkillDefinition({...base,id:"charged-debuff",name:"Gel renforcé",category:"buff_debuff",
    form:"beam",element:"ice",preparationMs:800,travelMs:100,recoveryMs:0,
    cooldownMs:0,energyCost:2,targetRelations:["enemy"],targetLocations:["active"],
    effect:{damage:0,heal:0,interruptsPreparation:false,stunMs:0,tags:[]},
    effects:[{kind:"apply_status",targetScope:"target",status:vulnerable}],
    chargedEffects,...overrides});
}
function clock(){let t=0,queue=[],id=0;return {now:()=>t,advance(ms){t+=ms;
  for(const task of [...queue]){queue=queue.filter(x=>x!==task);task.callback();}},
  setTimer(callback,delay){const item={id:++id,callback,delay};queue.push(item);return item.id;},
  clearTimer(key){queue=queue.filter(x=>x.id!==key);}};}
test("charge contract accepts timed buff/debuff potency, never adds a second attack authority",()=>{
  assert.equal(spell().chargedEffects.potencyIncreasePct,50);
  assert.throws(()=>spell({chargedAttack:{baseDamage:1,bonusDamagePerCharge:1,maxCharges:2,
    reactivationWindowMs:300,sizeIncreasePct:10}}),/charg/i);
  assert.throws(()=>spell({chargedEffects:{...chargedEffects,maxCharges:0}}),/maxCharges/i);
  assert.throws(()=>spell({chargedEffects:{...chargedEffects,potencyIncreasePct:-1}}),/potency/i);
  assert.throws(()=>spell({effects:[{kind:"apply_status",targetScope:"target",status:{
    ...vulnerable,kind:"stun",modifierPct:undefined}}]}),/chargedEffects|potency|status/i);
});
test("native Combat Runtime charges one debuff, with one status and time/energy paid per activation",()=>{
  const session=createCombatSession({fighters:[
    {...json("data/combat/fighters/maraileron.combat.json"),initialEnergy:10,initialHp:100,energyChargeIntervalMs:1000000},
    {...json("data/combat/fighters/braisombre.combat.json"),initialEnergy:10,initialHp:100}]});
  const time=clock(),released=[],resolved=[];
  const runtime=createCombatRuntime({session,now:time.now,setTimer:time.setTimer,clearTimer:time.clearTimer,
    tickMs:50,onRelease:e=>released.push(e),onResolved:e=>resolved.push(e)});
  const skill=spell();runtime.start();
  assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill}).outcome,"started");
  assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill}).outcome,"charge_preparing");
  time.advance(800);
  assert.equal(runtime.startSkill({actorId:"maraileron",targetId:"braisombre",skill}).chargeCount,2);
  assert.equal(session.snapshot().fighters.maraileron.energy,6,"2 paid activations at 2 energy each");
  time.advance(800);time.advance(100);
  assert.equal(released.length,1);
  assert.equal(released[0].action.skill.effects[0].status.modifierPct,30);
  assert.equal(released[0].action.skill.effects[0].status.durationMs,20000);
  assert.equal(resolved.length,1);
  const statuses=session.snapshot().fighters.braisombre.statusEffects
    .filter(x=>x.definition.id==="test-vulnerability");
  assert.equal(statuses.length,1,"no duplicated status or second damage authority");
  assert.equal(statuses[0].definition.modifierPct,30);
  runtime.dispose();
});
test("the author editor and bestiary preserve a charged heal and scope without invented duration scaling",()=>{
  const exportDraft=json("data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json").draft;
  const fields=humanSkillEditorFieldsFromDraftV1(exportDraft);
  const adjusted=buildHumanSkillDraftV1({...fields,chargedEffects,chargedAttack:null,
    preparationMs:800,effects:[{kind:"heal",targetScope:"target",amount:20}]});
  assert.deepEqual(adjusted.definition.chargedEffects,chargedEffects);
  assert.deepEqual(humanSkillEditorFieldsFromDraftV1(adjusted).chargedEffects,chargedEffects);
  assert.match(describeCaptureSkillV1(spell()).sentences.join(" "),/charge|activation/i);
  const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  assert.match(html,/data-skill-charged-effects-enabled/);
  assert.match(html,/data-skill-charged-effects-potency/);
});
