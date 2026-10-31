import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
test("snowball catalog v46 busts every public editor entry and dynamic preview module cache",()=>{
 const token=read("examples/dom-demo/capture-editor-v2.html").match(/capture-editor-v2\.js\?v=([^"]+)/)?.[1];
 assert.ok(token&&token.includes("snowball-v46"),"Snowball delivered module revision must remain");
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
 const m=owner.match(/const REVISION = "2026-\d\d-\d\d-v(\d+)-[a-z0-9-]+"/);
 assert.ok(m&&Number(m[1])>=46,"Snowball requires catalog v46 or newer");
});
