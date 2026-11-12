import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCaptureEncounterCombatSourceV1} from '../../src/ui/capture-encounter-combat-source-v1.js';
import {createEmbeddedCombatLifecycleV1} from '../../src/ui/embedded-combat-lifecycle-v1.js';
import {createCaptureCombatRosterControllerV1} from '../../src/ui/capture-combat-roster-controller-v1.js';

const record=(id)=>({
 draft:{schema:'capture-creature-editor-draft-v3',id,displayName:id,description:'Test creature',level:1,
 sourceStats:{force:0,agility:0,intelligence:0,spirit:0,endurance:0,initiative:0},
 elements:[],resistances:[],capture:{capturable:true,captureRate:50,spawnChance:10,spawnTags:[],evolution:null},
 combat:{maxHp:100,maxEnergy:10,initialEnergy:10},skillIds:['basic'],presentation:null},
 loadout:{schema:'capture-active-skill-loadout-v1',creatureId:id,
 slots:[{id:'slot-1',skillId:'basic'},{id:'slot-2',skillId:null},
 {id:'slot-3',skillId:null},{id:'slot-4',skillId:null},{id:'slot-ultimate',skillId:null}]},
 statValues:{schema:'capture-creature-stat-values-v1',creatureId:id,values:{health:100}}
});
const skill={schema:'capture-skill-editor-draft-v1',id:'basic',description:'Test skill',requiredLevel:1,
 usageScopes:['capture','combat'],definition:{id:'basic',name:'Basic',category:'offensive',form:'projectile',
 element:null,approachMode:'none',energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
 allowedDistances:['short','medium','long'],targetRelations:['enemy'],
 effect:{damage:10,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}},presentation:null};
const rules={schema:'capture-combat-rules-editor-draft-v1',
 maxEnergy:10,initialEnergy:10,energyChargeAmount:0,energyChargeIntervalMs:1000,
 movementEnergyPerStep:0,chargeTimeModifierPct:0};
const registry={schema:'capture-stat-registry-v1',stats:[{id:'health',label:'PV',maxHpPerPoint:1}]};
const x={configuredCreatures:new Map([['a',record('a')],['b',record('b')],['enemy',record('enemy')]]),
 configuredSkills:new Map([['basic',skill]]),arenaId:'forest',combatRules:rules,statRegistry:registry};
const team=()=>buildCaptureEncounterCombatSourceV1({...x,
 local:{instanceId:'owned-1',speciesId:'a',level:1,hp:60,statAllocations:{health:20}},
 localReserve:[
  {instanceId:'owned-2',speciesId:'b',level:2,hp:11},
  {instanceId:'owned-3',speciesId:'a',level:3,hp:0,statAllocations:{health:40}}
 ],
 opponent:{speciesId:'enemy',level:1},hpMultiplier:0.25
});
test('a real wild battle passes the full saved party through the single native Combat roster',()=>{
 const source=team();
 assert.equal(source.battleFormat.actors.length,2,'wild encounter remains native 1v1');
 const members=source.roster.teams['local-1'].members;
 assert.equal(members.length,3);
 assert.deepEqual(Object.values(source.localInstanceIdsByMemberId),['owned-1','owned-2','owned-3']);
 assert.deepEqual(members.map(m=>m.creatureId),['a','b','a'],'duplicate species are independent instances');
 assert.equal(source.fighters.find(f=>f.id==='local-1').maxHp,30,'instance health then 25%');
 assert.equal(source.fighters.find(f=>f.id==='local-1').initialHp,30,'saved HP clamped to battle maximum');
 assert.deepEqual(members.map(m=>source.fighterConfigs[m.fighterConfigId].initialHp),[30,11,0]);
 assert.deepEqual(members.map(m=>source.fighterConfigs[m.fighterConfigId].maxHp),[30,25,35]);
 assert.equal(source.fighters.find(f=>f.id==='opponent-1').maxHp,25,'wild enemy uses author stats');
 assert.equal(x.configuredCreatures.get('a').draft.combat.maxHp,100,'never rewrite author');
});
test('missing or duplicate instance identity and over-sized roster fail closed',()=>{
 const base={...x,local:{instanceId:'owned-1',speciesId:'a',level:1},
  opponent:{speciesId:'enemy',level:1}};
 assert.throws(()=>buildCaptureEncounterCombatSourceV1({...base,
  localReserve:[{instanceId:'owned-1',speciesId:'b',level:1}]}),/duplicate/i);
 assert.throws(()=>buildCaptureEncounterCombatSourceV1({...base,
  localReserve:Array.from({length:6},(_,i)=>({instanceId:'i'+i,speciesId:'b',level:1}))}),/1.to.6|6|reserve/i);
 assert.throws(()=>buildCaptureEncounterCombatSourceV1({...base,
  localReserve:[{instanceId:'ko',speciesId:'bad',level:1}]}),/missing|absent|introuvable|Unknown/i);
});
test('personal reserved skill sets reach the only native roster UI controller',()=>{
 const source=team();
 const members=source.roster.teams['local-1'].members;
 assert.equal(Object.keys(source.skillIdsByRosterMember['local-1']).length,members.length);
 for(const member of members)
  assert.ok(Array.isArray(source.skillIdsByRosterMember['local-1'][member.id]));
 const ui=readFileSync(new URL('../../src/ui/combat-2v2-test-ui.js',import.meta.url),'utf8');
 assert.match(ui,/skillIdsByRosterMember: input\.skillIdsByRosterMember/);
 assert.match(ui,/skillIdsByCreature, skillIdsByRosterMember, visuals/);
});
test('embedded Combat native team defeat waits for the last real reserve, not first active KO',async()=>{
 const source=team();
 const life=createEmbeddedCombatLifecycleV1({format:source.battleFormat});
 const snapshot=(localHp,enemyHp,memberHps)=>({
  fighters:{'local-1':{hp:localHp,maxHp:30},'opponent-1':{hp:enemyHp,maxHp:25}},
  roster:{'local-1':{members:memberHps.map((hp,i)=>({id:'local-member-'+(i+1),hp}))},
   'opponent-1':{members:[{id:'opponent-member-1',hp:enemyHp}]}}
 });
 const alive=snapshot(0,22,[0,11,0]);
 assert.equal(life.observe(alive,alive.roster),false,'remaining reserve prevents game over');
 const done=snapshot(0,22,[0,0,0]);
 assert.equal(life.observe(done,done.roster),true);
 const result=await life.completion;
 assert.equal(result.outcome,'defeat');
 assert.deepEqual(result.roster,done.roster,'native party KO state remains available for owner save');
});

