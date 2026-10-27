import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {humanSkillEditorFieldsFromDraftV1, buildHumanSkillDraftV1} from "../../src/ui/capture-editor-human-v2.js";
import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {createDomStatusFxRenderer} from "../../src/adapters/renderer/dom-status-fx.js";

const FILE = "../../data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json";
const ICON = "core:icon-skill-recall-01";
const AURA = "pack:capture:sprite-water-healing-bubble-01";
const STATUS = "lib_aqua_heal_regeneration";
async function read() {
  return importCaptureTransferJsonV1(await readFile(new URL(FILE, import.meta.url), "utf8")).value.draft;
}

test("authored skill transfer keeps exact icon, healing aura, scale and opacity, and preserves latest authored 3 PV ticks", async () => {
  const draft = await read();
  assert.equal(draft.id, "lib_aqua_heal");
  assert.equal(draft.definition.effects[0].amount, 5);
  assert.equal(draft.definition.effects[1].status.amount, 3, "the user's latest exported value has priority over previous manual edits");
  assert.equal(draft.definition.effects[1].status.durationMs, 20000);
  assert.equal(draft.definition.effects[1].status.tickIntervalMs, 3000);
  assert.equal(draft.presentation?.visual?.icon?.assetId, ICON);
  assert.equal(draft.presentation?.statusVisuals?.[STATUS]?.mode, "sprite");
  assert.equal(draft.presentation?.statusVisuals?.[STATUS]?.sprite?.assetId, AURA);
  assert.equal(draft.presentation?.statusVisuals?.[STATUS]?.sprite?.displayScale, 1.7);
  assert.equal(draft.presentation?.statusVisuals?.[STATUS]?.sprite?.opacity, 0.45);
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft, draft);
  const editorRoundtrip = buildHumanSkillDraftV1(humanSkillEditorFieldsFromDraftV1(draft));
  assert.deepEqual(editorRoundtrip.presentation, draft.presentation, "loading/saving through editor must keep complete author visuals");
});

function spriteAssetCatalog() {
  // Exact ID, file and frame metadata independently checked on global-assets.
  return {assets:[
    {id:ICON,resource:{file:"core/icons/skills/icon_skill_recall_01.webp"}},
    {id:AURA,resource:{file:"capture/sprites/skills/water_healing_bubble/atlases/sprite_heal_water_bubble_atlas_20f_384.webp",frameCount:20,frameMs:70,playbackMode:"loop"}}
  ]};
}
function element(doc) {
  return {ownerDocument:doc,style:{},dataset:{},className:"",children:[],append(n){this.children.push(n);},remove(){this.removed=true;}};
}
test("actual presentation resolver + status renderer produce visible 45 percent authored healing aura", async () => {
  const draft = await read();
  const assetForId = createGlobalPresentationAssetResolverV1({
    assetCatalog:spriteAssetCatalog(),
    assetUrlForFile:file => "https://example.invalid/assets/library/" + file
  });
  const resolver = createCaptureSkillPresentationAssetsV2({
    skillPresentations:{[draft.id]:draft.presentation}, assetForId
  });
  const skill = resolver.presentationForSkill(draft.id, {view:"player"});
  assert.equal(skill.icon?.assetId, ICON);
  const presentation = resolver.statusPresentationFor(STATUS,{sourceSkillId:draft.id,view:"player"});
  assert.equal(presentation.mode,"sprite");
  assert.equal(presentation.sprite.assetId,AURA);
  assert.equal(presentation.sprite.frameCount,20);
  assert.equal(presentation.sprite.frameMs,70);
  assert.equal(presentation.sprite.opacity,0.45);
  assert.equal(presentation.sprite.displayScale,1.7);
  const doc={createElement(){return element(doc)}};
  const motion=element(doc);
  const renderer=createDomStatusFxRenderer({
    targetFor:()=>({motion,image:{src:"/creature.webp"}}),
    statusPresentationFor:(id,ctx)=>resolver.statusPresentationFor(id,ctx)
  });
  renderer.sync({elapsedMs:100,fighters:{player:{statusEffects:[{
    definition:{id:STATUS,kind:"heal_over_time",polarity:"beneficial",durationMs:20000},
    appliedAtMs:0,expiresAtMs:20000,sourceActorId:"player",sourceSkillId:draft.id
  }]}}});
  assert.equal(motion.children.length,1,"one persistent aura node, no duplicate renderer authority");
  assert.equal(motion.children[0].dataset.statusId,STATUS);
  assert.equal(motion.children[0].style.opacity,"0.45");
  assert.match(motion.children[0].style.backgroundImage, /sprite_heal_water_bubble_atlas_20f_384.webp/);
  renderer.dispose();
});
import {createHash} from "node:crypto";

function sortRecordKeys(value) {
  if (Array.isArray(value)) return value.map(sortRecordKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortRecordKeys(value[key])]));
  }
  return value;
}

test("full author export content remains lossless, not merely selected visual fields", async () => {
  const file = JSON.parse(await readFile(new URL(FILE, import.meta.url), "utf8"));
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(sortRecordKeys(file)), "utf8")
    .digest("hex");
  assert.equal(fingerprint,
    "18489b4653761649cfc166871d93f4a9cdb66b1eecf339141951fedd39b48627",
    "published authored transfer diverged from user source: icon, status FX, gameplay or other field was changed"
  );
});
