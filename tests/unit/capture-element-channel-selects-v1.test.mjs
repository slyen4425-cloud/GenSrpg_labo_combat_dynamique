import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { captureEditorElementChannelChoicesV1 } from "../../src/ui/capture-editor-element-channel-select-v1.js";

const rootText=async name=>readFile(new URL("../../"+name,import.meta.url),"utf8");
const native=[{id:"fire",label:"Feu"},{id:"nature",label:"Nature"},{id:"air",label:"Air"}];
const registry={stats:[{id:"defense",label:"Défense",resistanceChannel:"physical",damageChannel:"physical"},{id:"crystal",label:"Cristal",resistanceChannel:"crystal",damageChannel:"crystal"}]};

test("element/channel choices merge the real elemental list with live custom stat channels and physical",()=>{
  const result=captureEditorElementChannelChoicesV1({nativeElements:native,statRegistry:registry});
  assert.deepEqual(result.map(x=>x.id),["fire","nature","air","physical","crystal"]);
  assert.equal(result.find(x=>x.id==="crystal").label,"Cristal");
  assert.equal(result.find(x=>x.id==="nature").label,"Nature");
  assert.equal(result.filter(x=>x.id==="physical").length,1);
});
test("custom stat ID is available before saving and legacy imported channels survive selection",()=>{
  const newElement=captureEditorElementChannelChoicesV1({nativeElements:native,statRegistry:registry,customStat:{id:"lightningstorm",label:"Tempête"}});
  assert.ok(newElement.some(x=>x.id==="lightningstorm"&&x.label==="Tempête"));
  const old=captureEditorElementChannelChoicesV1({nativeElements:native,statRegistry:registry,selectedId:"my_old_modded_element"});
  assert.equal(old.find(x=>x.id==="my_old_modded_element")?.id,"my_old_modded_element");
  assert.equal(old.filter(x=>x.id==="nature").length,1);
});
test("all free-text channels in skill effects and stat resistance editor are selects and refresh after registry change",async()=>{
  const js=await rootText("src/ui/capture-editor-human-v2.js");
  const html=await rootText("examples/dom-demo/capture-editor-v2.html");
  for(const key of ["statDefinitionDamageChannel","statDefinitionResistanceChannel","skillEffectChannel","skillScheduledEffectChannel","skillZoneStatusChannel","skillStatusChannel","skillZoneChannel"]){
    assert.match(js,new RegExp("captureEditorElementChannelChoicesV1|humanElementChannelSelectV1"));
    if(key.startsWith("statDefinition")||["skillEffectChannel","skillScheduledEffectChannel","skillZoneStatusChannel"].includes(key))assert.doesNotMatch(js,new RegExp('tacticalTextInputV1\\(\\s*["\\']'+key));
  }
  assert.match(html,/<select[^>]+data-stat-custom-resistance-channel/);
  assert.match(html,/<select[^>]+data-stat-custom-damage-channel/);
  assert.doesNotMatch(html,/<input[^>]+data-stat-custom-resistance-channel/);
  assert.match(js,/refreshHumanElementChannelSelectsV1/);
  assert.match(js,/customStat/);
});
