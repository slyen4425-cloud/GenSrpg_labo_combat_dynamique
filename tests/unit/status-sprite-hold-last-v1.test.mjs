import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildHumanSkillDraftV1, humanSkillEditorFieldsFromDraftV1 } from "../../src/ui/capture-editor-human-v2.js";
import { normalizeSkillPresentationBinding } from "../../src/contracts/skill-presentation-binding.js";
import { exportCaptureSkillTransferJsonV1, importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { createCaptureSkillPresentationAssetsV2 } from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import { createDomStatusFxRenderer } from "../../src/adapters/renderer/dom-status-fx.js";
import { applySpriteVisual } from "../../src/adapters/renderer/dom-skill-fx.js";

const spriteId="pack:capture:sprite-status-stone-shell-01";
const draftFields=()=>({
  id:"status-stone",name:"Armure de pierre",description:"Test visuel",requiredLevel:1,
  usageScopes:["capture","combat"],category:"buff_debuff",form:"self",element:"earth",
  approachMode:"none",energyCost:1,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:3000,
  allowedDistances:["short","medium","long"],targetRelations:["self"],damage:0,heal:0,stunMs:0,
  interruptsPreparation:false,effects:[{kind:"apply_status",targetScope:"self",status:{
    id:"stone-armor",kind:"stat_modifier",statId:"defense",deltaPoints:200,polarity:"beneficial",durationMs:10000,stacking:"refresh",maxStacks:1
  }}],
  reaction:{blockForms:[],reflectForms:[],immuneElements:[],counterForms:[],evadeForms:[],evadeApproaches:[]},
  projectileClash:{mode:"none"},
  presentation:{statusVisuals:{"stone-armor":{mode:"sprite",sprite:{
    assetId:spriteId,displayScale:1.3,opacity:0.85,playbackMode:"hold-last",
    offsetX:0,offsetY:0,layerByView:{player:"front",opponent:"front"}
  }}}}
});

test("hold-last is an authored status presentation setting that survives Capture skill export/import and editor fields",()=>{
  const draft=buildHumanSkillDraftV1(draftFields());
  assert.equal(draft.presentation.statusVisuals["stone-armor"].sprite.playbackMode,"hold-last");
  const roundtrip=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft));
  assert.deepEqual(roundtrip.value.draft,draft);
  assert.equal(humanSkillEditorFieldsFromDraftV1(roundtrip.value.draft).presentation.statusVisuals["stone-armor"].sprite.playbackMode,"hold-last");
  assert.deepEqual(buildHumanSkillDraftV1(humanSkillEditorFieldsFromDraftV1(draft)),draft);
  const unsupported=structuredClone(draft.presentation);
  unsupported.statusVisuals["stone-armor"].sprite.playbackMode="not-a-mode";
  assert.throws(()=>normalizeSkillPresentationBinding(unsupported),/playbackMode/);
});

test("hold-last strip plays once at frame native speed and freezes final atlas frame until status is removed",()=>{
  const draft=buildHumanSkillDraftV1(draftFields());
  const resolved=createCaptureSkillPresentationAssetsV2({
    skillPresentations:{[draft.id]:draft.presentation},
    assetForId:id=>({assetId:id,url:"/stone-shell.webp",frameCount:8,frameMs:90})
  });
  const slot={children:[],ownerDocument:null,append(child){this.children.push(child)},remove(){}};
  const document={createElement(){
    return {className:"",dataset:{},style:{},ownerDocument:document,remove(){this.removed=true},append(){}};
  }};
  slot.ownerDocument=document;
  const renderer=createDomStatusFxRenderer({
    targetFor:()=>({motion:slot,image:{src:"/stone.webp"}}),
    statusPresentationFor:id=>resolved.statusPresentationFor(id,{view:"player"})
  });
  const status={definition:{id:"stone-armor",durationMs:10000},appliedAtMs:200,expiresAtMs:10200};
  const state=expiresAtMs=>({elapsedMs:1000,fighters:{player:{statusEffects:[{...status,expiresAtMs}]}}});
  renderer.sync(state(10200));
  const sprite=slot.children.find(n=>n.dataset.statusFx==="sprite");
  assert.ok(sprite);
  assert.equal(sprite.style.backgroundImage,'url("/stone-shell.webp")');
  assert.equal(sprite.style.animationName,"skill-fx-strip");
  assert.equal(sprite.style.animationDuration,"720ms");
  assert.equal(sprite.style.animationIterationCount,"1");
  assert.equal(sprite.style.animationFillMode,"forwards");
  assert.equal(sprite.style.animationTimingFunction,"steps(7, end)");
  // The final 100% keyframe of the single atlas strip is the last (8th) tile.
  renderer.sync(state(20200)); // status refresh extends ownership, not sprite animation
  assert.equal(slot.children.filter(n=>n.dataset.statusFx==="sprite").length,1);
  assert.equal(sprite.style.animationDuration,"720ms");
  assert.equal(sprite.removed,undefined);
  renderer.sync({elapsedMs:20300,fighters:{player:{statusEffects:[]}}});
  assert.equal(sprite.removed,true,"native status removal owns sprite removal");
  renderer.dispose();
});

test("hold-last frames[] uses real image layers with one playback and retains last frame after completion (no background-image interpolation)",()=>{
  const children=[],anim=[];
  const document={createElement(){const n={className:"",dataset:{},style:{},ownerDocument:document,src:"",append(child){(this.children??=[]).push(child)},remove(){this.removed=true}};return n}};
  const node=document.createElement("span");
  node.append=child=>children.push(child);
  const frames=["/stone-1.webp","/stone-2.webp","/stone-3.webp","/stone-4.webp"];
  const playback=applySpriteVisual(node,{assetId:spriteId,frames,frameMs:75,playbackMode:"hold-last"},9000,
    (element,keyframes,options)=>{const a={element,keyframes,options,cancel(){this.cancelled=true}};anim.push(a);return a;});
  assert.equal(playback.playbackMs,300);
  assert.equal(children.length,4);
  assert.deepEqual(children.map(n=>n.src),frames);
  assert.equal(node.style.backgroundImage,"none");
  assert.equal(anim.length,4);
  assert.ok(anim.every(a=>a.options.iterations===1&&a.options.fill==="both"&&a.options.duration===300));
  assert.deepEqual(anim.at(-1).keyframes.at(-1),{opacity:1,offset:1});
  assert.equal(anim[0].keyframes.at(-1).opacity,0);
  playback.frameAnimation.cancel();
  assert.ok(anim.every(a=>a.cancelled));
});

test("hold-last is visible as an explicit status sprite mode; other modes and sprite roles remain unchanged",async()=>{
  const source=await readFile(new URL("../../src/ui/capture-editor-sprite-controls-v1.js",import.meta.url),"utf8");
  assert.match(source,/hold-last/);
  assert.match(source,/Jouer une fois puis garder la dernière image/);
  assert.match(source,/\["playbackMode", "playback", "Animation du statut", "loop", statusModes\]/);
  assert.match(source,/const modes = \[/);
  assert.match(source,/\["loop", "Boucler pendant l’effet"\]/);
});
