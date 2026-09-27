import test from "node:test";
import assert from "node:assert/strict";

import {
  createSkillPresentationRegistryV1
} from "../../src/adapters/presentation/skill-presentation-registry-v1.js";

function binding(skillId = "fireball") {
  return {
    version: 1,
    skillId,
    visual: {
      icon: {
        assetId: "core:icon-fire"
      },
      cast: {
        assetId: "pack:capture:cast-fire",
        displayScale: 1.5,
        attachment: "source",
        anchor: "mouth",
        layer: "behind",
        trigger: "preparation-start",
        playbackMode: "loop"
      },
      impact: {
        assetId: "pack:capture:impact-fire",
        attachment: "target-fixed",
        trigger: "impact"
      },
      phases: {
        vanish: {
          assetId: "pack:capture:vanish",
          attachment: "source-fixed",
          trigger: "vanish"
        }
      }
    },
    audio: {
      cast: {
        assetId: "core:sound-fire-cast",
        volume: 0.8,
        trigger: "preparation-start"
      },
      impact: {
        assetId: "core:sound-fire-impact",
        trigger: "impact"
      },
      phases: {
        vanish: {
          assetId: "core:sound-teleport",
          trigger: "vanish"
        }
      }
    }
  };
}

function assets() {
  return new Map([
    ["core:icon-fire", Object.freeze({ id: "icon", mediaType: "image" })],
    ["pack:capture:cast-fire", Object.freeze({ id: "cast", mediaType: "image" })],
    ["pack:capture:impact-fire", Object.freeze({ id: "impact", mediaType: "image" })],
    ["pack:capture:vanish", Object.freeze({ id: "vanish", mediaType: "image" })],
    ["core:sound-fire-cast", Object.freeze({ id: "cast-sound", mediaType: "audio" })],
    ["core:sound-fire-impact", Object.freeze({ id: "impact-sound", mediaType: "audio" })],
    ["core:sound-teleport", Object.freeze({ id: "phase-sound", mediaType: "audio" })]
  ]);
}

test("SkillPresentationRegistryV1 indexes normalized bindings and resolves assets lazily", () => {
  const sourceAssets = assets();
  const calls = [];
  const registry = createSkillPresentationRegistryV1({
    bindings: [binding()],
    resolveAsset(assetId) {
      calls.push(assetId);
      return sourceAssets.get(assetId) ?? null;
    }
  });

  const raw = registry.bindingForSkill("fireball");
  assert.equal(raw.skillId, "fireball");
  assert.equal(raw.visual.cast.displayScale, 1.5);
  assert.deepEqual(calls, []);

  const resolved = registry.resolvedForSkill("fireball");

  assert.equal(resolved.skillId, "fireball");
  assert.equal(resolved.visual.icon.asset.id, "icon");
  assert.equal(resolved.visual.cast.asset.id, "cast");
  assert.equal(resolved.visual.cast.displayScale, 1.5);
  assert.equal(resolved.visual.cast.anchor, "mouth");
  assert.equal(resolved.visual.cast.layer, "behind");
  assert.equal(resolved.visual.phases.vanish.asset.id, "vanish");
  assert.equal(resolved.audio.cast.asset.id, "cast-sound");
  assert.equal(resolved.audio.cast.volume, 0.8);
  assert.equal(
    resolved.audio.phases.vanish.asset.id,
    "phase-sound"
  );

  assert.ok(Object.isFrozen(registry));
  assert.ok(Object.isFrozen(resolved));
  assert.ok(Object.isFrozen(resolved.visual));
  assert.ok(Object.isFrozen(resolved.visual.cast));
  assert.ok(Object.isFrozen(resolved.audio));
  assert.deepEqual(
    calls,
    [
      "core:icon-fire",
      "pack:capture:cast-fire",
      "pack:capture:impact-fire",
      "pack:capture:vanish",
      "core:sound-fire-cast",
      "core:sound-fire-impact",
      "core:sound-teleport"
    ]
  );
});

test("missing assets remain explicit null fallbacks without breaking the binding", () => {
  const registry = createSkillPresentationRegistryV1({
    bindings: [binding()],
    resolveAsset() {
      return null;
    }
  });

  const resolved = registry.resolvedForSkill("fireball");
  assert.equal(resolved.visual.cast.asset, null);
  assert.equal(
    resolved.visual.cast.assetId,
    "pack:capture:cast-fire"
  );
  assert.equal(resolved.audio.impact.asset, null);
  assert.equal(
    resolved.audio.impact.assetId,
    "core:sound-fire-impact"
  );
});

test("unknown skill ids resolve to null", () => {
  const registry = createSkillPresentationRegistryV1({
    bindings: [binding()],
    resolveAsset() {
      return null;
    }
  });

  assert.equal(registry.bindingForSkill("missing"), null);
  assert.equal(registry.resolvedForSkill("missing"), null);
});

test("duplicate skill bindings are rejected", () => {
  assert.throws(
    () =>
      createSkillPresentationRegistryV1({
        bindings: [binding(), binding()],
        resolveAsset() {
          return null;
        }
      }),
    /duplicate skill presentation binding/
  );
});

test("registry preserves source assets instead of rewriting them with editor settings", () => {
  const sourceAssets = assets();
  const castAsset = sourceAssets.get(
    "pack:capture:cast-fire"
  );
  const before = { ...castAsset };

  const registry = createSkillPresentationRegistryV1({
    bindings: [binding()],
    resolveAsset(assetId) {
      return sourceAssets.get(assetId) ?? null;
    }
  });

  const resolved = registry.resolvedForSkill("fireball");

  assert.strictEqual(resolved.visual.cast.asset, castAsset);
  assert.deepEqual(castAsset, before);
  assert.equal(
    Object.prototype.hasOwnProperty.call(castAsset, "displayScale"),
    false
  );
  assert.equal(resolved.visual.cast.displayScale, 1.5);
});

test("resolver is required and bindings are validated by SkillPresentationBindingV1", () => {
  assert.throws(
    () =>
      createSkillPresentationRegistryV1({
        bindings: [binding()]
      }),
    /resolveAsset must be a function/
  );

  const invalid = binding("broken");
  invalid.visual.cast.assetId = "assets/fire.png";

  assert.throws(
    () =>
      createSkillPresentationRegistryV1({
        bindings: [invalid],
        resolveAsset() {
          return null;
        }
      }),
    /assetId must be a stable namespaced id/
  );
});
