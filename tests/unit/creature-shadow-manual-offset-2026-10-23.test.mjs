import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCreaturePresentationBinding } from "../../src/contracts/creature-presentation-binding.js";
import { buildHumanCreatureDraftV3 } from "../../src/ui/capture-editor-human-v2.js";
import { groundShadowLayoutFromOpaqueMaskV2 } from "../../src/adapters/renderer/dom-ground-shadow-v2.js";
import { adaptCaptureExportToNativeVisualSourceV1 } from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";

const source = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
function authorFields(shadowOffset = undefined) {
  return {
    id:"crea_tox_2",displayName:"Venombre",description:"",level:1,
    sourceStats:{force:1,agility:1,intelligence:1,spirit:1,endurance:1,initiative:1},
    elements:[],resistances:{},capture:{capturable:true,captureRate:10,spawnChance:10,spawnTags:[],evolution:null},
    combat:{maxHp:100,maxEnergy:10,initialEnergy:0,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0},
    linkedSkillIds:[],profileId:"biped",displayScale:1,
    visual:{frontAssetId:"pack:test:front",backAssetId:"",iconAssetId:""},sockets:[],audio:{},
    ...(shadowOffset === undefined ? {} : { shadowOffset })
  };
}
function tailMask() {
  const width=120,height=120,opaque=new Uint8Array(width*height);
  for(const [x0,y0,x1,y1] of [[12,15,80,56],[32,53,41,102],[66,53,75,102],[99,10,99,118]]) {
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)opaque[y*width+x]=1;
  }
  return {width,height,opaque};
}

test("new author field is optional: 0/0 leaves old binding and automatic shadows unchanged",()=>{
  const original=buildHumanCreatureDraftV3(authorFields());
  const zero=buildHumanCreatureDraftV3(authorFields({x:0,y:0}));
  assert.equal(original.presentation.version,zero.presentation.version);
  assert.deepEqual(original.presentation,zero.presentation);
  const shadow=groundShadowLayoutFromOpaqueMaskV2(tailMask());
  assert.deepEqual(shadow,groundShadowLayoutFromOpaqueMaskV2(tailMask(),{offsetXPct:0,offsetYPct:0}));
  const profile=JSON.parse(source("data/capture/showcase/crea_tox_2.capture-creature-transfer-v1.json"));
  assert.equal(profile.draft.presentation.profileId,"biped");
  assert.equal(profile.draft.presentation.shadowOffset,undefined);
});

test("real creature editor -> V10 contract roundtrip: X/Y do not alter morphology or skill data",()=>{
  const fields=authorFields({x:-14,y:11});
  const draft=buildHumanCreatureDraftV3(fields);
  assert.equal(draft.presentation.version,10);
  assert.deepEqual(draft.presentation.shadowOffset,{x:-14,y:11});
  assert.equal(draft.presentation.profileId,"biped");
  const again=normalizeCreaturePresentationBinding(JSON.parse(JSON.stringify(draft.presentation)));
  assert.deepEqual(again.shadowOffset,{x:-14,y:11});
  assert.ok(Object.isFrozen(again.shadowOffset));
  assert.deepEqual(draft.combat,buildHumanCreatureDraftV3(authorFields()).combat);
  for(const bad of [NaN,Infinity,-41,41,"12",null]) {
    assert.throws(()=>buildHumanCreatureDraftV3(authorFields({x:bad,y:0})),/ombre|shadowOffset|must/i);
  }
  assert.throws(()=>normalizeCreaturePresentationBinding({...again,shadowOffset:{x:0,y:0,z:7}}),/shadowOffset/);
});

