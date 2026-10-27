import test from "node:test";
import assert from "node:assert/strict";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {createCombatResolutionPresenter} from "../../src/adapters/renderer/combat-resolution-presenter.js";
import {planSkillReleaseFx} from "../../src/core/fx/skill-fx-plan.js";

const makeWave = () => normalizeSkillDefinition({
  id:"wave",name:"Sphère de feu",category:"offensive",form:"projectile",
  projectileTargeting:"expanding_wave",
  expandingWave:{startRadiusPct:3,endRadiusPct:150,thicknessPct:6},
  element:"fire",approachMode:"none",energyCost:0,preparationMs:0,
  travelMs:2000,recoveryMs:0,cooldownMs:0,
  hitPresenceStates:["surface","airborne"],
  allowedDistances:["short","medium","long"],targetRelations:["enemy"],
  effect:{damage:20,heal:0,tags:[]}
});
const fighter = id => ({
  id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,
  chargeTimeModifierPct:0
});
function alphaFrame(left,top){
  return {
    mask:{width:4,height:4,opaque:new Uint8Array(16).fill(1)},
    origin:{x:left,y:top},
    axisX:{x:left+12,y:top},
    axisY:{x:left,y:top+12}
  };
}
function fixture({linkedRuntime = true}={}) {
  const frames=[],animations=[],reported=[];
  const doc={createElement(){
    const node={
      className:"",dataset:{},style:{},children:[],
      append(...items){this.children.push(...items);},
      remove(){this.removed=true;},
      getBoundingClientRect(){
        const width=(parseFloat(this.style.width)||30)*(this.currentScale??1);
        const height=(parseFloat(this.style.height)||30)*(this.currentScale??1);
        const x=parseFloat(this.style.left)||0,y=parseFloat(this.style.top)||0;
        return {left:x-width/2,top:y-height/2,width,height};
      }
    };
    node.ownerDocument=doc;
    return node;
  }};
  const arena={
    ownerDocument:doc,nodes:[],
    append(node){this.nodes.push(node);},
    getBoundingClientRect(){return {left:0,top:0,width:1000,height:500};}
  };
  const a=(x,y)=>({getBoundingClientRect(){
    return {left:x,top:y,width:20,height:20};
  }});
  const anchors={player:a(90,190),opponent:a(270,190)};
  let runtime=null,presenter=null,nowMs=0,uid=0;
  const scheduled=new Map();
  const fx=createDomSkillFxRenderer({
    arena,anchors,targetAnchors:anchors,
    presentationForSkill:()=>({
      travel:{url:"https://example.test/sphere-of-fire.webp",assetId:"test:fire-sphere",
        frameCount:1,frameMs:100,playbackMode:"stretch"}
    }),
    targetCollisionModelFor:()=>({
      snapshot:()=>alphaFrame(270,195)
    }),
    onProjectileContact:contact=>{
      reported.push(contact);
      if(linkedRuntime)runtime.reportActionContact(contact);
    },
    requestFrame:cb=>{frames.push(cb);return frames.length;},
    cancelFrame:()=>{},
    animate:(node,keyframes,options)=>{
      let resolve;
      const finished=new Promise(done=>resolve=done);
      const handle={
        node,keyframes,options,finished,
        finish(){resolve({status:"finished"});},
        cancel(){this.cancelled=true;resolve({status:"cancelled"});}
      };
      animations.push(handle);
      return handle;
    }
  });
  presenter=createCombatResolutionPresenter({
    fx,
    visuals:{
      playEventFor:()=>Promise.resolve({status:"finished"}),
      cancelFor:()=>{}
    },
    setTimer:()=>1,
    clearTimer:()=>{}
  });
  const session=createCombatSession({distance:"short",fighters:[fighter("player"),fighter("opponent")]});
  runtime=createCombatRuntime({
    session,now:()=>nowMs,
    setTimer:cb=>{const id=++uid;scheduled.set(id,cb);return id;},
    clearTimer:id=>scheduled.delete(id),
    onRelease:({action})=>{
      for(const plan of planSkillReleaseFx({
        action,actorSlot:"player",targetSlot:"opponent"
      }))fx.play(plan);
    },
    onResolved:resolution=>presenter.presentOutcome({
      resolution,actorSlot:"player",targetSlot:"opponent"
    })
  });
  if(linkedRuntime)runtime.start();
  return {
    fx,arena,frames,animations,reported,session,presenter,runtime,scheduled,
    now(ms){nowMs=ms;},
    step(scale){
      const shell=arena.nodes[0];
      shell.currentScale=scale;
      const callback=frames.shift();
      assert.equal(typeof callback,"function");
      callback();
    },
    dispose(){runtime.dispose();presenter.dispose();fx.dispose();}
  };
}
test("150% is BOTH the sprite-shell radius and the exact swept-hit radius, not a hidden collision-only setting",()=>{
  const scene=fixture({linkedRuntime:false});
  const fx=scene.fx;
  fx.play({
    type:"projectile",skillId:"wave",fromSlot:"player",targetSlot:"opponent",
    durationMs:2000,expandingWave:makeWave().expandingWave
  });
  const shell=scene.arena.nodes[0],anim=scene.animations[0];
  assert.equal(shell.style.width,"3000px");
  assert.equal(shell.style.height,"3000px");
  assert.match(shell.className,/skill-fx--sprite-shell/);
  const tacticalLine=shell.children.find(child=>child.className==="skill-fx__tactical-radius");
  const authoredSprite=shell.children.find(child=>child.dataset.assetId==="test:fire-sphere");
  assert.ok(tacticalLine && authoredSprite);
  assert.ok(shell.children.indexOf(tacticalLine)<shell.children.indexOf(authoredSprite));
  assert.equal(authoredSprite.style.backgroundSize,"100% 100%");
  assert.equal(authoredSprite.style.width,undefined); // CSS sizes child to full shell
  assert.match(anim.keyframes[0].transform,/scale\(0\.02\)/);
  assert.equal(anim.keyframes[1].transform,"translate(-50%, -50%) scale(1)");
  scene.dispose();
});
test("real contact deals damage once and the wave keeps visually expanding until its animation finishes",async()=>{
  const h=fixture();
  assert.equal(h.runtime.startSkill({
    actorId:"player",targetId:"opponent",skill:makeWave()
  }).ok,true);
  const shell=h.arena.nodes[0];
  assert.ok(shell,"real Runtime must release and draw the same wave renderer");
  h.now(250);
  h.step(0.05);
  assert.equal(h.reported.length,0);
  h.now(300);
  // At 150% arena width, the opponent's opaque edge is crossed at ~12% scale.
  h.step(0.15);
  assert.equal(h.reported.length,1);
  assert.equal(h.session.snapshot().fighters.opponent.hp,80);
  assert.equal(h.fx.activeCount,1,"sprite must remain mounted after damage");
  assert.equal(shell.removed,undefined);
  const frameCount=h.frames.length;
  // Contact is settled; the ongoing visual may no longer damage or clash.
  assert.equal(frameCount,0,"real contact turns off the RAF collision sensor");
  shell.currentScale=1;
  assert.equal(shell.getBoundingClientRect().width,3000);
  assert.equal(h.session.snapshot().fighters.opponent.hp,80);
  h.animations[0].finish();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(h.fx.activeCount,0);
  assert.equal(shell.removed,true);
  h.dispose();
});
test("early interruption still removes a wave; preserving requires a reported hit of the same skill",()=>{
  const h=fixture({linkedRuntime:false});
  const play=()=>h.fx.play({
    type:"projectile",skillId:"wave",fromSlot:"player",targetSlot:"opponent",
    durationMs:2000,expandingWave:makeWave().expandingWave
  });
  play();
  assert.equal(h.fx.cancelProjectileFor("player",{
    preserveContactedWave:true,skillId:"wave"
  }),1,"no confirmed hit must not preserve anything");
  assert.equal(h.fx.activeCount,0);
  play();
  h.step(0.05);
  h.step(0.11);
  assert.equal(h.reported.length,1);
  assert.equal(h.fx.cancelProjectileFor("player",{
    preserveContactedWave:true,skillId:"wrong-skill"
  }),1,"wrong skill may not preserve the wave");
  assert.equal(h.fx.activeCount,0);
  h.dispose();
});
test("Presenter passes preservation only on confirmed hits; ordinary misses and clashes keep cancellation",()=>{
  const calls=[];
  const presenter=createCombatResolutionPresenter({
    fx:{play:()=>({status:"ignored",finished:Promise.resolve()}),
      cancelProjectileFor:(...args)=>{calls.push(args);return 1;}},
    visuals:{cancelFor:()=>{},playEventFor:()=>Promise.resolve({status:"finished"})},
    setTimer:()=>1,clearTimer:()=>{}
  });
  const resolution=outcome=>({
    ok:true,outcome,events:[
      {type:"skill-release",form:"projectile",skillId:"wave"},
      {type:"skill-arrive",skillId:"wave"},
      ...(outcome==="hit"?[{type:"hit",actorId:"opponent",appliedDamage:20,hpAfter:80}]:[])
    ]
  });
  presenter.presentOutcome({resolution:resolution("hit"),actorSlot:"player",targetSlot:"opponent"});
  presenter.presentOutcome({resolution:resolution("evaded"),actorSlot:"player",targetSlot:"opponent"});
  assert.equal(calls.length,2);
  assert.equal(calls[0][1].preserveContactedWave,true);
  assert.equal(calls[0][1].skillId,"wave");
  assert.equal(calls[1][1].preserveContactedWave,false);
  presenter.presentOutcome({resolution:resolution("clashed"),actorSlot:"player",targetSlot:"opponent"});
  assert.equal(calls.length,3);
  assert.equal(calls[2][1],undefined,"clash must keep its old strict cancellation");
  presenter.dispose();
});
