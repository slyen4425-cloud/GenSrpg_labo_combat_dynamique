import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";

const asset=(id,file)=>({id,assetType:"sprite",mediaType:"image",resource:{file}});
const imageAssets={assets:[
  asset("front","capture/creatures/test/runtime/front.webp"),
  asset("rear","capture/creatures/test/runtime/back.webp"),
  {...asset("icon","capture/creatures/test/runtime/icon.webp"),assetType:"portrait"}
]};
const slots=[
  {id:"slot-1",skillId:"s1"},
  {id:"slot-2",skillId:"native"},
  {id:"slot-3",skillId:"unknown"},
  {id:"slot-4",skillId:null},
  {id:"slot-ultimate",skillId:null}
];
const example={
  draft:{
    id:"crea_test",displayName:"Créature Test",description:"Présentation.",
    level:2,sourceStats:{force:10,agility:8},elements:["poison"],
    resistances:[{kind:"element:earth",value:-50},{kind:"element:water",value:0}],
    // The 20 historical skills must NEVER flow to the equipped Bestiary view.
    skillIds:["s1","native","unknown",...Array.from({length:17},(_,n)=>"learned-"+n)],
    capture:{captureRate:36,capturable:true},
    presentation:{visual:{front:{assetId:"front"},back:{assetId:"rear"},icon:{assetId:"icon"}}}
  },
  statValues:{values:{health:165,speed:15}},
  loadout:{schema:"capture-active-skill-loadout-v1",creatureId:"crea_test",slots}
};
const cards=(creatures=[example],assets=imageAssets)=>
  captureBestiaryCardsV1({creatureTransfers:creatures,assetCatalog:assets,
    nativeSkills:[{definition:{id:"native",name:"Compétence native",element:"fire"}}],
    skillTransfers:[{draft:{description:"Compétence documentée.",requiredLevel:1,
      definition:{id:"s1",name:"Morsure",element:"poison"}}}],
    statRegistry:{stats:[{id:"health",label:"Santé / PV",maxHpPerPoint:1},{id:"speed",label:"Vitesse",chargeTimeReductionPctPerPoint:1}]}
  });
test("face uniquement, aucune caractéristique héritée, 5 slots selon loadout",()=>{
  const [card]=cards();
  assert.equal(card.portrait.assetId,"front");
  assert.equal(card.icon.assetId,"icon");
  assert.equal("back" in card,false);
  assert.equal("attributes" in card,false);
  assert.deepEqual(card.measures.map(x=>x.label),["Santé / PV","Vitesse"]);
  assert.deepEqual(card.resistances,[{element:"earth",amount:-50}]);
  assert.equal(card.skills.length,5);
  assert.deepEqual(card.skills.map(x=>x.slot),slots.map(x=>x.id));
  assert.deepEqual(card.skills.map(x=>x.state),[
    "ready","ready","unpublished","empty","empty"]);
  assert.equal(card.skills[0].name,"Morsure");
  assert.equal(card.skills[1].name,"Compétence native");
  assert.equal(card.skills[2].name,undefined);
  assert.equal(card.skills[4].name,undefined);
  assert.equal(card.skills.some(x=>String(x.name).includes("learned")),false);
  assert.equal(card.captureRate,36);
  assert.ok(Object.isFrozen(card));
});
test("a skill linked but not equipped must never replace an empty slot",()=>{
  const onlyOne={...example,draft:{...example.draft,skillIds:["s1","native"]},
    loadout:{...example.loadout,slots:slots.map(s=>({id:s.id,skillId:s.id==="slot-1"?"s1":null}))}};
  const [card]=cards([onlyOne]);
  assert.deepEqual(card.skills.map(s=>s.state),["ready","empty","empty","empty","empty"]);
});
test("creature with unmatched loadout identity rejects data rather than masking",()=>{
  const invalid={...example,loadout:{...example.loadout,creatureId:"other"}};
  assert.throws(()=>cards([invalid]),/loadout creatureId differs/);
});
test("published asset readiness : front, back, icon all required",()=>{
  for(const missing of ["front","rear","icon"]){
    const published={assets:imageAssets.assets.filter(a=>a.id!==missing)};
    assert.equal(cards([example],published).length,0,missing);
  }
  assert.equal(cards([{draft:{...example.draft,presentation:null}}]).length,0);
});
test("same showcase manifest can grow without a second creature registry",()=>{
  const second={...example,draft:{...example.draft,id:"crea_2",displayName:"Aurore"},
    loadout:{...example.loadout,creatureId:"crea_2"}};
  assert.deepEqual(cards([example,second,example]).map(x=>x.name),
    ["Aurore","Créature Test"]);
});
test("HTML: no redundant Force table; gallery opens one presentation route",()=>{
  const file=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
  const page=file("examples/dom-demo/bestiary.html");
  const app=file("examples/dom-demo/bestiary.js");
  const model=file("src/ui/capture-bestiary-cards-v1.js");
  const editor=file("examples/dom-demo/capture-editor-v2.html");
  assert.match(page,/data-bestiary-return/);
  assert.match(page,/data-bestiary-portrait/);
  assert.match(page,/Compétences équipées/);
  assert.doesNotMatch(page,/data-bestiary-attributes|bestiary-attributes/);
  assert.doesNotMatch(model,/sourceStats|draft.skillIds/);
  assert.doesNotMatch(app,/historicalAbilities|capture-used-ability-catalog/);
  assert.match(app,/history.pushState/);
  assert.match(app,/popstate/);
  assert.match(app,/nativeSkills/);
  assert.match(editor,/href="\.\/bestiary\.html"/);
});

test("effects under each stat derive from the identical editor-owned projection",()=>{
  const [card]=cards();
  assert.equal(card.measures[0].effectSummary,
    "1 point = +1 PV max · 165 points = 165 PV max");
  assert.equal(card.measures[1].effectSummary,
    "1 point = -1 % temps de charge · 15 points = -15 % temps de charge");
  const editor=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  const app=readFileSync(new URL("../../examples/dom-demo/bestiary.js",import.meta.url),"utf8");
  assert.match(editor,/captureStatEffectSummaryV1 as humanStatEffectSummaryV1/);
  assert.doesNotMatch(editor,/function statEffectNumber\(/);
  assert.match(app,/stat__effect/);
  assert.match(app,/effectSummary/);
});
test("registered element stats preserve the editor damage/resistance formula",()=>{
  const source=JSON.parse(readFileSync(
    new URL("../../data/capture/monster-capture-stat-registry.v1.json",import.meta.url),"utf8"));
  const venombre={...example,
    statValues:{values:{poison:20,health:165,speed:15}}};
  const [card]=captureBestiaryCardsV1({
    creatureTransfers:[venombre],assetCatalog:imageAssets,statRegistry:source
  });
  const poison=card.measures.find(x=>x.key==="poison");
  assert.ok(poison);
  assert.equal(poison.effectSummary,
    "1 point = +1 % dégâts Poison / +1 % résistance Poison · 20 points = +20 % dégâts / +20 % résistance");
});
test("unknown custom stat is not given fabricated effects",()=>{
  const unknown={...example,statValues:{values:{mystere:4}}};
  const [card]=cards([unknown]);
  assert.equal(card.measures[0].label,"Mystere");
  assert.equal("effectSummary" in card.measures[0],false);
});
