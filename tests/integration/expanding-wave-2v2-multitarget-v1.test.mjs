import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBattleFormatDefinition } from "../../src/contracts/battle-format-definition.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";

const battleFormat = normalizeBattleFormatDefinition({
  id:"wave-2v2",localActorId:"player",
  teams:{players:["player","ally"],enemies:["opponent","opponent-b"]},
  actors:["player","ally","opponent","opponent-b"].map(actorId=>({
    actorId,teamId:["player","ally"].includes(actorId)?"players":"enemies",
    creatureId:actorId,displayName:actorId,fighterConfigId:actorId,controllerId:"human-local"
  }))
});
const fighter=id=>({
  id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0
});
const wave=(damage=20)=>normalizeSkillDefinition({
  id:"wave-2v2",name:"Onde expansive",category:"offensive",form:"projectile",
  projectileTargeting:"expanding_wave",
  expandingWave:{startRadiusPct:3,endRadiusPct:65,thicknessPct:6},
  element:"fire",approachMode:"none",energyCost:3,preparationMs:0,
  travelMs:1000,recoveryMs:0,cooldownMs:0,
  hitPresenceStates:["surface","airborne"],
  targetRelations:["enemy"],allowedDistances:["short","medium","long"],
  effect:{damage,heal:0,tags:[]}
});
function clock(){
  let time=0,sequence=0;
  const scheduled=new Map();
  return {
    now:()=>time,setTime:value=>{time=value},
    setTimer:fn=>{let id=++sequence;scheduled.set(id,fn);return id},
    clearTimer:id=>scheduled.delete(id),
    fireNext(){const [id,fn]=scheduled.entries().next().value??[];assert.ok(fn);scheduled.delete(id);fn();}
  };
}
function runtimeFixture(){
  const session=createCombatSession({
    distance:"short",battleFormat,
    fighters:["player","ally","opponent","opponent-b"].map(fighter)
  });
  const timer=clock(),resolutions=[];
  const runtime=createCombatRuntime({
    session,now:timer.now,setTimer:timer.setTimer,clearTimer:timer.clearTimer,
    enableExpandingWaveMultiTarget:true,
    onResolved:resolution=>resolutions.push(resolution)
  });
  runtime.start();
  return {session,timer,runtime,resolutions};
}

test("one 2v2 expanding wave contacts two enemy slots only, each once, with one cost",()=>{
  const game=runtimeFixture();
  assert.equal(game.runtime.startSkill({actorId:"player",targetId:"opponent",skill:wave()}).ok,true);
  assert.equal(game.session.snapshot().fighters.player.energy,17);
  game.timer.setTime(200);
  const first=game.runtime.reportExpandingWaveTargetContact({
    actorId:"player",targetId:"opponent",skillId:"wave-2v2"
  });
  assert.equal(first.ok,true);
  assert.equal(game.session.snapshot().fighters.opponent.hp,80);
  assert.equal(game.runtime.reportExpandingWaveTargetContact({
    actorId:"player",targetId:"opponent",skillId:"wave-2v2"
  }).outcome,"already_contacted");
  assert.equal(game.runtime.reportExpandingWaveTargetContact({
    actorId:"player",targetId:"ally",skillId:"wave-2v2"
  }).outcome,"invalid_target");
  game.timer.setTime(600);
  assert.equal(game.runtime.reportExpandingWaveTargetContact({
    actorId:"player",targetId:"opponent-b",skillId:"wave-2v2"
  }).ok,true);
  assert.equal(game.session.snapshot().fighters["opponent-b"].hp,80);
  assert.equal(game.session.snapshot().fighters.ally.hp,100);
  game.timer.setTime(1050);game.timer.fireNext();
  assert.equal(game.session.snapshot().fighters.opponent.hp,80);
  assert.equal(game.session.snapshot().fighters["opponent-b"].hp,80);
  assert.equal(game.session.snapshot().fighters.player.energy,17);
  assert.deepEqual(game.resolutions.map(x=>x.targetId),["opponent","opponent-b"]);
  assert.ok(game.resolutions.every(x=>x.waveContact===true));
  game.runtime.dispose();
});

