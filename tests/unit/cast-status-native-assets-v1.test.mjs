import test from "node:test";
import assert from "node:assert/strict";
import { demoPresentationAssets } from "../../examples/dom-demo/demo-assets.js";
import { captureEditorAssetMatchesRoleV1 } from "../../src/ui/capture-editor-human-v2.js";
import { createCaptureSkillPresentationAssetsV2 } from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import { createDomStatusFxRenderer } from "../../src/adapters/renderer/dom-status-fx.js";

const families = ["healing_aura", "energy_shield", "stone_shell", "poison", "regeneration", "purification", "curse"];
function node() {
  const style = { setProperty(name, value) { this[name] = value; }, removeProperty(name) { delete this[name]; } };
  return { className: "", dataset: {}, style, children: [], append(child) { this.children.push(child); },
    remove() { this.removed = true; }, setAttribute() {} };
}
function target() {
  const motion = node(), image = node(), statusHost = node();
  const document = { createElement() { const n = node(); n.ownerDocument = document; return n; } };
  motion.ownerDocument = statusHost.ownerDocument = document;
  image.src = "creature.webp";
  return { motion, image, statusHost };
}
for (const name of families) {
  test(name + ": canonical ID reaches aura and status slots and loops one atlas cell in the native renderer", () => {
    const assetId = "pack:capture:sprite-status-" + name.replaceAll("_", "-") + "-01";
    const visual = demoPresentationAssets.asset(assetId);
    assert.ok(visual, "native resolver must expose the actual status asset");
    assert.equal(visual.frameCount, 8); assert.equal(visual.frameMs, 90); assert.equal(visual.playbackMode, "loop");
    const url = new URL(visual.url);
    assert.equal(url.hostname, "raw.githubusercontent.com");
    assert.ok(url.pathname.includes("/global-assets/assets/library/capture/sprites/statuses/" + name + "/atlases/"));
    const catalogMetadata = { id: assetId, assetType: "sprite", mediaType: "image", category: "skill",
      tags: ["skill", "status", "aura"], compatibility: { uses: ["combat", "capture", "editor"] } };
    assert.equal(captureEditorAssetMatchesRoleV1(catalogMetadata, "status"), true);
    assert.equal(captureEditorAssetMatchesRoleV1(catalogMetadata, "zone"), true);
    const presentations = createCaptureSkillPresentationAssetsV2({
      skillPresentations: { fixture: { id: "skill:fixture", subjectType: "skill", subjectId: "fixture", version: 3,
        visual: { aura: { assetId, displayScale: 1.2 } }, audio: {},
        statusVisuals: { effect: { mode: "sprite", sprite: { assetId, displayScale: 1.4, opacity: 0.8 } } } } },
      assetForId: id => demoPresentationAssets.asset(id)
    });
    assert.equal(presentations.presentationForSkill("fixture").persistentZone.assetId, assetId);
    const t = target(), renderer = createDomStatusFxRenderer({ targetFor: () => t,
      statusPresentationFor: id => presentations.statusPresentationFor(id) });
    const state = { fighters: { actor: { statusEffects: [{ definition: { id: "effect", polarity: "beneficial" } }] } } };
    renderer.sync(state);
    const sprite = t.motion.children.find(n => n.dataset.statusFx === "sprite");
    assert.equal(sprite.dataset.assetId, assetId);
    assert.equal(sprite.style.backgroundSize, "800% 100%", "show one frame, not the complete strip");
    assert.equal(sprite.style.animationDuration, "720ms");
    assert.equal(sprite.style.animationIterationCount, "infinite");
    assert.equal(sprite.style.animationTimingFunction, "steps(8, jump-none)", "all eight frames, including the last, need a visible interval");
    const hud = t.statusHost.children.find(n => n.dataset.statusFx === "hud-icon");
    assert.equal(hud.style.backgroundSize, "800% 100%", "HUD fallback must display one representative phase");
    const beforeClass = sprite.className;
    renderer.sync({ ...state, elapsedMs: 500 });
    assert.equal(t.motion.children.length, 1, "runtime refresh must not recreate or duplicate the effect");
    assert.equal(sprite.className, beforeClass, "runtime refresh must not rebind the sprite reader");
    renderer.sync({ fighters: { actor: { statusEffects: [] } } });
    assert.equal(sprite.removed, true); assert.equal(hud.removed, true);
    assert.equal(renderer.activeCount, 0);
    renderer.dispose();
  });
}
test("five charge IDs keep their canonical eight-frame strips and native timing", () => {
  for (const name of ["blade", "physical", "electric", "water", "nature"]) {
    const id = "pack:capture:sprite-cast-" + name + "-01", visual = demoPresentationAssets.asset(id);
    assert.equal(visual.assetId, id); assert.equal(visual.frameCount, 8); assert.equal(visual.frameMs, 60);
    assert.equal(visual.playbackMode, "once");
    assert.ok(new URL(visual.url).pathname.includes("/global-assets/assets/library/capture/sprites/casts/" + name + "/atlases/"));
  }
});
