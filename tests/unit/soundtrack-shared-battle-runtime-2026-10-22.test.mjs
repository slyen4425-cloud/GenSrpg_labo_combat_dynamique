import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {createHash} from "node:crypto";
import {
  SOUNDTRACK_STARTER_BATTLE_IDS_V1 as battle,
  SOUNDTRACK_STARTER_EXPLORATION_IDS_V1 as exploration,
  SOUNDTRACK_STARTER_CATALOG_V1 as catalog,
  SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1 as project
} from "../../src/assets/soundtrack-starter-catalog-v1.js";
import {
  soundtrackRuntimeAssetV1,
  SOUNDTRACK_RUNTIME_BATTLE_FILES_V1 as filenames
} from "../../src/assets/soundtrack-runtime-library-v1.js";
import {createCombatSoundtrackPreviewBridgeV1} from "../../src/adapters/audio/combat-soundtrack-preview-bridge-v1.js";

const source=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
test("the six real Battle runtime copies resolve by the existing stable assetIds",()=>{
  assert.equal(filenames.length,6);
  assert.equal(battle.length,6);
  assert.equal(catalog.assets.filter(x=>x.assetId.startsWith("gensrpg:music:combat:")).length,6);
  for(const [index,id] of battle.entries()){
    const asset=soundtrackRuntimeAssetV1(id);
    assert.equal(asset.assetId,id);
    const path=new URL("../../assets/runtime/audio/music-v1/"+filenames[index],import.meta.url);
    assert.equal(asset.url,path.href);
    const data=readFileSync(path);
    assert.ok(data.length>100000,"missing or tiny MP3 runtime "+filenames[index]);
    const tag=data.subarray(0,3).toString("ascii");
    assert.ok(tag==="ID3" || data[0]===0xff,"MP3 signature missing "+filenames[index]);
    assert.equal(statSync(path).size,data.length);
    assert.equal(createHash("sha256").update(data).digest("hex").length,64);
  }
  assert.deepEqual(project.scenes["capture:combat:normal"].music.tracks,battle);
  assert.ok(exploration.every(x=>soundtrackRuntimeAssetV1(x)===null));
  assert.equal(soundtrackRuntimeAssetV1("bogus"),null);
});
test("any visitor gets a playable authorized runtime URL without local upload",()=>{
  const played=[];
  const output={play(id,{channel,volume}){
    const v={assetId:id,stopped:false,volume,setVolume(n){v.volume=n;},
      currentVolume(){return v.volume;},stop(){v.stopped=true;},onEnded(fn){v.ended=fn;}};
    played.push(v);return v;
  }};
  const timers=new Map();let idx=0;
  const clock={setTimeout(fn,ms){const k=++idx;timers.set(k,[fn,ms]);return k;},clearTimeout(k){timers.delete(k);}};
  const bridge=createCombatSoundtrackPreviewBridgeV1({
    project,catalog,output,clock,resolveAudioAsset:soundtrackRuntimeAssetV1
  });
  let result=bridge.transitionTo("capture:combat:normal");
  assert.equal(result.status,"playing");
  assert.equal(result.music,battle[0]);
  assert.equal(played.length,1);
  played[0].ended();
  assert.equal(played.length,2);
  assert.equal(played[1].assetId,battle[1]);
  bridge.dispose();
  assert.ok(played.every(x=>x.stopped));
  assert.equal(timers.size,0);
});
test("real Capture DOM bridge chooses hosted music without requiring the local file input",()=>{
  assert.match(source,/import \{soundtrackRuntimeAssetV1\}/);
  assert.match(source,/soundtrackRuntimeAssetV1\(assetId\)/);
  assert.match(source,/resolveAudioAsset:resolveEditorAudioAsset/);
  assert.match(source,/soundtrack\.transitionTo\("capture:combat:normal"\)/);
  assert.match(source,/soundtrack\?\.dispose\(\)/);
  assert.match(html,/sans chargement manuel/);
  assert.doesNotMatch(html,/<a[^>]+download/i);
  assert.doesNotMatch(source,/api\.github\.com\/repos\/slyen4425-cloud\/GenSrpG_audio_prive/);
});
