import test from 'node:test';
import assert from 'node:assert/strict';
import {projectCaptureEncounterOwnedStatsV1} from '../../src/adapters/input/capture/capture-encounter-owned-stats-v1.js';
import {buildCaptureEncounterCombatSourceV1} from '../../src/ui/capture-encounter-combat-source-v1.js';

const creature=(id,level)=>({
 schema:'capture-creature-editor-draft-v3',id,displayName:id,description:id,level,
 sourceStats:{force:0,agility:0,intelligence:0,spirit:0,endurance:0,initiative:0},
 elements:[],resistances:[],
 capture:{capturable:true,captureRate:10,spawnChance:10,spawnTags:[],evolution:null},
 combat:{maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,
  energyChargeAmount:1,energyChargeIntervalMs:2000,movementEnergyPerStep:1,
  chargeTimeModifierPct:0},
 skillIds:['stat-bolt'],presentation:null
});
const skill={
 schema:'capture-skill-editor-draft-v1',id:'stat-bolt',description:'Element',
 requiredLevel:1,usageScopes:['capture','combat'],
 definition:{id:'stat-bolt',name:'Stat bolt',category:'offensive',form:'projectile',
  element:'fire',approachMode:'none',energyCost:1,preparationMs:1000,
  travelMs:0,recoveryMs:0,cooldownMs:0,
  allowedDistances:['short','medium','long'],targetRelations:['enemy'],
  effect:{damage:20,tags:['fire']}},
 presentation:null
};
const loadout=id=>({schema:'capture-active-skill-loadout-v1',creatureId:id,
 slots:[{id:'slot-1',skillId:'stat-bolt'},
  {id:'slot-2',skillId:null},{id:'slot-3',skillId:null},{id:'slot-4',skillId:null}]
});
const registry={schema:'capture-stat-registry-v1',stats:[
 {id:'health',label:'PV',maxHpPerPoint:1},
 {id:'fire',label:'Feu',damageChannel:'fire',resistanceChannel:'fire',
  damagePctPerPoint:2,resistancePctPerPoint:1},
 {id:'focus',label:'Concentration',outgoingDamagePctPerPoint:1.5}
]};
const record=(id,health=100)=>Object.freeze({
 draft:Object.freeze(creature(id,1)),
 loadout:Object.freeze(loadout(id)),
 statValues:Object.freeze({schema:'capture-creature-stat-values-v1',creatureId:id,
  values:Object.freeze({health,fire:10,focus:0})})
});
const combatRules={schema:'capture-combat-rules-editor-draft-v1',
 maxEnergy:10,initialEnergy:10,energyChargeAmount:1,energyChargeIntervalMs:2000,
 movementEnergyPerStep:1,chargeTimeModifierPct:0};
