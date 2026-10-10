import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeCaptureCreatureTransferV1 } from "../../src/contracts/capture-creature-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCreaturePresentationBinding } from "../../src/contracts/creature-presentation-binding.js";
import { createDomCombatAudio } from "../../src/adapters/audio/dom-combat-audio.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";

const read = path => readFile(new URL("../../"+path,import.meta.url),"utf8");
test("creature owns optional movement sample through existing V2/V3 presentation and transfer roundtrip",async()=>{
  const raw=JSON.parse(await read("data/capture/showcase/crea-loup.capture-creature-transfer-v1.json"));
  const statRegistry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  raw.draft.presentation.audio.movement={assetId:"author:audio:light-steps",volume:0.45};
  const normalized=normalizeCaptureCreatureTransferV1(raw,statRegistry);
  assert.deepEqual(normalized.draft.presentation.audio.movement,{assetId:"author:audio:light-steps",volume:0.45});
  assert.deepEqual(normalizeCaptureCreatureTransferV1(JSON.parse(JSON.stringify(normalized)),statRegistry),normalized);
  const v3={...raw.draft.presentation,version:3};
  assert.deepEqual(normalizeCreaturePresentationBinding(v3).audio.movement,raw.draft.presentation.audio.movement);
  delete raw.draft.presentation.audio.movement;
  assert.equal(normalizeCaptureCreatureTransferV1(raw,statRegistry).draft.presentation.audio.movement,undefined,"legacy creator files stay valid");
});
test("single contact skill uses ACTOR's creature-owned movement sound not its skill travel audio",()=>{
  const output=[];
  const bySlot={player:{assetId:"author:audio:light-steps",volume:0.35},opponent:{assetId:"author:audio:heavy-steps",volume:0.9}};
  const audio=createDomCombatAudio({
    presentationForSkill:()=>({travelSound:{assetId:"author:audio:projectile",loop:true}}),
    movementSoundForActor:actor=>bySlot[actor]??null,
    resolveAudioAsset:id=>({url:"https://example.test/"+id,loop:true}),
    createAudio(url){const instance={url,volume:1,loop:false,currentTime:0,play(){output.push({url,volume:this.volume,loop:this.loop});return Promise.resolve()},pause(){}};return instance;}
  });
  const creatureStep=audio.play({type:"movement",actorSlot:"player",loop:false});
  assert.equal(creatureStep.assetId,"author:audio:light-steps");
  assert.equal(output[0].volume,0.35);assert.equal(output[0].loop,false);
  bySlot.player=bySlot.opponent;
  const afterSwitch=audio.play({type:"movement",actorSlot:"player",loop:false});
  assert.equal(afterSwitch.assetId,"author:audio:heavy-steps");
  const projectile=audio.play({type:"travel",skillId:"same-skill",actorSlot:"player"});
  assert.equal(projectile.assetId,"author:audio:projectile");
  assert.equal(projectile.loop,true);
  audio.dispose();
});
test("presenter distributes actual attack contact cues to creature movement owner, never skill travel",()=>{
  const sounds=[], approaches=[];
  const presenter=createCombatResolutionPresenter({
    visuals:{playEventFor:()=>Promise.resolve({status:"finished"}),cancelFor(){},playApproachFor(_slot,_mode,callbacks){approaches.push(callbacks);return Promise.resolve({status:"finished"});}},
    audio:{play(event){sounds.push(event);return {status:"ignored",finished:Promise.resolve({status:"ignored"})}}}
  });
  presenter.presentRelease({action:{skill:{id:"claw",form:"contact",approachMode:"ground"},travelMs:1000},actorSlot:"player",targetSlot:"opponent"});
  for(let i=0;i<4;i++)approaches[0].onFootfall({type:"footfall",atMs:250*(i+1)});
  assert.deepEqual(sounds.filter(s=>s.type==="movement").map(s=>s.actorSlot),["player","player","player","player"]);
  assert.equal(sounds.filter(s=>s.type==="travel").length,0);
  presenter.presentRelease({action:{skill:{id:"fire",form:"projectile",approachMode:"none"},travelMs:1500},actorSlot:"player",targetSlot:"opponent"});
  assert.equal(sounds.filter(s=>s.type==="travel").length,1);
  presenter.dispose();
});
test("editor, export adapter and both combat clients resolve movement by current creature",async()=>{
  const html=await read("examples/dom-demo/capture-editor-v2.html");
  const ui=await read("src/ui/capture-editor-human-v2.js");
  const visual=await read("src/adapters/input/capture/capture-export-to-native-visual-source-v1.js");
  const demo=await read("src/ui/demo-app.js");
  for(const runtime of ["src/ui/combat-test-ui.js","src/ui/combat-2v2-test-ui.js"]){
    const source=await read(runtime);assert.match(source,/movementSoundForActor/);
  }
  assert.match(html,/data-creature-audio-movement/);
  assert.match(html,/Son du trajet \(projectile \/ rayon\)/);
  assert.doesNotMatch(html,/Son du trajet \(projectile \/ rayon \/ contact\)/);
  assert.match(ui,/data-creature-audio-movement/);
  assert.match(visual,/movementSound:/);
  assert.match(demo,/getMovementSoundFor\(/);
});
