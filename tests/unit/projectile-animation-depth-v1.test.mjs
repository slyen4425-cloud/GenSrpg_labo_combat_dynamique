import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalizeSkillPresentationBinding} from "../../src/contracts/skill-presentation-binding.js";
import {buildHumanSkillDraftV1,humanSkillEditorFieldsFromDraftV1} from "../../src/ui/capture-editor-human-v2.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {exportCaptureSkillTransferJsonV1,importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

const assetId="user:tornado-travel";
const base={id:"tornado",name:"Tornade",description:"Vent",requiredLevel:1,usageScopes:["capture","combat"],
 category:"offensive",form:"projectile",element:"air",approachMode:"none",energyCost:2,preparationMs:100,travelMs:1200,
 recoveryMs:150,cooldownMs:0,allowedDistances:["short","medium","long"],targetRelations:["enemy"],damage:10,heal:0,stunMs:0,
 effects:[{kind:"damage",targetScope:"target",channel:"physical",amount:10}]};
function author(options={}) {
 return buildHumanSkillDraftV1({...base,presentation:{travelAssetId:assetId,travelPlaybackMode:"loop",travelDisplayScale:2,...options}});
}
function node(rect={left:0,top:0,width:80,height:80}) {
 return {style:{},dataset:{},className:"",children:[],append(n){this.children.push(n)},remove(){this.removed=true},getBoundingClientRect(){return rect}};
}
function flight(draft,fromSlot="player",toSlot="opponent",asset={url:"/tornado.png",frameCount:8,frameMs:100}) {
 const animations=[],nodes=[];
 const a=createCaptureSkillPresentationAssetsV2({skillPresentations:{tornado:draft.presentation},assetForId:()=>asset});
 const arena=node({left:0,top:0,width:900,height:600});
 arena.ownerDocument={createElement(){return node();}};
 arena.append=n=>nodes.push(n);
 const anchors={player:node({left:80,top:360,width:80,height:80}),opponent:node({left:720,top:160,width:80,height:80})};
 const renderer=createDomSkillFxRenderer({arena,anchors,targetAnchors:anchors,
 presentationForSkill:(id,context)=>a.presentationForSkill(id,context),
 animate(element,keyframes,options){const animation={element,keyframes,options,finished:new Promise(()=>{}),cancel(){}};animations.push(animation);return animation;}});
 renderer.play({type:"projectile",skillId:"tornado",fromSlot,targetSlot:toSlot,durationMs:1200});
 return {animations,nodes,renderer,presentation:a};
}

test("V11 optional travel playback rate and perspective survive normalization/import/export/editor",()=>{
 const draft=author({travelFrameSpeedMultiplier:3,travelPerspectiveAmount:0.25});
 assert.equal(draft.presentation.version,11);
 assert.equal(draft.presentation.visual.travel.frameSpeedMultiplier,3);
 assert.equal(draft.presentation.visual.travel.perspectiveAmount,0.25);
 const t=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft));
 assert.deepEqual(t.value.draft,draft);
 const fields=humanSkillEditorFieldsFromDraftV1(t.value.draft);
 assert.equal(fields.presentation.travelFrameSpeedMultiplier,3);
 assert.equal(fields.presentation.travelPerspectiveAmount,0.25);
 assert.deepEqual(buildHumanSkillDraftV1(fields),draft);
 const normalized=normalizeSkillPresentationBinding(draft.presentation);
 assert.equal(normalized.visual.travel.frameSpeedMultiplier,3);
 assert.equal(normalized.visual.travel.perspectiveAmount,0.25);
});

test("V11 validates limits and rejects cadence/depth on any slot besides travel",()=>{
 const draft=author({travelFrameSpeedMultiplier:2,travelPerspectiveAmount:0.2});
 for (const [key,value] of [["frameSpeedMultiplier",0],["frameSpeedMultiplier",9],["perspectiveAmount",-0.1],["perspectiveAmount",0.8]]) {
   const raw=JSON.parse(JSON.stringify(draft.presentation));raw.visual.travel[key]=value;
   assert.throws(()=>normalizeSkillPresentationBinding(raw),/frameSpeedMultiplier|perspectiveAmount/);
 }
 const raw=JSON.parse(JSON.stringify(draft.presentation));raw.visual.cast={assetId,attachment:"source",trigger:"preparation-start",frameSpeedMultiplier:2};
 assert.throws(()=>normalizeSkillPresentationBinding(raw));
 const sky=JSON.parse(JSON.stringify(draft.presentation));sky.visual.travel.trajectoryMode="skyfall";sky.visual.travel.fallHeightPx=400;
 assert.throws(()=>normalizeSkillPresentationBinding(sky),/perspective|skyfall/i);
});

test("loop frames rotate three times faster while projectile travel duration is unchanged",()=>{
 const f=flight(author({travelFrameSpeedMultiplier:3,travelPerspectiveAmount:0.25}));
 const sprite=f.nodes[0].children[0];
 assert.equal(sprite.style.animationDuration,"266.6666666666667ms");
 assert.equal(sprite.style.animationIterationCount,"infinite");
 assert.equal(f.animations[0].options.duration,1200);
 f.renderer.dispose();
});

test("opt-in visual depth makes outgoing sprite smaller and incoming sprite larger",()=>{
 const draft=author({travelPerspectiveAmount:0.25});
 const outgoing=flight(draft,"player","opponent");
 const incoming=flight(draft,"opponent","player");
 const move=a=>a.animations.find(x=>x.element.className.includes("projectile"));
 assert.match(move(outgoing).keyframes[0].transform,/scale\(1\.88\)/);
 assert.match(move(outgoing).keyframes.at(-1).transform,/scale\(1\.47\)/);
 assert.match(move(incoming).keyframes[0].transform,/scale\(1\.41\)/);
 assert.match(move(incoming).keyframes.at(-1).transform,/scale\(1\.96\)/);
 outgoing.renderer.dispose();incoming.renderer.dispose();
});

test("existing projectiles keep historical three-scale easing and original versions",()=>{
 const old=author();
 assert.notEqual(old.presentation.version,11);
 const f=flight(old);
 const move=f.animations.find(x=>x.element.className.includes("projectile"));
 assert.match(move.keyframes[0].transform,/scale\(1\.88\)/);
 assert.match(move.keyframes[1].transform,/scale\(2\.08\)/);
 assert.match(move.keyframes[2].transform,/scale\(1\.96\)/);
 f.renderer.dispose();
});

test("Capture editor offers readable independent speed and perspective inputs",async()=>{
 const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 const ui=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
 for(const key of ["travel-frame-speed","travel-perspective"]){
   assert.match(html,new RegExp("data-skill-"+key));
   assert.match(ui,new RegExp("data-skill-"+key));
 }
});
