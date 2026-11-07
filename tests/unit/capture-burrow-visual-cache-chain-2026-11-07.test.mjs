import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("RED: public burrow editor and all shared ESM owners carry one cache revision",()=>{
 const html=read("examples/dom-demo/capture-editor-v2.html");
 const rev=html.match(/src="\.\/capture-editor-v2\.js\?v=([^"]+)"/)?.[1];
 assert.ok(rev?.endsWith("burrow-visual-fields-20261107"));
 const owners={
  "examples/dom-demo/capture-editor-v2.js":["capture-editor-human-v2.js","capture-editor-preview-runtime-loader-v1.js","global-visual-library.js"],
  "src/ui/capture-editor-human-v2.js":["capture-showcase-skill-presets-v1.js","global-visual-library.js"],
  "src/ui/capture-editor-preview-runtime-loader-v1.js":["capture-combat-preview-v1.js"],
  "src/ui/capture-combat-preview-v1.js":["combat-2v2-test-ui.js"],
  "src/ui/combat-2v2-test-ui.js":["capture-combat-preview-v1.js"]
 };
 for(const [file,required] of Object.entries(owners)){
  const code=read(file);
  for(const script of required){
   const marker=script+"?v="+rev;
   if(code.includes(script+"?v="))
     assert.ok(code.includes(marker),"mixed release for "+script+" in "+file);
  }
 }
});
