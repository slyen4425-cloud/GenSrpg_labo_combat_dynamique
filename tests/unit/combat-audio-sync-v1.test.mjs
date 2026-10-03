import test from "node:test";
import assert from "node:assert/strict";

import {
  createCombatResolutionPresenter
} from "../../src/adapters/renderer/combat-resolution-presenter.js";
import {
  createDomCombatAudio
} from "../../src/adapters/audio/dom-combat-audio.js";

function visuals(order = []) {
  return {
    playEventFor(slot, event) {
      order.push("visual:" + slot + ":" + event);
      return Promise.resolve({ status: "finished" });
    },
    cancelFor() {},
    playApproachFor() {
      return Promise.resolve({ status: "finished" });
    }
  };
}

test("non-loop cast keeps playing through release", () => {
  let stopped = 0;
  const presenter = createCombatResolutionPresenter({
    visuals: visuals(),
    fx: { play() { return { status: "ignored" }; }, cancelProjectileFor() { return 0; } },
    audio: {
      play({ type }) {
        if (type !== "cast") {
          return { status: "ignored", finished: Promise.resolve({ status: "ignored" }) };
        }
        return {
          status: "running",
          loop: false,
          finished: new Promise(() => {}),
          stop() { stopped += 1; }
        };
      }
    }
  });

  const action = {
    skill: { id: "skill", form: "contact", approachMode: "none" },
    preparationMs: 0,
    travelMs: 0,
    targetId: "opponent"
  };

  presenter.presentPreparation({ action, actorSlot: "player" });
  presenter.presentRelease({ action, actorSlot: "player", targetSlot: "opponent" });

  assert.equal(stopped, 0);
  presenter.dispose();
  assert.equal(stopped, 1);
});

test("looping cast stops exactly at release", () => {
  let stopped = 0;
  const presenter = createCombatResolutionPresenter({
    visuals: visuals(),
    fx: { play() { return { status: "ignored" }; }, cancelProjectileFor() { return 0; } },
    audio: {
      play({ type }) {
        if (type !== "cast") {
          return { status: "ignored", finished: Promise.resolve({ status: "ignored" }) };
        }
        return {
          status: "running",
          loop: true,
          finished: new Promise(() => {}),
          stop() { stopped += 1; }
        };
      }
    }
  });

  const action = {
    skill: { id: "skill", form: "contact", approachMode: "none" },
    preparationMs: 500,
    travelMs: 0,
    targetId: "opponent"
  };

  presenter.presentPreparation({ action, actorSlot: "player" });
  presenter.presentRelease({ action, actorSlot: "player", targetSlot: "opponent" });

  assert.equal(stopped, 1);
  presenter.dispose();
});

for (const outcome of ["hit", "blocked", "reflected", "immune"]) {
  test("impact audio follows semantic impact FX for " + outcome, () => {
    const order = [];
    const presenter = createCombatResolutionPresenter({
      visuals: visuals(order),
      fx: {
        cancelProjectileFor() { return 0; },
        play(plan) {
          order.push("fx:" + plan.type);
          return { status: "running", finished: Promise.resolve({ status: "finished" }) };
        }
      },
      audio: {
        play(event) {
          order.push("audio:" + event.type);
          return {
            status: "running",
            loop: false,
            finished: Promise.resolve({ status: "finished" }),
            stop() {}
          };
        }
      }
    });

    presenter.presentOutcome({
      resolution: {
        ok: true,
        actionType: "skill",
        actorId: "player",
        targetId: "opponent",
        skillId: "skill",
        outcome,
        events: [
          { type: "skill-release", skillId: "skill", form: "contact", atMs: 100 },
          { type: "skill-arrive", skillId: "skill", atMs: 200 },
          ...(outcome === "hit"
            ? [{ type: "hit", actorId: "opponent", hpBefore: 100, hpAfter: 90 }]
            : [])
        ]
      },
      actorSlot: "player",
      targetSlot: "opponent"
    });

    const fxIndex = order.indexOf("fx:impact");
    const audioIndex = order.indexOf("audio:impact");
    assert.ok(fxIndex >= 0);
    assert.equal(audioIndex, fxIndex + 1);
    presenter.dispose();
  });
}

for (const outcome of ["evaded", "clashed"]) {
  test("standard impact audio is not invented for " + outcome, () => {
    const audioTypes = [];
    const presenter = createCombatResolutionPresenter({
      visuals: visuals(),
      fx: {
        cancelProjectileFor() { return 0; },
        play() { return { status: "ignored" }; }
      },
      audio: {
        play(event) {
          audioTypes.push(event.type);
          return { status: "ignored", finished: Promise.resolve({ status: "ignored" }) };
        }
      }
    });

    presenter.presentOutcome({
      resolution: {
        ok: true,
        actionType: "skill",
        actorId: "player",
        targetId: "opponent",
        skillId: "skill",
        outcome,
        events:
          outcome === "clashed"
            ? [{ type: "projectile-clash", otherActorId: "opponent", progress: 0.5 }]
            : [{ type: "skill-arrive", skillId: "skill", atMs: 200 }]
      },
      actorSlot: "player",
      targetSlot: "opponent"
    });

    assert.equal(audioTypes.includes("impact"), false);
    presenter.dispose();
  });
}

test("DOM combat audio exposes whether a playing sound loops", () => {
  const audio = createDomCombatAudio({
    presentationForSkill() {
      return {
        castSound: {
          assetId: "gensrpg:sound:test",
          loop: true
        }
      };
    },
    resolveAudioAsset() {
      return { url: "https://example.test/test.mp3" };
    },
    createAudio() {
      return {
        volume: 1,
        loop: false,
        currentTime: 0,
        onended: null,
        onerror: null,
        play() { return Promise.resolve(); },
        pause() {}
      };
    }
  });

  const handle = audio.play({
    type: "cast",
    skillId: "skill"
  });

  assert.equal(handle.status, "running");
  assert.equal(handle.loop, true);
  handle.stop();
});
