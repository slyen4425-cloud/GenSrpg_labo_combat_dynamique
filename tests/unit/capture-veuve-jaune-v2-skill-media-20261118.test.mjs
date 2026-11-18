import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {resolveCombatBarrierSpriteAssetIdForSideV1} from "../../src/adapters/renderer/combat-entity-overlay-v1.js";
import {GLOBAL_VISUAL_LIBRARY} from "../../src/assets/global-visual-library.js";

const skillNames = [
 "fil-foudroyant","toile-paralysante","morsure-neuroelectrique",
 "emprise-de-soie","domaine-de-la-veuve"
];
const file=id=>"data/capture/showcase/veuve-jaune-"+id+".capture-skill-transfer-v1.json";
const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const transfers=skillNames.map(short=>importCaptureTransferJsonV1(read(file(short))).value.draft);
const skill=(short)=>transfers[skillNames.indexOf(short)];
const icon=id=>"pack:capture:icon-skill-veuve-jaune-"+id+"-v1";
const sprite=id=>"pack:capture:sprite-skill-veuve-jaune-"+id+"-v1";

test("five Veuve jaune skills keep canonical IDs and author gameplay, while changing only skill visuals",()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.match(GLOBAL_VISUAL_LIBRARY.revision,/v68-veuve-jaune-five-skill-media/);
 for(let i=0;i<skillNames.length;i++){
   let s=transfers[i];
   assert.equal(s.id,"veuve-jaune-"+skillNames[i]);
   assert.equal(s.definition.id,s.id);
   assert.equal(s.presentation.subjectId,s.id);
   assert.equal(s.presentation.visual.icon.assetId,icon(skillNames[i]));
 }
 const fil=skill("fil-foudroyant");
 assert.equal(fil.definition.effects[0].amount,12);
 assert.equal(fil.presentation.visual.travel.assetId,sprite("fil-foudroyant-projectile"));
 assert.equal(fil.presentation.visual.impact.assetId,sprite("fil-foudroyant-impact"));
 assert.equal(skill("morsure-neuroelectrique").presentation.visual.impact.assetId,
   sprite("morsure-neuroelectrique-impact"));
 const ultimate=skill("domaine-de-la-veuve");
 assert.equal(ultimate.definition.maxUsesPerCombat,1);
 assert.equal(ultimate.definition.activationRequirements.conditions[0].threshold,30000);
 assert.equal(ultimate.presentation.visual.impact.assetId,sprite("domaine-de-la-veuve-impact-zone"));
});

test("Veuve jaune web wall uses Gorice's ONE native destructible barrier, mirrored diagonal sprite and preserved 20s HP mechanics",()=>{
 const d=skill("toile-paralysante").definition;
 assert.equal(d.cooldownMs,70000);
 const b=d.effects[0];
 assert.equal(b.kind,"summon_entity");
 assert.equal(b.entityKind,"barrier");
 assert.equal(b.hpPerStatPoint,3);
 assert.equal(b.durationMs,20000);
 assert.equal(b.contactDamage,6);
 assert.equal(b.contactImmobilizeMs,1500);
 assert.equal(b.placementMode,"arena");
 const wall=sprite("toile-paralysante-mur-apparition");
 assert.equal(b.spriteAssetId,wall);
 assert.equal(b.opponentSpriteAssetId,wall);
 assert.equal(resolveCombatBarrierSpriteAssetIdForSideV1(b,false),wall);
 assert.equal(resolveCombatBarrierSpriteAssetIdForSideV1(b,true),wall);
 assert.ok(b.visualScale>1&&b.opponentVisualScale>1,"diagonal wall has readable native scaling");
});

test("Emprise de soie uses one native 20s roster lock and overlays the real target, no pre-rendered humanoid",()=>{
 const s=skill("emprise-de-soie");
 assert.equal(s.definition.effects[0].amount,18);
 const lock=s.definition.effects.find(e=>e.kind==="apply_status").status;
 assert.equal(lock.id,"veuve-jaune-emprise-verrouillage");
 assert.equal(lock.kind,"roster_lock");
 assert.equal(lock.durationMs,20000);
 assert.equal(s.presentation.visual.travel.assetId,sprite("emprise-de-soie-projectile"));
 assert.equal(s.presentation.visual.impact,undefined,"old unrelated Nature impact removed");
 const visual=s.presentation.statusVisuals[lock.id];
 assert.equal(visual.mode,"sprite");
 assert.equal(visual.sprite.assetId,sprite("emprise-de-soie-entrave-sur-cible"));
 assert.equal(visual.sprite.playbackMode,"hold-last");
 assert.equal(visual.sprite.layerByView.player,"front");
 assert.equal(visual.sprite.layerByView.opponent,"front");
});

test("real presentation adapter resolves the same Veuve jaune asset IDs on both combat views and status projection",()=>{
 const data=Object.fromEntries(transfers.map(s=>[s.id,s.presentation]));
 const ids=new Set();
 const resolver=id=>{
   ids.add(id);
   return {url:"https://assets.example.test/"+encodeURIComponent(id)+".webp",frameCount:8,frameMs:100};
 };
 const adapter=createCaptureSkillPresentationAssetsV2({
   skillPresentations:data,
   assetForId:resolver,
   audioAssetForId:()=>null
 });
 for(let i=0;i<skillNames.length;i++){
   const sid="veuve-jaune-"+skillNames[i];
   const visPlayer=adapter.presentationForSkill(sid,{view:"player"});
   const visOpponent=adapter.presentationForSkill(sid,{view:"opponent"});
   assert.equal(visPlayer.icon.assetId,icon(skillNames[i]));
   assert.equal(visOpponent.icon.assetId,icon(skillNames[i]));
 }
 const lock=adapter.statusPresentationFor("veuve-jaune-emprise-verrouillage",{
   sourceSkillId:"veuve-jaune-emprise-de-soie",view:"opponent"
 });
 assert.equal(lock.mode,"sprite");
 assert.equal(lock.sprite.assetId,sprite("emprise-de-soie-entrave-sur-cible"));
 assert.equal(lock.sprite.playbackMode,"hold-last");
 assert.ok(adapter.visualAsset(sprite("toile-paralysante-mur-apparition")));
 assert.ok(ids.has(sprite("toile-paralysante-mur-apparition")));
});
