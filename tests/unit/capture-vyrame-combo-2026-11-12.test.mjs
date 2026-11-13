import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeCaptureCreatureTransferV1} from '../../src/contracts/capture-creature-transfer-v1.js';
import {normalizeCaptureSkillTransferV1} from '../../src/contracts/capture-skill-transfer-v1.js';
import {normalizeCaptureStatRegistryV1} from '../../src/contracts/capture-stat-registry-v1.js';
import {assertCaptureNewCreatureStatBudgetV1} from '../../src/contracts/capture-creature-stat-budget-v1.js';
import {createCombatState} from '../../src/core/combat/combat-state.js';
import {applyImmediateTacticalEffectsV1} from '../../src/core/combat/immediate-tactical-effects-v1.js';
import {effectiveApproachTimingMs} from '../../src/core/combat/combat-timing.js';
import {describeCaptureSkillV1} from '../../src/ui/capture-skill-explanation-v1.js';
const ids=["vyrame-griffe-dame","vyrame-crocs-du-voile","vyrame-rugissement-des-limbes","vyrame-carapace-des-ames","vyrame-deferlante-spectrale"];
const read=p=>readFile(new URL('../../'+p,import.meta.url),'utf8');
const load=async name=>JSON.parse(await read('data/capture/showcase/'+name+'.json'));
const skills=await Promise.all(ids.map(async id=>(await normalizeCaptureSkillTransferV1(await load(id+'.capture-skill-transfer-v1'))).draft));
const fighter=(id,hp=200)=>({id,maxHp:hp,initialHp:hp===200?100:hp,maxEnergy:25,initialEnergy:10,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,statValuesById:{defense:18},statEffectRulesById:{defense:{damageChannel:null,resistanceChannel:null,damagePctPerPoint:0,resistancePctPerPoint:0,chargeTimeReductionPctPerPoint:0}}});
const state=()=>createCombatState({fighters:[fighter('vyrame'),fighter('enemy',300)]});
const battleFormat={actors:[{actorId:'vyrame'},{actorId:'enemy'}],teamOf:id=>id==='vyrame'?'player':'opponent'};
const apply=(s,skill,at=0)=>applyImmediateTacticalEffectsV1({state:s,actorId:'vyrame',targetId:'enemy',skill,atMs:at,combatAtMs:at,battleFormat}).state;
const stacks=s=>s.fighters.vyrame.statusEffects.find(v=>v.definition.id==='marker:vyrame-combo')?.stacks??0;
test('Vyrâme: one original approved portrait trio, proper defensive reaction and exactly 100 standard points',async()=>{
 const registry=normalizeCaptureStatRegistryV1(JSON.parse(await read('data/capture/monster-capture-stat-registry.v1.json')));
 const creature=normalizeCaptureCreatureTransferV1(await load('crea_vyrame.capture-creature-transfer-v1'),registry);
 assert.equal(creature.draft.displayName,'Vyrâme');
 assert.deepEqual(creature.draft.elements,['spirit']);
 assert.equal(creature.draft.combat.reaction.type,'defense');
 assert.equal(creature.draft.combat.maxHp,200);
 assert.equal(assertCaptureNewCreatureStatBudgetV1({statValues:creature.statValues,statRegistry:registry}).spent,100);
 assert.deepEqual(creature.draft.skillIds,ids);
 assert.deepEqual(creature.loadout.slots.map(s=>s.skillId),ids);
 for(const [view,id] of [['front','opponent'],['back','player'],['icon','icon']])
  assert.equal(creature.draft.presentation.visual[view].assetId,'pack:capture:creature-pourpre-'+id+'-01');
 assert.equal(creature.draft.presentation.transformOrigin.y,'88%');
 assert.equal(creature.draft.presentation.version,9,'keep canonical V9 media metadata');
 assert.deepEqual(creature.draft.presentation.viewOverrides.player,{displayScale:1.75,position:{x:0,y:0}},'preserve uploaded player settings');
 assert.deepEqual(creature.draft.presentation.viewOverrides.opponent,{displayScale:1.1,position:{x:0,y:50}},'preserve uploaded opponent settings');

});
test('Vyrâme: five skills and four marker consumers preserve source and target semantics',()=>{
 assert.deepEqual(skills.map(x=>x.requiredLevel),[1,5,10,15,20]);
 assert.equal(skills[0].definition.effects[1].targetScope,'self');
 assert.equal(skills[0].definition.effects[1].marker.maxStacks,3);
 assert.equal(skills[0].definition.effects[1].marker.polarity,'beneficial');
 assert.equal(skills[0].definition.travelMs,1300,'basic attack movement at half speed');
 assert.equal(skills[0].presentation.visual.cast,undefined,'no Lv1 cast sprite');
 assert.ok(skills[0].presentation.visual.impact,'Lv1 impact sprite retained');
 assert.equal(skills[3].definition.targetRelations.includes('self'),true);
 assert.equal(skills[4].definition.maxUsesPerCombat,1);
 for(const draft of skills.slice(1)){
  const effects=draft.definition.effects,consume=effects.find(x=>x.kind==='consume_marker');
  assert.ok(effects.some(x=>x.kind!=='consume_marker'),'base effect must work independently');
  assert.equal(consume.targetScope,'self');
  assert.equal(consume.markerId,'vyrame-combo');
  assert.equal(consume.minimum,3);assert.equal(consume.count,3);
  assert.ok(consume.effects.length>=1);
  if(['vyrame-crocs-du-voile','vyrame-rugissement-des-limbes'].includes(draft.id))
   assert.deepEqual(consume.effects.map(x=>x.targetScope),['target'],'extra damage on original enemy');
  else
   assert.ok(consume.effects.every(x=>x.targetScope==='self'),'self-only defensive bonus');
 }
});
test('Combo: each basic attack adds one marker ON SELF, caps at 3 and never marks target',()=>{
 let s=state();
 for(let i=1;i<=4;i++){
  s=apply(s,skills[0].definition,i*1000);
  assert.equal(stacks(s),Math.min(i,3));
  assert.equal(s.fighters.enemy.statusEffects.some(x=>x.definition.id==='marker:vyrame-combo'),false);
 }
});
test('Combo: 2 charges preserve base effects, 3 charges trigger and consume exactly once',()=>{
 const markerOnly={...skills[0].definition,effects:[skills[0].definition.effects[1]]};
 for(const draft of skills.slice(1)){
  let s=state();
  s=apply(s,markerOnly,1000);
  s=apply(s,markerOnly,2000);
  const before=s.fighters.enemy.hp;
  const hpBefore=s.fighters.vyrame.hp;
  s=apply(s,draft.definition,3000);
  assert.equal(stacks(s),2,draft.id+' must NOT consume below threshold');
  if(draft.definition.effects.some(e=>e.kind==='damage'))assert.ok(s.fighters.enemy.hp<before,draft.id+' has unconditional damage');
  assert.equal(s.fighters.vyrame.hp,hpBefore,'No prethreshold self-heal');
  if(draft.id==='vyrame-carapace-des-ames')
   assert.deepEqual(s.fighters.vyrame.statusEffects.filter(x=>x.definition.id.startsWith('vyrame-carapace-')).map(x=>x.definition.deltaPoints),[100]);
  s=apply(s,markerOnly,4000);
  assert.equal(stacks(s),3);
  const ownHp=s.fighters.vyrame.hp;
  s=apply(s,draft.definition,5000);
  assert.equal(stacks(s),0,draft.id+' consumes all three exactly once');
  assert.equal(s.fighters.vyrame.hp,ownHp+(draft.id==='vyrame-deferlante-spectrale'?25:0),draft.id+' preserves only the intended healing');
  if(draft.id==='vyrame-carapace-des-ames') {
   const statuses=s.fighters.vyrame.statusEffects.filter(x=>x.definition.id.startsWith('vyrame-carapace-'));
   assert.equal(statuses.length,2);
   assert.equal(statuses.reduce((sum,x)=>sum+x.definition.deltaPoints,0),200);
  }
  if(draft.id==='vyrame-deferlante-spectrale')
   assert.ok(s.fighters.vyrame.statusEffects.some(x=>x.definition.id==='vyrame-deferlante-surcharge'));
 }
});
test('Combo attacks deliver precisely +10 Spirit damage to enemy, never the caster',()=>{
 const markerOnly={...skills[0].definition,effects:[skills[0].definition.effects[1]]};
 for(const [index,bonus] of [[1,10],[2,10]]){
  let normal=state(),charged=state();
  for(let i=1;i<=3;i++)charged=apply(charged,markerOnly,i*1000);
  normal=apply(normal,skills[index].definition,5000);
  charged=apply(charged,skills[index].definition,5000);
  assert.equal(stacks(charged),0);
  const unchargedDamage=300-normal.fighters.enemy.hp;
  const chargedDamage=300-charged.fighters.enemy.hp;
  assert.equal(chargedDamage-unchargedDamage,bonus,'bonus damage must use original selected enemy');
  assert.equal(charged.fighters.vyrame.hp,normal.fighters.vyrame.hp,'no self damage');
 }
});
test('Rugissement targets enemy with native 5-second stun and real action-interrupt event',()=>{
 const definition=skills[2].definition;
 assert.equal(definition.effects[0].amount,8,'base damage applies to all active enemies');
 assert.equal(definition.effects[2].effects[0].amount,10,'Combo bonus hits original selected enemy');
 assert.equal(definition.effects[1].targetScope,'target');
 assert.equal(definition.effects[1].status.kind,'stun');
 assert.equal(definition.effects[1].status.durationMs,5000);
 const result=applyImmediateTacticalEffectsV1({state:state(),actorId:'vyrame',targetId:'enemy',skill:definition,atMs:2500,combatAtMs:2500,battleFormat});
 assert.ok(result.state.fighters.enemy.statusEffects.some(x=>x.definition.id==='vyrame-limbes-etourdissement'&&x.expiresAtMs===7500));
 assert.ok(result.events.some(e=>e.type==='charge-interrupt'&&e.actorId==='enemy'&&e.stunMs===5000));
});
test('Sélachombre only Lv1 contact approach moves at one third the previous speed; cooldown, preparation and other moves unchanged',async()=>{
 const basic=(await load('selachombre-morsure-ecume.capture-skill-transfer-v1')).draft.definition;
 const another=(await load('selachombre-aileron-fantome.capture-skill-transfer-v1')).draft.definition;
 assert.equal(basic.travelMs,900);assert.equal(basic.preparationMs,700);
 assert.equal(basic.cooldownMs,10000);assert.equal(another.travelMs,250);
 assert.equal(effectiveApproachTimingMs({baseMs:basic.travelMs,approachMode:'ground',permanentPct:-12}),792);
 assert.equal(792/264,3);
});
test('Bestiary uses one native prose generator and each skill shows Combo spirituel name',()=>{
 const names=Object.fromEntries(skills[0].definition.effects.filter(x=>x.kind==='apply_marker').map(x=>[x.marker.id,x.marker.name]));
 for(const sk of skills){
  const prose=describeCaptureSkillV1(sk.definition,{markerNames:names}).sentences.join(' ');
  if(sk.requiredLevel!==1){
   assert.match(prose,/Combo spirituel/);
   assert.doesNotMatch(prose,/vyrame-combo/);
  }
 }
});
test('Vyrâme registered once in the one official creature and skill Showcase catalogs',async()=>{
 const c=await read('src/catalogs/capture-showcase-creature-presets-v1.js');
 const s=await read('src/catalogs/capture-showcase-skill-presets-v1.js');
 assert.equal(c.split('crea_vyrame.capture-creature-transfer-v1.json').length-1,1);
 for(const id of ids)assert.equal(s.split(id+'.capture-skill-transfer-v1.json').length-1,1);
});