function options(sameSpecies=false){
 const config=new Map([['local',record('local')],['enemy',record('enemy',60)]]);
 return {configuredCreatures:config,configuredSkills:new Map([['stat-bolt',skill]]),
  arenaId:'forest',combatRules,statRegistry:registry};
}
test('RED: official registry alone augments owned creature instance values without mutating author data',()=>{
 const optionsBefore=options();
 const before=optionsBefore.configuredCreatures.get('local');
 const projected=projectCaptureEncounterOwnedStatsV1({
  configuredCreatures:optionsBefore.configuredCreatures,
  statRegistry:registry,speciesId:'local',
  statAllocations:{health:20,fire:5,focus:2}
 });
 assert.notEqual(projected,optionsBefore.configuredCreatures);
 assert.equal(projected.get('local').statValues.values.health,120);
 assert.equal(projected.get('local').statValues.values.fire,15);
 assert.equal(projected.get('local').statValues.values.focus,2);
 assert.equal(projected.get('enemy'),optionsBefore.configuredCreatures.get('enemy'));
 assert.equal(before.statValues.values.health,100);
 assert.equal(before.statValues.values.fire,10);
});
test('RED: Combat native fighter gets health, elemental and custom effects, plus 25% only AFTER stats',()=>{
 const x=options();
 const source=buildCaptureEncounterCombatSourceV1({
  ...x,local:{speciesId:'local',level:2,statAllocations:{health:20,fire:5,focus:2}},
  opponent:{speciesId:'enemy',level:1},hpMultiplier:0.25
 });
 const player=source.fighters.find(f=>f.id==='local-1');
 const enemy=source.fighters.find(f=>f.id==='opponent-1');
 assert.equal(player.maxHp,30,'100 authored +20 instance health, then ×.25');
 assert.equal(enemy.maxHp,15,'enemy retains authored 60 health, then ×.25');
 assert.equal(player.damagePctByChannel.fire,30,'2 percent per fire point × 15');
 assert.equal(player.outgoingDamagePct,3,'custom registry effect × 2');
 assert.equal(enemy.damagePctByChannel.fire,20,'enemy authored fire stat remains 10');
 assert.equal(x.configuredCreatures.get('local').statValues.values.health,100);
 assert.equal(x.configuredCreatures.get('enemy').statValues.values.health,60);
 assert.equal(source.exported.creatures.find(v=>v.id==='local').combat.statValuesById.health,120);
});
test('RED: same-species opponent stays unbuffed despite identical species ID and different level',()=>{
 const x=options();x.configuredCreatures.delete('enemy');
 const source=buildCaptureEncounterCombatSourceV1({
  ...x,local:{speciesId:'local',level:2,statAllocations:{health:20,fire:5}},
  opponent:{speciesId:'local',level:1},hpMultiplier:0.25
 });
 const player=source.fighters.find(f=>f.id==='local-1');
 const enemy=source.fighters.find(f=>f.id==='opponent-1');
 assert.equal(player.maxHp,30);
 assert.equal(enemy.maxHp,25,'enemy same species does not inherit instance wallet');
 assert.equal(enemy.damagePctByChannel.fire,20);
 assert.equal(player.damagePctByChannel.fire,30);
 assert.equal(source.fighterConfigs['roster/opponent-1/opponent-member-1'].maxHp,25);
});
test('same-species same-level wild opponent also never inherits player instance bonuses',()=>{
 const x=options();x.configuredCreatures.delete('enemy');
 const source=buildCaptureEncounterCombatSourceV1({
  ...x,local:{speciesId:'local',level:1,statAllocations:{health:20,focus:2}},
  opponent:{speciesId:'local',level:1},hpMultiplier:0.25
 });
 const player=source.fighters.find(f=>f.id==='local-1');
 const enemy=source.fighters.find(f=>f.id==='opponent-1');
 assert.equal(player.maxHp,30);
 assert.equal(enemy.maxHp,25);
 assert.equal(player.outgoingDamagePct,3);
 assert.ok(!enemy.outgoingDamagePct,'no per-instance stat effect on wild opponent');
});
test('RED: invalid allocations and missing official registry fail without partial mutation',()=>{
 const x=options(),before=x.configuredCreatures.get('local');
 for(const bad of [{ghost:1},{ghost:0},{fire:-1},{fire:1.5},{health:Infinity},
  {fire:'2'},Object.assign(Object.create(null),{fire:3})]){
  assert.throws(()=>projectCaptureEncounterOwnedStatsV1({
    configuredCreatures:x.configuredCreatures,statRegistry:registry,
    speciesId:'local',statAllocations:bad
  }),/stat|allocat|points|registry|object|integer/i);
 }
 assert.throws(()=>buildCaptureEncounterCombatSourceV1({
  ...x,statRegistry:null,local:{speciesId:'local',level:2,statAllocations:{health:5}},
  opponent:{speciesId:'enemy',level:1}
 }),/registry/i);
 assert.equal(x.configuredCreatures.get('local'),before);
});
test('RED: historical Tester and Adventure without wallet preserve previous authoritative behavior',()=>{
 const x=options();
 const plain=buildCaptureEncounterCombatSourceV1({
  ...x,local:{speciesId:'local',level:1},opponent:{speciesId:'enemy',level:1}
 });
 const empty=buildCaptureEncounterCombatSourceV1({
  ...x,local:{speciesId:'local',level:1,statAllocations:{}},
  opponent:{speciesId:'enemy',level:1}
 });
 assert.equal(plain.fighters.find(f=>f.id==='local-1').maxHp,100);
 assert.equal(empty.fighters.find(f=>f.id==='local-1').maxHp,100);
 assert.equal(plain.fighters.find(f=>f.id==='opponent-1').maxHp,60);
});

test('official wild level 10 gets 180 auto-distributed points while level 1 stays authored',()=>{
 const x=options();
 const base=buildCaptureEncounterCombatSourceV1({...x,local:{speciesId:'local',level:1},
  opponent:{speciesId:'enemy',level:1},wildStatProfile:{}});
 const high=buildCaptureEncounterCombatSourceV1({...x,local:{speciesId:'local',level:1},
  opponent:{speciesId:'enemy',level:10},wildStatProfile:{}});
 const normal=base.fighters.find(f=>f.id==='opponent-1');
 const wild=high.fighters.find(f=>f.id==='opponent-1');
 assert.equal(normal.maxHp,60);
 assert.ok(wild.maxHp>normal.maxHp,'NPC health must increase with level');
 assert.ok(wild.damagePctByChannel.fire>normal.damagePctByChannel.fire,'authored fire ability must specialize the NPC');
 assert.equal(high.fighters.find(f=>f.id==='local-1').maxHp,100,'player must not inherit wild points');
 assert.equal(x.configuredCreatures.get('enemy').statValues.values.health,60,'author stays unchanged');
});
test('editable NPC profile is applied in actual Combat and keeps mirror opponents independent',()=>{
 const x=options();x.configuredCreatures.delete('enemy');
 const base=buildCaptureEncounterCombatSourceV1({...x,
  local:{speciesId:'local',level:10,statAllocations:{health:7}},opponent:{speciesId:'local',level:10},
  wildStatProfile:{pointsPerLevel:20,healthMinimumPct:25,defenseMinimumPct:15,speedMinimumPct:15,specialtyMultiplier:2}});
 const local=base.fighters.find(f=>f.id==='local-1');
 const enemy=base.fighters.find(f=>f.id==='opponent-1');
 assert.equal(local.maxHp,107,'local only receives its own points');
 assert.ok(enemy.maxHp>local.maxHp,'wild mirror receives its own derived points');
 assert.equal(x.configuredCreatures.get('local').statValues.values.health,100);
});
