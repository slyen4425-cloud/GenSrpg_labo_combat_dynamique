import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createDomCombatAudio
} from "../../src/adapters/audio/dom-combat-audio.js";
import {
  createCombatResolutionPresenter
} from "../../src/adapters/renderer/combat-resolution-presenter.js";

test("travel audio type resolves presentation travelSound", () => {
  const played = [];
  const audio = createDomCombatAudio({
    presentationForSkill() {
      return {
        travelSound: {
          assetId: "gensrpg:sound:projectile-flight-01",
          loop: true
        }
      };
    },
    resolveAudioAsset(assetId) {
      return {
        assetId,
        url: "https://example.test/travel.mp3"
      };
    },
    createAudio(url) {
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
    type: "travel",
    skillId: "fireball",
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.equal(handle.status, "running");
  assert.equal(played.length, 1);
  handle.stop();
});

test("presenter starts travel sound for projectile release and stops it on outcome", () => {
  const calls = [];
  const handles = [];
  const presenter = createCombatResolutionPresenter({
    visuals: {
      playEventFor() { return Promise.resolve({ status: "finished" }); },
      cancelFor() {},
      playApproachFor() { return Promise.resolve({ status: "finished" }); }
    },
    fx: { play() {}, cancelProjectileFor() { return 1; } },
    audio: {
      play(event) {
        calls.push(event);
        const handle = {
          status: "running",
          finished: new Promise(() => {}),
          stop() { handle.stopped = true; }
        };
        handles.push(handle);
        return handle;
      }
    }
  });

  const action = {
    skill: { id: "fireball", form: "projectile", approachMode: "none" },
    travelMs: 600,
    targetId: "opponent"
  };

  presenter.presentRelease({
    action,
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.ok(calls.some((event) => event.type === "travel"));
  const travelHandle = handles[calls.findIndex((event) => event.type === "travel")];

  presenter.presentOutcome({
    resolution: {
      ok: true,
      outcome: "hit",
      events: [
        { type: "skill-release", form: "projectile", skillId: "fireball" },
        { type: "skill-arrive", skillId: "fireball" },
        { type: "hit", actorId: "opponent", hpAfter: 90 }
      ]
    },
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.equal(travelHandle.stopped, true);
  presenter.dispose();
});

test("human editor exposes and persists projectile travel audio", async () => {
  const html = await readFile(
    new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url),
    "utf8"
  );
  const source = await readFile(
    new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url),
    "utf8"
  );

  assert.match(html, /data-skill-travel-audio/);
  assert.match(source, /travelAudioAssetId/);
  assert.match(source, /audio\.travel/);
});
