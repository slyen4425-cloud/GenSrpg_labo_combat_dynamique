import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildHumanSkillDraftV1, humanSkillEditorFieldsFromDraftV1 } from "../../src/ui/capture-editor-human-v2.js";
import { createCaptureSkillPresentationAssetsV2 } from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { planSkillReleaseFx } from "../../src/core/fx/skill-fx-plan.js";
import { demoPresentationAssets } from "../../examples/dom-demo/demo-assets.js";

function fields(presentation = {}) {
  return {
    id: "slow-water", name: "Eau lente", description: "Test", requiredLevel: 1,
    usageScopes: ["capture", "combat"], category: "offensive", form: "projectile",
    element: "water", approachMode: "none", energyCost: 3, preparationMs: 300,
    travelMs: 2400, recoveryMs: 450, cooldownMs: 2800,
    allowedDistances: ["short", "medium", "long"], targetRelations: ["enemy"],
    damage: 0, heal: 0, stunMs: 0, interruptsPreparation: false,
    effects: [{ kind: "damage", targetScope: "target", channel: "water", amount: 4 }],
    reaction: { blockForms: [], reflectForms: [], immuneElements: [], counterForms: [], evadeForms: [], evadeApproaches: [] },
    projectileClash: { mode: "none" },
    presentation: {
      travelAssetId: "pack:capture:sprite-projectile-water-01",
      impactAssetId: "pack:capture:sprite-impact-water-01",
      ...presentation
    }
  };
}

function harness(draft) {
  const nodes = [], animations = [];
  const arena = {
    ownerDocument: { createElement() { return {
      className: "", dataset: {}, style: {}, children: [],
      append(child) { this.children.push(child); },
      remove() { this.removed = true; }
    }; } },
    append(node) { nodes.push(node); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 600, height: 300 }; }
  };
  const anchors = Object.fromEntries([["player", 40], ["opponent", 500]].map(([key, left]) =>
    [key, { getBoundingClientRect() { return { left, top: 100, width: 40, height: 40 }; } }]));
  const presentation = createCaptureSkillPresentationAssetsV2({
    skillPresentations: { [draft.id]: draft.presentation },
    assetForId: id => demoPresentationAssets.asset(id)
  });
  const renderer = createDomSkillFxRenderer({
    arena, anchors, presentationForSkill: presentation.presentationForSkill,
    animate(node, keyframes, options) {
      let resolve;
      const finished = new Promise(r => { resolve = r; });
      const animation = { node, keyframes, options, finished, resolve, cancel() { this.cancelled = true; resolve(); } };
      animations.push(animation); return animation;
    }
  });
  return { renderer, nodes, animations };
}

test("projectile: new drafts default to stretch and expose the existing playback modes", async () => {
  assert.equal(buildHumanSkillDraftV1(fields()).presentation.visual.travel.playbackMode, "stretch");
  const html = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8");
  assert.match(html, /data-skill-travel-playback/);
});

test("projectile: editor save/reload preserves explicit once, loop and stretch without changing travelMs", () => {
  for (const travelPlaybackMode of ["once", "loop", "stretch"]) {
    const draft = buildHumanSkillDraftV1(fields({ travelPlaybackMode }));
    assert.equal(draft.presentation.visual.travel.playbackMode, travelPlaybackMode);
    const restored = humanSkillEditorFieldsFromDraftV1(JSON.parse(JSON.stringify(draft)));
    assert.equal(restored.presentation.travelPlaybackMode, travelPlaybackMode);
    const roundTrip = buildHumanSkillDraftV1(restored);
    assert.deepEqual(roundTrip.definition, draft.definition);
    assert.deepEqual(roundTrip.presentation, draft.presentation);
  }
});

test("projectile: native release and renderer stretch water over fast and slow travel, then cancel cleanly", async () => {
  for (const travelMs of [180, 650, 2400]) {
    const draft = buildHumanSkillDraftV1({ ...fields({ travelPlaybackMode: "stretch" }), travelMs });
    const { renderer, nodes, animations } = harness(draft);
    const [plan] = planSkillReleaseFx({ action: { skill: draft.definition, travelMs } });
    const handle = renderer.play(plan);
    const sprite = nodes[0].children[0];
    assert.equal(sprite.style.animationDuration, travelMs + "ms");
    assert.equal(animations[0].options.duration, travelMs);
    assert.equal(sprite.style.animationIterationCount, "1");
    assert.equal(sprite.style.left, "-15.23%");
    assert.equal(renderer.activeCount, 1);
    renderer.cancelProjectileFor("player");
    assert.equal(nodes[0].removed, true);
    assert.equal(renderer.activeCount, 0);
    await handle.finished;
  }
});

