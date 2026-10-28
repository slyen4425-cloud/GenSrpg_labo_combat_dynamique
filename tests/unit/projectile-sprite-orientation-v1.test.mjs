import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createCaptureSkillPresentationAssetsV2 } from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { normalizeSkillPresentationBinding } from "../../src/contracts/skill-presentation-binding.js";
import { createGlobalPresentationAssetResolverV1 } from "../../src/assets/global-presentation-asset-resolver-v1.js";

const fixturePath = "../../data/capture/showcase/cap_air_atk_4.capture-skill-transfer-v1.json";
const spriteAsset = {url:"/creator-tornado.png",frameCount:8,frameMs:90,coreAnchor:{x:0.5,y:0.5}};
function element(rect={left:0,top:0,width:80,height:80}) {
  return {className:"",style:{},dataset:{},children:[],append(x){this.children.push(x);},remove(){},getBoundingClientRect(){return rect}};
}
async function runProjectile({fromSlot="player",asset=spriteAsset}={}) {
  const file=JSON.parse(await readFile(new URL(fixturePath,import.meta.url),"utf8"));
  const binding=normalizeSkillPresentationBinding(file.draft.presentation);
  const projection=createCaptureSkillPresentationAssetsV2({
    skillPresentations:{[file.draft.id]:binding},
    assetForId:()=>asset
  });
  const animations=[];
  const doc={createElement:()=>element()};
  const arena=element({left:0,top:0,width:900,height:500});
  arena.ownerDocument=doc;
  const anchors={
    player:element({left:80,top:320,width:80,height:80}),
    opponent:element({left:720,top:120,width:80,height:80})
  };
  const renderer=createDomSkillFxRenderer({arena,anchors,targetAnchors:anchors,
    presentationForSkill:(id,context)=>projection.presentationForSkill(id,context),
    animate(node,keyframes,options){
      const a={node,keyframes,options,finished:new Promise(()=>{}),cancel(){}};
      animations.push(a);return a;
    }
  });
  const targetSlot=fromSlot==="player"?"opponent":"player";
  const playing=renderer.play({type:"projectile",skillId:file.draft.id,fromSlot,targetSlot,durationMs:file.draft.definition.travelMs});
  const flight=animations.find(a=>a.node.className.includes("skill-fx--projectile"));
  const sprite=flight.node.children.find(c=>c.className.includes("skill-fx__sprite"));
  return {file,binding,projection,renderer,playing,flight,sprite};
}

test("vertical tornado sprite from AI remains upright while movement and visual depth stay unchanged",async()=>{
  const {renderer,flight,sprite}=await runProjectile({fromSlot:"opponent"});
  assert.equal(sprite.style.transform,"rotate(0rad)");
  assert.equal(flight.options.duration,2500);
  assert.equal(flight.keyframes[0].zIndex,undefined);
  assert.equal(flight.keyframes.at(-1).zIndex,undefined);
  assert.ok(Math.abs(Number(flight.keyframes[0].transform.match(/scale\(([^)]+)\)/)[1])-2.35)<1e-6);
  assert.match(flight.keyframes.at(-1).transform,/scale\(4\.9\)/);
  renderer.dispose();
});

test("unoriented personal sprite also stays upright from player, no arbitrary downward tilt",async()=>{
  const {renderer,sprite,flight}=await runProjectile({fromSlot:"player",asset:{url:"/user-upload.png",frameCount:2,frameMs:125}});
  assert.equal(sprite.style.transform,"rotate(0rad)");
  assert.equal(flight.options.duration,2500);
  renderer.dispose();
});

test("directional asset with native heading follows both directions without upside-down opponent artwork",async()=>{
  const asset={...spriteAsset,headingRad:0};
  const a=await runProjectile({fromSlot:"player",asset});
  const b=await runProjectile({fromSlot:"opponent",asset});
  const headingA=Math.atan2(-200,640);
  const headingB=Math.atan2(200,-640);
  assert.equal(a.sprite.style.transform,`rotate(${headingA}rad)`);
  assert.equal(b.sprite.style.transform,`rotate(${headingB-Math.PI}rad) scaleX(-1)`);
  assert.ok(Math.abs(headingB-Math.PI)<Math.PI/2,
    "opponent projectile must not rotate its art by 180 degrees");
  a.renderer.dispose();b.renderer.dispose();
});

test("editor offers one principal far-depth setting and places V11 historical perspective behind compatibility details",async()=>{
  const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  assert.match(html,/<details[^>]*data-skill-legacy-perspective/);
  assert.match(html,/<summary>[^<]*Perspective historique/);
  const detail=html.match(/<details[^>]*data-skill-legacy-perspective[^>]*>([\s\S]*?)<\/details>/);
  assert.ok(detail,"legacy control is inside collapsible compatibility details");
  assert.match(detail[1],/data-skill-travel-perspective/);
  assert.match(html,/data-skill-travel-far-scale/);
});

test("global asset resolver preserves explicit heading zero but ignores missing/null heading",()=>{
  for (const heading of [null,undefined]) {
    const resolve=createGlobalPresentationAssetResolverV1({
      assetCatalog:{assets:[{id:"neutral",resource:{file:"fx.png",headingRad:heading}}]},
      assetUrlForFile:()=>"/fx.png"
    });
    assert.equal("headingRad" in resolve("neutral"),false);
  }
  const resolve=createGlobalPresentationAssetResolverV1({
    assetCatalog:{assets:[{id:"directed",resource:{file:"fx.png",headingRad:0}}]},
    assetUrlForFile:()=>"/fx.png"
  });
  assert.equal(resolve("directed").headingRad,0);
});
