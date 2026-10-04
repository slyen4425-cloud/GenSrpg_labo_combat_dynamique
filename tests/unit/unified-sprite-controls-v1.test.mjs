import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildHumanSkillDraftV1, humanSkillEditorFieldsFromDraftV1, captureEditorAssetMatchesRoleV1 } from "../../src/ui/capture-editor-human-v2.js";
import { createCaptureSkillPresentationAssetsV2 } from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { createDomStatusFxRenderer } from "../../src/adapters/renderer/dom-status-fx.js";

const spriteId = "pack:capture:sprite-status-healing-aura-01";
function fields(presentation = {}) {
  return { id: "sprite-controls", name: "Réglages sprites", description: "Test des réglages visuels", requiredLevel: 1,
    usageScopes: ["capture", "combat"], category: "offensive", form: "projectile",
    element: "water", approachMode: "none", energyCost: 3, preparationMs: 1500,
    travelMs: 2400, recoveryMs: 450, cooldownMs: 2800,
    allowedDistances: ["short", "medium", "long"], targetRelations: ["enemy"],
    damage: 0, heal: 0, stunMs: 0, interruptsPreparation: false,
    effects: [{ kind: "damage", targetScope: "target", channel: "water", amount: 4 }],
    reaction: { blockForms: [], reflectForms: [], immuneElements: [], counterForms: [], evadeForms: [], evadeApproaches: [] },
    projectileClash: { mode: "none" }, presentation };
}
function node() { return { className: "", dataset: {}, style: {}, children: [], append(n) { this.children.push(n); }, remove() { this.removed = true; } }; }
function assets(draft) {
  return createCaptureSkillPresentationAssetsV2({ skillPresentations: { [draft.id]: draft.presentation },
    assetForId: id => ({ assetId: id, url: "/real-sprite.webp", frameCount: 8, frameMs: 90 }) });
}
function harness(draft, view = null) {
  const nodes = [], animations = [], ownerDocument = { createElement() { const n = node(); n.ownerDocument = ownerDocument; return n; } };
  const arena = { ownerDocument, append(n) { nodes.push(n); }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 300 }) };
  const anchors = Object.fromEntries([["player", 40], ["opponent", 500]].map(([id, left]) => [id, { getBoundingClientRect: () => ({ left, top: 100, width: 40, height: 40 }) }]));
  const presentation = assets(draft);
  const renderer = createDomSkillFxRenderer({ arena, anchors, presentationForSkill: (id, context) => presentation.presentationForSkill(id, view ? { view } : context),
    animate(n, keyframes, options) { let resolve; const finished = new Promise(r => resolve = r); const a = { node: n, keyframes, options, finished, resolve, cancel() { this.cancelled = true; resolve(); } }; animations.push(a); return a; } });
  return { renderer, nodes, animations };
}

test("only projectile chooser remains restricted by sprite category", () => {
  for (const category of ["release", "impact", "skill", "travel"]) {
    const asset = { assetType: "sprite", mediaType: "image", category, tags: [], compatibility: { uses: ["editor"] } };
    for (const role of ["cast", "impact", "zone", "status"]) assert.equal(captureEditorAssetMatchesRoleV1(asset, role), true, role + "/" + category);
    assert.equal(captureEditorAssetMatchesRoleV1(asset, "travel"), category === "travel");
  }
  for (const role of ["cast", "impact", "zone", "status", "travel"]) {
    assert.equal(captureEditorAssetMatchesRoleV1({ assetType: "icon", mediaType: "image", category: "impact", compatibility: { uses: ["editor"] } }, role), false);
    assert.equal(captureEditorAssetMatchesRoleV1({ assetType: "sprite", mediaType: "image", category: "creature", tags: ["creature"], compatibility: { uses: ["editor"] } }, role), false);
  }
});

for (const role of ["cast", "impact", "zone"]) for (const playbackMode of ["once", "loop", "stretch"]) {
  test(role + " " + playbackMode + ": saved fields preserve placement and playback without changing combat", () => {
    const input = fields({ [role + "AssetId"]: spriteId, [role + "PlaybackMode"]: playbackMode,
      [role + "DisplayScale"]: 2.5, [role + "OffsetX"]: 35, [role + "OffsetY"]: -25,
      [role + "LayerPlayer"]: "behind", [role + "LayerOpponent"]: "front" });
    const draft = buildHumanSkillDraftV1(input);
    const slot = draft.presentation.visual[role === "zone" ? "aura" : role];
    assert.equal(slot.playbackMode, playbackMode);
    assert.equal(slot.offsetX, 35); assert.equal(slot.offsetY, -25);
    assert.deepEqual(slot.layerByView, { player: "behind", opponent: "front" });
    const restored = humanSkillEditorFieldsFromDraftV1(JSON.parse(JSON.stringify(draft)));
    assert.deepEqual(buildHumanSkillDraftV1(restored), draft);
    assert.deepEqual(draft.definition, buildHumanSkillDraftV1(fields()).definition);
  });
}

test("cast aura uses configured offset, large scale and looping until preparation finishes", async () => {
  const draft = buildHumanSkillDraftV1(fields({ castAssetId: spriteId, castPlaybackMode: "loop", castOffsetX: 35, castOffsetY: -25, castDisplayScale: 6, castLayerPlayer: "behind" }));
  const { renderer, nodes, animations } = harness(draft);
  const handle = renderer.play({ type: "cast", skillId: draft.id, actorSlot: "player", durationMs: 1500 });
  assert.equal(nodes[0].style.left, "95px"); assert.equal(nodes[0].style.top, "95px");
  assert.equal(nodes[0].style.animationIterationCount, "infinite"); assert.equal(nodes[0].style.animationDuration, "720ms");
  assert.match(nodes[0].className, /layer-behind/); assert.match(animations[0].keyframes.at(-1).transform, /scale\(6\)/);
  assert.equal(animations[0].options.duration, 1500);
  animations[0].resolve(); await handle.finished;
  assert.equal(renderer.activeCount, 0); assert.equal(nodes[0].removed, true);
});

