import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {sweptExpandingWaveMeetsProjectileV1} from "../../src/adapters/renderer/dom-visible-model-contact.js";
import {projectileClashCandidate,projectileClashAtVisualContactV1} from "../../src/core/combat/projectile-clash.js";
import {planSkillReleaseFx} from "../../src/core/fx/skill-fx-plan.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";

const wave=(power=6)=>normalizeSkillDefinition({
 id:"wave",name:"Onde",category:"offensive",form:"projectile",projectileTargeting:"expanding_wave",
 expandingWave:{startRadiusPct:3,endRadiusPct:65,thicknessPct:6},
 element:"fire",approachMode:"none",energyCost:0,preparationMs:0,travelMs:2000,recoveryMs:0,
 cooldownMs:0,allowedDistances:["short","medium","long"],targetRelations:["enemy"],
 hitPresenceStates:["surface","airborne"],projectileClash:{power},
 effect:{damage:20,heal:0,tags:[]}
});
const bolt=(power=3)=>normalizeSkillDefinition({
 ...wave(),id:"bolt",name:"Projectile direct",
 projectileTargeting:"direct",expandingWave:undefined,projectileClash:{power},
 effect:{damage:15,heal:0,tags:[]}
});
const action=(actorId,targetId,skill)=>({
 actionType:"skill",actorId,targetId,skill,releaseAtMs:0,impactAtMs:2000,travelMs:2000
});
function harness(wavePower,boltPower){
 let time=0,seq=0;const timers=new Map(),resolutions=[],releases=[];
 const session=createCombatSession({distance:"short",fighters:["player","opponent"].map(id=>({
  id,maxHp:100,initialHp:100,maxEnergy:50,initialEnergy:50,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0
 }))});
 const runtime=createCombatRuntime({session,now:()=>time,
  setTimer:cb=>{timers.set(++seq,cb);return seq;},
  clearTimer:id=>timers.delete(id),
  onRelease:({action})=>releases.push(action),
  onResolved:resolution=>resolutions.push(resolution)});
 runtime.start();
 assert.equal(runtime.startSkill({actorId:"player",targetId:"opponent",skill:wave(wavePower)}).ok,true);
 assert.equal(runtime.startSkill({actorId:"opponent",targetId:"player",skill:bolt(boltPower)}).ok,true);
 function tick(t){time=t;const entry=timers.entries().next().value;assert.ok(entry);timers.delete(entry[0]);entry[1]();}
 tick(100);
 return {runtime,session,resolutions,releases,setTime:t=>{time=t;},tick};
}
test("a radial wave keeps its author-configurable projectile power and passes it to the real FX owner",()=>{
 const skill=wave(8);
 assert.equal(skill.projectileClash.power,8);
 const plan=planSkillReleaseFx({action:{skill,travelMs:2000},actorSlot:"player",targetSlot:"opponent"});
 assert.equal(plan[0].projectilePower,8);
 assert.deepEqual(plan[0].expandingWave,skill.expandingWave);
 const normal=planSkillReleaseFx({action:{skill:bolt(4),travelMs:2000}});
 assert.equal(normal[0].projectilePower,4);
});
test("swept ring meets a REAL passing projectile or outward wave, not a phantom midpoint",()=>{
 const point=(x,y=0)=>({x,y});
 assert.equal(sweptExpandingWaveMeetsProjectileV1({center:point(0),previousRadiusPx:15,
  radiusPx:35,thicknessPx:4,previousPoint:point(27),point:point(27)}),true);
 assert.equal(sweptExpandingWaveMeetsProjectileV1({center:point(0),previousRadiusPx:10,
  radiusPx:12,thicknessPx:3,previousPoint:point(50),point:point(-50)}),true);
 assert.equal(sweptExpandingWaveMeetsProjectileV1({center:point(0),previousRadiusPx:15,
  radiusPx:35,thicknessPx:4,previousPoint:point(55),point:point(55)}),false);
 assert.equal(sweptExpandingWaveMeetsProjectileV1({center:point(0),previousRadiusPx:15,
  radiusPx:35,thicknessPx:4,previousPoint:point(27,140),point:point(27,140)}),false);
});
test("midpoint clash stays disabled, whereas the real spatial event compares authored strength",()=>{
 const a=action("player","opponent",wave(8));
 const b=action("opponent","player",bolt(4));
 assert.equal(projectileClashCandidate({leftAction:a,rightAction:b,leftStartedAtClockMs:0,rightStartedAtClockMs:0}),null);
 const candidate=projectileClashAtVisualContactV1({
  leftAction:a,rightAction:b,atClockMs:250,leftProgress:.2,rightProgress:.3
 });
 assert.equal(candidate.outcome,"left_survives");
 assert.equal(candidate.leftPower,8);
 assert.equal(candidate.rightPower,4);
 assert.equal(projectileClashAtVisualContactV1({
  leftAction:a,rightAction:{...b,targetId:"other"},atClockMs:250
 }),null);
 assert.equal(projectileClashAtVisualContactV1({
  leftAction:a,rightAction:action("opponent","player",wave(4)),atClockMs:250
 }),null);
});
for (const [left,right,expected] of [[4,4,"mutual_cancel"],[8,3,"left_survives"],[2,6,"right_survives"]]) {
 test("real CombatRuntime handles visual power clash: wave="+left+" versus projectile="+right,()=>{
  const game=harness(left,right);
  game.setTime(420);
  const result=game.runtime.reportProjectileClashContact({
   waveActorId:"player",waveSkillId:"wave",
   projectileActorId:"opponent",projectileSkillId:"bolt"
  });
  assert.equal(result.ok,true);
  assert.equal(result.outcome,expected);
  assert.equal(game.resolutions.filter(x=>x.outcome==="clashed").length,
   expected==="mutual_cancel"?2:1);
  const winner=expected==="left_survives"?"player":
   expected==="right_survives"?"opponent":null;
  if(winner){
   const loser=winner==="player"?"opponent":"player";
   assert.equal(game.runtime.hasActiveActionFor(winner),true);
   assert.equal(game.runtime.hasActiveActionFor(loser),false);
  } else {
   assert.equal(game.runtime.hasActiveAction,false);
  }
  assert.equal(game.session.snapshot().fighters.player.hp,100);
  assert.equal(game.session.snapshot().fighters.opponent.hp,100);
  const duplicate=game.runtime.reportProjectileClashContact({
   waveActorId:"player",waveSkillId:"wave",
   projectileActorId:"opponent",projectileSkillId:"bolt"
  });
  assert.equal(duplicate.ok,false);
  game.runtime.dispose();
 });
}
test("zero-power waves and wrong actor IDs cannot create projectile clashes",()=>{
 const game=harness(0,5);
 game.setTime(300);
 assert.equal(game.runtime.reportProjectileClashContact({
  waveActorId:"player",projectileActorId:"opponent"
 }).ok,false);
 assert.equal(game.runtime.reportProjectileClashContact({
  waveActorId:"player",projectileActorId:"enemy"
 }).ok,false);
 game.runtime.dispose();
});
test("actual 1v1/2v2 client uses the same visual sensor and canonical Runtime callback",()=>{
 const renderer=readFileSync(new URL("../../src/adapters/renderer/dom-skill-fx.js",import.meta.url),"utf8");
 assert.match(renderer,/sweptExpandingWaveMeetsProjectileV1/);
 assert.match(renderer,/onProjectileClashContact\(Object\.freeze/);
 for(const client of ["combat-test-ui.js","combat-2v2-test-ui.js"]){
  const ui=readFileSync(new URL("../../src/ui/"+client,import.meta.url),"utf8");
  assert.match(ui,/reportProjectileClashContact\(contact\)/);
 }
});

test("actual expanding-wave DOM shell reports spatial projectile collision to CombatRuntime exactly once",()=>{
 const game=harness(7,4);
 const rect=(left,top,width,height)=>({left,top,width,height});
 let frames=[];
 const doc={createElement(){
  return {
   className:"",dataset:{},style:{},children:[],
   append(...children){this.children.push(...children);},
   remove(){this.removed=true;},
   getBoundingClientRect(){
    const diameter=Number.parseFloat(this.style.width)||30;
    const scale=this.currentScale ?? 1;
    const width=diameter*scale;
    const height=(Number.parseFloat(this.style.height)||30)*scale;
    const cx=this.currentX ?? Number.parseFloat(this.style.left) ?? 0;
    const cy=Number.parseFloat(this.style.top)||0;
    return rect(cx-width/2,cy-height/2,width,height);
   }
  };
 }};
 const arena={
  ownerDocument:doc,nodes:[],
  append(node){this.nodes.push(node);},
  getBoundingClientRect(){return rect(0,0,1000,500);}
 };
 const anchor=(left,top)=>({getBoundingClientRect(){return rect(left,top,20,20);}});
 const anchors={player:anchor(90,190),opponent:anchor(290,190)};
 const calls=[];
 const fx=createDomSkillFxRenderer({
  arena,anchors,targetAnchors:anchors,
  presentationForSkill:()=>null,
  targetCollisionModelFor:()=>({snapshot:()=>null}),
  onProjectileContact:()=>null,
  onProjectileClashContact:contact=>{
   const result=game.runtime.reportProjectileClashContact(contact);
   calls.push(result);
   return result;
  },
  requestFrame:callback=>{frames.push(callback);return frames.length;},
  cancelFrame:()=>{},
  animate:()=>({finished:new Promise(()=>{}),cancel(){}})
 });
 const waveFx=planSkillReleaseFx({
  action:{skill:wave(7),travelMs:2000},actorSlot:"player",targetSlot:"opponent"
 })[0];
 const boltFx=planSkillReleaseFx({
  action:{skill:bolt(4),travelMs:2000},actorSlot:"opponent",targetSlot:"player"
 })[0];
 fx.play(waveFx);
 fx.play(boltFx);
 const shell=arena.nodes.find(x=>x.dataset.waveMode==="expanding_wave");
 const bullet=arena.nodes.find(x=>x.dataset.skillId==="bolt");
 assert.ok(shell);
 assert.ok(bullet);
 function frame(scale,x,t){
  game.setTime(t);
  shell.currentScale=scale;
  bullet.currentX=x;
  const callbacks=frames;frames=[];
  for(const callback of callbacks)callback();
 }
 // The distant projectile is not touched just because two attacks coexist.
 frame(0.05,300,180);
 assert.equal(calls.length,0);
 frame(0.10,300,250);
 assert.equal(calls.length,0);
 // Move the ACTUAL projectile point across the ring while it grows.
 frame(0.20,170,410);
 assert.equal(calls.length,1);
 assert.equal(calls[0].ok,true);
 assert.equal(calls[0].outcome,"left_survives");
 assert.equal(game.resolutions.length,1);
 assert.equal(game.resolutions[0].outcome,"clashed");
 frame(0.30,150,500);
 assert.equal(calls.length,1);
 assert.equal(game.session.snapshot().fighters.opponent.hp,100);
 fx.dispose();game.runtime.dispose();
});
