import test from "node:test";
import assert from "node:assert/strict";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";

function visuals() {
  return {
    playEventFor() { return Promise.resolve({status:"finished"}); },
    cancelFor() {},
    playApproachFor() { return Promise.resolve({status:"finished"}); }
  };
}

test("beam release uses the canonical travel sound until authoritative impact and cancels the beam", () => {
  const audioEvents = [];
  const fxEvents = [];
  let travelStops = 0;
  const presenter = createCombatResolutionPresenter({
    visuals: visuals(),
    fx: {
      play(plan) { fxEvents.push("play:" + plan.type); return {status:"ignored"}; },
      cancelProjectileFor(slot) {fxEvents.push("cancel:" + slot); return 1;}
    },
    audio: {
      play(event) {
        audioEvents.push(event.type);
        if (event.type === "travel") {
          return {
            status:"running",loop:true,
            finished:new Promise(() => {}),
            stop() {travelStops++;}
          };
        }
        return {status:"ignored",finished:Promise.resolve({status:"ignored"})};
      }
    }
  });
  const action = {
    skill:{id:"water-beam",form:"beam",approachMode:"none",element:"water"},
    preparationMs:0,travelMs:900,targetId:"opponent"
  };
  presenter.presentRelease({action,actorSlot:"player",targetSlot:"opponent"});
  assert.ok(fxEvents.includes("play:beam"),"same beam FX owner");
  assert.ok(audioEvents.includes("travel"),"beam must play its configured travel audio");
  assert.equal(travelStops,0,"travel sound must not stop before contact");

  presenter.presentOutcome({
    resolution:{
      ok:true,actionType:"skill",actorId:"player",targetId:"opponent",
      skillId:"water-beam",outcome:"hit",
      events:[
        {type:"skill-release",skillId:"water-beam",form:"beam",atMs:0},
        {type:"skill-arrive",skillId:"water-beam",atMs:900},
        {type:"hit",actorId:"opponent",hpBefore:100,hpAfter:75}
      ]
    },
    actorSlot:"player",targetSlot:"opponent"
  });
  assert.equal(travelStops,1,"looping travel sound stops exactly at outcome");
  assert.equal(fxEvents.filter(x=>x==="cancel:player").length,1,"beam FX must be cleaned up at outcome");
  assert.ok(audioEvents.includes("impact"),"canonical impact sound stays at real resolution");
  presenter.dispose();
});

test("beam shares authored cast and impact offsets at both ends during target motion", async () => {
  const nodes=[];
  const frames=new Map();let nextId=0,resolveAnimation;
  let targetX=440, targetY=120;
  function element() {
    return {className:"",dataset:{},style:{},children:[],
      append(...children){this.children.push(...children)},
      remove(){this.removed=true}};
  }
  const arena={
    ownerDocument:{createElement:element},
    append(node){nodes.push(node)},
    getBoundingClientRect(){return {left:0,top:0,width:620,height:300}}
  };
  const anchors={
    player:{getBoundingClientRect(){return {left:50,top:120,width:40,height:40}}},
    opponent:{getBoundingClientRect(){return {left:targetX,top:targetY,width:40,height:40}}}
  };
  const sprite=(id)=>({assetId:id,url:"https://example.test/"+id+".webp",frameCount:1,displayScale:1});
  const renderer=createDomSkillFxRenderer({
    arena,anchors,
    sourceAnchorFor(_slot,name){assert.equal(name,"mouth");return {left:70,top:140,width:0,height:0}},
    presentationForSkill(){return {
      cast:{offsetX:30,offsetY:-10},
      beamStart:sprite("start"),
      travel:sprite("body"),
      impact:{...sprite("impact"),offsetX:15,offsetY:5},
      travelSourceAnchor:"mouth",feedback:null
    }},
    requestFrame(fn){let id=++nextId;frames.set(id,fn);return id},
    cancelFrame(id){frames.delete(id)},
    animate(){return {finished:new Promise(r=>{resolveAnimation=r}),cancel(){}}}
  });
  const handle=renderer.play({type:"beam",skillId:"water-beam",fromSlot:"player",targetSlot:"opponent",durationMs:900});
  const node=nodes[0];assert.ok(node);
  assert.equal(node.style.left,"100px","body and start start exactly on the mouth cast");
  assert.equal(node.style.top,"130px","cast vertical offset follows source");
  assert.equal(Number.parseFloat(node.style.width),Math.hypot(375,15),"body must terminate at authored target impact offset");

  targetX=480;targetY=140;
  const follow=[...frames.values()][0];
  assert.ok(follow);
  follow();
  assert.equal(Number.parseFloat(node.style.width),Math.hypot(415,35),"moving target keeps the same offset and attachment");
  assert.deepEqual(node.children.map(x=>x.dataset.beamPart),["body","start","target"]);
  const body=node.children[0];
  assert.ok(Number.parseFloat(body.style.left)<0,"beam body must overlap underneath the source cap, not start at its midpoint");
  assert.ok(Number.parseFloat(body.style.width)>Number.parseFloat(node.style.width),"beam body must extend underneath both caps without changing contact length");
  assert.equal(node.children[1].style.left,"0","source cap remains anchored at the mouth");
  assert.equal(node.children[2].style.left,"100%","target cap remains at the impact anchor");
  resolveAnimation();
  assert.deepEqual(await handle.finished,{status:"arrived"});
  assert.equal(renderer.activeCount,0);
});
