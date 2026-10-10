import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { createDomCombatAudio } from "../../src/adapters/audio/dom-combat-audio.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";
import { normalizeCreaturePresentationBinding } from "../../src/contracts/creature-presentation-binding.js";
import { importCaptureTransferJsonV1, exportCaptureCreatureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

const read = path => readFile(new URL("../../" + path, import.meta.url), "utf8");
const CREATURE_FILE = "data/capture/showcase/crea-loup.capture-creature-transfer-v1.json";

test("new creature movement sound is normalized without changing old V2/V3 presentation and transfers roundtrip", async () => {
  const registry = normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const oldRaw = JSON.parse(await read(CREATURE_FILE));
  const original = normalizeCreaturePresentationBinding(oldRaw.draft.presentation);
  assert.equal(original.audio.movement, undefined);
  const raw = structuredClone(oldRaw);
  raw.draft.presentation.audio.movement = { assetId:"gensrpg:sound:light-steps-01", volume:0.7 };
  const binding = normalizeCreaturePresentationBinding(raw.draft.presentation);
  assert.deepEqual(binding.audio.movement, {assetId:"gensrpg:sound:light-steps-01", volume:0.7});
  assert.equal(binding.audio.ko, undefined);
  const transfer = importCaptureTransferJsonV1(JSON.stringify(raw), { statRegistry: registry });
  assert.equal(transfer.kind, "creature");
  assert.deepEqual(transfer.value.draft.presentation.audio.movement, binding.audio.movement);
  const output = importCaptureTransferJsonV1(exportCaptureCreatureTransferJsonV1(transfer.value, { statRegistry: registry }), { statRegistry: registry });
  assert.deepEqual(output.value.draft.presentation.audio.movement, binding.audio.movement);
  assert.equal(output.value.draft.id, "crea-loup");
});

test("same contact skill plays distinct creature-owned footsteps for light and heavy actor slots", () => {
  const created = [];
  const sounds = {
    player: { movement: {assetId:"sound:light", volume:0.25} },
    opponent: { movement: {assetId:"sound:heavy", volume:0.9} }
  };
  const audio = createDomCombatAudio({
    presentationForSkill(skillId){ return {travelSound:{assetId:"sound:projectile", loop:true}}; },
    presentationForCreature(slot){ return sounds[slot] ?? null; },
    resolveAudioAsset(id){return {url:"https://sound.test/"+id, loop:true};},
    createAudio(url) { const a={url,volume:1,loop:true,currentTime:0,play(){created.push({url:this.url,volume:this.volume,loop:this.loop});return Promise.resolve()},pause(){}};return a; }
  });
  for (let i = 0; i < 2; i++) audio.play({type:"movement",actorSlot:"player",loop:false});
  for (let i = 0; i < 4; i++) audio.play({type:"movement",actorSlot:"opponent",loop:false});
  assert.equal(created.length,6);
  assert.deepEqual(created.slice(0,2).map(x=>x.url),Array(2).fill("https://sound.test/sound:light"));
  assert.deepEqual(created.slice(2).map(x=>x.url),Array(4).fill("https://sound.test/sound:heavy"));
  assert.ok(created.slice(0,2).every(x=>x.volume===0.25&&x.loop===false));
  assert.ok(created.slice(2).every(x=>x.volume===0.9&&x.loop===false));
  // A roster replacement switches the sound on the same actor slot immediately.
  sounds.player = { movement: {assetId:"sound:heavy",volume:0.9} };
  audio.play({type:"movement",actorSlot:"player",loop:false});
  assert.equal(created.at(-1).url,"https://sound.test/sound:heavy");
  assert.equal(created.at(-1).volume,0.9);
  sounds.player = {};
  const result = audio.play({type:"movement",actorSlot:"player",loop:false});
  assert.equal(result.status,"ignored", "NO fallback to skill or opponent audio");
  assert.equal(created.length,7);
  const projectile = audio.play({type:"travel",skillId:"shared-contact-skill",actorSlot:"player"});
  assert.equal(projectile.loop,true,"projectile keeps its loop and skill owner");
  assert.equal(created.at(-1).url,"https://sound.test/sound:projectile");
  audio.dispose();
});

test("contact presenter emits creature movement (not skill travel); projectile remains skill-owned travel", () => {
  const events=[], approaches=[];
  const presenter=createCombatResolutionPresenter({
    visuals:{playEventFor(){return Promise.resolve({status:"finished"})},cancelFor(){},playApproachFor(slot,mode,opts){approaches.push(opts);return Promise.resolve({status:"finished"})}},
    audio:{play(event){events.push(event);return {status:"ignored",finished:Promise.resolve({status:"ignored"})}}}
  });
  presenter.presentRelease({action:{skill:{id:"shared",form:"contact",approachMode:"ground"},travelMs:1000},actorSlot:"player",targetSlot:"opponent"});
  approaches[0].onFootfall({type:"footfall",atMs:250});
  approaches[0].onFootfall({type:"footfall",atMs:500});
  assert.deepEqual(events.filter(x=>x.type==="movement").map(x=>x.actorSlot),["player","player"]);
  assert.equal(events.filter(x=>x.type==="travel").length,0);
  presenter.presentRelease({action:{skill:{id:"projectile",form:"projectile",approachMode:"none"},travelMs:800},actorSlot:"opponent",targetSlot:"player"});
  assert.ok(events.some(x=>x.type==="travel"&&x.skillId==="projectile"));
  presenter.dispose();
});

test("editor saves creature movement sound and retains skill travel only for projectile/beam", async () => {
  const html=await read("examples/dom-demo/capture-editor-v2.html");
  const editor=await read("src/ui/capture-editor-human-v2.js");
  const source=await read("src/adapters/input/capture/capture-export-to-native-visual-source-v1.js");
  const visual=await read("src/ui/demo-app.js");
  const ui1=await read("src/ui/combat-test-ui.js");
  const ui2=await read("src/ui/combat-2v2-test-ui.js");
  assert.match(html,/Sons de la créature[\s\S]*?data-creature-audio-movement/);
  assert.match(html,/data-creature-audio-movement[^>]+data-private-audio/);
  assert.match(html,/data-audio-roles="movement"/);
  assert.match(editor,/\["data-creature-audio-movement"\]|\[data-creature-audio-movement\]/);
  assert.match(editor,/movement: selectedValue/);
  assert.match(editor,/for \(const role of \["attack", "hit", "ko", "movement"\]/);
  assert.match(source,/audio: binding\.audio/);
  assert.match(visual,/getCreatureAudioFor/);
  for(const ui of [ui1,ui2])assert.match(ui,/presentationForCreature/);
  assert.match(html,/Son du trajet \(projectile \/ rayon\)/);
  assert.doesNotMatch(html,/Son du trajet \(projectile \/ rayon \/ contact\)/);
});
