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
// Fixed integrity reference from private 96 kbps MP3 runtime conversion manifest.
const EXPECTED_RUNTIME_SHA256=[
  "a640550734f7c55ea8fe76c58dba064ec3ac1353146f03ad7d9a975daa68edc0",
  "1dbed1af1b1985519fe5013c4c368a2198c9c42bc0f799c0f4e1aaafc542b3b3",
  "9c15b6f965c4088683a10e756a903167a2bb5ae99881a20062f78b0c660a4659",
  "6e2675198e185bb8229403415182285e54b4be95f5beaf8282531e95e235616c",
  "55995b9c4672b69e58ce7b2c65af6aaa7b43b55995b903b185c0dee22e03250a",
  "48705e1f87a2d74732151431ff4e2497bf6a19b9b6b1fa8e9e85a4daedf1381b"
];
const EXPECTED_RUNTIME_SIZES=[2074952,2433510,2612070,1499530,1829284,1728774];
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
    assert.equal(statSync(path).size,EXPECTED_RUNTIME_SIZES[index]);
    assert.equal(createHash("sha256").update(data).digest("hex"),EXPECTED_RUNTIME_SHA256[index]);
    assert.equal(catalog.assets.find(x=>x.assetId===id).licenseRef,"author-declared-suno-paid-rights-2026-10-22");
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
  // Node imports resolve import.meta.url to file:, whereas the real GitHub
  // Pages import resolves to https:. Validate the real resolver in the asset
  // test above; supply its same filenames with a browser HTTPS base here.
  const browserResolver=id=>{
    const asset=soundtrackRuntimeAssetV1(id);
    const index=battle.indexOf(id);
    return asset && index>=0 ? {assetId:id,url:"https://example.test/assets/runtime/audio/music-v1/"+filenames[index]} : null;
  };
  const bridge=createCombatSoundtrackPreviewBridgeV1({
    project,catalog,output,clock,random:()=>0,resolveAudioAsset:browserResolver
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
