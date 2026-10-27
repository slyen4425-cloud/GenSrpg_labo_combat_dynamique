import test from "node:test";
import assert from "node:assert/strict";

import {
  mountCaptureCombatPreviewV1
} from "../../src/ui/capture-combat-preview-v1.js";

test("native Capture preview mount passes exact sources through existing owners", async () => {
  const calls = [];
  const root = { marker: "root" };
  const nativeVisualSource = Object.freeze({
    profiles: [{ id: "quadruped" }],
    creatureMetas: [{ id: "creature-a" }]
  });
  const nativeCombatSource = Object.freeze({
    battleFormat: { id: "format" }
  });
  const presentationAssets = Object.freeze({
    marker: "presentation-assets"
  });
  const visuals = Object.freeze({
    marker: "visual-controller",
    dispose() {
      calls.push("visuals-dispose");
    }
  });
  const combat = Object.freeze({
    marker: "combat-controller",
    dispose() {
      calls.push("combat-dispose");
    }
  });

  const preview = await mountCaptureCombatPreviewV1({
    root,
    nativeVisualSource,
    nativeCombatSource,
    presentationAssets,
    async mountVisuals(args) {
      assert.equal(args.root, root);
      assert.equal(args.nativeVisualSource, nativeVisualSource);
      calls.push("mount-visuals");
      return visuals;
    },
    async mountCombat(args) {
      assert.equal(args.root, root);
      assert.equal(args.visuals, visuals);
      assert.equal(args.nativeCombatSource, nativeCombatSource);
      assert.equal(args.presentationAssets, presentationAssets);
      calls.push("mount-combat");
      return combat;
    }
  });

  assert.equal(preview.visuals, visuals);
  assert.equal(preview.combat, combat);
  assert.deepEqual(calls, [
    "mount-visuals",
    "mount-combat"
  ]);

  preview.dispose();
  assert.deepEqual(calls.slice(-2), [
    "combat-dispose",
    "visuals-dispose"
  ]);

  preview.dispose();
  assert.equal(
    calls.filter((value) => value === "combat-dispose").length,
    1
  );
  assert.equal(
    calls.filter((value) => value === "visuals-dispose").length,
    1
  );
});

test("native Capture preview mount rolls back visuals if combat mount fails", async () => {
  const calls = [];
  const visuals = {
    dispose() {
      calls.push("visuals-dispose");
    }
  };

  await assert.rejects(
    () =>
      mountCaptureCombatPreviewV1({
        root: {},
        nativeVisualSource: {},
        nativeCombatSource: {},
        async mountVisuals() {
          calls.push("mount-visuals");
          return visuals;
        },
        async mountCombat() {
          calls.push("mount-combat");
          throw new Error("combat mount failed");
        }
      }),
    /combat mount failed/i
  );

  assert.deepEqual(calls, [
    "mount-visuals",
    "mount-combat",
    "visuals-dispose"
  ]);
});

test("native Capture preview mount rejects invalid mounted owners and cleans what it owns", async () => {
  let visualDisposed = 0;

  await assert.rejects(
    () =>
      mountCaptureCombatPreviewV1({
        root: {},
        nativeVisualSource: {},
        nativeCombatSource: {},
        async mountVisuals() {
          return {
            dispose() {
              visualDisposed += 1;
            }
          };
        },
        async mountCombat() {
          return {};
        }
      }),
    /mountCombat.*dispose|combat.*dispose/i
  );

  assert.equal(visualDisposed, 1);

  await assert.rejects(
    () =>
      mountCaptureCombatPreviewV1({
        root: {},
        nativeVisualSource: {},
        nativeCombatSource: {},
        async mountVisuals() {
          return {};
        },
        async mountCombat() {
          throw new Error("must not mount");
        }
      }),
    /mountVisuals.*dispose|visual.*dispose/i
  );
});
