import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
test("snowball catalog v46 busts every public editor entry and dynamic preview module cache",()=>{
 const token="liane-audio-r2-20261030-snowball-v46-20261031-stage-energy-boule-20261031";
 const paths=[
  "examples/dom-demo/capture-editor-v2.html",
  "examples/dom-demo/capture-editor-v2.js",
  "src/ui/capture-editor-human-v2.js",
  "src/ui/capture-editor-preview-runtime-loader-v1.js",
  "src/ui/capture-combat-preview-v1.js",
  "src/ui/combat-2v2-test-ui.js"
 ];
 for(const path of paths){
  const text=read(path);
  assert.ok(text.includes("?v="+token),"old cached module import remains in "+path);
  assert.equal(text.includes("?v=liane-audio-r2-20261030\""),false,"old exact cached revision in "+path);
 }
 const owner=read("src/assets/global-visual-library.js");
 assert.match(owner,/const BRANCH = "global-assets"/);
 assert.match(owner,/2026-10-31-v46-boule-de-neige-3x12/);
});
