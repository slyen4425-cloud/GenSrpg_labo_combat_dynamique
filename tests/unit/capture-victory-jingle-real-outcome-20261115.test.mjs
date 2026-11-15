import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolveCaptureCombatBattleOutcomeV1} from "../../src/ui/capture-combat-battle-outcome-v1.js";
import {SOUNDTRACK_STARTER_CATALOG_V1 as catalog,SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1 as project,
  SOUNDTRACK_STARTER_VICTORY_ID_V1 as victoryId} from "../../src/assets/soundtrack-starter-catalog-v1.js";
import {soundtrackRuntimeAssetV1,SOUNDTRACK_RUNTIME_VICTORY_FILE_V1} from "../../src/assets/soundtrack-runtime-library-v1.js";
import {normalizeSoundtrackCatalogV1,normalizeSoundtrackProjectV1} from "../../src/contracts/soundtrack-project-v1.js";
import {createCombatSoundtrackPreviewBridgeV1} from "../../src/adapters/audio/combat-soundtrack-preview-bridge-v1.js";
const format={teams:{"ally":["local-1","local-2"],"enemy":["enemy-1","enemy-2"]},
 localActorId:"local-1",teamOf:id=>id.startsWith("local")?"ally":"enemy"};
function roster({local=[100,100],enemy=[0,0,40]}={}){
 return {"local-1":{members:[{hp:local[0]}]},"local-2":{members:[{hp:local[1]}]},
 "enemy-1":{members:[{hp:enemy[0]},{hp:enemy[2]}]},"enemy-2":{members:[{hp:enemy[1]}]}};
}
test("a single knocked-out creature with surviving reserve NEVER starts the victory song",()=>{
 assert.equal(resolveCaptureCombatBattleOutcomeV1({format,rosterSnapshot:roster(),defeatedActorId:"enemy-1"}),null);
 assert.equal(resolveCaptureCombatBattleOutcomeV1({format,rosterSnapshot:roster({enemy:[0,0,40]}),defeatedActorId:"enemy-2"}),null);
});
test("only a fully defeated native team emits the correct result relative to local player",()=>{
 assert.equal(resolveCaptureCombatBattleOutcomeV1({format,rosterSnapshot:roster({enemy:[0,0,0]}),defeatedActorId:"enemy-1"}),"victory");
 assert.equal(resolveCaptureCombatBattleOutcomeV1({format,rosterSnapshot:roster({local:[0,0]}),defeatedActorId:"local-2"}),"defeat");
 assert.equal(resolveCaptureCombatBattleOutcomeV1({format,rosterSnapshot:roster({local:[0,0],enemy:[0,0,0]}),defeatedActorId:"enemy-1"}),"draw");
 const partial=roster({enemy:[0,0,0]});delete partial["enemy-2"];
 assert.equal(resolveCaptureCombatBattleOutcomeV1({format,rosterSnapshot:partial,defeatedActorId:"enemy-1"}),null);
});
test("actual author MP3 bytes are delivered once, with verifiable immutable provenance",()=>{
 assert.equal(SOUNDTRACK_RUNTIME_VICTORY_FILE_V1,"victory-01-0b52ce2b.mp3");
 const bytes=readFileSync(new URL("../../assets/runtime/audio/music-v1/"+SOUNDTRACK_RUNTIME_VICTORY_FILE_V1,import.meta.url));
 assert.equal(bytes.length,190638);
 assert.equal(bytes.subarray(0,3).toString(),"ID3");
 assert.equal(createHash("sha256").update(bytes).digest("hex"),"327d2734bca243c90c3b9f0b6bbf2f93fb78a667fbe380dc1be5486e68e250fe");
 assert.equal(soundtrackRuntimeAssetV1(victoryId)?.assetId,victoryId);
 assert.ok(soundtrackRuntimeAssetV1(victoryId).url.endsWith(SOUNDTRACK_RUNTIME_VICTORY_FILE_V1));
});
test("victory defaults to one non-looping track, defeat remains independently configurable",()=>{
 const c=normalizeSoundtrackCatalogV1(catalog),p=normalizeSoundtrackProjectV1(project,c);
 assert.equal(c.assets.filter(x=>x.assetId===victoryId).length,1);
 assert.deepEqual(p.scenes["capture:combat:victory"].music.tracks,[victoryId]);
 assert.equal(p.scenes["capture:combat:victory"].music.repeat,false);
 assert.equal(p.scenes["capture:combat:defeat"].music,null);
 const voices=[];
 const out={play(id){const v={id,stopped:false,stop(){v.stopped=true;},
 setVolume(){},onEnded(fn){v.end=fn;}};voices.push(v);return v;}};
 const scheduled=new Map();let nextTimer=0;
 const clock={setTimeout(fn){const id=++nextTimer;scheduled.set(id,fn);return id;},
 clearTimeout(id){scheduled.delete(id);}};
 // A real browser resolves the same assetId to HTTPS; Node import.meta.url
 // deliberately resolves to file:, which the browser adapter rejects.
 const bridge=createCombatSoundtrackPreviewBridgeV1({
  catalog:c,project:p,output:out,clock,
  resolveAudioAsset:id=>id===victoryId?{assetId:id,url:"https://example.test/victory.mp3"}:null
 });
 assert.equal(bridge.transitionTo("capture:combat:victory").music,victoryId);
 assert.equal(voices.length,1);
 voices[0].end();
 assert.equal(voices.length,1,"single-play victory must never loop");
 bridge.dispose();
 assert.equal(scheduled.size,0);
});
test("the real combat pipeline forwards the ending result into the existing soundtrack session",()=>{
 const ui=readFileSync(new URL("../../src/ui/combat-2v2-test-ui.js",import.meta.url),"utf8");
 const mount=readFileSync(new URL("../../src/ui/capture-combat-preview-v1.js",import.meta.url),"utf8");
 const boot=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.js",import.meta.url),"utf8");
 const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 assert.match(ui,/result\.outcome === "team_defeated"/);
 assert.match(ui,/resolveCaptureCombatBattleOutcomeV1/);
 assert.match(ui,/announcedBattleOutcome=outcome/);
 assert.match(ui,/onBattleOutcome\(outcome\)/);
 assert.match(mount,/onBattleOutcome:presentBattleOutcome/);
 assert.match(mount,/createCombatSoundtrackPreviewBridgeV1/);
 assert.match(boot,/soundtrack\?\.transitionTo\("capture:combat:"\+outcome\)/);
 assert.match(html,/data-soundtrack-quick-scene="capture:combat:victory"/);
 assert.match(html,/data-soundtrack-quick-scene="capture:combat:defeat"/);
});