test('an authored trainer reserve uses each creature level and the native team victory rule',async()=>{
 const advanced={...skill,id:'advanced',requiredLevel:10,
  definition:{...skill.definition,id:'advanced',name:'Advanced'}};
 const enemy=record('enemy');
 enemy.draft.skillIds.push(advanced.id);
 enemy.loadout.slots[1].skillId=advanced.id;
 const source=buildCaptureEncounterCombatSourceV1({...x,
  configuredCreatures:new Map([...x.configuredCreatures,['enemy',enemy]]),
  configuredSkills:new Map([...x.configuredSkills,[advanced.id,advanced]]),
  progressionRules:JSON.parse(readFileSync(new URL('../../data/capture/monster-capture-progression-rules.v1.json',import.meta.url),'utf8')),
  local:{instanceId:'owned-1',speciesId:'a',level:1},
  opponent:{speciesId:'enemy',level:2},
  opponentReserve:[{speciesId:'enemy',level:17},{speciesId:'b',level:5}]
 });
 const rival=source.roster.teams['opponent-1'].members;
 assert.deepEqual(rival.map(member=>member.creatureId),['enemy','enemy','b']);
 assert.deepEqual(rival.map(member=>source.displayLevelsByRosterMember['opponent-1'][member.id]),[2,17,5]);
 const skills=source.skillIdsByRosterMember['opponent-1'];
 assert.deepEqual(source.skillIdsByActor['opponent-1'],['basic']);
 assert.deepEqual(skills[rival[0].id],['basic']);
 assert.deepEqual(skills[rival[1].id],['basic','advanced']);
 assert.ok(source.skills.advanced,'the native runtime can activate the reserve skill');

 const life=createEmbeddedCombatLifecycleV1({format:source.battleFormat});
 const battle={fighters:Object.fromEntries(source.fighters.map(fighter=>[fighter.id,{
  hp:fighter.id==='local-1'?fighter.maxHp:0,maxHp:fighter.maxHp
 }]))};
 const roster={
  'local-1':{members:source.roster.teams['local-1'].members.map(member=>({id:member.id,hp:100}))},
  'opponent-1':{members:rival.map((member,index)=>({id:member.id,hp:index===1?1:0}))}
 };
 assert.equal(life.observe(battle,roster),false);
 roster['opponent-1'].members[1].hp=0;
 assert.equal(life.observe(battle,roster),true);
 assert.equal((await life.completion).outcome,'victory');
});
