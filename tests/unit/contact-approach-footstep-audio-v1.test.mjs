import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
import { planAnimation } from "../../src/core/animation/plan-animation.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";
import { createDomCombatAudio } from "../../src/adapters/audio/dom-combat-audio.js";

const read = path => readFile(new URL("../../"+path,import.meta.url),"utf8");

async function approachFootfalls(profileId) {
  const profile = JSON.parse(await read("data/profiles/"+profileId+".profile.json"));
  const actor = normalizeVisualActor({
    id:"actor",creatureId:"creature",profile:profileId,asset:"test.webp",
    view:"player",facing:"right",scale:1
  });
  const plan = planAnimation({
    event:{type:"ground-attack",actorId:"actor",targetId:"enemy",intensity:1,metadata:{
      targetTranslateX:200,targetTranslateY:-40,arenaHeight:300,travelMs:1400
    }},
    actor,profile
  });
  return plan.cues?.filter(cue=>cue.type==="footfall")??[];
}

test("canonical contact approach cues have 4 massive, 2 quadruped, 3 biped and zero flying/serpentine footfalls", async()=>{
  for(const [profile,count] of [["massive",4],["quadruped",2],["biped",3],["flying",0],["serpentine",0]]){
    const cues=await approachFootfalls(profile);
    assert.equal(cues.length,count,profile);
    assert.ok(cues.every(cue=>cue.atMs>=0&&cue.atMs<=1400),profile+" cue must follow actual approach");
  }
});

test("presenter turns each real contact cue into a creature movement sample, not a skill sound",()=>{
  const events=[], callbacks=[];
  const presenter=createCombatResolutionPresenter({
    visuals:{
      playEventFor(){return Promise.resolve({status:"finished"})},
      cancelFor(){},
      playApproachFor(actor,mode,options){callbacks.push(options);return Promise.resolve({status:"finished"})}
    },
    audio:{play(event){events.push(event);return {status:"ignored",finished:Promise.resolve({status:"ignored"})}}}
  });
  const action={skill:{id:"contact-skill",form:"contact",approachMode:"ground"},travelMs:1400,targetId:"opponent"};
  presenter.presentRelease({action,actorSlot:"player",targetSlot:"opponent"});
  assert.equal(typeof callbacks[0].onFootfall,"function");
  callbacks[0].onFootfall({type:"footfall",atMs:350});
  callbacks[0].onFootfall({type:"footfall",atMs:700});
  callbacks[0].onFootfall({type:"footfall",atMs:1050});
  callbacks[0].onFootfall({type:"footfall",atMs:1400});
  const footsteps=events.filter(event=>event.type==="movement");
  assert.equal(footsteps.length,4);
  assert.ok(footsteps.every(event=>event.actorSlot==="player"&&event.loop===false));
  assert.equal(events.filter(event=>event.type==="travel").length,0);
  assert.ok(events.some(event=>event.type==="release"));
  assert.ok(!events.some(event=>event.type==="impact"));
  presenter.dispose();
});

test("contact approach with no footfalls can trigger one travel sample and other forms do not get step callbacks",()=>{
  const events=[], callbacks=[];
  const presenter=createCombatResolutionPresenter({
    visuals:{
      playEventFor(){return Promise.resolve({status:"finished"})},
      cancelFor(){},
      playApproachFor(actor,mode,options){callbacks.push(options);return Promise.resolve({status:"finished"})}
    },
    audio:{play(event){events.push(event);return {status:"ignored",finished:Promise.resolve({status:"ignored"})}}}
  });
  presenter.presentRelease({action:{skill:{id:"flight",form:"contact",approachMode:"aerial"},travelMs:1300},actorSlot:"player",targetSlot:"opponent"});
  assert.equal(typeof callbacks[0].onFootfall,"function");
  callbacks[0].onFootfall({type:"movement",atMs:0});
  assert.equal(events.filter(e=>e.type==="movement"&&e.actorSlot==="player").length,1);
  presenter.presentRelease({action:{skill:{id:"projectile",form:"projectile",approachMode:"ground"},travelMs:1300},actorSlot:"player",targetSlot:"opponent"});
  assert.equal(callbacks[1].onFootfall,null);
  presenter.presentRelease({action:{skill:{id:"silent",form:"contact",approachMode:"ground"},travelMs:0},actorSlot:"player",targetSlot:"opponent"});
  assert.equal(callbacks[2].onFootfall,null);
  presenter.dispose();
});

