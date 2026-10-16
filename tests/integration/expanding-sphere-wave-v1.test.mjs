import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {humanSkillEditorFieldsFromDraftV1,buildHumanSkillDraftV1} from "../../src/ui/capture-editor-human-v2.js";
import {sweptExpandingWaveHitsOpaqueMaskV1} from "../../src/adapters/renderer/dom-visible-model-contact.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {planSkillReleaseFx} from "../../src/core/fx/skill-fx-plan.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import {projectileClashCandidate} from "../../src/core/combat/projectile-clash.js";

const wave=()=>normalizeSkillDefinition({
 id:"fire-wave",name:"Onde de feu",category:"offensive",form:"projectile",
 projectileTargeting:"expanding_wave",
 expandingWave:{startRadiusPct:3,endRadiusPct:65,thicknessPct:6},
 element:"fire",approachMode:"none",energyCost:0,preparationMs:0,
 travelMs:1000,recoveryMs:0,cooldownMs:0,
 hitPresenceStates:["surface","airborne"],
 allowedDistances:["short","medium","long"],
 targetRelations:["enemy"],
 effect:{damage:20,heal:0,tags:[]}
});
const base=id=>({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
 energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const fixture=()=>JSON.parse(readFileSync(
 new URL("../../data/capture/showcase/cap_fire_atk_5.capture-skill-transfer-v1.json",import.meta.url),"utf8"));
function frame(left,top=0){
 const mask={width:4,height:4,opaque:new Uint8Array(16).fill(1)};
 return {mask,origin:{x:left,y:top},axisX:{x:left+12,y:top},axisY:{x:left,y:top+12}};
}
function clock(){
 let time=0;let index=0;const scheduled=new Map();
 return {
  now:()=>time,setTime:t=>{time=t;},
  setTimer:fn=>{const id=++index;scheduled.set(id,fn);return id;},
  clearTimer:id=>scheduled.delete(id),
  fireNext:()=>{const [id,fn]=scheduled.entries().next().value ?? []; assert.ok(fn);scheduled.delete(id);fn();}
 };
}
function harness(){
 const session=createCombatSession({distance:"short",fighters:[base("player"),base("opponent")]});
 const c=clock(),resolutions=[];
 const runtime=createCombatRuntime({session,now:c.now,setTimer:c.setTimer,clearTimer:c.clearTimer,
  onResolved:result=>resolutions.push(result)});
 runtime.start();
 return {session,clock:c,runtime,resolutions};
}

test("expanding-wave is a strictly authored projectile mode, with bounded mobile relative geometry",()=>{
 const skill=wave();
 assert.equal(skill.form,"projectile");
 assert.equal(skill.projectileTargeting,"expanding_wave");
 assert.deepEqual(skill.expandingWave,{startRadiusPct:3,endRadiusPct:65,thicknessPct:6});
 const action={skill,travelMs:1000};
 const plan=planSkillReleaseFx({action,actorSlot:"player",targetSlot:"opponent"});
 assert.equal(plan.length,1);
 assert.deepEqual(plan[0].expandingWave,skill.expandingWave);
 const direct=normalizeSkillDefinition({...skill,id:"direct",projectileTargeting:"direct",expandingWave:undefined});
 assert.equal("expandingWave" in direct,false);
 assert.throws(()=>normalizeSkillDefinition({...skill,expandingWave:{...skill.expandingWave,endRadiusPct:2}}),/expandingWave/);
 assert.throws(()=>normalizeSkillDefinition({...skill,form:"self"}),/expanding_wave/);
});

test("wave collision sweeps a real transformed opaque alpha boundary, not a central projectile point",()=>{
 const center={x:0,y:6};
 assert.equal(sweptExpandingWaveHitsOpaqueMaskV1({
  center,previousRadiusPx:12,radiusPx:40,thicknessPx:5,frame:frame(30)
 }),true);
 assert.equal(sweptExpandingWaveHitsOpaqueMaskV1({
  center,previousRadiusPx:12,radiusPx:40,thicknessPx:5,frame:frame(95)
 }),false);
 assert.equal(sweptExpandingWaveHitsOpaqueMaskV1({
  center,previousRadiusPx:32,radiusPx:40,thicknessPx:5,frame:frame(12)
 }),false);
 assert.equal(sweptExpandingWaveHitsOpaqueMaskV1({
  center,previousRadiusPx:35,radiusPx:55,thicknessPx:5,
  previousFrame:frame(70),frame:frame(51)
 }),true);
});

test("the author can edit and transfer a wave via the canonical skill editor without modifying existing abilities",()=>{
 const native=importCaptureTransferJsonV1(JSON.stringify(fixture())).value.draft;
 const fields=humanSkillEditorFieldsFromDraftV1(native);
 const authored=buildHumanSkillDraftV1({
  ...fields,id:"fire-wave",name:"Onde de feu",form:"projectile",
  presentation:{...fields.presentation,travelTrajectoryMode:"expanding_wave",
   waveStartRadiusPct:4,waveEndRadiusPct:80,waveThicknessPct:7}
 });
 assert.equal(authored.definition.projectileTargeting,"expanding_wave");
 assert.deepEqual(authored.definition.expandingWave,{startRadiusPct:4,endRadiusPct:80,thicknessPct:7});
 const transferred=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(authored)).value.draft;
 assert.deepEqual(transferred,authored);
 const roundtripFields=humanSkillEditorFieldsFromDraftV1(transferred);
 assert.equal(roundtripFields.presentation.travelTrajectoryMode,"expanding_wave");
 assert.equal(roundtripFields.presentation.waveEndRadiusPct,80);
 assert.equal(native.definition.projectileTargeting,"expanding_wave");
 assert.deepEqual(native.definition.expandingWave,{startRadiusPct:8,endRadiusPct:65,thicknessPct:8});
});

test("uncontacted wave can never auto-hit at its travel deadline",()=>{
 const {session,clock:c,runtime,resolutions}=harness();
 const result=runtime.startSkill({actorId:"player",targetId:"opponent",skill:wave()});
 assert.equal(result.ok,true);
 c.setTime(1200);c.fireNext();
 assert.equal(session.snapshot().fighters.opponent.hp,100);
 assert.equal(resolutions.length,1);
 assert.equal(resolutions[0].outcome,"evaded");
 runtime.dispose();
});

test("an opaque-wave contact during expansion resolves exactly one hit from CombatRuntime",()=>{
 const {session,clock:c,runtime,resolutions}=harness();
 assert.equal(runtime.startSkill({actorId:"player",targetId:"opponent",skill:wave()}).ok,true);
 c.setTime(500);
 const contact=runtime.reportActionContact({actorId:"player",targetId:"opponent",skillId:"fire-wave"});
 assert.equal(contact.ok,true);
 assert.equal(contact.outcome,"contact_resolved");
 assert.equal(session.snapshot().fighters.opponent.hp,80);
 assert.equal(resolutions.length,1);
 assert.equal(resolutions[0].outcome,"hit");
 c.setTime(1200);c.fireNext();
 assert.equal(session.snapshot().fighters.opponent.hp,80);
 runtime.dispose();
});

test("visual + rules are coupled only for wave; old direct projectile, skyfall and target presence stay unchanged",()=>{
 const waveSkill=wave();
 assert.deepEqual(waveSkill.hitPresenceStates,["surface","airborne"]);
 const author=fixture().draft.definition;
 // The showcase author is now a real wave; prove the ordinary direct mode
 // remains supported through its own independent contract fixture.
 assert.equal(author.projectileTargeting,"expanding_wave");
 const direct=normalizeSkillDefinition({...author,id:"control-direct",projectileTargeting:"direct",expandingWave:undefined});
 assert.equal(direct.projectileTargeting,"direct");
 assert.equal(direct.expandingWave,undefined);
 assert.deepEqual(direct.hitPresenceStates,["surface","airborne"]);
 const visualSource=readFileSync(new URL("../../src/adapters/renderer/dom-skill-fx.js",import.meta.url),"utf8");
 assert.match(visualSource,/sweptExpandingWaveHitsOpaqueMaskV1/);
 assert.match(visualSource,/onProjectileContact/);
 assert.match(visualSource,/node\.getBoundingClientRect\(\)/);
});


function waveRendererFixture({selectedTarget="opponent",targetX=270}={}){
 const rect=(left,top,width,height)=>({left,top,width,height});
 const frames=[];
 const doc={createElement(){
  const obj={
   className:"",dataset:{},style:{},children:[],
   append(...children){this.children.push(...children);},
   remove(){this.removed=true;},
   getBoundingClientRect(){
    const diameter=Number.parseFloat(this.style.width)||30;
    const scale=this.currentScale ?? 1;
    const width=diameter*scale;
    const height=(Number.parseFloat(this.style.height)||30)*scale;
    const centerX=Number.parseFloat(this.style.left)||0;
    const centerY=Number.parseFloat(this.style.top)||0;
    return rect(centerX-width/2,centerY-height/2,width,height);
   }
  };
  return obj;
 }};
 const arena={
  ownerDocument:doc,nodes:[],append(node){this.nodes.push(node);},
  getBoundingClientRect(){return rect(0,0,1000,500);}
 };
 const anchor=(left,top)=>({getBoundingClientRect(){return rect(left,top,20,20)}});
 const anchors={player:anchor(90,190),opponent:anchor(targetX,190),"opponent-2":anchor(500,190)};
 const reported=[];
 const modelFrame=(left)=>frame(left,195);
 const fx=createDomSkillFxRenderer({
  arena,anchors,targetAnchors:anchors,
  presentationForSkill:()=>null,
  targetCollisionModelFor:slot=>({snapshot(){
   return slot === "opponent" ? modelFrame(targetX) : modelFrame(500);
  }}),
  onProjectileContact:contact=>reported.push(contact),
  requestFrame:fn=>{frames.push(fn);return frames.length;},
  cancelFrame:()=>{},
  animate:(_node,keyframes,options)=>{
   return {keyframes,options,finished:new Promise(()=>{}),cancel(){}};
  }
 });
 const result=fx.play({type:"projectile",skillId:"fire-wave",
  fromSlot:"player",targetSlot:selectedTarget,
  durationMs:1000,expandingWave:wave().expandingWave});
 const shell=arena.nodes[0];
 return {fx,frames,reported,result,shell,step(scale){
  shell.currentScale=scale;
  const callback=frames.shift();assert.equal(typeof callback,"function");
  callback();
 }};
}

test("actual DOM wave renderer grows one hitbox with its sprite shell, sees alpha only at ring crossing and emits once",()=>{
 const game=waveRendererFixture();
 assert.equal(game.result.status,"running");
 assert.equal(game.shell.dataset.waveMode,"expanding_wave");
 assert.equal(game.shell.style.width,"1300px");
 game.step(0.15);
 assert.equal(game.reported.length,0);
 game.step(0.32);
 assert.equal(game.reported.length,1);
 assert.equal(game.reported[0].actorId,"player");
 assert.equal(game.reported[0].targetId,"opponent");
 assert.equal(game.reported[0].skillId,"fire-wave");
 assert.equal(game.fx.cancelProjectileFor("player"),1);
 assert.equal(game.fx.activeCount,0);
 game.fx.dispose();
});

test("wave never claims contact with an unselected 2v2 enemy even when visually expansive",()=>{
 const game=waveRendererFixture({selectedTarget:"opponent-2"});
 game.step(0.15);
 game.step(0.32);
 assert.equal(game.reported.length,0);
 game.step(1);
 assert.equal(game.reported.length,1);
 assert.equal(game.reported[0].targetId,"opponent-2");
 game.fx.dispose();
});


test("expanding radial wave never triggers a fictitious ballistic midpoint clash against a true projectile",()=>{
 const radial={actionType:"skill",actorId:"player",targetId:"opponent",
  skill:{...wave(),projectileClash:{power:7}},
  releaseAtMs:0,impactAtMs:1000,travelMs:1000};
 const direct={actionType:"skill",actorId:"opponent",targetId:"player",
  skill:{...wave(),projectileTargeting:"direct",expandingWave:undefined,projectileClash:{power:5}},
  releaseAtMs:0,impactAtMs:1000,travelMs:1000};
 assert.equal(projectileClashCandidate({leftAction:radial,leftStartedAtClockMs:0,
  rightAction:direct,rightStartedAtClockMs:0}),null);
});
