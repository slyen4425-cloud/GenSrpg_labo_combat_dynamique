import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureCreatureEditorDraftV3} from "../../src/contracts/capture-creature-editor-draft-v3.js";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";
import {captureEditorCreatureVisualKindV1,captureEditorAssetMatchesRoleV1} from "../../src/ui/capture-editor-human-v2.js";
const record=JSON.parse(readFileSync(new URL("../../data/capture/showcase/crea_nat_1.capture-creature-transfer-v1.json",import.meta.url),"utf8"));
const mappings=[
 ["rangedAttack","attack","opponent",130,"once"],
 ["rangedAttackBack","attack","player",125,"once"],
 ["movement","movement","opponent",115,"loop"],
 ["movementBack","movement","player",100,"loop"]
];
const folder="capture/creatures/heriplante/animations/";
const atlas=action=>action==="attack"?"attack":"movement";
const files={
 "attack:opponent":"heriplante_attack_opponent_12f_strip.webp",
 "attack:player":"heriplante_attack_player_12f.webp",
 "movement:opponent":"heriplante_movement_opponent_12f.webp",
 "movement:player":"heriplante_movement_player_12f.webp"
};
test("Grainou preserves author gameplay, four views, dodge and upgrades presentation without shadow binding",()=>{
 const draft=normalizeCaptureCreatureEditorDraftV3(record.draft);
 assert.equal(draft.id,"crea_nat_1");
 assert.equal(draft.presentation.version,9);
 assert.deepEqual(draft.presentation.viewOverrides,record.draft.presentation.viewOverrides);
 assert.equal(draft.presentation.visual.dodge.assetId,"pack:capture:sprite-fleur-defense-01");
 assert.deepEqual(draft.sourceStats,record.draft.sourceStats);
 assert.deepEqual(draft.combat,record.draft.combat);
 assert.deepEqual(draft.skillIds,record.draft.skillIds);
 assert.deepEqual(draft.presentation.visual.front,{assetId:"pack:capture:creature-heriplante-opponent-01"});
 assert.deepEqual(draft.presentation.visual.back,{assetId:"pack:capture:creature-heriplante-player-01"});
 assert.equal(draft.presentation.visual.movementPlayback.mode,"loop");
 for(const [field,action,view] of mappings){
   const id="pack:capture:creature-heriplante-"+action+"-"+view+"-12-v1";
   assert.equal(draft.presentation.visual[field].assetId,id);
   assert.equal(draft.presentation.visual[field].mode,"sprite");
   assert.equal(draft.presentation.visual[field].rotationTurns,0);
 }
});
test("all four role-specific media resolve to separate official WebP atlas files",()=>{
 const assets=mappings.map(([,action,view,frameMs,playbackMode])=>{
  const file=folder+action+"/"+view+"/atlases/"+files[action+":"+view];
  return {id:"pack:capture:creature-heriplante-"+action+"-"+view+"-12-v1",
   assetType:"sprite",mediaType:"image",category:"creature",
   tags:["capture","creature","heriplante",action,view,"animated"],
   resource:{file,format:"sprite-strip",frameCount:12,frameMs,playbackMode}};
 });
 const resolver=createGlobalPresentationAssetResolverV1({assetCatalog:{assets},assetUrlForFile:globalVisualAssetUrl});
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.ok(Number(GLOBAL_VISUAL_LIBRARY.revision.match(/-v([0-9]+)-/)?.[1]||0)>=60);
 for(const [field,action,view,frameMs,mode] of mappings){
  const id=record.draft.presentation.visual[field].assetId;
  const meta=assets.find(x=>x.id===id);
  assert.ok(meta);
  assert.equal(captureEditorCreatureVisualKindV1(meta),action);
  assert.ok(captureEditorAssetMatchesRoleV1(meta,action));
  const media=resolver(id);
  assert.equal(media.url,globalVisualAssetUrl(meta.resource.file));
  assert.equal(media.frameCount,12);
  assert.equal(media.frameMs,frameMs);
  assert.equal(media.playbackMode,mode);
 }
});
