import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as CREATURES} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";

const published=CREATURES.map(path=>({
  path,record:JSON.parse(readFileSync(new URL("../../"+path,import.meta.url),"utf8"))
}));
const descriptions=published.map(({path,record})=>({path,id:record.draft.id,
  name:record.draft.displayName,description:record.draft.description}));

test("Every published Showcase creature has substantial unique French Bestiary lore",()=>{
  assert.ok(published.length>=22,"all currently published Showcase creatures must be audited");
  assert.equal(new Set(published.map(x=>x.record.draft.id)).size,published.length);
  assert.equal(new Set(descriptions.map(x=>x.description?.trim())).size,published.length,
    "creatures must not share a generic copy-pasted description");
  for(const {path,description} of descriptions){
    assert.equal(typeof description,"string",path);
    const lore=description.trim();
    assert.ok(lore.length>=120,path+" has only "+lore.length+" characters");
    assert.match(lore,/[.!?]$/,path+" should end with punctuation");
    assert.ok(lore.split(/[.!?](?:\s|$)/).filter(x=>x.trim()).length>=2,
      path+" should have at least two sentences");
    assert.doesNotMatch(lore,/^(Na|N\/A|Aucune description|Description non renseignée|.+, créature de type .+)\.?$/i,
      path+" cannot keep an editor placeholder");
  }
});

test("The actual Bestiary card projection uses authored descriptions, never a second lore source",()=>{
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
  const cards=captureBestiaryCardsV1({creatureTransfers:published.map(x=>x.record),
    assetCatalog:{assets:[...assets.values()]},statRegistry:{stats:[]},skillTransfers:[],nativeSkills:[]});
  assert.equal(cards.length,published.length);
  for(const card of cards){
    const authored=published.find(x=>x.record.draft.id===card.id).record.draft;
    assert.equal(card.name,authored.displayName);
    assert.equal(card.description,authored.description);
    assert.equal(card.skills.length,5,"unchanged canonical active loadout");
  }
});