test("impact: visual duration, offset and large scale round-trip independently of gameplay", async () => {
  const draft = buildHumanSkillDraftV1(fields({
    impactDurationMs: 800, impactDisplayScale: 5.5, impactOffsetX: 18, impactOffsetY: -12
  }));
  const slot = draft.presentation.visual.impact;
  assert.equal(slot.durationMs, 800);
  assert.equal(slot.offsetX, 18);
  assert.equal(slot.offsetY, -12);
  assert.equal(slot.playbackMode, "stretch");
  const restored = humanSkillEditorFieldsFromDraftV1(JSON.parse(JSON.stringify(draft)));
  assert.equal(restored.presentation.impactDurationMs, 800);
  assert.equal(restored.presentation.impactOffsetX, 18);
  assert.equal(restored.presentation.impactOffsetY, -12);
  assert.deepEqual(buildHumanSkillDraftV1(restored), draft);
  const { renderer, nodes, animations } = harness(draft);
  const handle = renderer.play({ type: "impact", skillId: draft.id, targetSlot: "opponent", durationMs: 420 });
  assert.equal(nodes[0].style.animationDuration, "800ms");
  assert.equal(animations[0].options.duration, 800);
  assert.equal(nodes[0].style.left, "538px");
  assert.equal(nodes[0].style.top, "108px");
  assert.match(animations[0].keyframes[1].transform, /scale\(5\.94/);
  assert.equal(animations[0].keyframes[0].opacity, 1);
  assert.equal(animations[0].keyframes[2].opacity, 1);
  assert.doesNotMatch(nodes[0].className, /layer-behind/);
  assert.equal(draft.definition.travelMs, 2400);
  animations[0].resolve();
  assert.deepEqual(await handle.finished, { status: "finished" });
  assert.equal(renderer.activeCount, 0);
});

test("impact: auto duration uses the real sequence and invalid visual durations are rejected", () => {
  const { renderer, nodes, animations } = harness(buildHumanSkillDraftV1(fields()));
  renderer.play({ type: "impact", skillId: "slow-water", targetSlot: "opponent", durationMs: 420 });
  assert.equal(nodes[0].style.animationDuration, "360ms");
  assert.equal(animations[0].options.duration, 360);
  renderer.dispose();
  for (const impactDurationMs of [-1, Number.NaN, Infinity]) {
    assert.throws(() => buildHumanSkillDraftV1(fields({ impactDurationMs })), /durée|duration/i);
  }
});


test("V9 opponent impact keeps flash on the same custom side-aware point as the impact sprite", () => {
  const draft = buildHumanSkillDraftV1(
    fields({
      impactOffsetX: 18,
      impactOffsetY: -12,
      impactOffsetMode: "custom",
      impactOpponentOffsetX: -30,
      impactOpponentOffsetY: 9,
      impactFlashColor: "#ffffff",
      impactFlashOpacity: 0.7,
      impactFlashDurationMs: 120,
      impactFlashScale: 1.4
    })
  );

  assert.equal(
    draft.presentation.version,
    9
  );

  const { renderer, nodes } =
    harness(draft);

  renderer.play({
    type: "impact",
    skillId: draft.id,
    targetSlot: "opponent",
    durationMs: 420
  });

  const flash = nodes.find(
    (node) =>
      node.dataset.skillFx ===
      "impact-flash"
  );
  const impact = nodes.find(
    (node) =>
      node.dataset.skillFx ===
      "impact"
  );

  assert.ok(flash);
  assert.ok(impact);

  // opponent center is (520, 120);
  // custom V9 offset is (-30, +9).
  assert.equal(flash.style.left, "490px");
  assert.equal(flash.style.top, "129px");
  assert.equal(impact.style.left, "490px");
  assert.equal(impact.style.top, "129px");

  renderer.dispose();
});
