import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createRosterSession} from "../../src/core/combat/roster-session.js";
import {normalizePersistentZoneSpatialV1,visiblePersistentZonePassThroughV1}
 from "../../src/contracts/persistent-zone-spatial-v1.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {planSkillPreparationFx} from "../../src/core/fx/skill-fx-plan.js";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";

const read=id=>JSON.parse(readFileSync(new URL(
 "../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),"utf8"));
const trail=normalizeSkillDefinition(read("polocendre-trainee-feu").draft.definition);
const ultimate=normalizeSkillDefinition(read("polocendre-ruee-explosive").draft.definition);
const fighter=(id,hp=100)=>({id,maxHp:100,initialHp:hp,maxEnergy:30,
 initialEnergy:30,energyChargeAmount:0,energyChargeIntervalMs:1000,
 movementEnergyPerStep:0,chargeTimeModifierPct:0});
const format={actors:[{actorId:"player"},{actorId:"opponent"}],
 teamOf(id){return id==="player"?"heroes":id==="opponent"?"foes":null;}};

test("A KO team member stays counted after automatic roster replacement; ultimate unlocks once",()=>{
 const session=createCombatSession({distance:"medium",battleFormat:format,
  fighters:[fighter("player"),fighter("opponent")]});
 const configs={a:fighter("a"),polocendre:fighter("polocendre"),foe:fighter("foe")};
 const team=(slotId,names)=>({slotId,activeMemberId:names[0],
  members:names.map((name,i)=>({id:name,creatureId:name,displayName:name,fighterConfigId:name}))});
 const roster=createRosterSession({combatSession:session,battleFormat:format,
  fighterConfigs:configs,roster:{teams:{
   player:team("player",["a","polocendre"]),
   opponent:team("opponent",["foe"])
  }}});
 let attempt=session.previewSkill({actorId:"player",targetId:"opponent",skill:ultimate});
 assert.equal(attempt.ok,false);assert.equal(attempt.outcome,"activation_requirements");
 const kill=normalizeSkillDefinition({id:"test-hit",name:"KO test",
  category:"offensive",form:"area",approachMode:"none",energyCost:0,
  preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
  allowedDistances:["short","medium","long"],targetRelations:["enemy"],
  effect:{damage:150,heal:0,stunMs:0,tags:[]}});
 assert.equal(session.useSkill({actorId:"opponent",targetId:"player",skill:kill}).ok,true);
 assert.equal(session.snapshot().fighters.player.hp,0);
 const replaced=roster.replaceKnockedOut("player");
 assert.equal(replaced.ok,true);assert.equal(replaced.replacementMemberId,"polocendre");
 assert.equal(session.snapshot().fighters.player.hp,100);
 assert.equal(roster.snapshot().player.members.find(m=>m.id==="a").hp,0);
 attempt=session.previewSkill({actorId:"player",targetId:"opponent",skill:ultimate});
 assert.equal(attempt.ok,true,JSON.stringify(attempt));
 const started=session.startSkill({actorId:"player",targetId:"opponent",skill:ultimate});
 assert.equal(started.ok,true,JSON.stringify(started));
 assert.equal(session.snapshot().fighters.player.energy,22);
});

test("The normal activation requirement retains BattleFormat-only KO behavior without roster",()=>{
 const session=createCombatSession({distance:"medium",battleFormat:format,
 fighters:[fighter("player"),fighter("opponent")]});
 const ordinary=normalizeSkillDefinition({...ultimate,
  effects:[{kind:"damage",targetScope:"target",amount:60,channel:"fire"}]});
 assert.equal(session.previewSkill({actorId:"player",targetId:"opponent",skill:ordinary}).ok,false);
});

test("Three trail placements keep the real pre-charge path even when caster has reached target",()=>{
 const fake=rect=>({className:"",dataset:{},style:{},children:[],removed:false,
  append(child){this.children.push(child);},remove(){this.removed=true;},
  getBoundingClientRect(){return typeof rect==="function"?rect():rect;}});
 const arena=fake({left:0,top:0,width:650,height:300});
 let caster={left:80,top:135,width:40,height:40};
 let opponent={left:480,top:135,width:40,height:40};
 const source=fake(()=>caster),target=fake(()=>opponent);
 arena.ownerDocument={createElement(){
  const node=fake({left:0,top:0,width:24,height:24});
  node.ownerDocument=arena.ownerDocument;return node;}};
 const fx=createDomSkillFxRenderer({arena,anchors:{player:source,opponent:target},
 targetAnchors:{player:source,opponent:target},presentationForSkill(){return {
  persistentZone:{assetId:"fire",url:"zone.webp",displayScale:0.7,
   displayScaleX:1,displayScaleY:0.75,attachment:"fixed-source",playbackMode:"loop",
   opacity:0.7},persistentZoneLayer:"behind"};},
 animate(){return {finished:new Promise(()=>{}),cancel(){}};},
 requestFrame(){return null;},cancelFrame(){}});
 const castPlan=planSkillPreparationFx({action:{skill:trail,targetId:"opponent",
  preparationMs:trail.preparationMs},actorSlot:"player"})[0];
 assert.equal(castPlan.trailPath,true);
 assert.equal(castPlan.targetSlot,"opponent");
 fx.play(castPlan);
 caster={left:478,top:135,width:40,height:40}; // physical impact: both models now coincide
 const zones=[1,2,3].map(i=>({id:"player:trail:"+i,zoneId:"trail-"+i,
  skillId:trail.id,sourceActorId:"player",targetId:"opponent",radius:"short",
  trailIndex:i,trailCount:3,appliedAtMs:2400,expiresAtMs:12400}));
 fx.syncPersistentZones(zones);
 const nodes=arena.children.filter(x=>x.dataset.skillFx==="persistent-zone");
 assert.equal(nodes.length,3);
 assert.deepEqual(nodes.map(n=>Number.parseFloat(n.style.left)),[200,300,400]);
 assert.equal(new Set(nodes.map(n=>n.style.transform)).size,1);
 assert.ok(nodes.every(n=>n.style.transform.includes("scale(")));
 fx.dispose();
});

const sample=x=>normalizePersistentZoneSpatialV1({
 zones:[{zoneId:"player:trail:1",sourceActorId:"player",radius:"short",
  bounds:{left:56,top:50,width:28,height:28}}],
 actors:[{actorId:"player",bounds:{left:200,top:50,width:12,height:12}},
 {actorId:"opponent",bounds:{left:x,top:55,width:12,height:12}}]
});
test("Fast moving opponent crosses a narrow fire trail between snapshots and gets ONE native hit",()=>{
 const session=createCombatSession({distance:"medium",battleFormat:format,
  fighters:[fighter("player"),fighter("opponent")]});
 const effects=trail.effects.filter(e=>e.kind==="persistent_zone").slice(0,1);
 const zoneSkill=normalizeSkillDefinition({...trail,id:"only-one-trail",form:"aura",
  approachMode:"none",preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
  energyCost:0,effects});
 assert.equal(session.useSkill({actorId:"player",targetId:"opponent",skill:zoneSkill}).ok,true);
 const zone=session.snapshot().persistentZones[0];
 assert.ok(zone);
 const visual=(x)=>({visibleZones:normalizePersistentZoneSpatialV1({
  zones:[{zoneId:zone.id,sourceActorId:zone.sourceActorId,radius:zone.radius,
   bounds:{left:56,top:50,width:28,height:28}}],
  actors:[{actorId:"player",bounds:{left:200,top:50,width:12,height:12}},
   {actorId:"opponent",bounds:{left:x,top:55,width:12,height:12}}]
 })});
 session.advanceMs(100,{zoneSpatialContext:visual(0)});
 assert.equal(session.snapshot().fighters.opponent.hp,100);
 session.advanceMs(100,{zoneSpatialContext:visual(120)});
 assert.equal(session.snapshot().fighters.opponent.hp,95,
  "even with no intermediate frame, crossing the area deals 5 fire damage");
 session.advanceMs(100,{zoneSpatialContext:visual(120)});
 assert.equal(session.snapshot().fighters.opponent.hp,95,
  "standing outside must not double-hit");
 session.advanceMs(100,{zoneSpatialContext:visual(0)});
 assert.equal(session.snapshot().fighters.opponent.hp,90,"second traversal hits once again");
 session.advanceMs(10200,{zoneSpatialContext:visual(150)});
 assert.equal(session.snapshot().persistentZones.length,0);
 assert.equal(visiblePersistentZonePassThroughV1({
  sample:sample(120),zoneId:"player:trail:1",sourceActorId:"player",
  radius:"short",candidateId:"opponent",
  previousBounds:{left:0,top:55,width:12,height:12}}),true);
});

test("The player-facing description gives 3 zones and exactly one per-zone damage rule",()=>{
 const sentences=describeCaptureSkillV1(trail).sentences.join(" ");
 assert.match(sentences,/3 traînées/);
 assert.match(sentences,/espacées uniformément/);
 assert.match(sentences,/Chaque zone traversée inflige 5 dégâts de Feu/);
 assert.equal((sentences.match(/Chaque zone traversée inflige/g)||[]).length,1);
 assert.doesNotMatch(sentences,/infligent 5 dégâts[^.]*infligent 5 dégâts/);
});
