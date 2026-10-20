import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {captureEditorGeneratedStatIdV1,captureEditorElementChannelChoicesV1} from "../../src/ui/capture-editor-element-channel-select-v1.js";
import {nextHumanTacticalStatusIdV1,nextHumanTacticalZoneIdV1} from "../../src/ui/capture-editor-human-v2.js";
const read=p=>readFile(new URL("../../"+p,import.meta.url),"utf8");
test("French stat names generate stable unique technical IDs privately",()=>{
 assert.equal(captureEditorGeneratedStatIdV1("Armure d’acier"),"armure-d-acier");
 assert.equal(captureEditorGeneratedStatIdV1("Givre",[{id:"givre"}]),"givre-2");
 assert.equal(captureEditorGeneratedStatIdV1("Électricité",[{id:"electricite"},{id:"electricite-2"}]),"electricite-3");
 assert.equal(captureEditorGeneratedStatIdV1(""),"stat");
});
test("French element labels selected without requiring English IDs; imported author value remains intact",()=>{
 const choices=captureEditorElementChannelChoicesV1({
   nativeElements:[{id:"steel",label:"Acier"},{id:"fire",label:"Feu"}],selectedId:"acier"
 });
 assert.equal(choices.find(x=>x.id==="steel").label,"Acier");
 assert.equal(choices.find(x=>x.id==="acier").label,"Acier — choix importé");
 assert.equal(choices.filter(x=>x.id==="acier").length,1);
});
test("status and zone IDs allocated automatically and imported IDs are preserved",()=>{
 assert.equal(nextHumanTacticalStatusIdV1(["status-1","status-2"]),"status-3");
 assert.equal(nextHumanTacticalZoneIdV1(["zone-1","zone-2"]),"zone-3");
 const js=await read("src/ui/capture-editor-human-v2.js");
 const html=await read("examples/dom-demo/capture-editor-v2.html");
 assert.match(html,/<input type="hidden" data-stat-custom-id/);
 assert.doesNotMatch(html,/ID stable<input data-stat-custom-id/);
 assert.match(js,/captureEditorGeneratedStatIdV1\(label, statRegistry\?\.stats \?\? \[\]\)/);
 assert.match(js,/statusId\.type = "hidden"/);
 assert.match(js,/zoneId\.type = "hidden"/);
 assert.match(js,/nextHumanTacticalZoneIdV1/);
 assert.doesNotMatch(js,/createOption\(select,id,label\+" \("\+id\+"\)"\)/);
});
