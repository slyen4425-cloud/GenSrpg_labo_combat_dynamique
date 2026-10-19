import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalizeCreaturePresentationBinding} from "../../src/contracts/creature-presentation-binding.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {importCaptureTransferJsonV1,exportCaptureCreatureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {createDomCombatAudio} from "../../src/adapters/audio/dom-combat-audio.js";
const read=path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
test("reaction audio belongs to creature presentation, keeps author preset intact, and survives full transfer roundtrip",async()=>{
 const registry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
 const raw=JSON.parse(await read("data/capture/showcase/crea_scar_2.capture-creature-transfer-v1.json"));
 assert.equal(raw.draft.presentation.audio.dodge,undefined,"do not assign unsolicited sound to authored Scarabacier");
 assert.equal(raw.draft.presentation.audio.defense,undefined,"do not assign unsolicited defense sound");
 const customized=structuredClone(raw);
 customized.draft.presentation.audio.dodge={assetId:"gensrpg:sound:effect-ad54aecf",volume:0.35};
 customized.draft.presentation.audio.defense={assetId:"gensrpg:sound:effect-ff9cee8c",volume:0.8};
 const norm=normalizeCreaturePresentationBinding(customized.draft.presentation);
 assert.deepEqual(norm.audio.dodge,customized.draft.presentation.audio.dodge);
 assert.deepEqual(norm.audio.defense,customized.draft.presentation.audio.defense);
 assert.equal(norm.audio.movement.assetId,raw.draft.presentation.audio.movement.assetId);
 const restored=importCaptureTransferJsonV1(JSON.stringify(customized),{statRegistry:registry});
 assert.equal(restored.kind,"creature");
 assert.deepEqual(restored.value.draft.presentation.audio.dodge,norm.audio.dodge);
 assert.deepEqual(restored.value.draft.presentation.audio.defense,norm.audio.defense);
 const roundtrip=importCaptureTransferJsonV1(exportCaptureCreatureTransferJsonV1(restored.value,{statRegistry:registry}),{statRegistry:registry});
 assert.deepEqual(roundtrip.value.draft.presentation.audio,norm.audio);
 assert.deepEqual(roundtrip.value.loadout,raw.loadout,"equipped Cisaille preserved");
 assert.equal(roundtrip.value.draft.combat.reaction.type,"defense");
 assert.equal(roundtrip.value.draft.combat.reaction.damageReductionPct,80);
 assert.equal(roundtrip.value.draft.combat.reaction.activeWindowMs,700);
});
test("combat audio resolves dodge and defense only through currently active creature slot",async()=>{
 const events=[];
 const sounds={player:{dodge:{assetId:"sound:step",volume:0.3},defense:{assetId:"sound:guard",volume:0.8},movement:{assetId:"sound:foot"}},opponent:{defense:{assetId:"sound:heavy",volume:0.4}}};
 const audio=createDomCombatAudio({
  presentationForCreature:actor=>sounds[actor]??null,
  presentationForSkill:()=>({impactSound:{assetId:"sound:skill"}}),
  resolveAudioAsset:id=>({url:"https://test.invalid/"+id,loop:true}),
  createAudio(url){const a={url,volume:1,loop:true,currentTime:0,play(){events.push({url:this.url,volume:this.volume,loop:this.loop});return Promise.resolve()},pause(){}};return a;}
 });
 assert.equal(audio.play({type:"dodge",actorSlot:"player",loop:false}).status,"running");
 assert.equal(audio.play({type:"defense",actorSlot:"player",loop:false}).status,"running");
 assert.equal(audio.play({type:"defense",actorSlot:"opponent",loop:false}).status,"running");
 assert.deepEqual(events.map(x=>x.url),["https://test.invalid/sound:step","https://test.invalid/sound:guard","https://test.invalid/sound:heavy"]);
 assert.deepEqual(events.map(x=>x.volume),[0.3,0.8,0.4]);
 assert.ok(events.every(x=>x.loop===false),"reaction is one-shot even when the asset is marked loop");
 assert.equal(audio.play({type:"dodge",actorSlot:"opponent",loop:false}).status,"ignored","no fallback sound from skill or other creature");
 assert.equal(audio.play({type:"defense",actorSlot:null}).status,"ignored");
 assert.equal(events.length,3);
 audio.dispose();
 assert.equal(audio.play({type:"dodge",actorSlot:"player"}).status,"disposed");
});
test("editor exposes two independent real catalog selectors and both successful player and AI reaction events play optional audio",async()=>{
 const html=await read("examples/dom-demo/capture-editor-v2.html");
 const editor=await read("src/ui/capture-editor-human-v2.js");
 const combat=await read("src/ui/combat-2v2-test-ui.js");
 const contract=await read("src/contracts/creature-presentation-binding-v1.js");
 const sceneAudio=await read("src/adapters/audio/dom-combat-audio.js");
 for(const type of ["dodge","defense"]){
  assert.match(html,new RegExp("data-creature-audio-"+type+" data-private-audio"));
  assert.match(html,new RegExp("data-audio-roles=\\\""+type));
  assert.match(editor,new RegExp("presentation\\?\\.audio\\?\\."+type));
  assert.match(editor,new RegExp("selectedValue\\(root,\\\"\\[data-creature-audio-"+type+"\\]\\\"\\)"));
  assert.match(contract,new RegExp('"'+type+'"'));
  assert.match(sceneAudio,new RegExp('case "'+type+'"'));
 }
 assert.match(combat,/combatAudio\.play\(\{type:reaction\.type,actorSlot:controlledActorId\(\),loop:false\}\)/);
 assert.match(combat,/combatAudio\.play\(\{type:decision\.status === "defended"\?"defense":"dodge",actorSlot:decision\.actorId,loop:false\}\)/);
 assert.ok(combat.indexOf("if (!result.ok)") < combat.indexOf("combatAudio.play({type:reaction.type"),"failed activation must not play audio");
});
