import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

function read(path){return readFileSync(new URL("../../"+path,import.meta.url),"utf8")}
function query(source,path){
 const needle=path+"?v=";
 const pos=source.indexOf(needle);
 assert.ok(pos>=0,"expected versioned runtime import "+path);
 const match=source.slice(pos+needle.length).match(/^[A-Za-z0-9_-]+/);
 assert.ok(match,"missing ESM version "+path);
 return match[0];
}
test("public Capture preview imports fresh locomotion script through ONE versioned module chain",()=>{
 const html=read("examples/dom-demo/capture-editor-v2.html");
 const entry=read("examples/dom-demo/capture-editor-v2.js");
 const human=read("src/ui/capture-editor-human-v2.js");
 const loader=read("src/ui/capture-editor-preview-runtime-loader-v1.js");
 const preview=read("src/ui/capture-combat-preview-v1.js");
 const demo=read("src/ui/demo-app.js");
 const release=query(html,"capture-editor-v2.js");
 assert.ok(release.includes("-ground-approach-steps-20261105"));
 assert.equal(query(entry,"capture-editor-human-v2.js"),release);
 assert.equal(query(entry,"capture-editor-preview-runtime-loader-v1.js"),release);
 assert.equal(query(human,"capture-showcase-skill-presets-v1.js"),release);
 assert.equal(query(loader,"capture-combat-preview-v1.js"),release);
 assert.ok(query(preview,"demo-app.js").includes("-ground-approach-steps-20261105"));
 assert.equal(query(demo,"plan-animation.js"),"ground-approach-steps-20261105");
});
