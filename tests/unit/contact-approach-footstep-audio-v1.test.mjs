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

test("presenter turns each real contact footfall into a one-shot travel sound for that skill, not release/impact",()=>{
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
  const travel=events.filter(event=>event.type==="travel");
  assert.equal(travel.length,4);
  assert.ok(travel.every(event=>event.skillId==="contact-skill"&&event.loop===false));
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
  assert.equal(events.filter(e=>e.type==="travel"&&e.skillId==="flight").length,1);
  presenter.presentRelease({action:{skill:{id:"projectile",form:"projectile",approachMode:"ground"},travelMs:1300},actorSlot:"player",targetSlot:"opponent"});
  assert.equal(callbacks[1].onFootfall,null);
  presenter.presentRelease({action:{skill:{id:"silent",form:"contact",approachMode:"ground"},travelMs:0},actorSlot:"player",targetSlot:"opponent"});
  assert.equal(callbacks[2].onFootfall,null);
  presenter.dispose();
});

test("audio adapter overrides loop=true with a one-shot for footfall without changing projectile travel defaults",()=>{
  const created=[];
  const audio=createDomCombatAudio({
    presentationForSkill(){return {travelSound:{assetId:"sound:travel",loop:true}}},
    resolveAudioAsset(){return {url:"https://example.test/step.mp3",loop:true}},
    createAudio(){const item={volume:1,loop:false,currentTime:0,play(){return Promise.resolve()},pause(){}};created.push(item);return item}
  });
  const oneShot=audio.play({type:"travel",skillId:"contact",loop:false});
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
  assert.match(presenter,/onFootfall:[\s\S]*?type: "travel"/);
  assert.match(html,/Son du trajet \(projectile \/ rayon \/ contact\)/);
});
