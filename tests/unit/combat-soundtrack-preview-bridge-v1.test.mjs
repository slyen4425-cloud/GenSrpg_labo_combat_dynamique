import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCombatSoundtrackPreviewBridgeV1} from "../../src/adapters/audio/combat-soundtrack-preview-bridge-v1.js";
const catalog={schema:"gensrpg-soundtrack-catalog-v1",version:1,assets:[
  {assetId:"app:normal",kind:"music",origin:"app",title:"Combat"},
  {assetId:"app:boss",kind:"music",origin:"app",title:"Boss"},
  {assetId:"app:wind",kind:"ambience",origin:"app",title:"Vent"}
]};
const tracks=(ids,volume=.8)=>({tracks:ids,order:"sequence",volume,fadeMs:0,repeat:true});
const project={schema:"gensrpg-soundtrack-project-v1",version:1,projectId:"game",
  scenes:{
    "capture:combat:normal":{music:tracks(["app:normal"]),ambience:tracks(["app:wind"],.2)},
    "capture:combat:boss":{music:tracks(["app:boss"]),ambience:null}
  }};
function fakeOutput(){
 const voices=[],events=[];
 return {voices,events,
   play(id,{channel,volume}){
     const voice={id,channel,volume,stopped:false,
       setVolume(v){voice.volume=v;},
       onEnded(fn){voice.ended=fn;},
       stop(){voice.stopped=true;events.push(["stop",id]);}
     };
     voices.push(voice);events.push(["play",id,channel]);return voice;
   }
 };
}
const clock={setTimeout(){throw Error("unexpected fade: tests use fadeMs=0")},
  clearTimeout(){}};
const available=id=>({url:"https://media.test/"+id+".ogg"});
test("empty project is silent and never starts a voice; combat remains playable",()=>{
  const output=fakeOutput();
  const p={schema:project.schema,version:1,projectId:"game",scenes:{}};
  const bridge=createCombatSoundtrackPreviewBridgeV1({project:p,catalog,resolveAudioAsset:available,clock,output});
  assert.deepEqual(bridge.transitionTo("capture:combat:normal"),{status:"silent",sceneId:null});
  assert.equal(output.voices.length,0);
  bridge.dispose();bridge.dispose();
  assert.throws(()=>bridge.transitionTo("capture:combat:normal"),/disposed/);
});
test("metadata without a playable authorized media is unavailable but does not throw",()=>{
  const output=fakeOutput();
  const bridge=createCombatSoundtrackPreviewBridgeV1({
    project,catalog,resolveAudioAsset:()=>null,clock,output
  });
  assert.deepEqual(bridge.transitionTo("capture:combat:normal"),{
    status:"unavailable",sceneId:"capture:combat:normal",assetId:"app:normal"
  });
  assert.equal(output.voices.length,0);
  bridge.dispose();
});
test("real context -> boss -> returning to editor uses the same soundtrack session and disposes both channels",()=>{
 const output=fakeOutput();
 const bridge=createCombatSoundtrackPreviewBridgeV1({
   project,catalog,resolveAudioAsset:available,clock,output
 });
 const first=bridge.transitionTo("capture:combat:normal");
 assert.equal(first.status,"playing");
 assert.equal(first.music,"app:normal");
 assert.equal(first.ambience,"app:wind");
 assert.deepEqual(output.voices.map(x=>x.id),["app:normal","app:wind"]);
 const again=bridge.transitionTo("capture:combat:normal");
 assert.equal(again.music,"app:normal");
 assert.equal(output.voices.length,2,"same scene cannot restart duplicate tracks");
 const boss=bridge.transitionTo("capture:combat:boss");
 assert.equal(boss.music,"app:boss");
 assert.equal(output.voices[0].stopped,true);
 assert.equal(output.voices[1].stopped,true);
 assert.equal(output.voices[2].stopped,false);
 bridge.dispose();
 assert.equal(output.voices.filter(x=>!x.stopped).length,0);
});
test("unavailable later scene stops the prior soundtrack without affecting gameplay",()=>{
  const output=fakeOutput();
  const bridge=createCombatSoundtrackPreviewBridgeV1({
    project,catalog,clock,output,
    resolveAudioAsset:id=>id==="app:boss"?null:available(id)
  });
  assert.equal(bridge.transitionTo("capture:combat:normal").status,"playing");
  assert.equal(bridge.transitionTo("capture:combat:boss").status,"unavailable");
  assert.equal(output.voices.filter(x=>!x.stopped).length,0);
});
test("audio constructor failures are reported but never break combat",()=>{
 const failures=[];
 const bridge=createCombatSoundtrackPreviewBridgeV1({
   project,catalog,resolveAudioAsset:available,clock,
   output:{play(){throw new Error("blocked autoplay")}},
   onAudioError:error=>failures.push(error.message)
 });
 assert.equal(bridge.transitionTo("capture:combat:normal").status,"unavailable");
 assert.deepEqual(failures,["blocked autoplay"]);
 bridge.dispose();
});
test("Capture actual preview mounts soundtrack only inside preview lifetime",()=>{
 const boot=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.js",import.meta.url),"utf8");
 assert.match(boot,/createCombatSoundtrackPreviewBridgeV1/);
 assert.match(boot,/soundtrack\.transitionTo\("capture:combat:normal"\)/);
 assert.match(boot,/soundtrack\?\.dispose\(\)/);
 assert.match(boot,/mounted\.dispose\(\)/);
 assert.ok(boot.includes("resolveAudioAsset:resolveEditorAudioAsset"));
});
