import test from "node:test";
import assert from "node:assert/strict";

import { createDomCombatAudio } from "../../src/adapters/audio/dom-combat-audio.js";
import { createLocalAudioSourceRegistry } from "../../src/adapters/audio/local-audio-source-registry.js";

test("local audio source registry maps selected private files by stable asset id", () => {
  const revoked = [];
  let nextUrl = 0;

  const registry = createLocalAudioSourceRegistry({
    createObjectURL(file) {
      nextUrl += 1;
      return `blob:test-${nextUrl}-${file.name}`;
    },
    revokeObjectURL(url) {
      revoked.push(url);
    }
  });

  const expected = [
    {
      assetId: "core:sound-fire",
      fileName: "fire.wav"
    },
    {
      assetId: "core:sound-impact",
      fileName: "impact.wav"
    }
  ];

  const result = registry.loadFiles(
    [
      { name: "fire.wav" },
      { name: "unrelated.wav" },
      { name: "impact.wav" }
    ],
    expected
  );

  assert.equal(result.required, 2);
  assert.equal(result.loaded, 2);
  assert.equal(result.matched, 2);
  assert.match(registry.resolve("core:sound-fire"), /^blob:test-1-/);
  assert.match(registry.resolve("core:sound-impact"), /^blob:test-2-/);
  assert.equal(registry.resolve("unknown"), null);

  registry.loadFiles([{ name: "fire.wav" }], expected);
  assert.equal(revoked.length, 1);

  registry.dispose();
  assert.equal(revoked.length, 3);
  assert.equal(registry.size, 0);
});

test("combat audio adapter resolves presentation sound and stops active playback", async () => {
  const played = [];
  const paused = [];

  const audio = createDomCombatAudio({
    presentationForSkill(skillId) {
      assert.equal(skillId, "fireball");
      return {
        castSound: {
          assetId: "core:sound-test-fire-cast-01",
          volume: 0.72
        }
      };
    },
    resolveSource(assetId) {
      assert.equal(assetId, "core:sound-test-fire-cast-01");
      return "blob:fire";
    },
    createAudio(url) {
      assert.equal(url, "blob:fire");
      return {
        volume: 1,
        loop: false,
        currentTime: 0,
        onended: null,
        onerror: null,
        play() {
          played.push(url);
          return Promise.resolve();
        },
        pause() {
          paused.push(url);
        }
      };
    }
  });

  const handle = audio.play({
    type: "cast",
    skillId: "fireball",
    actorSlot: "player"
  });

  assert.equal(handle.status, "running");
  assert.equal(handle.assetId, "core:sound-test-fire-cast-01");
  assert.deepEqual(played, ["blob:fire"]);
  assert.equal(handle.audio.volume, 0.72);
  assert.equal(audio.activeCount, 1);

  assert.equal(handle.stop(), true);
  assert.deepEqual(paused, ["blob:fire"]);
  assert.equal(audio.activeCount, 0);
  assert.equal((await handle.finished).status, "stopped");

  audio.dispose();
});

test("combat audio adapter ignores missing local private sources safely", async () => {
  const audio = createDomCombatAudio({
    presentationForSkill() {
      return {
        impactSound: {
          assetId: "core:sound-test-impact-01"
        }
      };
    },
    resolveSource() {
      return null;
    },
    createAudio() {
      throw new Error("must not create audio without source");
    }
  });

  const handle = audio.play({
    type: "impact",
    skillId: "claw",
    targetSlot: "opponent"
  });

  assert.equal(handle.status, "missing_source");
  assert.equal((await handle.finished).status, "missing_source");
  assert.equal(audio.activeCount, 0);
});

test("combat audio adapter resolves phase sounds by animation label", () => {
  const phases = [];
  const audio = createDomCombatAudio({
    presentationForSkill(_skillId, context) {
      phases.push(context.phase);
      return {
        phaseSound: {
          "teleport-vanish": {
            assetId: "core:sound-test-teleport-01"
          }
        }
      };
    },
    resolveSource() {
      return "blob:teleport";
    },
    createAudio() {
      return {
        volume: 1,
        loop: false,
        currentTime: 0,
        play() {
          return Promise.resolve();
        },
        pause() {}
      };
    }
  });

  const handle = audio.play({
    type: "phase",
    skillId: "teleport-strike",
    actorSlot: "player",
    phase: "teleport-vanish"
  });

  assert.equal(handle.status, "running");
  assert.deepEqual(phases, ["teleport-vanish"]);
  handle.stop();
});
