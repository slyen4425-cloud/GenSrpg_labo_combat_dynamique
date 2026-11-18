import test from "node:test";
import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import {CREATURE_STYLE_MOVEMENT_AUDIO_V1,creatureAudioForStyleV1} from "../../src/core/profiles/creature-style-audio-v1.js";
import {PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1,privateAudioRuntimeAssetV1} from "../../src/assets/private-audio-runtime-library-v1.js";
import {createDomCombatAudio} from "../../src/adapters/audio/dom-combat-audio.js";

const path="data/capture/showcase";
const files=readdirSync(path).filter(f=>f.endsWith(".capture-creature-transfer-v1.json"));
const creatures=files.map(f=>JSON.parse(readFileSync(path+"/"+f,"utf8")).draft);
const roles=JSON.parse(readFileSync("data/presentation/audio/private-audio-catalog.v1.json","utf8")).entries;
const byId=new Map(roles.map(x=>[x.assetId,x]));
const profileCounts={biped:7,quadruped:3,flying:5,serpentine:3,massive:4};

test("audits ALL 22 published Showcase creatures and all five official styles, not only flight",()=>{
 assert.equal(creatures.length,22);
 for(const [id,count] of Object.entries(profileCounts)){
  assert.equal(creatures.filter(c=>c.presentation.profileId===id).length,count);
  const sound=CREATURE_STYLE_MOVEMENT_AUDIO_V1[id];
  assert.ok(PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1.includes(sound.assetId));
  assert.ok(privateAudioRuntimeAssetV1(sound.assetId)?.url.endsWith(".mp3"));
  assert.ok(byId.get(sound.assetId)?.roles.includes("movement"),id+" references a non-movement role");
 }
});

test("all 22 creature movement sounds resolve via ONE style source; each group shares exactly its official sound",()=>{
 for(const creature of creatures){
  const {profileId,audio}=creature.presentation;
  const resolved=creatureAudioForStyleV1(profileId,audio);
  assert.equal(resolved.movement.assetId,CREATURE_STYLE_MOVEMENT_AUDIO_V1[profileId].assetId,
    creature.id+" should use the same movement SFX as its style");
  assert.ok(byId.get(resolved.movement.assetId)?.roles.includes("movement"));
 }
});

test("four misassigned author presets are replaced without disturbing visuals, stats or skills",()=>{
 const sounds={"crea_ailevent":{"prior":"gensrpg:sound:conflux-da9a4465","status":"release role corrected"},"crea_dracendre":{"prior":"gensrpg:sound:sanctuary-367a77dd","status":"non-wing movement standardized"},"crea_foudrillon":{"prior":"gensrpg:sound:effect-79dd62d8","status":"author wing retained"},"crea_scar_2":{"prior":"gensrpg:sound:effect-ad54aecf","status":"impact role corrected"},"crea_mossback":{"prior":"gensrpg:sound:genrpg-pack2-f75d0d8f","status":"impact role corrected"}};
 for(const creature of creatures){
  const id=creature.id;
  assert.ok(creature.presentation.audio);
  if(!["crea_ailevent","crea_dracendre","crea_scar_2","crea_mossback"].includes(id)) continue;
  const source=creature.presentation.audio.movement;
  assert.equal(source.assetId,CREATURE_STYLE_MOVEMENT_AUDIO_V1[creature.presentation.profileId].assetId,id);
  assert.notEqual(source.assetId,sounds[id].prior);
  assert.ok(creature.presentation.visual.front?.assetId);
 }
});

test("creature explicit edits always override profile audio and do not affect other roles",()=>{
 const custom={movement:{assetId:"gensrpg:sound:effect-79dd62d8",volume:0.3,mode:"once"},
  dodge:{assetId:"gensrpg:sound:effect-0221d6ed",volume:0.7}};
 const resolved=creatureAudioForStyleV1("biped",custom);
 assert.equal(resolved.movement,custom.movement);
 assert.equal(resolved.dodge,custom.dodge);
 assert.equal(creatureAudioForStyleV1("unknown",custom),custom);
 assert.equal(creatureAudioForStyleV1("serpentine",{}).movement.mode,"once");
 assert.equal(creatureAudioForStyleV1("flying",{}).movement.mode,"loop");
});

test("real combat audio reads shared style movement from native player without duplicating an audio owner",async()=>{
 const created=[];
 const participants={player:{profile:"flying",audio:{}},opponent:{profile:"massive",audio:{}}};
 const player=createDomCombatAudio({
  presentationForCreature:slot=>creatureAudioForStyleV1(participants[slot].profile,participants[slot].audio),
  resolveAudioAsset:privateAudioRuntimeAssetV1,
  createAudio(url){const a={url,volume:1,loop:false,currentTime:0,
   play(){created.push({url:this.url,loop:this.loop,volume:this.volume});return Promise.resolve()},
   pause(){}};return a}
 });
 const fly=player.play({type:"movement",actorSlot:"player",loop:true});
 const massive=player.play({type:"movement",actorSlot:"opponent",loop:false});
 assert.equal(fly.status,"running");
 assert.equal(massive.status,"running");
 assert.ok(created[0].url.includes("effect-79dd62d8"));
 assert.ok(created[0].loop);
 assert.ok(created[1].url.includes("effect-01d545e2"));
 assert.equal(created[1].loop,false);
 player.dispose();
 assert.equal((await fly.finished).status,"stopped");
 assert.equal((await massive.finished).status,"stopped");
});

test("editor and combat bridge use official audio slot with profile fallback, keeping skill SFX independent",()=>{
 const editor=readFileSync("examples/dom-demo/capture-editor-v2.html","utf8");
 const demo=readFileSync("src/ui/demo-app.js","utf8");
 const sound=readFileSync("src/adapters/audio/dom-combat-audio.js","utf8");
 assert.match(editor,/data-creature-audio-movement/);
 assert.match(editor,/Son automatique du style/);
 assert.match(demo,/creatureAudioForStyleV1\(meta\.profile, meta\.audio\)/);
 assert.match(sound,/return presentation\?\.movement/);
 assert.doesNotMatch(readFileSync("src/contracts/creature-presentation-binding-v2.js","utf8"),/CREATURE_STYLE_MOVEMENT_AUDIO_V1/);
});
