import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  saveSoundtrackAuthoringSceneV1,soundtrackAuthoringCatalogGroupsV1
} from "../../src/ui/soundtrack-editor-v1.js";
import {
  normalizeSoundtrackProjectV1,createEmptySoundtrackProjectV1
} from "../../src/contracts/soundtrack-project-v1.js";
const catalog={schema:"gensrpg-soundtrack-catalog-v1",version:1,assets:[
  {assetId:"app:track:forest",kind:"music",origin:"app",title:"Forêt"},
  {assetId:"user:track:epic",kind:"music",origin:"user",title:"Épique"},
  {assetId:"project:wind",kind:"ambience",origin:"project",title:"Vent"},
  {assetId:"app:sword",kind:"sfx",origin:"app",title:"Épée"}
]};
const scene=(tracks,override={})=>({tracks,order:"sequence",volume:.6,fadeMs:1000,repeat:true,...override});
test("independent games and shared music assets do not mix configuration",()=>{
  const first=createEmptySoundtrackProjectV1("capture-a");
  const second=createEmptySoundtrackProjectV1("survival-b");
  const a1=saveSoundtrackAuthoringSceneV1(first,catalog,"capture:combat:normal","music",scene(["app:track:forest","user:track:epic"]));
  const a2=saveSoundtrackAuthoringSceneV1(a1,catalog,"capture:combat:normal","ambience",scene(["project:wind"],{volume:.2}));
  const b=saveSoundtrackAuthoringSceneV1(second,catalog,"survival:combat:normal","music",scene(["app:track:forest"],{volume:.95}));
  assert.equal(a2.scenes["capture:combat:normal"].music.volume,.6);
  assert.equal(a2.scenes["capture:combat:normal"].ambience.volume,.2);
  assert.equal(b.scenes["survival:combat:normal"].music.volume,.95);
  assert.equal(a2.scenes["survival:combat:normal"],undefined);
  assert.equal(first.scenes["capture:combat:normal"],undefined);
  assert.deepEqual(normalizeSoundtrackProjectV1(JSON.parse(JSON.stringify(a2)),catalog),a2);
  assert.deepEqual(a2.scenes["capture:combat:normal"].music.tracks,["app:track:forest","user:track:epic"]);
});
test("channel configuration cannot select SFX or an unknown asset; empty list mutes without overwriting another channel",()=>{
  const base=saveSoundtrackAuthoringSceneV1(createEmptySoundtrackProjectV1("game"),catalog,"capture:combat:boss","music",scene(["app:track:forest"]));
  const quiet=saveSoundtrackAuthoringSceneV1(base,catalog,"capture:combat:boss","ambience",scene([]));
  assert.equal(quiet.scenes["capture:combat:boss"].ambience,null);
  assert.deepEqual(quiet.scenes["capture:combat:boss"].music.tracks,["app:track:forest"]);
  assert.throws(()=>saveSoundtrackAuthoringSceneV1(base,catalog,"capture:combat:boss","music",scene(["app:sword"])),/kind/);
  assert.throws(()=>saveSoundtrackAuthoringSceneV1(base,catalog,"capture:combat:boss","music",scene(["not-indexed"])),/unknown soundtrack/);
  assert.throws(()=>saveSoundtrackAuthoringSceneV1(base,catalog,"capture:combat:boss","effects",scene([])),/canal/);
  assert.throws(()=>saveSoundtrackAuthoringSceneV1(base,catalog,"", "music",scene([])));
});
test("catalog origin is a label, not a gameplay restriction",()=>{
 const items=soundtrackAuthoringCatalogGroupsV1(catalog,"music");
 assert.deepEqual(items.map(x=>x.assetId),["app:track:forest","user:track:epic"]);
 assert.match(items[0].label,/Application/);
 assert.match(items[1].label,/Ma bibliothèque/);
 assert.deepEqual(soundtrackAuthoringCatalogGroupsV1(catalog,"ambience").map(x=>x.assetId),["project:wind"]);
});
test("real Capture editor exposes a standalone Musiques tab and loads its own script, not creature/skill FX adapters",()=>{
 const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 const boot=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.js",import.meta.url),"utf8");
 assert.match(html,/data-editor-tab="music"/);
 assert.match(html,/data-editor-panel="music" hidden/);
 for(const field of ["project-id","scene-id","channel","asset-id","track-list","order","volume",
   "fade","repeat","add","save","export","catalog-file","project-file","new-project","status"]) {
    assert.ok(html.includes('data-soundtrack-'+field),'missing soundtrack field '+field);
 }
 assert.match(boot,/mountSoundtrackAuthoringV1/);
 assert.match(boot,/root\.querySelector\("\[data-soundtrack-editor\]"\)/);
 assert.equal((html.match(/data-editor-tab="music"/g)||[]).length,1);
 assert.equal((html.match(/data-editor-panel="music"/g)||[]).length,1);
});
