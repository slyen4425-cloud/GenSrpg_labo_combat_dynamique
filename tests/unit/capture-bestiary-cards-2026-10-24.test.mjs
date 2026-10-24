import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";

const asset = (id,file) => ({id,assetType:"sprite",mediaType:"image",resource:{file}});
const imageAssets = {assets:[
  asset("face","capture/creatures/test/runtime/front.webp"),
  asset("back","capture/creatures/test/runtime/back.webp"),
  {...asset("icon","capture/creatures/test/runtime/icon.webp"),assetType:"portrait"}
]};
const example = {
  draft:{
    id:"crea_test",displayName:"Créature Test",description:"Présentation.",
    level:2,sourceStats:{force:10,agility:8},elements:["poison"],
    resistances:[{kind:"element:earth",value:-50},{kind:"element:water",value:0}],
    skillIds:["s1","s-unknown"],capture:{captureRate:36,capturable:true},
    presentation:{visual:{front:{assetId:"face"},back:{assetId:"back"},icon:{assetId:"icon"}}}
  },
  statValues:{values:{health:165,speed:15}},
  loadout:{slots:[{id:"slot-1",skillId:"s1"}]}
};
const cards = (creatures=[example],assets=imageAssets) =>
  captureBestiaryCardsV1({creatureTransfers:creatures,assetCatalog:assets,
    skillTransfers:[{draft:{description:"Compétence documentée.",requiredLevel:1,
      definition:{id:"s1",name:"Morsure",element:"poison"}}}],
    statRegistry:{stats:[{id:"health",label:"Santé / PV"},{id:"speed",label:"Vitesse"}]}
  });
test("fiche terminée : image FACE uniquement et données d'auteur fidèles", () => {
  const [card] = cards();
  assert.equal(card.portrait.assetId,"face");
  assert.equal(card.icon.assetId,"icon");
  assert.equal("back" in card,false);
  assert.equal(card.name,"Créature Test");
  assert.deepEqual(card.elements,["poison"]);
  assert.deepEqual(card.attributes.map(a=>a.value),[10,8]);
  assert.deepEqual(card.measures.map(s=>s.label),["Santé / PV","Vitesse"]);
  assert.deepEqual(card.resistances,[{element:"earth",amount:-50}]);
  assert.equal(card.skills[0].name,"Morsure");
  assert.equal(card.skills[0].slot,"slot-1");
  assert.equal(card.unavailableSkillCount,1);
  assert.equal(card.captureRate,36);
  assert.ok(Object.isFrozen(card));
});
test("jamais afficher une créature sans ensemble visuel publié", () => {
  for(const missing of ["face","back","icon"]) {
    const assets={assets:imageAssets.assets.filter(a=>a.id!==missing)};
    assert.equal(cards([example],assets).length,0,missing);
  }
  assert.equal(cards([{draft:{...example.draft,presentation:null}}]).length,0);
  assert.equal(cards([{draft:{...example.draft,displayName:""}}]).length,0);
  assert.equal(cards([example],{assets:[...imageAssets.assets,{id:"fake",assetType:"sprite",mediaType:"image",resource:{file:"https://external.test/x.webp"}}]}).length,1);
});
test("source mise à jour : ajout au même manifeste automatiquement visible, IDs non dupliqués", () => {
  const second={...example,draft:{...example.draft,id:"crea_2",displayName:"Aurore"}};
  const output=cards([example,second,example]);
  assert.deepEqual(output.map(v=>v.name),["Aurore","Créature Test"]);
});
test("sentinelle UI : navigation Bestiaire et consultation sans modèle dos", () => {
  const fromRoot = path => readFileSync(new URL("../../"+path,import.meta.url),"utf8");
  const page=fromRoot("examples/dom-demo/bestiary.html");
  const script=fromRoot("examples/dom-demo/bestiary.js");
  const editor=fromRoot("examples/dom-demo/capture-editor-v2.html");
  assert.match(page,/Bestiaire/);
  assert.match(page,/data-bestiary-portrait/);
  assert.match(editor,/href="\.\/bestiary\.html"/);
  assert.match(script,/CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1/);
  assert.match(script,/GLOBAL_VISUAL_LIBRARY/);
  assert.doesNotMatch(page,/data-bestiary-back/);
  assert.doesNotMatch(script,/visual\.back/);
  assert.match(script,/captureBestiaryCardsV1/);
  assert.match(page,/name="viewport"/);
});
