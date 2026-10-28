import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {normalizeSkillPresentationBinding} from "../../src/contracts/skill-presentation-binding.js";

const root=new URL("../../",import.meta.url);
function node(rect={left:0,top:0,width:80,height:80}){
  return {className:"",style:{},dataset:{},children:[],append(child){this.children.push(child);},
    remove(){},getBoundingClientRect(){return rect}};
}
async function stage(skillName,asset){
  const data=JSON.parse(await readFile(new URL("data/capture/showcase/"+skillName+".capture-skill-transfer-v1.json",root),"utf8")).draft;
  const projection=createCaptureSkillPresentationAssetsV2({
    skillPresentations:{[data.id]:normalizeSkillPresentationBinding(data.presentation)},
    assetForId:()=>asset
  });
  const arena=node({left:0,top:0,width:900,height:500});
  arena.ownerDocument={createElement:()=>node()};
  const anchors={player:node({left:80,top:320,width:80,height:80}),
    opponent:node({left:720,top:120,width:80,height:80})};
  const renderer=createDomSkillFxRenderer({arena,anchors,targetAnchors:anchors,
    presentationForSkill:(id,context)=>projection.presentationForSkill(id,context),
    animate(target,keyframes,options){return {target,keyframes,options,finished:new Promise(()=>{}),cancel(){}}}
  });
  return {renderer,arena,id:data.id,form:data.definition.form,travelMs:data.definition.travelMs};
}
function launch(stage,slot,fromPoint){
  const type=stage.form;
  stage.renderer.play({type,skillId:stage.id,fromSlot:slot,
    targetSlot:slot==="opponent"?"player":"opponent",durationMs:stage.travelMs,
    ...(fromPoint?{fromPoint}:{})});
  const fx=stage.arena.children.findLast(c=>c.className.includes("skill-fx--"+type));
  assert.ok(fx,"real authored attack form has to be rendered");
  return fx;
}
function angle(transform){
  const match=transform.match(/rotate\(([-\d.eE]+)rad\)/);
  assert.ok(match,transform);
  return Number(match[1]);
}

test("left-authored Fireball points toward both teams without rotating the drawing upside down",async()=>{
  const scene=await stage("fireball",{url:"/actual-left-facing-fireball.png",headingRad:Math.PI,frameCount:8,frameMs:70});
  const outgoing=launch(scene,"player");
  const spriteRight=outgoing.children.find(c=>c.className.includes("skill-fx__sprite"));
  assert.match(spriteRight.style.transform,/scaleX\(-1\)/,"rightward flight mirrors left-authored sprite");
  assert.ok(Math.abs(angle(spriteRight.style.transform))<Math.PI/2);
  const incoming=launch(scene,"opponent");
  const spriteLeft=incoming.children.find(c=>c.className.includes("skill-fx__sprite"));
  assert.doesNotMatch(spriteLeft.style.transform,/scaleX\(-1\)/,"leftward flight keeps its authored facing");
  assert.ok(Math.abs(angle(spriteLeft.style.transform))<Math.PI/2);
  const reflected=launch(scene,"opponent",{x:720,y:150});
  const reflectedSprite=reflected.children.find(c=>c.className.includes("skill-fx__sprite"));
  assert.doesNotMatch(reflectedSprite.style.transform,/scaleX\(-1\)/);
  assert.ok(Math.abs(angle(reflectedSprite.style.transform))<Math.PI/2);
  scene.renderer.dispose();
});

test("real Coupe feuille beam body stays upright from the opponent; geometry and endpoints are unchanged",async()=>{
  const scene=await stage("coupe_feuille",{url:"/leaves.webp",headingRad:0,frameCount:12,frameMs:65});
  assert.equal(scene.form,"beam","must test the authored form, not a fake projectile");
  const outgoing=launch(scene,"player");
  const rightBody=outgoing.children.find(c=>c.className.includes("skill-fx__beam-body"));
  assert.ok(rightBody);
  assert.equal(rightBody.style.transform,"none");
  const incoming=launch(scene,"opponent");
  const leftBody=incoming.children.find(c=>c.className.includes("skill-fx__beam-body"));
  assert.ok(leftBody);
  assert.equal(leftBody.style.transform,"scaleY(-1)",
    "beam shell geometry rotates toward target; child must correct the vertical flip");
  assert.ok(incoming.style.width.endsWith("px"));
  assert.ok(Math.abs(angle(incoming.style.transform))>Math.PI/2,"beam still connects the two original anchors");
  scene.renderer.dispose();
});
