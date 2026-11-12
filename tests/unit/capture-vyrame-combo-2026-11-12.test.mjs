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
});
test('Vyrâme: five new skills at levels 1/5/10/15/20 and four conditional self-combo consumers',()=>{
 assert.deepEqual(skills.map(x=>x.requiredLevel),[1,5,10,15,20]);
 assert.equal(skills[0].definition.effects[1].targetScope,'self');
 assert.equal(skills[0].definition.effects[1].marker.maxStacks,3);
 assert.equal(skills[0].definition.effects[1].marker.polarity,'beneficial');
 assert.equal(skills[3].definition.targetRelations.includes('self'),true);
 assert.equal(skills[4].definition.maxUsesPerCombat,1);
 for(const draft of skills.slice(1)){
  const effects=draft.definition.effects,consume=effects.find(x=>x.kind==='consume_marker');
  assert.ok(effects.some(x=>x.kind!=='consume_marker'),'base effect must work independently');
  assert.equal(consume.targetScope,'self');
  assert.equal(consume.markerId,'vyrame-combo');
  assert.equal(consume.minimum,3);assert.equal(consume.count,3);
  assert.ok(consume.effects.length>=1);
  assert.ok(consume.effects.every(x=>x.targetScope==='self'),'nested bonuses cannot accidentally target actor instead of original enemy');
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
test('Combo: other skills keep base effect with fewer than three stacks; all 4 consume exactly 3 and deliver their bonus',()=>{
 for(const draft of skills.slice(1)){
  let s=state();
  s=apply(s,skills[0].definition,1000);
  s=apply(s,skills[0].definition,2000);
  const before=s.fighters.enemy.hp;
  const actorHp=s.fighters.vyrame.hp;
  const actorEnergy=s.fighters.vyrame.energy;
  s=apply(s,draft.definition,3000);
  assert.equal(stacks(s),2,draft.id+' must NOT consume below threshold');
  if(draft.definition.effects.some(e=>e.kind==='damage'))assert.ok(s.fighters.enemy.hp<before,draft.id+' has unconditional damage');
  if(draft.id==='vyrame-crocs-du-voile'||draft.id==='vyrame-carapace-des-ames'||draft.id==='vyrame-deferlante-spectrale')
   assert.equal(s.fighters.vyrame.hp,actorHp,draft.id+' has no premature healing');
  if(draft.id==='vyrame-rugissement-des-limbes')assert.equal(s.fighters.vyrame.energy,actorEnergy);
  s=apply(s,skills[0].definition,4000);
  assert.equal(stacks(s),3);
  const hpBefore=s.fighters.vyrame.hp,energyBefore=s.fighters.vyrame.energy;
  s=apply(s,draft.definition,5000);
  assert.equal(stacks(s),0,draft.id+' consumes all three exactly once');
  if(draft.id==='vyrame-crocs-du-voile')assert.equal(s.fighters.vyrame.hp,hpBefore+20);
  if(draft.id==='vyrame-rugissement-des-limbes')assert.equal(s.fighters.vyrame.energy,energyBefore+4);
  if(draft.id==='vyrame-carapace-des-ames')assert.equal(s.fighters.vyrame.hp,hpBefore+30);
  if(draft.id==='vyrame-deferlante-spectrale'){
   assert.equal(s.fighters.vyrame.hp,hpBefore+25);
   assert.ok(s.fighters.vyrame.statusEffects.some(x=>x.definition.id==='vyrame-deferlante-surcharge'));
  }
 }
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
