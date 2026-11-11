import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";

const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const parse=path=>JSON.parse(read(path));
const creaturePath="data/capture/showcase/crea_sylvorne.capture-creature-transfer-v1.json";
const creature=parse(creaturePath);
const visuals=creature.draft.presentation.visual;
const image=(id,file,type)=>({id:id.assetId,assetType:type,mediaType:"image",resource:{file}});
const assetCatalog={assets:[
  image(visuals.front,"capture/creatures/sylvorne/runtime/sylvorne_face.png","sprite"),
  image(visuals.back,"capture/creatures/sylvorne/runtime/sylvorne_dos.png","sprite"),
  image(visuals.icon,"capture/creatures/sylvorne/runtime/sylvorne_icone.png","portrait")
]};
const skills=creature.draft.skillIds.map(id=>parse("data/capture/showcase/"+id+".capture-skill-transfer-v1.json"));

test("official Showcase Bestiary projects Sylvorne with all 3 canonical visuals and five native skills",()=>{
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(p=>p===creaturePath).length,1);
  const cards=captureBestiaryCardsV1({
    creatureTransfers:[creature],skillTransfers:skills,assetCatalog,
    statRegistry:parse("data/capture/monster-capture-stat-registry.v1.json"),
    nativeSkills:[]
  });
  assert.equal(cards.length,1,"a complete canonically illustrated creature must not be silently omitted");
  const card=cards[0];
  assert.equal(card.name,"Sylvorne");
  assert.equal(card.portrait.file,assetCatalog.assets[0].resource.file);
  assert.equal(card.icon.file,assetCatalog.assets[2].resource.file);
  assert.equal(card.skills.length,5);
  assert.equal(card.skills.filter(s=>s.state==="ready").length,5);
  assert.equal(card.measures.find(s=>s.key==="speed")?.value,0);
  assert.equal(card.measures.find(s=>s.key==="physical")?.value,0);
});
test("public editor and Bestiary explicitly refresh the published Sylvorne module graph",()=>{
  const token="sylvorne-showcase-media-20261111";
  const bestiaryHtml=read("examples/dom-demo/bestiary.html");
  const bestiaryEntry=read("examples/dom-demo/bestiary.js");
  const editorHtml=read("examples/dom-demo/capture-editor-v2.html");
  const editorEntry=read("examples/dom-demo/capture-editor-v2.js");
  const editorOwner=read("src/ui/capture-editor-human-v2.js");
  assert.ok(bestiaryHtml.includes("bestiary.js?v="+token));
  assert.ok(editorHtml.includes("capture-editor-v2.js?v="));
  assert.ok(editorHtml.includes(token));
  for(const module of [
    "capture-showcase-creature-presets-v1.js",
    "capture-showcase-skill-presets-v1.js",
    "global-visual-library.js"
  ])assert.ok(bestiaryEntry.includes(module+"?v="+token),"Bestiary cached module: "+module);
  assert.ok(editorEntry.includes("capture-editor-human-v2.js?v=")&&editorEntry.includes(token));
  assert.ok(editorOwner.includes("capture-showcase-creature-presets-v1.js?v="+token));
  assert.ok(editorOwner.includes("capture-showcase-skill-presets-v1.js?v=")&&editorOwner.includes(token));
});
