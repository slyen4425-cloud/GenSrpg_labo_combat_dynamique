import test from "node:test";
import assert from "node:assert/strict";

import {
  loadCombatDemoVisualSource
} from "../../src/ui/demo-app.js";

function profile(id) {
  return {
    id,
    idle: {},
    attack: {},
    hit: {},
    ko: {}
  };
}

function creature(id, profileId) {
  return {
    id,
    name: id,
    profile: profileId,
    views: {
      player: "player.png",
      opponent: "opponent.png",
      icon: "icon.png"
    },
    runtimePreview: {
      player: "player.png",
      opponent: "opponent.png",
      icon: "icon.png"
    },
    assetBaseUrl: "https://example.invalid/assets/",
    displayScale: {
      player: 1,
      opponent: 1
    },
    fxAnchors: {
      player: {},
      opponent: {}
    }
  };
}

test("native visual source bypasses all demo fixture fetches", async () => {
  const profiles = [profile("quadruped")];
  const creatureMetas = [
    creature("local-creature", "quadruped"),
    creature("enemy-creature", "quadruped")
  ];

  let fetchCalls = 0;
  const loaded = await loadCombatDemoVisualSource({
    nativeVisualSource: {
      profiles,
      creatureMetas
    },
    fetchImpl: async () => {
      fetchCalls += 1;
      throw new Error("demo fixtures must not be fetched");
    }
  });

  assert.equal(fetchCalls, 0);
  assert.equal(loaded.profiles[0], profiles[0]);
  assert.equal(loaded.creatureMetas[0], creatureMetas[0]);
  assert.equal(loaded.creatureMetas[1], creatureMetas[1]);
});

test("native visual source validates arrays without inventing data", async () => {
  await assert.rejects(
    () =>
      loadCombatDemoVisualSource({
        nativeVisualSource: {
          profiles: {},
          creatureMetas: []
        }
      }),
    /profiles.*array/i
  );

  await assert.rejects(
    () =>
      loadCombatDemoVisualSource({
        nativeVisualSource: {
          profiles: [],
          creatureMetas: {}
        }
      }),
    /creatureMetas.*array/i
  );
});


test("second Encounter cached/fallback image never runs ready callback before its VisualActor exists", async () => {
  // A cached bitmap or data: SVG may be complete synchronously.
  // loadRuntimeAsset calls markReady immediately in this situation, and
  // markReady reads actor.profile to update the shadow model geometry.
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../../src/ui/demo-app.js", import.meta.url), "utf8");
  const setCreature = source.slice(
    source.indexOf("  function setCreature(nextMeta, displayName = null) {"),
    source.indexOf("  function setVisible(nextVisible) {")
  );
  assert.ok(setCreature.includes("loadRuntimeAsset(runtimeUrl)"));
  assert.ok(setCreature.includes("rebuildActor(runtimeUrl)"));
  assert.ok(
    setCreature.indexOf("rebuildActor(runtimeUrl)") <
    setCreature.indexOf("loadRuntimeAsset(runtimeUrl)"),
    "the actor and its renderer must exist before an already cached image synchronously calls markReady"
  );
  assert.match(source, /image\.complete && image\.naturalWidth > 0/);
});