test("impact loops for its visual duration and respects each semantic view layer", async () => {
  const draft = buildHumanSkillDraftV1(fields({ impactAssetId: spriteId, impactPlaybackMode: "loop", impactDurationMs: 1800, impactLayerPlayer: "behind", impactLayerOpponent: "front" }));
  for (const view of ["player", "opponent"]) {
    const { renderer, nodes, animations } = harness(draft, view);
    const handle = renderer.play({ type: "impact", skillId: draft.id, targetSlot: "opponent", durationMs: 420 });
    assert.equal(nodes[0].style.animationIterationCount, "infinite"); assert.equal(nodes[0].style.animationDuration, "720ms");
    assert.equal(nodes[0].className.includes("layer-behind"), view === "player");
    assert.equal(animations[0].options.duration, 1800);
    renderer.dispose(); await handle.finished; assert.equal(nodes[0].removed, true);
  }
});

test("persistent zone stretches to Runtime duration without restart on refresh or reinforcement", () => {
  const draft = buildHumanSkillDraftV1(fields({ zoneAssetId: spriteId, zonePlaybackMode: "stretch", zoneLayerPlayer: "front" }));
  const { renderer, nodes } = harness(draft);
  const zone = { id: "zone-1", skillId: draft.id, sourceActorId: "player", radius: "short", appliedAtMs: 100, expiresAtMs: 4100 };
  renderer.syncPersistentZones([zone]);
  assert.equal(nodes[0].style.animationIterationCount, "1"); assert.equal(nodes[0].style.animationDuration, "4000ms");
  assert.equal(nodes[0].className.includes("layer-behind"), false);
  renderer.syncPersistentZones([{ ...zone, radius: "medium", appliedAtMs: 2100, expiresAtMs: 6100 }]);
  assert.equal(nodes.length, 1); assert.equal(nodes[0].style.animationDuration, "6000ms");
  renderer.syncPersistentZones([]); assert.equal(nodes[0].removed, true); assert.equal(renderer.activeCount, 0);
});

for (const playbackMode of ["once", "loop", "stretch"]) test("status " + playbackMode + ": binding, resolver and native renderer keep sprite controls", () => {
  const draft = buildHumanSkillDraftV1(fields({ statusVisuals: { aura: { mode: "sprite", sprite: { assetId: spriteId, displayScale: 2, opacity: .8, playbackMode, offsetX: 20, offsetY: -15, layerByView: { player: "behind", opponent: "front" } } } } }));
  const restored = humanSkillEditorFieldsFromDraftV1(JSON.parse(JSON.stringify(draft)));
  assert.deepEqual(buildHumanSkillDraftV1(restored), draft);
  const presentation = assets(draft), motion = node();
  motion.ownerDocument = { createElement: node };
  const renderer = createDomStatusFxRenderer({ targetFor: () => ({ motion, image: { src: "/creature.webp" } }), statusPresentationFor: id => presentation.statusPresentationFor(id, { view: "player" }) });
  const instance = { definition: { id: "aura", durationMs: 4000 }, appliedAtMs: 100, expiresAtMs: 4100 };
  const state = expiresAtMs => ({ elapsedMs: 100, fighters: { player: { statusEffects: [{ ...instance, expiresAtMs }] } } });
  renderer.sync(state(4100)); const n = motion.children[0];
  assert.equal(n.style.animationIterationCount, playbackMode === "loop" ? "infinite" : "1");
  assert.equal(n.style.animationDuration, playbackMode === "stretch" ? "4000ms" : "720ms");
  assert.equal(n.style.left, "calc(50% + 20px)"); assert.equal(n.style.top, "calc(50% + -15px)"); assert.equal(n.style.zIndex, "-1");
  renderer.sync(state(6100)); assert.equal(motion.children.length, 1);
  if (playbackMode === "stretch") assert.equal(n.style.animationDuration, "6000ms");
  renderer.sync({ fighters: { player: { statusEffects: [] } } }); assert.equal(n.removed, true);
});

test("editor provides non-projectile animation and placement controls", async () => {
  const html = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8");
  for (const role of ["cast", "impact", "zone"]) {
    for (const control of ["playback", "layer-player", "layer-opponent", "offset-x", "offset-y"]) assert.match(html, new RegExp("data-skill-" + role + "-" + control));
  }
});

test("impact uses the target semantic view, while cast uses the source semantic view", () => {
  const draft = buildHumanSkillDraftV1(fields({ castAssetId: spriteId, impactAssetId: spriteId,
    castLayerPlayer: "behind", castLayerOpponent: "front", impactLayerPlayer: "behind", impactLayerOpponent: "front" }));
  const { renderer, nodes } = harness(draft);
  renderer.play({ type: "cast", skillId: draft.id, fromSlot: "player", durationMs: 500 });
  renderer.play({ type: "impact", skillId: draft.id, fromSlot: "player", targetSlot: "opponent", durationMs: 420 });
  assert.equal(nodes[0].className.includes("layer-behind"), true);
  assert.equal(nodes[1].className.includes("layer-behind"), false);
  renderer.dispose();
});
