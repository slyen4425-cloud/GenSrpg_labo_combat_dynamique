import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as presets} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {applyStatusEffectV1} from "../../src/core/combat/status-effect-runtime-v1.js";
import {computeCombatDamageV1} from "../../src/core/combat/combat-damage-v1.js";
import {projectStatusEffectInfoV1,statusEffectInfoTextV1} from "../../src/adapters/renderer/status-effect-info-v1.js";
import {createDomStatusFxRenderer} from "../../src/adapters/renderer/dom-status-fx.js";

const sources=[
 {path:"data/capture/showcase/lib_heat_wave.capture-skill-transfer-v1.json",bytes:3025,sha256:"322ff8b9ef8cf05b3f9c8bbd2d5fb4bea45bed24024280c24105ae3b643cb5c2",id:"lib_heat_wave"},
 {path:"data/capture/showcase/cap_fire_special_2.capture-skill-transfer-v1.json",bytes:3733,sha256:"8a312cd22d29bbd02c1731ad597532bcadb644fcf7225a35a45fd2c1a8f162f0",id:"cap_fire_special_2"}
];
const read=p=>readFileSync(new URL("../../"+p,import.meta.url));
const imported=path=>importCaptureTransferJsonV1(read(path).toString("utf8")).value.draft;
const burn=()=>imported(sources[1].path);
const fighter=id=>({id,maxHp:100,initialHp:100,maxEnergy:100,initialEnergy:100});
function buffed(){
 let state=createCombatState({fighters:[fighter("player"),fighter("enemy")]});
 state=applyStatusEffectV1({state,targetActorId:"player",sourceActorId:"player",
  sourceSkillId:"cap_fire_special_2",status:burn().definition.effects[0].status});
 return state;
}
function fakeDocument(){
 const document={createElement(){
  return {className:"",dataset:{},style:{},textContent:"",title:"",hidden:false,children:[],
   ownerDocument:document,append(...xs){this.children.push(...xs);},
   remove(){this.removed=true;},setAttribute(k,v){this.attributes??={};this.attributes[k]=String(v);}};
 }};
 return document;
}

test("the two uploaded skill transfers are byte-exact, importable and uniquely active",()=>{
 for(const item of sources){
  const bytes=read(item.path);
  assert.equal(bytes.length,item.bytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"),item.sha256);
  assert.equal(presets.filter(path=>path===item.path).length,1);
  const skill=importCaptureTransferJsonV1(bytes.toString("utf8"));
  assert.equal(skill.kind,"skill");
  assert.equal(skill.value.draft.id,item.id);
  const roundtrip=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(skill.value.draft));
  assert.deepEqual(roundtrip.value,skill.value);
 }
 assert.equal(presets.length,36);
 assert.equal(new Set(presets).size,presets.length);
 const fire=burn();
 assert.equal(fire.definition.name,"Surchauffe");
 assert.equal(fire.definition.effects[0].status.kind,"outgoing_damage_modifier");
 assert.equal(fire.definition.effects[0].status.modifierPct,50);
 assert.equal(fire.definition.effects[0].status.durationMs,20000);
});

test("Surchauffe's +50 percent outgoing buff displays exact amount, name and combat-clock duration",()=>{
 const state=buffed();
 const actual=state.fighters.player.statusEffects[0];
 const info=projectStatusEffectInfoV1({
   instance:actual,elapsedMs:5000,sourceSkill:burn().definition,fighter:state.fighters.player
 });
 assert.equal(info.statusName,"Dégâts infligés");
 assert.equal(info.sourceSkillName,"Surchauffe");
 assert.equal(info.typeLabel,"Buff");
 assert.equal(info.remainingLabel,"15 s");
 assert.deepEqual(info.effectLines,["Dégâts infligés (tous types) augmentés de 50 %"]);
 assert.match(statusEffectInfoTextV1(info),/Surchauffe/);
 assert.match(statusEffectInfoTextV1(info),/augmentés de 50 %/);
 for(const channel of ["fire","physical","creator-new-element"]){
  const result=computeCombatDamageV1({state,attackerId:"player",targetId:"enemy",baseDamage:20,channel});
  assert.equal(result.damage,30);
  assert.equal(result.resistancePct,0);
 }
 const after=projectStatusEffectInfoV1({instance:actual,elapsedMs:20000,sourceSkill:burn().definition});
 assert.equal(after.remainingLabel,"0 s");
});

test("generic outgoing debuffs and stacks communicate their exact signed effect without hardcoded ability names",()=>{
 const instance={
  ...buffed().fighters.player.statusEffects[0],
  stacks:2,
  definition:{
   ...burn().definition.effects[0].status,
   polarity:"detrimental",
   stacking:"stack",
   maxStacks:3,
   modifierPct:-30
  }
 };
 const info=projectStatusEffectInfoV1({instance,elapsedMs:2000,sourceSkill:{name:"Malédiction"}});
 assert.equal(info.sourceSkillName,"Malédiction");
 assert.equal(info.stacksLabel,"2 / 3");
 assert.deepEqual(info.effectLines,["Dégâts infligés (tous types) réduits de 60 %"]);
 const neutral=projectStatusEffectInfoV1({instance:{...instance,stacks:1,definition:{...instance.definition,modifierPct:0}}});
 assert.deepEqual(neutral.effectLines,["Dégâts infligés (tous types) inchangés"]);
});

test("stat-based Puissance bonus is described by the same canonical status projector",()=>{
 const origin=buffed().fighters.player.statusEffects[0];
 const instance={...origin,definition:{
  ...origin.definition,id:"power-buff",kind:"stat_modifier",statId:"power",modifierMode:"points",deltaPoints:20
 }};
 const fighter={statValuesById:{power:0},
  statEffectRulesById:{power:{damageChannel:null,resistanceChannel:null,damagePctPerPoint:0,
   resistancePctPerPoint:0,chargeTimeReductionPctPerPoint:0,outgoingDamagePctPerPoint:1}},
  statusEffects:[instance]};
 const info=projectStatusEffectInfoV1({instance,elapsedMs:1000,fighter});
 assert.deepEqual(info.effectLines,["Dégâts infligés (tous types) augmentés de 20 %"]);
});

test("real HUD card shows +50% outgoing on player side, independent of enemy status, in 1v1 and 2v2",()=>{
 for(const actorIds of [["player","enemy"],["player","ally","enemy","enemy2"]]){
  const doc=fakeDocument();
  const targets=Object.fromEntries(actorIds.map(id=>{
   const motion=doc.createElement(),image=doc.createElement(),statusHost=doc.createElement();
   image.src="https://example.test/creature.webp";
   return [id,{motion,image,statusHost}];
  }));
  const renderer=createDomStatusFxRenderer({
   targetFor:id=>targets[id],
   statusPresentationFor:()=>null,
   skillPresentationFor:()=>null,
   skillDefinitionFor:id=>id==="cap_fire_special_2"?burn().definition:null
  });
  const active=buffed().fighters.player;
  const fighters=Object.fromEntries(actorIds.map(id=>[id,{statusEffects:[] }]));
  fighters.player=active;
  renderer.sync({elapsedMs:5000,fighters});
  const icon=targets.player.statusHost.children[0];
  assert.ok(icon);
  icon.onclick({stopPropagation(){}});
  const detail=icon.children.find(x=>x.dataset.statusFx==="hud-details");
  assert.equal(detail.hidden,false);
  assert.match(detail.textContent,/Surchauffe/);
  assert.match(detail.textContent,/augmentés de 50 %/);
  assert.match(detail.textContent,/15 s/);
  renderer.dispose();
 }
});
