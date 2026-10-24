import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
import {populateBurrowStageAssetChoicesV1} from "../../src/ui/capture-burrow-stage-fields-v1.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {playDomBurrowTerrainFxV2} from "../../src/adapters/renderer/dom-burrow-terrain-fx-v2.js";
import {defaultBurrowSpritesV1} from "../../src/assets/burrow-terrain-builtins-v1.js";

const stages = ["start","travel","impact"];
function fakeRoot() {
  const selectors = Object.fromEntries(stages.map(stage => [
    "[data-burrow-"+stage+"-asset]",{
      value:"burrow:"+stage,
      options:[],
      set textContent(value) {if (value==="") this.options=[];},
      append(option) {this.options.push(option);}
    }
  ]));
  return {
    selectors,
    ownerDocument:{createElement(tag){assert.equal(tag,"option");return {value:"",textContent:""};}},
    querySelector(query){return selectors[query]??null;}
  };
}

test("the same visual catalog populates start, travel and impact without any creature/icon contamination",()=>{
  const root=fakeRoot();
  const assets=[
    {id:"pack:soil:fx",label:"Terre personnalisée",assetType:"sprite",mediaType:"image",category:"skill",
      resource:{file:"fx/soil.webp",frameCount:20},source:{scope:"pack"},compatibility:{uses:["editor"]}},
    {id:"user:fx:1",label:"Mon nuage",assetType:"fx",mediaType:"image",category:"skill",
      resource:{runtimeUrl:"blob:session"},source:{scope:"user"},compatibility:{uses:["editor"]}},
    {id:"pack:creature:dragon",label:"Dragon",assetType:"sprite",mediaType:"image",category:"creature",
      resource:{file:"dragon.webp"},compatibility:{uses:["editor"]}},
    {id:"pack:icon",label:"Icône",assetType:"icon",mediaType:"image",category:"skill",
      resource:{file:"icon.png"},compatibility:{uses:["editor"]}},
  ];
  populateBurrowStageAssetChoicesV1(root,assets);
  for (const stage of stages) {
    const options=root.selectors["[data-burrow-"+stage+"-asset]"].options;
    assert.deepEqual(options.slice(0,2).map(opt=>opt.value),["","burrow:"+stage]);
    assert.ok(options.some(opt=>opt.value==="pack:soil:fx"));
    assert.ok(options.some(opt=>opt.value==="user:fx:1"&&opt.textContent.includes("Mes assets")));
    assert.equal(options.some(opt=>opt.value==="pack:creature:dragon"),false);
    assert.equal(options.some(opt=>opt.value==="pack:icon"),false);
  }
});
test("existing custom sprite selection survives catalog refresh and empty stage selection remains empty",()=>{
  const root=fakeRoot();
  root.selectors["[data-burrow-start-asset]"].value="user:my-missing-fx";
  root.selectors["[data-burrow-impact-asset]"].value="";
  populateBurrowStageAssetChoicesV1(root,[]);
  assert.equal(root.selectors["[data-burrow-start-asset]"].value,"user:my-missing-fx");
  assert.ok(root.selectors["[data-burrow-start-asset]"].options.some(opt=>opt.value==="user:my-missing-fx"));
  assert.equal(root.selectors["[data-burrow-impact-asset]"].value,"");
});
test("custom FX selected in the burrow stage resolves to real catalog media, not just a decorative dropdown",()=>{
  const raw={id:"skill:souterrain-test",version:13,baseVersion:2,subjectType:"skill",subjectId:"souterrain-test",
    visual:{burrowTerrain:{
      start:{assetId:"pack:soil:fx",scale:1.15,offsetX:7,offsetY:-8,frameMs:55},
      travel:{assetId:"user:fx:1",scale:1,offsetX:0,offsetY:0,frameMs:60},
      impact:null}},audio:{}};
  const assets={
    "pack:soil:fx":{url:"https://example.invalid/soil.webp",frameCount:20,frameMs:70},
    "user:fx:1":{url:"blob:session",frameCount:1,frameMs:60}
  };
  const presenter=createCaptureSkillPresentationAssetsV2({
    skillPresentations:{"souterrain-test":raw},
    assetForId:id=>assets[id]??null
  });
  const fx=presenter.presentationForSkill("souterrain-test").burrowTerrain;
  assert.equal(fx.start.url,assets["pack:soil:fx"].url);
  assert.equal(fx.start.scale,1.15);
  assert.equal(fx.start.frameMs,55);
  assert.equal(fx.travel.url,"blob:session");
  assert.equal(fx.impact,null);
});
test("creusement animation outlasts the short dive but ends before emergence",()=>{
  const created=[],animated=[];
  const arena={
    ownerDocument:{createElement(){const node={
      className:"",dataset:{},style:{},setAttribute(){},remove(){this.removed=true;},
      animate(frames,options){
        const handle={frames,options,cancel(){this.cancelled=true;}};
        animated.push(handle);return handle;
      }
    };created.push(node);return node;}},
    append(){}
  };
  const fx=playDomBurrowTerrainFxV2({
    arena,from:{x:40,y:120},to:{x:450,y:175},travelMs:650,sprites:defaultBurrowSpritesV1()
  });
  const start=animated[0];
  assert.ok(start.options.duration>fx.plan.phases.diveMs,
    "start frame sequence should be visible beyond the 22% dive");
  assert.ok(start.options.duration<=fx.plan.emergeAtMs,
    "start must finish before impact/emergence");
  fx.cancel();
  assert.ok(created.every(node=>node.removed));
  assert.ok(animated.every(handle=>handle.cancelled));
});
test("editor refreshes the three sprite menus with published and personal media",()=>{
  const source=readFileSync(resolve(dirname(fileURLToPath(import.meta.url)),
    "../../src/ui/capture-editor-human-v2.js"),"utf8");
  assert.match(source,/function hydrateAssetCatalog[\s\S]*?populateBurrowStageAssetChoicesV1\(root, assets\)/);
  assert.match(source,/function refreshCreatorAssetLists\(\)[\s\S]*?populateBurrowStageAssetChoicesV1\(root, assets\)/);
});