test("single-shadow renderer moves ellipse right/down and silhouette with the same authored XY, keeping collision contact intact",()=>{
  const mask=tailMask(), auto=groundShadowLayoutFromOpaqueMaskV2(mask);
  const moved=groundShadowLayoutFromOpaqueMaskV2(mask,{offsetXPct:9,offsetYPct:12});
  assert.equal(moved.centerXPct,auto.centerXPct+9);
  assert.equal(moved.bottomPct,Math.max(0,auto.bottomPct-12));
  assert.equal(moved.contactXPct,auto.contactXPct);
  assert.equal(moved.contactYPct,auto.contactYPct);
  assert.equal(moved.widthPct,auto.widthPct);
  assert.equal(moved.heightPct,auto.heightPct);
  assert.equal(moved.offsetXPct,9);
  assert.equal(moved.offsetYPct,12);
  const raised=groundShadowLayoutFromOpaqueMaskV2(mask,{offsetXPct:-8,offsetYPct:-10});
  assert.equal(raised.bottomPct,Math.min(60,auto.bottomPct+10));
  assert.equal(raised.centerXPct,auto.centerXPct-8);
  for(const bad of [NaN,Infinity,-41,41])assert.throws(
    ()=>groundShadowLayoutFromOpaqueMaskV2(mask,{offsetXPct:bad}),/shadow offsets/
  );
});

test("native combat preview receives V10 creature-specific offset without changing legacy opponent",()=>{
  const v10=buildHumanCreatureDraftV3(authorFields({x:-8,y:9})).presentation;
  const legacy=buildHumanCreatureDraftV3({...authorFields(),id:"normal",displayName:"Normal"}).presentation;
  const combat={maxHp:50,maxEnergy:10};
  const exported={
    schema:"capture-combat-export-v1",
    battle:{id:"shadow-preview",localActorId:"player"},
    teams:{local:["player"],opponent:["enemy"]},
    actors:[
      {actorId:"player",teamId:"local",creatureId:"crea_tox_2",displayName:"Venombre",controllerId:"human"},
      {actorId:"enemy",teamId:"opponent",creatureId:"normal",displayName:"Normal",controllerId:"ai"}
    ],
    creatures:[
      {id:"crea_tox_2",displayName:"Venombre",combat,skillIds:[],presentationId:v10.id},
      {id:"normal",displayName:"Normal",combat,skillIds:[],presentationId:legacy.id}
    ],
    skills:[],rosters:[],
    presentation:{creatures:{[v10.id]:v10,[legacy.id]:legacy}}
  };
  const result=adaptCaptureExportToNativeVisualSourceV1({
    exported,
    assetCatalog:{assets:[{id:"pack:test:front",resource:{file:"sprite.png"}}]},
    profiles:[{id:"biped",idle:{},attack:{},hit:{},ko:{}}],
    assetUrlForFile:file=>"https://example.test/"+file
  });
  const venombre=result.creatureMetas.find(m=>m.id==="crea_tox_2");
  const ordinary=result.creatureMetas.find(m=>m.id==="normal");
  assert.equal(venombre.profile,"biped");
  assert.deepEqual(venombre.shadowOffset,{x:-8,y:9});
  assert.equal(ordinary.shadowOffset,null);
});

test("the real Appearance UI and one shadow render path retain the manual X/Y through load/save/display",()=>{
  const html=source("examples/dom-demo/capture-editor-v2.html");
  const ui=source("src/ui/capture-editor-human-v2.js");
  const bridge=source("src/adapters/input/capture/capture-export-to-native-visual-source-v1.js");
  const renderer=source("src/ui/demo-app.js");
  const css=source("examples/dom-demo/demo.css");
  for(const axis of ["x","y"]) {
    const field="data-creature-shadow-offset-"+axis;
    assert.equal((html.match(new RegExp(field,"g"))??[]).length,1,field);
    assert.ok(ui.includes('['+field+']'),"reader/writer owns "+field);
    assert.match(css,new RegExp("--creature-shadow-offset-"+axis));
    assert.match(renderer,new RegExp("--creature-shadow-offset-"+axis));
  }
  assert.match(bridge,/shadowOffset: binding\.version >= 10/);
  assert.match(renderer,/offsetXPct: meta\.shadowOffset\?\.x/);
  assert.match(renderer,/offsetYPct: meta\.shadowOffset\?\.y/);
  assert.match(css,/translate\(var\(--creature-shadow-offset-x/);
  assert.equal((html.match(/data-demo-shadow/g)??[]).length,(html.match(/data-demo-motion/g)??[]).length);
});
