import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {planSkillOutcomeFx} from "../../src/core/fx/skill-fx-plan.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";

const ids=["ephemus-lanterne-ames","ephemus-danse-mille-ames","ephemus-chrysalide-fantome"];
const loads=Object.fromEntries(ids.map(id=>[id,normalizeCaptureSkillTransferV1(
  JSON.parse(readFileSync(new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),"utf8"))
).draft]));
const lane=loads["ephemus-lanterne-ames"];
const dance=loads["ephemus-danse-mille-ames"];
const chrysalide=loads["ephemus-chrysalide-fantome"];
const present=createCaptureSkillPresentationAssetsV2({
  skillPresentations:Object.fromEntries(ids.map(id=>[id,loads[id].presentation])),
  assetForId(id){return {assetId:id,url:"https://assets.invalid/"+id+".webp",frameCount:16,frameMs:100,displayScale:1}}
});

test("Éphémus: true Lanterne persistent zones use the existing aura slot, not impact-only FX",()=>{
  assert.equal(lane.definition.form,"area");
  assert.equal(lane.definition.effects.filter(x=>x.kind==="persistent_zone").length,2);
  assert.equal(lane.presentation.visual.aura?.assetId,"pack:capture:sprite-skill-ephemus-lanterne-ames-v1");
  const visual=present.presentationForSkill(lane.id,{sourceView:"ephemus",fxType:"persistent-zone"});
  assert.equal(visual.persistentZone?.assetId,"pack:capture:sprite-skill-ephemus-lanterne-ames-v1");
});

test("Éphémus: ultimate uses native held cast and native-tick impact, without becoming a fake ground zone",()=>{
  assert.equal(dance.definition.channeling.maxDurationMs,3000);
  assert.equal(dance.definition.channeling.maxTicks,6);
  assert.equal(dance.definition.effects.some(e=>e.kind==="persistent_zone"),false);
  assert.equal(dance.presentation.visual.cast?.assetId,"pack:capture:sprite-skill-ephemus-danse-mille-ames-v1");
  assert.equal(dance.presentation.visual.impact?.assetId,"pack:capture:sprite-skill-ephemus-danse-mille-ames-v1");
  const visual=present.presentationForSkill(dance.id,{sourceView:"ephemus",targetView:"enemy",fxType:"channel-pulse"});
  assert.ok(visual.cast?.url);
  assert.ok(visual.impact?.url);
});

const format={actors:[{actorId:"ephemus"},{actorId:"enemy"}],teamOf:id=>id==="ephemus"?"player":"enemy"};
function session(distance="short"){
  return createCombatSession({distance,battleFormat:format,fighters:[
    {id:"ephemus",maxHp:200,initialHp:200,maxEnergy:30,initialEnergy:30,energyChargeAmount:0,movementEnergyPerStep:0},
    {id:"enemy",maxHp:200,initialHp:200,maxEnergy:30,initialEnergy:30,energyChargeAmount:0,movementEnergyPerStep:0}
  ]});
}

test("Éphémus target-centered Lanterne damages its selected enemy even at long casting range",()=>{
  const combat=session("long");
  assert.equal(combat.useSkill({actorId:"ephemus",targetId:"enemy",skill:lane.definition}).ok,true);
  assert.equal(combat.snapshot().persistentZones.length,2);
  const durationEnd=Math.max(...combat.snapshot().persistentZones.map(z=>z.expiresAtMs));
  combat.advanceMs(durationEnd);
  assert.ok(Math.abs(combat.snapshot().fighters.enemy.hp-152)<1e-9,
    "targeted medium-radius zone on distant enemy must deliver 10 native pulses with vulnerability, not disappear: "+combat.snapshot().fighters.enemy.hp);
});

