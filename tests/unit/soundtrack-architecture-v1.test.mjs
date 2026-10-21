import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSoundtrackCatalogV1,normalizeSoundtrackProjectV1,setSoundtrackSceneV1,
  createEmptySoundtrackProjectV1
} from "../../src/contracts/soundtrack-project-v1.js";
import {createSoundtrackSessionV1} from "../../src/core/audio/soundtrack-session-v1.js";
import {createDomSoundtrackOutputV1} from "../../src/adapters/audio/dom-soundtrack-output-v1.js";

const catalog={schema:"gensrpg-soundtrack-catalog-v1",version:1,assets:[
  {assetId:"app:music:forest",kind:"music",origin:"app",title:"Forest"},
  {assetId:"user:music:battle",kind:"music",origin:"user",title:"Battle"},
  {assetId:"app:music:boss",kind:"music",origin:"app",title:"Boss"},
  {assetId:"app:ambience:birds",kind:"ambience",origin:"app",title:"Birds"},
  {assetId:"project:sfx:attack",kind:"sfx",origin:"project",title:"Attack"}
]};
const mix=(tracks,overrides={})=>({tracks,volume:.7,fadeMs:100,order:"sequence",repeat:true,...overrides});
const project={
  schema:"gensrpg-soundtrack-project-v1",version:1,projectId:"game-a",
  scenes:{
    "capture:exploration:forest":{music:mix(["app:music:forest"]),ambience:mix(["app:ambience:birds"],{volume:.25})},
    "capture:combat":{music:mix(["user:music:battle","app:music:boss"]),ambience:null},
    "capture:boss":{music:mix(["app:music:boss"],{fadeMs:0}),ambience:null}
  }
};
function fixture() {
  const events=[];
  let now=0, nextId=0;
  const tasks=new Map(),handles=[];
  const clock={
    setTimeout(cb,delay){const id=++nextId;tasks.set(id,{at:now+delay,cb});return id},
    clearTimeout(id){tasks.delete(id)}
  };
  const output={play(id,{channel,volume}) {
    const h={id,channel,volume,stopped:false,ended:null,
      onEnded(fn){h.ended=fn;},
      setVolume(v){h.volume=v;events.push(["volume",id,v]);},
      currentVolume(){return h.volume;},
      stop(){h.stopped=true;events.push(["stop",id]);},
      finish(){h.ended?.();}
    };
    handles.push(h);events.push(["play",id,channel]);return h;
  }};
  function advance(ms) {
    const target=now+ms;
    for(let guard=0;guard<3000;guard++){
      const due=[...tasks.entries()].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];
      if(!due)break;
      tasks.delete(due[0]);now=due[1].at;due[1].cb();
    }
    now=target;
  }
  return {clock,output,events,handles,tasks,advance};
}
test("catalog is shared but each game's scenes and channels remain independent",()=>{
 const normalized=normalizeSoundtrackCatalogV1(catalog);
 assert.equal(normalized.assets.length,5);
 assert.throws(()=>normalizeSoundtrackCatalogV1({...catalog,assets:[catalog.assets[0],catalog.assets[0]]}));
 const first=normalizeSoundtrackProjectV1(project,catalog);
 const second=setSoundtrackSceneV1(createEmptySoundtrackProjectV1("game-b"),catalog,"survival:combat",{music:mix(["app:music:forest"]),ambience:null});
 assert.equal(first.projectId,"game-a");
 assert.equal(second.projectId,"game-b");
 assert.equal(second.scenes["survival:combat"].music.tracks[0],"app:music:forest");
 assert.equal(first.scenes["survival:combat"],undefined);
 assert.equal(first.scenes["capture:exploration:forest"].music.volume,.7);
 assert.deepEqual(normalizeSoundtrackProjectV1(JSON.parse(JSON.stringify(first)),catalog),first);
});
test("unknown assets, SFX in music, invalid volumes and IDs fail before playback",()=>{
 assert.throws(()=>normalizeSoundtrackProjectV1({...project,scenes:{x:{music:mix(["private:not-indexed"]),ambience:null}}},catalog),/unknown soundtrack asset/);
 assert.throws(()=>normalizeSoundtrackProjectV1({...project,scenes:{x:{music:mix(["project:sfx:attack"]),ambience:null}}},catalog),/kind/);
 assert.throws(()=>normalizeSoundtrackProjectV1({...project,scenes:{x:{music:mix(["app:music:forest"],{volume:2}),ambience:null}}},catalog),/volume/);
 assert.throws(()=>createEmptySoundtrackProjectV1("bad id"));
});
test("exploration -> combat -> exploration crossfades channels, sequences tracks and cleanup",()=>{
 const f=fixture(),session=createSoundtrackSessionV1({catalog,project,clock:f.clock,output:f.output});
 assert.equal(session.transitionTo("capture:exploration:forest").sceneId,"capture:exploration:forest");
 assert.equal(f.handles.length,2);
 assert.equal(f.handles[0].volume,0);
 f.advance(100);
 assert.equal(f.handles[0].volume,.7);
 assert.equal(f.handles[1].volume,.25);
 session.transitionTo("capture:combat");
 assert.equal(f.handles.length,3);
 f.advance(100);
 assert.equal(f.handles[0].stopped,true);
 assert.equal(f.handles[1].stopped,true);
 assert.equal(f.handles[2].volume,.7);
 f.handles[2].finish();
 assert.equal(session.snapshot().music,"app:music:boss");
 assert.equal(f.handles.length,4);
 session.transitionTo("capture:exploration:forest");
 f.advance(100);
 assert.equal(f.handles[3].stopped,true);
 assert.equal(session.snapshot().music,"app:music:forest");
 session.dispose();
 assert.equal(f.tasks.size,0);
 assert.equal(f.handles.filter(h=>!h.stopped).length,0);
 assert.throws(()=>session.transitionTo("capture:combat"),/disposed/);
});
test("rapid transition and stop work without duplicate current voices or dangling timers",()=>{
 const f=fixture(),session=createSoundtrackSessionV1({catalog,project,clock:f.clock,output:f.output});
 session.transitionTo("capture:exploration:forest");
 f.advance(20);
 session.transitionTo("capture:combat");
 f.advance(20);
 session.transitionTo("capture:boss");
 f.advance(200);
 session.transitionTo(null);
 f.advance(300);
 assert.equal(f.handles.filter(x=>!x.stopped).length,0,"no ghost soundtrack voice");
 assert.deepEqual(session.snapshot(),{projectId:"game-a",sceneId:null,music:null,ambience:null});
 assert.equal(f.tasks.size,0);
 session.dispose();
});
test("DOM audio output resolves only authorized URLs and never assumes private GitHub access",async()=>{
 class AudioFake {
   constructor(url){this.url=url;this.listeners=new Map();this.volume=1;this.paused=false;}
   addEventListener(n,fn){this.listeners.set(n,fn)}
   removeEventListener(n){this.listeners.delete(n)}
   play(){return Promise.resolve()}
   pause(){this.paused=true}
   load(){}
   removeAttribute(){}
 }
 const output=createDomSoundtrackOutputV1({resolveAssetUrl:id=>id==="app:music:forest"?"https://example.test/forest.ogg":"",AudioCtor:AudioFake});
 const voice=output.play("app:music:forest",{channel:"music",volume:.25});
 assert.equal(voice.currentVolume(),.25);
 voice.setVolume(.9);assert.equal(voice.currentVolume(),.9);
 voice.stop();voice.stop();
 assert.throws(()=>output.play("user:music:bad",{channel:"music",volume:1}),/authorized/);
});
