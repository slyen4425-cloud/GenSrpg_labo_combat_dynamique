import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as CREATURES} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";

const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const published=CREATURES.map(path=>({path,record:JSON.parse(read(path))}));
const officialLore=JSON.parse(read("data/capture/bestiary/official-lore.v1.json"));

test("A single editorial published-lore source covers all short Showcase bios without changing author transfers",()=>{
  assert.equal(officialLore.schema,"capture-bestiary-published-lore-v1");
  assert.equal(officialLore.version,1);
  assert.ok(published.length>=22);
  assert.equal(officialLore.entries.length,20);
  const publishedIds=new Set(published.map(x=>x.record.draft.id));
  assert.equal(publishedIds.size,published.length);
  const overlayIds=new Set();
  const allTexts=new Set();
  for(const entry of officialLore.entries){
    assert.ok(publishedIds.has(entry.creatureId),"No invented or unpublished creatureId");
    assert.ok(!overlayIds.has(entry.creatureId),"No duplicate editorial ownership");
    overlayIds.add(entry.creatureId);
    assert.equal(typeof entry.text,"string");
    assert.ok(entry.text.length>=120,entry.creatureId+" lore too brief");
    assert.match(entry.text,/[.!?]$/);
    assert.ok(entry.text.split(/[.!?](?:\s|$)/).filter(x=>x.trim()).length>=2);
    assert.doesNotMatch(entry.text,/^(Na|N\/A|Aucune description)/i);
    assert.ok(!allTexts.has(entry.text),"No duplicated filler prose");
    allTexts.add(entry.text);
  }
  for(const {record} of published){
    if(!overlayIds.has(record.draft.id))
      assert.ok(record.draft.description?.trim().length>=120,
        "Already detailed authored prose preserved for "+record.draft.id);
  }
});

function bestiaryCards(withOverlay){
  const assets=new Map();
  for(const {record} of published){
    const vis=record.draft.presentation.visual;
    for(const role of ["front","back","icon"]){
      const id=vis[role]?.assetId;
      assert.ok(id,record.draft.id+" missing "+role+" binding");
      assets.set(id,{id,mediaType:"image",assetType:role==="icon"?"icon":"sprite",
        resource:{file:"capture/fixtures/"+role+".png"}});
    }
  }
  return captureBestiaryCardsV1({creatureTransfers:published.map(x=>x.record),
    assetCatalog:{assets:[...assets.values()]},statRegistry:{stats:[]},skillTransfers:[],nativeSkills:[],
    ...(withOverlay?{publishedLore:officialLore.entries}:{})});
}
test("Published Bestiary renders exactly 20 editorial portraits and three existing authored descriptions",()=>{
  const cards=bestiaryCards(true);
  assert.equal(cards.length,published.length);
  const editorial=new Map(officialLore.entries.map(x=>[x.creatureId,x.text]));
  for(const card of cards){
    const original=published.find(x=>x.record.draft.id===card.id).record.draft;
    assert.equal(card.name,original.displayName);
    assert.equal(card.description,editorial.get(card.id)??original.description);
    assert.ok(card.description.length>=120,card.name);
    assert.equal(card.skills.length,5);
  }
});
test("Custom universes and the editor never inherit Showcase-only narrative overrides",()=>{
  const cards=bestiaryCards(false);
  assert.equal(cards.length,published.length);
  for(const card of cards){
    const original=published.find(x=>x.record.draft.id===card.id).record.draft;
    assert.equal(card.description,original.description);
  }
  const bestiaryPage=read("examples/dom-demo/bestiary.js");
  const officialFetch=bestiaryPage.indexOf('fetchJson(publishedPath("data/capture/bestiary/official-lore.v1.json"))');
  const customStore=bestiaryPage.indexOf('createCaptureUniverseDatabaseStoreV1({storage:window.localStorage})');
  assert.ok(officialFetch>customStore,"Only published Showcase branch loads editorial metadata");
  assert.match(bestiaryPage,/publishedLore:officialLore.entries/);
});
