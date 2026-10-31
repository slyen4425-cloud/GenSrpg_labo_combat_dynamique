import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const roles={
 zone_gelee:"pack:capture:sprite-zone-gelee-01",
 pointe_glace:"pack:capture:sprite-pointe-glace-01",
 brouillard_gelant:"pack:capture:sprite-brouillard-gelant-01"
};
test("ice VFX public editor uses updated one official media catalog without legacy cache",()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.equal(GLOBAL_VISUAL_LIBRARY.repository,"slyen4425-cloud/GenSrpg_labo_combat_dynamique");
 const m=GLOBAL_VISUAL_LIBRARY.revision.match(/^2026-\d\d-\d\d-v(\d+)-[a-z0-9-]+$/);
 assert.ok(m&&Number(m[1])>=47,"new Glace assets require canonical catalog v47 or newer");
 assert.equal(new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl).searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
 for(const role of Object.keys(roles)){
  const url=globalVisualAssetUrl("capture/sprites/skills/glace_suite/"+role+"/"+role+"_atlas_12f.webp");
  assert.ok(url.startsWith("https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/global-assets/"));
  assert.equal(new URL(url).searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
 }
 const html=read("examples/dom-demo/capture-editor-v2.html");
 const token=html.match(/capture-editor-v2\.js\?v=([^"]+)/)?.[1];
 assert.ok(token&&token.includes("ice-ground-spike-fog-20261031"),"stale editor module URL");
 for(const file of ["examples/dom-demo/capture-editor-v2.js","src/ui/capture-editor-human-v2.js","src/ui/capture-editor-preview-runtime-loader-v1.js","src/ui/capture-combat-preview-v1.js","src/ui/combat-2v2-test-ui.js"]){
  assert.ok(read(file).includes("?v="+token),"stale module cache in "+file);
 }
});
