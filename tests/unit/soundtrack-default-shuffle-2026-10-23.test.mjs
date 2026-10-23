import test from "node:test";
import assert from "node:assert/strict";
import {
  SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1 as starter,
  SOUNDTRACK_STARTER_CATALOG_V1 as catalog,
  SOUNDTRACK_STARTER_BATTLE_IDS_V1 as battle
} from "../../src/assets/soundtrack-starter-catalog-v1.js";
import {createSoundtrackSessionV1} from "../../src/core/audio/soundtrack-session-v1.js";

test("the combat default randomly selects the first Battle track, retaining the six licensed tracks",()=>{
  const defaultMusic=starter.scenes["capture:combat:normal"].music;
  assert.equal(defaultMusic.order,"shuffle");
  assert.equal(defaultMusic.repeat,true);
  assert.equal(defaultMusic.volume,0.65);
  assert.equal(defaultMusic.fadeMs,700);
  assert.deepEqual([...defaultMusic.tracks],[...battle]);
});

test("separate combats may start on different Battle tracks and consecutive plays do not repeat",()=>{
  const played=[];
  const output={play(assetId){
    const voice={assetId,stopped:false,volume:0,
      setVolume(value){voice.volume=value;},
      stop(){voice.stopped=true;},
      onEnded(callback){voice.end=callback;}};
    played.push(voice);return voice;
  }};
  const clock={setTimeout(){return 1;},clearTimeout(){}};
  const raw=starter.scenes["capture:combat:normal"].music;
  const music={...raw,fadeMs:0};
  const project={...starter,scenes:{"capture:combat:normal":{music,ambience:null}}};
  const values=[0.35,0,0.95,0.85];
  const random=()=>values.shift()??0.5;
  const first=createSoundtrackSessionV1({catalog,project,output,clock,random});
  const start=first.transitionTo("capture:combat:normal");
  assert.equal(start.music,battle[2]);
  played[0].end();
  assert.equal(played[1].assetId,battle[0]);
  played[1].end();
  assert.equal(played[2].assetId,battle[5]);
  assert.notEqual(played[2].assetId,played[1].assetId);
  first.dispose();
  const second=createSoundtrackSessionV1({catalog,project,output,clock,random});
  assert.equal(second.transitionTo("capture:combat:normal").music,battle[5]);
  second.dispose();
  assert.ok(played.every(x=>x.stopped));
});
