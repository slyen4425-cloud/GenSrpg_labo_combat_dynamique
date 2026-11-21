import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCaptureEncounterCombatSourceV1} from '../../src/ui/capture-encounter-combat-source-v1.js';
import {normalizeCaptureNpcOpponentInstanceV1,
 applyCaptureNpcOpponentSkillSelectionV1} from '../../src/adapters/input/capture/capture-npc-opponent-instance-v1.js';
const skill=id=>({
 schema:'capture-skill-editor-draft-v1',id,description:id,requiredLevel:1,
 usageScopes:['capture','combat'],
 definition:{id,name:id,category:'offensive',form:'projectile',
 element:'fire',approachMode:'none',energyCost:1,preparationMs:100,
 travelMs:0,recoveryMs:0,cooldownMs:0,allowedDistances:['short','medium','long'],
 targetRelations:['enemy'],effect:{damage:10,tags:['fire']}},
 presentation:null
});
const record=id=>{
 const ids=['slash','firebolt'];
 return Object.freeze({
  draft:{schema:'capture-creature-editor-draft-v3',id,displayName:id,description:id,
   level:1,sourceStats:{force:0,agility:0,intelligence:0,spirit:0,endurance:0,initiative:0},
   elements:[],resistances:[],capture:{capturable:true,captureRate:10,spawnChance:10,spawnTags:[],evolution:null},
   combat:{maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,energyChargeAmount:1,
    energyChargeIntervalMs:2000,movementEnergyPerStep:1,chargeTimeModifierPct:0},
   skillIds:ids,presentation:null},
  statValues:{schema:'capture-creature-stat-values-v1',creatureId:id,
   values:{health:100,fire:10}},
  loadout:{schema:'capture-active-skill-loadout-v1',creatureId:id,
   slots:[{id:'slot-1',skillId:'slash'},{id:'slot-2',skillId:'firebolt'},
    {id:'slot-3',skillId:null},{id:'slot-4',skillId:null}]}
 });
};
const registry={schema:'capture-stat-registry-v1',stats:[
 {id:'health',label:'PV',maxHpPerPoint:1},
 {id:'fire',label:'Feu',damageChannel:'fire',resistanceChannel:'fire',
  damagePctPerPoint:2,resistancePctPerPoint:1}
]};
const combatRules={schema:'capture-combat-rules-editor-draft-v1',
 maxEnergy:10,initialEnergy:10,energyChargeAmount:1,energyChargeIntervalMs:2000,
 movementEnergyPerStep:1,chargeTimeModifierPct:0};
function opts(){
 return {configuredCreatures:new Map([['hero',record('hero')],['wolf',record('wolf')]]),
  configuredSkills:new Map([['slash',skill('slash')],['firebolt',skill('firebolt')]]),
  arenaId:'forest',combatRules,statRegistry:registry};
}
const npc=(overrides={})=>({schema:'capture-npc-opponent-instance-v1',...overrides});
test('PNJ : schéma strict, pas de stats parallèles ni de duplication',()=>{
 const n=normalizeCaptureNpcOpponentInstanceV1(npc({displayName:'Gardien',
  statAllocations:{health:15,fire:2},skillIds:['slash']}));
 assert.equal(n.displayName,'Gardien');
 assert.equal(n.statAllocations.health,15);
 assert.deepEqual(n.skillIds,['slash']);
 assert.ok(Object.isFrozen(n.statAllocations));
 for(const bad of [{extra:true},{statAllocations:{health:-1}},
  {statAllocations:{unknown:Infinity}},{skillIds:['slash','slash']},
  {skillIds:[]}]){
  assert.throws(()=>normalizeCaptureNpcOpponentInstanceV1(npc(bad)));
 }
});
test('les points de stats propres au Loup PNJ agissent en vrai combat, sans toucher au Bestiaire',()=>{
 const x=opts();const original=x.configuredCreatures.get('wolf');
 const plain=buildCaptureEncounterCombatSourceV1({...x,
  local:{speciesId:'hero',level:1},opponent:{speciesId:'wolf',level:1}});
 const custom=buildCaptureEncounterCombatSourceV1({...x,
  local:{speciesId:'hero',level:1},opponent:{speciesId:'wolf',level:1,
   npcInstance:npc({statAllocations:{health:50,fire:5}})}});
 assert.equal(plain.fighters.find(f=>f.id==='opponent-1').maxHp,100);
 assert.equal(custom.fighters.find(f=>f.id==='opponent-1').maxHp,150);
 assert.equal(custom.fighters.find(f=>f.id==='opponent-1').damagePctByChannel.fire,30);
 assert.equal(custom.fighters.find(f=>f.id==='local-1').maxHp,100);
 assert.equal(x.configuredCreatures.get('wolf'),original);
 assert.equal(original.statValues.values.health,100);
});
test('même espèce des deux côtés : seul le PNJ reçoit ses bonus',()=>{
 const x=opts();
 const s=buildCaptureEncounterCombatSourceV1({...x,
  local:{speciesId:'wolf',level:1,statAllocations:{health:7}},
  opponent:{speciesId:'wolf',level:1,
   npcInstance:npc({statAllocations:{health:30}})}});
 assert.equal(s.fighters.find(f=>f.id==='local-1').maxHp,107);
 assert.equal(s.fighters.find(f=>f.id==='opponent-1').maxHp,130);
});
test('compétences : le joueur peut choisir seulement parmi celles réellement débloquées',()=>{
 const x=opts();
 const s=buildCaptureEncounterCombatSourceV1({...x,
  local:{speciesId:'hero',level:1},
  opponent:{speciesId:'wolf',level:1,npcInstance:npc({skillIds:['slash']})}});
 const id=s.battleFormat.teams['enemy-team'][0];
 assert.deepEqual(s.skillIdsByActor[id],['slash']);
 const broken=()=>buildCaptureEncounterCombatSourceV1({...x,
  local:{speciesId:'hero',level:1},
  opponent:{speciesId:'wolf',level:1,npcInstance:npc({skillIds:['not-unlocked']})}});
 assert.throws(broken,/débloquées/);
});
test('nom custom du PNJ suit la bonne instance de combattant et pas l espèce',()=>{
 const x=opts();
 const result=buildCaptureEncounterCombatSourceV1({...x,
  local:{speciesId:'hero',level:1},
  opponent:{speciesId:'wolf',level:3,npcInstance:npc({displayName:'Gardien nocturne'})}
 });
 const enemyId=result.battleFormat.teams['enemy-team'][0];
 const member=result.roster.teams[enemyId].activeMemberId;
 assert.equal(result.displayNamesByRosterMember[enemyId][member],'Gardien nocturne');
 const legacy=buildCaptureEncounterCombatSourceV1({...x,
  local:{speciesId:'hero',level:1},opponent:{speciesId:'wolf',level:1}
 });
 assert.equal('displayNamesByRosterMember' in legacy,false);
});
test('les allocations ennemies directes historiques restent rejetées : contrat explicite requis',()=>{
 const x=opts();
 assert.throws(()=>buildCaptureEncounterCombatSourceV1({...x,
  local:{speciesId:'hero',level:1},
  opponent:{speciesId:'wolf',level:1,statAllocations:{health:50}}}),/instance contract/);
});
