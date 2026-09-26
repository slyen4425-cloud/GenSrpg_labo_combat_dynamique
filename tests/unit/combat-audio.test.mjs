import test from "node:test";
import assert from "node:assert/strict";

import { createDomCombatAudio } from "../../src/adapters/audio/dom-combat-audio.js";

test("combat audio resolves a runtime asset URL automatically from assetId", async () => {
  const played = [];

  const audio = createDomCombatAudio({
    presentationForSkill(skillId) {
      assert.equal(skillId, "fireball");
      return {
        castSound: {
          assetId: "gensrpg:sound:fire-cast-01"
        }
      };
    },
    resolveAudioAsset(assetId) {
      assert.equal(assetId, "gensrpg:sound:fire-cast-01");
      return {
        assetId,
        url: "https://example.test/fire_cast.mp3",
        volume: 0.72
      };
    },
    createAudio(url) {
      assert.equal(url, "https://example.test/fire_cast.mp3");
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
        pause() {}
      };
    }
  });

  const handle = audio.play({
    type: "cast",
    skillId: "fireball",
    actorSlot: "player"
  });

  assert.equal(handle.status, "running");
  assert.equal(handle.assetId, "gensrpg:sound:fire-cast-01");
  assert.equal(played.length, 1);

  handle.stop();
  assert.equal((await handle.finished).status, "stopped");
});

test("missing runtime audio asset is a silent presentation fallback", async () => {
  const audio = createDomCombatAudio({
    presentationForSkill() {
      return {
        impactSound: {
          assetId: "gensrpg:sound:missing"
        }
      };
    },
    resolveAudioAsset() {
      return null;
    },
    createAudio() {
      throw new Error("must not create audio when no runtime URL exists");
    }
  });

  const handle = audio.play({
    type: "impact",
    skillId: "claw",
    targetSlot: "opponent"
  });

  assert.equal(handle.status, "unavailable");
  assert.equal((await handle.finished).status, "unavailable");
});

test("phase audio uses the same animation phase labels as visual presentation", () => {
  const seen = [];
  const audio = createDomCombatAudio({
    presentationForSkill(_skillId, context) {
      seen.push(context.phase);
      return {
        phaseSound: {
          "teleport-vanish": {
            assetId: "gensrpg:sound:teleport-01"
          }
        }
      };
    },
    resolveAudioAsset() {
      return {
        url: "https://example.test/teleport.mp3"
      };
    },
    createAudio() {
      return {
        volume: 1,
        loop: false,
        currentTime: 0,
        onended: null,
        onerror: null,
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
  assert.deepEqual(seen, ["teleport-vanish"]);
  handle.stop();
});
