import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {captureUiStatIconAssetIdV1,captureUiPublishedStatIconV1,captureSkillDamageChannelsV1} from "../../src/assets/capture-ui-stat-icon-bindings-v1.js";
const read=path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
test("approved mapping covers 16 actual registry stats, not energy or endurance",async()=>{
 const registry=JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json"));
 assert.equal(registry.stats.length,16);
 for(const stat of registry.stats)assert.ok(captureUiStatIconAssetIdV1(stat.id),stat.id);
 assert.equal(captureUiStatIconAssetIdV1("energy"),null);
 assert.equal(captureUiStatIconAssetIdV1("endurance"),null);
 assert.equal(captureUiStatIconAssetIdV1("ice"),"core:ui-element-glace-01");
});
test("no icon unless its real file is published in canonical catalog",()=>{
 const a={id:"core:ui-element-electric-01",assetType:"icon",mediaType:"image",
  resource:{file:"core/icons/ui/element/icon_ui_element_electric_128.webp"}};
 assert.equal(captureUiPublishedStatIconV1([],"electric"),null);
 assert.equal(captureUiPublishedStatIconV1([{...a,resource:{file:"../bad.webp"}}],"electric"),null);
 assert.deepEqual(captureUiPublishedStatIconV1([a],"electric"),
   {assetId:a.id,file:a.resource.file});
});
test("damage type comes from authored effects, never an outgoing-damage modifier",async()=>{
 const perle=JSON.parse(await read("data/capture/showcase/krakenor-perle-pression.capture-skill-transfer-v1.json")).draft.definition;
 assert.deepEqual(captureSkillDamageChannelsV1(perle),["water"]);
 assert.deepEqual(captureSkillDamageChannelsV1({effect:{damage:10}}),["physical"]);
 assert.deepEqual(captureSkillDamageChannelsV1({effects:[{kind:"apply_status",status:{kind:"outgoing_damage_modifier",modifierPct:-20}}]}),[]);
});
test("editor and bestiary use the one published-media resolver",async()=>{
 const sources=await Promise.all(["src/ui/capture-editor-human-v2.js","src/ui/capture-bestiary-cards-v1.js","examples/dom-demo/bestiary.js"].map(read));
 assert.ok(sources[0].includes("refreshHumanStatValueIconsV1"));
 assert.ok(sources[1].includes("captureUiPublishedStatIconV1"));
 assert.ok(sources[2].includes("skill__damage-icon"));
});

test("Bestiary numeric damage regex is executable rather than escaped as literal slash",async()=>{
 const source=await read("examples/dom-demo/bestiary.js");
 assert.match(source,/if\(\/\\d\+\(\?:\[,.\]\\d\+\)\? dégâts\/i\.test\(sentence\)\)/);
 assert.ok(/\d+(?:[,.]\d+)? dégâts/i.test("Inflige 8 dégâts d'Eau"));
 assert.equal(/\d+(?:[,.]\d+)? dégâts/i.test("Réduit les dégâts de 20 %"),false);
});