test("Éphémus immateriality: the one native blocked damage hit exposes provenance and shows IMMATÉRIEL",()=>{
  const combat=session();
  assert.equal(combat.useSkill({actorId:"ephemus",targetId:"ephemus",skill:chrysalide.definition}).ok,true);
  const attack=normalizeSkillDefinition({
    id:"test-attack-intangible-fx",name:"Test hostile strike",category:"offensive",
    form:"projectile",loadoutSlot:"standard",element:"physical",approachMode:"none",
    energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
    allowedDistances:["short","medium","long"],targetRelations:["enemy"],
    effect:{damage:25,tags:[]}
  });
  const result=combat.useSkill({actorId:"enemy",targetId:"ephemus",skill:attack});
  assert.equal(result.ok,true);
  const hit=result.events.find(e=>e.type==="hit"&&e.actorId==="ephemus");
  assert.ok(hit,"authoritative hit event must exist");
  assert.equal(hit.appliedDamage,0);
  assert.equal(hit.intangibleProtection,true);
  assert.equal(combat.snapshot().fighters.ephemus.hp,200);
  const plan=planSkillOutcomeFx({resolution:result,actorSlot:"enemy",targetSlot:"ephemus"});
  assert.deepEqual(plan.map(x=>({type:x.type,label:x.label,targetSlot:x.targetSlot})),[
    {type:"miss",label:"IMMATÉRIEL",targetSlot:"ephemus"}
  ]);
});

test("Generic immunities never masquerade as Chrysalide and ordinary dodges remain RATÉ",()=>{
  const ordinary={ok:true,skillId:"normal",outcome:"hit",events:[{type:"hit",actorId:"enemy",appliedDamage:0}]};
  assert.equal(planSkillOutcomeFx({resolution:ordinary})[0]?.type,"impact");
  const evaded={ok:true,outcome:"evaded",events:[]};
  assert.equal(planSkillOutcomeFx({resolution:evaded})[0]?.type,"miss");
  assert.equal(planSkillOutcomeFx({resolution:evaded})[0]?.label,undefined);
});


function node(bounds){
  return {
    dataset:{},style:{},children:[],ownerDocument:null,className:"",
    append(child){this.children.push(child)},
    remove(){},
    getBoundingClientRect(){return bounds}
  };
}

test("Visible zone uses selected fighter's actual position, not the distant caster's coordinates",()=>{
  const arena=node({left:0,top:0,width:500,height:300});
  const caster=node({left:40,top:50,width:40,height:40});
  const enemy=node({left:300,top:150,width:40,height:40});
  arena.ownerDocument={createElement(){
    const child=node({left:0,top:0,width:40,height:40});
    child.ownerDocument=arena.ownerDocument;
    return child;
  }};
  const renderer=createDomSkillFxRenderer({
    arena,anchors:{ephemus:caster,enemy},
    presentationForSkill:(id,context)=>present.presentationForSkill(id,context),
    animate(){return {finished:new Promise(()=>{}),cancel(){}}},
    requestFrame(){return null},cancelFrame(){}
  });
  const zones=lane.definition.effects.map(effect=>({
    id:"ephemus:"+lane.id+":"+effect.zoneId,
    skillId:lane.id,sourceActorId:"ephemus",targetId:"enemy",targetScope:"target",
    zoneId:effect.zoneId,radius:"medium",appliedAtMs:0,expiresAtMs:5000,durationMs:5000
  }));
  const result=renderer.syncPersistentZones(zones);
  assert.equal(result.activeCount,2);
  const visible=arena.children.filter(x=>x.dataset.skillFx==="persistent-zone");
  assert.equal(visible.length,2);
  for(const zone of visible){
    assert.equal(zone.style.left,"320px");
    assert.equal(zone.style.top,"170px");
    assert.match(zone.className,/persistent-zone/);
  }
  renderer.dispose();
});

test("Existing floating-text FX displays a proven IMMATÉRIEL reason without replacing ordinary RATÉ",()=>{
  const arena=node({left:0,top:0,width:500,height:300});
  const caster=node({left:40,top:50,width:40,height:40});
  const enemy=node({left:300,top:150,width:40,height:40});
  arena.ownerDocument={createElement(){
    const child=node({left:0,top:0,width:20,height:20});
    child.ownerDocument=arena.ownerDocument;
    return child;
  }};
  const renderer=createDomSkillFxRenderer({
    arena,anchors:{ephemus:caster,enemy},
    animate(){return {finished:new Promise(()=>{}),cancel(){}}},
    requestFrame(){return null},cancelFrame(){}
  });
  renderer.play({type:"miss",targetSlot:"ephemus",label:"IMMATÉRIEL",durationMs:850});
  renderer.play({type:"miss",targetSlot:"enemy",durationMs:650});
  const misses=arena.children.filter(x=>x.dataset.skillFx==="miss");
  assert.deepEqual(misses.map(x=>x.textContent),["IMMATÉRIEL","RATÉ"]);
  renderer.dispose();
});