test("the first enemy can be KO without cancelling the released wave before it reaches the second",()=>{
  const game=runtimeFixture();
  assert.equal(game.runtime.startSkill({
    actorId:"player",targetId:"opponent",skill:wave(100)
  }).ok,true);
  game.timer.setTime(250);
  assert.equal(game.runtime.reportExpandingWaveTargetContact({
    actorId:"player",targetId:"opponent",skillId:"wave-2v2"
  }).ok,true);
  assert.equal(game.session.snapshot().fighters.opponent.hp,0);
  game.timer.setTime(550);
  assert.equal(game.runtime.reportExpandingWaveTargetContact({
    actorId:"player",targetId:"opponent-b",skillId:"wave-2v2"
  }).ok,true);
  assert.equal(game.session.snapshot().fighters["opponent-b"].hp,0);
  assert.equal(game.resolutions.length,2);
  game.runtime.dispose();
});

test("2v2 wave never awards hit from time alone; rejects early and late contact",()=>{
  const game=runtimeFixture();
  assert.equal(game.runtime.startSkill({actorId:"player",targetId:"opponent",skill:wave()}).ok,true);
  game.timer.setTime(1100);game.timer.fireNext();
  assert.equal(game.runtime.reportExpandingWaveTargetContact({
    actorId:"player",targetId:"opponent-b",skillId:"wave-2v2"
  }).ok,false);
  assert.equal(game.session.snapshot().fighters["opponent-b"].hp,100);
  assert.equal(game.session.snapshot().fighters.opponent.hp,100);
  game.runtime.dispose();
});

test("2v2 wave visual uses one expanding shell and sweeps both opaque targets independently",()=>{
  const rect=(left,top,width,height)=>({left,top,width,height});
  const frames=[];
  const doc={createElement(){
    return {className:"",dataset:{},style:{},children:[],
      append(...children){this.children.push(...children);},
      remove(){this.removed=true;},
      getBoundingClientRect(){
        const d=Number.parseFloat(this.style.width)||30,scale=this.currentScale??1;
        const width=d*scale,height=(Number.parseFloat(this.style.height)||30)*scale;
        const x=Number.parseFloat(this.style.left)||0,y=Number.parseFloat(this.style.top)||0;
        return rect(x-width/2,y-height/2,width,height);
      }
    };
  }};
  const arena={ownerDocument:doc,nodes:[],append(node){this.nodes.push(node)},
    getBoundingClientRect(){return rect(0,0,1000,500)}};
  const anchor=(left,top)=>({getBoundingClientRect(){return rect(left,top,20,20)}});
  const anchors={player:anchor(90,190),ally:anchor(95,220),
    opponent:anchor(270,190),"opponent-b":anchor(500,190)};
  const mask={width:4,height:4,opaque:new Uint8Array(16).fill(1)};
  const model=left=>({
    mask,origin:{x:left,y:195},axisX:{x:left+12,y:195},axisY:{x:left,y:207}
  });
  const hits=[];
  const fx=createDomSkillFxRenderer({
    arena,anchors,targetAnchors:anchors,
    waveTargetsFor:()=>["opponent","opponent-b"],
    presentationForSkill:()=>null,
    targetCollisionModelFor:slot=>({snapshot(){
      return model(slot==="opponent"?270:500);
    }}),
    onProjectileContact:contact=>{hits.push(contact);return {ok:true}},
    requestFrame:fn=>{frames.push(fn);return frames.length},
    cancelFrame:()=>{},
    animate:()=>({finished:new Promise(()=>{}),cancel(){}})
  });
  fx.play({type:"projectile",skillId:"wave-2v2",fromSlot:"player",
    targetSlot:"opponent",durationMs:1000,expandingWave:wave().expandingWave});
  assert.equal(arena.nodes.length,1);
  const shell=arena.nodes[0];
  function step(scale){
    shell.currentScale=scale;
    const callback=frames.shift();assert.equal(typeof callback,"function");callback();
  }
  step(0.15);assert.equal(hits.length,0);
  step(0.32);assert.deepEqual(hits.map(x=>x.targetId),["opponent"]);
  step(0.75);assert.deepEqual(hits.map(x=>x.targetId),["opponent","opponent-b"]);
  step(1);assert.equal(hits.length,2);
  fx.dispose();
});
