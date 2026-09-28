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
