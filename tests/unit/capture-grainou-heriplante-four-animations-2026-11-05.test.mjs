import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureCreatureEditorDraftV3} from "../../src/contracts/capture-creature-editor-draft-v3.js";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";
import {captureEditorCreatureVisualKindV1,captureEditorAssetMatchesRoleV1} from "../../src/ui/capture-editor-human-v2.js";

const record=JSON.parse(readFileSync(new URL("../../data/capture/showcase/crea_nat_1.capture-creature-transfer-v1.json",import.meta.url),"utf8"));
const list=[
 {action:"attack",view:"opponent",name:"heriplante_attack_opponent_12f_strip.webp",ms:130,mode:"once"},
 {action:"attack",view:"player",name:"heriplante_attack_player_12f.webp",ms:125,mode:"once"},
 {action:"movement",view:"opponent",name:"heriplante_movement_opponent_12f.webp",ms:115,mode:"loop"},
 {action:"movement",view:"player",name:"heriplante_movement_player_12f.webp",ms:100,mode:"loop"}
];
test("Grainou author transfer remains unchanged; media library never overwrites creator data",()=>{
 const draft=normalizeCaptureCreatureEditorDraftV3(record.draft);
 assert.equal(draft.id,"crea_nat_1");
 assert.equal(draft.presentation.version,3);
 assert.equal(draft.presentation.visual.front.assetId,"pack:capture:creature-heriplante-opponent-01");
 assert.equal(draft.presentation.visual.back.assetId,"pack:capture:creature-heriplante-player-01");
 assert.equal(draft.presentation.visual.icon.assetId,"pack:capture:creature-heriplante-icon-01");
 assert.equal(draft.presentation.visual.dodge.assetId,"pack:capture:sprite-fleur-defense-01");
 for(const prop of ["movement","movementBack","rangedAttack","rangedAttackBack"]){
   assert.equal(draft.presentation.visual[prop],undefined,"author has not saved an animation assignment; do not invent it");
 }
 assert.deepEqual(draft.sourceStats,record.draft.sourceStats);
 assert.deepEqual(draft.combat,record.draft.combat);
 assert.deepEqual(record.loadout.creatureId,"crea_nat_1");
});
test("all four genuine Hériplante 12f media are available as independent editor-assignable official catalog roles",()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.ok(Number(GLOBAL_VISUAL_LIBRARY.revision.match(/-v([0-9]+)-/)?.[1]||0)>=60);
 const assets=list.map(item=>({
   id:"pack:capture:creature-heriplante-"+item.action+"-"+item.view+"-12-v1",
   assetType:"sprite",mediaType:"image",category:"creature",
   tags:["capture","creature","heriplante",item.action,item.view,"animated",item.view==="player"?"dos":"face"],
   compatibility:{uses:["combat","capture","editor"]},
   resource:{
     file:"capture/creatures/heriplante/animations/"+item.action+"/"+item.view+"/atlases/"+item.name,
     format:"sprite-strip",frameCount:12,frameMs:item.ms,playbackMode:item.mode
   }
 }));
 const resolver=createGlobalPresentationAssetResolverV1({assetCatalog:{assets},assetUrlForFile:globalVisualAssetUrl});
 for(const item of list){
   const id="pack:capture:creature-heriplante-"+item.action+"-"+item.view+"-12-v1";
   const asset=assets.find(a=>a.id===id);
   assert.ok(asset);
   assert.equal(captureEditorCreatureVisualKindV1(asset),item.action);
   assert.equal(captureEditorAssetMatchesRoleV1(asset,item.action),true);
   assert.equal(captureEditorAssetMatchesRoleV1(asset,item.action==="attack"?"movement":"attack"),false);
   const result=resolver(id);
   assert.equal(result.url,globalVisualAssetUrl(asset.resource.file));
   assert.equal(result.frameCount,12);
   assert.equal(result.frameMs,item.ms);
   assert.equal(result.playbackMode,item.mode);
 }
});
