import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCreaturePresentationBinding} from "../../src/contracts/creature-presentation-binding.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {importCaptureTransferJsonV1,exportCaptureCreatureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {createDomCombatAudio} from "../../src/adapters/audio/dom-combat-audio.js";
import {createCombatResolutionPresenter} from "../../src/adapters/renderer/combat-resolution-presenter.js";

test("creature-only movement mode roundtrips and old exports remain once",()=>{
 const read=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url)));
 const raw=read("data/capture/source-exports/gensrpg-capture-creature-crea_dracendre-original-before-2026-10-23.json");
 const original=normalizeCreaturePresentationBinding(raw.draft.presentation);
 assert.equal(original.audio.movement.mode,undefined);
 const registry=normalizeCaptureStatRegistryV1(read("data/capture/monster-capture-stat-registry.v1.json"));
 const modified=structuredClone(raw);
 modified.draft.presentation.audio.movement={...original.audio.movement,mode:"repeat",repeatIntervalMs:300};
 const binding=normalizeCreaturePresentationBinding(modified.draft.presentation);
 assert.deepEqual(binding.audio.movement,{assetId:original.audio.movement.assetId,volume:1,mode:"repeat",repeatIntervalMs:300});
 const transfer=importCaptureTransferJsonV1(JSON.stringify(modified),{statRegistry:registry});
 const output=importCaptureTransferJsonV1(exportCaptureCreatureTransferJsonV1(transfer.value,{statRegistry:registry}),{statRegistry:registry});
 assert.deepEqual(output.value.draft.presentation.audio.movement,binding.audio.movement);
 const bad=structuredClone(modified.draft.presentation);
 bad.audio.movement.repeatIntervalMs=0;
 assert.throws(()=>normalizeCreaturePresentationBinding(bad),/repeatIntervalMs/);
 bad.audio.movement.repeatIntervalMs=300;
 bad.audio.movement.mode="random";
 assert.throws(()=>normalizeCreaturePresentationBinding(bad),/mode/);
});
test("same audio owner drives repeated aerial wing beats after each sample completes, and cancels on interrupt",async()=>{
 const events=[],sounds=[],timers=new Map(),approaches=[];
 let serial=0;
 const audio={
  movementForCreature(slot){return {assetId:"sound:"+slot,mode:"repeat",repeatIntervalMs:300}},
  play(e){
   events.push(e);
   if(e.type!=="movement")return {status:"ignored",finished:Promise.resolve({status:"ignored"})};
   let settle;
   const finished=new Promise(res=>{settle=res});
   const h={status:"running",finished,stop(){settle({status:"stopped"});return true},end(){settle({status:"finished"})}};
   sounds.push(h);return h;
  }
 };
 const presenter=createCombatResolutionPresenter({
  audio,
  visuals:{
   playEventFor(){return Promise.resolve({status:"finished"})},cancelFor(){},
   playApproachFor(slot,mode,opts){approaches.push({slot,mode,opts});return new Promise(()=>{})}
  },
  setTimer(fn,ms){const id=++serial;timers.set(id,{fn,ms});return id},
  clearTimer(id){timers.delete(id)}
 });
 const action={skill:{id:"flap",form:"contact",approachMode:"aerial"},travelMs:2000};
 presenter.presentRelease({action,actorSlot:"player",targetSlot:"opponent"});
 approaches[0].opts.onFootfall();
 approaches[0].opts.onFootfall();
 assert.equal(events.filter(x=>x.type==="movement").length,1,"aerial movement starts one owned repeating track");
 sounds[0].end();
 for(let i=0;i<5;i++)await Promise.resolve();
 assert.equal(timers.size,1);
 const [id,delayed]=[...timers.entries()][0];
 assert.equal(delayed.ms,300);
 timers.delete(id);delayed.fn();
 assert.equal(events.filter(x=>x.type==="movement").length,2);
 presenter.cancelActionPresentation("player");
 assert.equal(timers.size,0);
 sounds[1].end();
 for(let i=0;i<5;i++)await Promise.resolve();
 assert.equal(timers.size,0);
 presenter.dispose();
});
test("aerial loop stops on outcome, terrestrial steps stay separate and projectiles retain skill audio",async()=>{
 const events=[],handles=[],approaches=[];
 const audio={
  movementForCreature(){return {assetId:"sound:wings",mode:"loop",repeatIntervalMs:200}},
  play(e){
    events.push(e);
    if(e.type!=="movement")return {status:"ignored",finished:Promise.resolve({status:"ignored"})};
    const handle={status:"running",loop:e.loop,stop(){handle.stopped=true},finished:new Promise(()=>{})};
    handles.push(handle);return handle;
  }
 };
 const presenter=createCombatResolutionPresenter({
  audio,
  visuals:{playEventFor(){return Promise.resolve({status:"finished"})},cancelFor(){},
   playApproachFor(slot,mode,opts){approaches.push({slot,mode,opts});return new Promise(()=>{})}}
 });
 presenter.presentRelease({action:{skill:{id:"aerial",form:"contact",approachMode:"aerial"},travelMs:1800},actorSlot:"player",targetSlot:"opponent"});
 approaches[0].opts.onFootfall();approaches[0].opts.onFootfall();
 assert.equal(events.filter(e=>e.type==="movement").length,1);
 assert.equal(events.find(e=>e.type==="movement").loop,true);
 presenter.presentOutcome({resolution:{ok:true,outcome:"evaded",events:[]},actorSlot:"player",targetSlot:"opponent"});
 assert.equal(handles[0].stopped,true,"loop must end at semantic arrival");
 presenter.presentRelease({action:{skill:{id:"melee",form:"contact",approachMode:"ground"},travelMs:1400},actorSlot:"opponent",targetSlot:"player"});
 approaches[1].opts.onFootfall();approaches[1].opts.onFootfall();
 assert.equal(events.filter(e=>e.type==="movement"&&e.actorSlot==="opponent").length,2);
 assert.ok(events.filter(e=>e.type==="movement"&&e.actorSlot==="opponent").every(e=>e.loop===false));
 presenter.presentRelease({action:{skill:{id:"fireball",form:"projectile",approachMode:"none"},travelMs:700},actorSlot:"player",targetSlot:"opponent"});
 assert.ok(events.some(e=>e.type==="travel"&&e.skillId==="fireball"));
 presenter.dispose();
});
test("real DOM audio respects creature loop while rejecting skill fallback and editor exposes all modes",()=>{
 const played=[],stops=[];
 const sound=createDomCombatAudio({
  presentationForCreature:()=>({movement:{assetId:"sound:wings",mode:"loop",volume:0.5}}),
  presentationForSkill:()=>({travelSound:{assetId:"skill:projectile",loop:true}}),
  resolveAudioAsset:id=>({url:"https://sound.test/"+id}),
  createAudio:url=>({url,volume:1,loop:false,currentTime:0,play(){played.push({url,loop:this.loop,volume:this.volume});return Promise.resolve()},pause(){stops.push(url)}})
 });
 assert.equal(sound.movementForCreature("player").mode,"loop");
 const h=sound.play({type:"movement",actorSlot:"player",loop:true});
 assert.equal(h.loop,true);assert.equal(played[0].volume,0.5);
 h.stop();assert.equal(stops.length,1);
 sound.dispose();
 const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 assert.match(html,/data-creature-audio-movement-mode/);
 assert.match(html,/data-creature-audio-movement-interval/);
});
