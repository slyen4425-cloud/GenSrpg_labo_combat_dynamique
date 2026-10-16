import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCaptureCreatureDefensiveReactionV1 } from "../../src/contracts/capture-creature-defensive-reaction-v1.js";
import { captureReactionIconAssetIdV1, CAPTURE_REACTION_ICON_IDS_V1 } from "../../src/assets/capture-reaction-icon-presets-v1.js";
import { normalizeCaptureCreatureEditorDraftV3 } from "../../src/contracts/capture-creature-editor-draft-v3.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { exportCaptureCreatureTransferJsonV1, importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { adaptCaptureCreatureToFighterConfig } from "../../src/adapters/input/capture/capture-creature-to-fighter-config.js";
import { captureEditorAssetMatchesRoleV1 } from "../../src/ui/capture-editor-human-v2.js";

const read = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const author = JSON.parse(read("data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json"));
const registry = normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));

test("two genuine library IDs are defaults but a creature may select any stable icon ID", () => {
  assert.equal(captureReactionIconAssetIdV1({ type:"dodge" }), CAPTURE_REACTION_ICON_IDS_V1.dodge);
  assert.equal(captureReactionIconAssetIdV1({ type:"defense" }), CAPTURE_REACTION_ICON_IDS_V1.defense);
  assert.equal(captureReactionIconAssetIdV1({ type:"none" }), null);
  const custom = "user:icon-special-monster-1";
  assert.equal(captureReactionIconAssetIdV1({ type:"defense", iconAssetId:custom }), custom);
  assert.equal(captureReactionIconAssetIdV1({ type:"dodge", iconAssetId:custom }), custom);
  assert.equal(normalizeCaptureCreatureDefensiveReactionV1({
    type:"defense",maxCharges:2,rechargeMs:30000,activeWindowMs:250,damageReductionPct:70,iconAssetId:custom
  }).iconAssetId,custom);
  assert.throws(() => normalizeCaptureCreatureDefensiveReactionV1({
    type:"dodge", iconAssetId:"javascript:evil/call"
  }),/iconAssetId/);
});

test("editor's author transfer retains exact custom reaction icon and has no impact on gameplay stats", () => {
  const configured = normalizeCaptureCreatureEditorDraftV3({
    ...author.draft,
    combat: {
      ...author.draft.combat,
      reaction: { type:"defense", maxCharges:3, rechargeMs:25000, activeWindowMs:500, damageReductionPct:60,
        iconAssetId:"user:my-own-shield-42" }
    }
  });
  const record = { draft:configured, loadout:author.loadout, statValues:author.statValues };
  const restored = importCaptureTransferJsonV1(
    exportCaptureCreatureTransferJsonV1(record,{statRegistry:registry}),{statRegistry:registry}
  ).value;
  assert.deepEqual(restored.draft.combat.reaction,configured.combat.reaction);
  assert.equal(restored.draft.combat.approachTimeModifierPct,author.draft.combat.approachTimeModifierPct);
  assert.deepEqual(restored.draft.presentation,author.draft.presentation);
  const fighter = adaptCaptureCreatureToFighterConfig({
    id:configured.id, combat:configured.combat, resistances:configured.resistances
  });
  assert.equal(fighter.defensiveReaction.iconAssetId,"user:my-own-shield-42");
  assert.equal(fighter.defensiveReaction.damageReductionPct,60);
  assert.equal(fighter.maxHp,120);
});

test("library icons have existing generic asset role and creature editor and native HUD share a single UI action", () => {
  const icon = {assetType:"icon",mediaType:"image",category:"reaction",tags:["capture","reaction"],
    compatibility:{uses:["combat","capture","editor"]}};
  assert.equal(captureEditorAssetMatchesRoleV1(icon,"icon"),true);
  const html=read("examples/dom-demo/capture-editor-v2.html");
  const app=read("src/ui/combat-2v2-test-ui.js");
  const preview=read("examples/dom-demo/capture-editor-v2.js");
  const editor=read("src/ui/capture-editor-human-v2.js");
  assert.match(html,/data-creature-reaction-icon data-asset-role="icon"/);
  assert.match(html,/data-preview-reaction-icon/);
  assert.match(html,/data-combat-reaction-icon/);
  assert.match(editor,/captureReactionIconAssetIdV1/);
  assert.match(app,/presentationAssets\.asset\(iconId\)/);
  assert.match(preview,/asset\(assetId\) \{ return resolvePreviewPresentationAsset\(assetId\); \}/);
  assert.equal((html.match(/data-combat-dodge\b/g)||[]).length,1);
});
