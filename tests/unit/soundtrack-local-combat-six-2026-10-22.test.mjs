import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  SOUNDTRACK_STARTER_CATALOG_V1 as catalog,
  SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1 as project,
  SOUNDTRACK_STARTER_BATTLE_IDS_V1 as battle,
  SOUNDTRACK_STARTER_EXPLORATION_IDS_V1 as exploration
} from "../../src/assets/soundtrack-starter-catalog-v1.js";
import {createSoundtrackLocalMediaV1} from "../../src/assets/soundtrack-local-media-v1.js";
import {
  normalizeSoundtrackCatalogV1,normalizeSoundtrackProjectV1
} from "../../src/contracts/soundtrack-project-v1.js";
import {createCombatSoundtrackPreviewBridgeV1} from "../../src/adapters/audio/combat-soundtrack-preview-bridge-v1.js";

function localFiles(){
  const made=[],revoked=[];
  const media=createSoundtrackLocalMediaV1({
    catalog,
    createObjectURL(file){const url="blob:test-"+file.name+"-"+made.length;made.push(url);return url;},
    revokeObjectURL(url){revoked.push(url);}
  });
  return {media,made,revoked};
}
const mp3=(name)=>({name,size:4096,type:"audio/mpeg"});
test("ten private source tracks are public METADATA only; exactly six Battle in Capture normal scene",()=>{
  const c=normalizeSoundtrackCatalogV1(catalog);
  const p=normalizeSoundtrackProjectV1(project,c);
  assert.equal(c.assets.length,10);
  assert.equal(battle.length,6);
  assert.equal(exploration.length,4);
  assert.deepEqual(c.assets.map(x=>x.title),[
    "Battle_1","Battle_2","Battle_3","Battle_4","Battle_5","Battle_6",
    "Exploration_1","Exploration_2","Exploration_3","Exploration_4"
  ]);
  assert.deepEqual(p.scenes["capture:combat:normal"].music.tracks,battle);
  assert.equal(p.scenes["capture:combat:normal"].music.repeat,true);
  assert.equal(p.scenes["capture:combat:normal"].ambience,null);
  assert.ok(exploration.every(id=>!battle.includes(id)));
  const serialized=JSON.stringify({catalog:c,project:p});
  assert.doesNotMatch(serialized,/\.mp3|github\.com|https?:|blob:|\/audio\/musiques/);
});
test("private audio bytes are NEVER fetched; local MP3 names bind to stable asset IDs and revoke on disposal",()=>{
  const {media,made,revoked}=localFiles();
  assert.equal(media.status().ready,0);
  assert.equal(media.runtimeAsset(battle[0]),null);
  media.importFiles(Array.from({length:6},(_,i)=>mp3("Battle_"+(i+1)+".mp3")));
  assert.equal(media.status().ready,6);
  for(let i=0;i<6;i++)assert.match(media.runtimeAsset(battle[i]).url,/^blob:test-Battle_/);
  assert.equal(media.runtimeAsset(exploration[0]),null);
  assert.equal(made.length,6);
  media.dispose();
  media.dispose();
  assert.equal(revoked.length,6);
  assert.throws(()=>media.runtimeAsset(battle[0]),/disposed/);
});
test("invalid upload is atomic; a replacement revokes only the old object URL",()=>{
  const {media,made,revoked}=localFiles();
  media.importFiles([mp3("Battle_1.mp3")]);
  assert.throws(()=>media.importFiles([mp3("Battle_2.mp3"),mp3("Other.mp3")]),/inconnue/);
  assert.throws(()=>media.importFiles([mp3("Battle_2.mp3"),{...mp3("Battle_3.mp3"),size:0}]),/vide/);
  assert.throws(()=>media.importFiles([mp3("Battle_3.mp3"),mp3("Battle_3.mp3")]),/double/);
  assert.throws(()=>media.importFiles([{...mp3("Battle_2.mp3"),type:"application/pdf"}]),/MP3/);
  assert.equal(made.length,1);
  assert.equal(media.status().ready,1);
  media.importFiles([mp3("Battle_1.mp3")]);
  assert.equal(revoked.length,1);
  assert.equal(media.status().ready,1);
  media.dispose();
  assert.equal(revoked.length,2);
});
test("six chosen MP3 play via the real CombatSoundtrackPreviewBridge and stop on return to editor",()=>{
  const {media,revoked}=localFiles();
  media.importFiles(Array.from({length:6},(_,i)=>mp3("Battle_"+(i+1)+".mp3")));
  const voices=[];
  const output={
    play(id,{channel,volume}){
      const voice={id,channel,volume,stopped:false,
        setVolume(v){voice.volume=v;},
        currentVolume(){return voice.volume;},
        onEnded(fn){voice.ended=fn;},
        stop(){voice.stopped=true;}
      };
      voices.push(voice);
      return voice;
    }
  };
  const timers=new Map();
  let nextTimer=0;
  const clock={
    setTimeout(fn,ms){const id=++nextTimer;timers.set(id,[fn,ms]);return id;},
    clearTimeout(id){timers.delete(id);}
  };
  const bridge=createCombatSoundtrackPreviewBridgeV1({
    catalog,project,output,clock,random:()=>0,resolveAudioAsset:id=>media.runtimeAsset(id)
  });
  const playing=bridge.transitionTo("capture:combat:normal");
  assert.equal(playing.status,"playing");
  assert.equal(playing.music,battle[0]);
  assert.equal(playing.ambience,null);
  assert.equal(voices.length,1);
  voices[0].ended();
  assert.equal(voices.length,2);
  assert.equal(voices[1].id,battle[1]);
  bridge.dispose();
  assert.ok(voices.every(x=>x.stopped));
  assert.equal(timers.size,0);
  media.dispose();
  assert.equal(revoked.length,6);
});
test("missing local MP3s must stay silent rather than playing broken URLs",()=>{
  const {media}=localFiles();
  media.importFiles([mp3("Battle_1.mp3")]);
  const bridge=createCombatSoundtrackPreviewBridgeV1({
    catalog,project,resolveAudioAsset:id=>media.runtimeAsset(id),
    output:{play(){throw new Error("should not play")}}
  });
  const result=bridge.transitionTo("capture:combat:normal");
  assert.equal(result.status,"unavailable");
  assert.equal(result.assetId,battle[1]);
  bridge.dispose();media.dispose();
});
test("real editor has a local file control and resolver before other one-shot SFX",()=>{
  const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const boot=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.js",import.meta.url),"utf8");
  assert.match(html,/data-soundtrack-local-files/);
  assert.match(html,/data-soundtrack-local-status/);
  assert.match(html,/multiple accept="\.mp3,audio\/mpeg"/);
  assert.match(boot,/initialCatalog:SOUNDTRACK_STARTER_CATALOG_V1/);
  assert.match(boot,/initialProject:SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1/);
  assert.match(boot,/soundtrackLocalMedia\.importFiles\(soundtrackLocalInput\.files\)/);
  assert.match(boot,/soundtrackLocalMedia\.runtimeAsset\(assetId\)/);
  assert.match(boot,/resolveAudioAsset:resolveEditorAudioAsset/);
  assert.match(boot,/soundtrackLocalMedia\.dispose\(\)/);
  assert.doesNotMatch(boot,/api\.github\.com\/repos\/.*audio_prive/i);
});