test("audio adapter plays creature movement one-shot without changing projectile travel defaults",()=>{
  const created=[];
  const audio=createDomCombatAudio({
    presentationForSkill(){return {travelSound:{assetId:"sound:travel",loop:true}}},
    movementSoundForActor(){return {assetId:"sound:step",volume:0.7}},
    resolveAudioAsset(){return {url:"https://example.test/step.mp3",loop:true}},
    createAudio(){const item={volume:1,loop:false,currentTime:0,play(){return Promise.resolve()},pause(){}};created.push(item);return item}
  });
  const oneShot=audio.play({type:"movement",actorSlot:"player",loop:false});
  assert.equal(oneShot.status,"running");
  assert.equal(oneShot.loop,false);
  assert.equal(created[0].loop,false);
  oneShot.stop();
  const projectile=audio.play({type:"travel",skillId:"projectile"});
  assert.equal(projectile.loop,true);
  projectile.stop();
  audio.dispose();
});

test("visual controller uses existing footfall cue scheduler for attack contact audio, and uses one start sound when zero cues",async()=>{
  const source=await read("src/ui/demo-app.js");
  const presenter=await read("src/adapters/renderer/combat-resolution-presenter.js");
  const html=await read("examples/dom-demo/capture-editor-v2.html");
  assert.match(source,/function schedulePlanCues[\s\S]*?onCue\?\./);
  assert.match(source,/function playApproachFor[\s\S]*?onFootfall[\s\S]*?onCue:/);
  assert.match(source,/plan\.cues[\s\S]*?onFootfall\(\{/);
  assert.match(presenter,/onFootfall:[\\s\\S]*?type: "movement"/);
  assert.match(html,/Son du trajet \\(projectile \\/ rayon\\)/);
  assert.match(html,/data-creature-audio-movement/);
});

test("canceling a contact attack stops active footsteps and rejects delayed cues from the old approach",()=>{
  const plays=[], callbacks=[];
  const presenter=createCombatResolutionPresenter({
    visuals:{
      playEventFor(){return Promise.resolve({status:"finished"})},
      cancelFor(){},
      playApproachFor(actor,mode,options){callbacks.push(options);return Promise.resolve({status:"finished"})}
    },
    audio:{play(event){
      plays.push(event);
      if(event.type!=="movement")return {status:"ignored",finished:Promise.resolve({status:"ignored"})};
      const handle={status:"running",finished:new Promise(()=>{}),stop(){handle.stopped=true}};
      plays.at(-1).handle=handle;
      return handle;
    }}
  });
  presenter.presentRelease({action:{skill:{id:"step",form:"contact",approachMode:"ground"},travelMs:1000},actorSlot:"player",targetSlot:"opponent"});
  const first=callbacks.at(-1);
  first.onFootfall({type:"footfall",atMs:300});
  const firstHandle=plays.filter(e=>e.type==="movement")[0].handle;
  assert.equal(firstHandle.stopped,undefined);
  assert.equal(presenter.cancelActionPresentation("player"),true);
  assert.equal(firstHandle.stopped,true);
  first.onFootfall({type:"footfall",atMs:600});
  assert.equal(plays.filter(e=>e.type==="movement").length,1,"stale timers cannot produce a footstep after cancellation");
  presenter.presentRelease({action:{skill:{id:"new",form:"contact",approachMode:"aerial"},travelMs:800},actorSlot:"player",targetSlot:"opponent"});
  callbacks.at(-1).onFootfall({type:"movement",atMs:0});
  assert.equal(plays.filter(e=>e.type==="movement").length,2);
  presenter.dispose();
  assert.equal(plays.filter(e=>e.type==="movement")[1].handle.stopped,true);
});

test("semantic outcome rejects future footfall cues but does not cut off a triggered one-shot",()=>{
  const events=[],callbacks=[];
  const presenter=createCombatResolutionPresenter({
    visuals:{
      playEventFor(){return Promise.resolve({status:"finished"})},
      cancelFor(){},
      playApproachFor(actor,mode,options){callbacks.push(options);return Promise.resolve({status:"finished"})}
    },
    audio:{play(event){
      events.push(event);
      const h={status:"running",finished:new Promise(()=>{}),stop(){h.stopped=true}};
      event.handle=h;return h;
    }}
  });
  presenter.presentRelease({action:{skill:{id:"strike",form:"contact",approachMode:"ground"},travelMs:500},actorSlot:"player",targetSlot:"opponent"});
  callbacks[0].onFootfall({type:"footfall",atMs:250});
  const step=events.find(e=>e.type==="movement").handle;
  presenter.presentOutcome({
    resolution:{ok:true,outcome:"hit",events:[
      {type:"skill-release",form:"contact",skillId:"strike"},
      {type:"skill-arrive",skillId:"strike"}
    ]},
    actorSlot:"player",targetSlot:"opponent"
  });
  assert.equal(step.stopped,undefined,"natural footstep tail survives the impact");
  callbacks[0].onFootfall({type:"footfall",atMs:500});
  assert.equal(events.filter(e=>e.type==="movement").length,1);
  presenter.dispose();
  assert.equal(step.stopped,true);
});
