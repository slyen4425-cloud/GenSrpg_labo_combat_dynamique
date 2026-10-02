import test from "node:test";
import assert from "node:assert/strict";

import {
  createDomCombatAudio
} from "../../src/adapters/audio/dom-combat-audio.js";
import {
  createCombatResolutionPresenter
} from "../../src/adapters/renderer/combat-resolution-presenter.js";

function runningHandle({ loop = false } = {}) {
  const handle = {
    status: "running",
    loop,
    stopped: false,
    finished: new Promise(() => {}),
    stop() {
      handle.stopped = true;
      return true;
    }
  };
  return handle;
}

function visuals() {
  return {
    playEventFor() {
      return Promise.resolve({ status: "finished" });
    },
    playApproachFor() {
      return Promise.resolve({ status: "finished" });
    },
    cancelFor() {}
  };
}

test("one-shot cast sound is not cut at release, but looping preparation sound is", () => {
  for (const [loop, expectedStopped] of [
    [false, false],
    [true, true]
  ]) {
    const calls = [];
    const cast = runningHandle({ loop });
    const presenter =
      createCombatResolutionPresenter({
        visuals: visuals(),
        fx: { play() {}, cancelProjectileFor() { return 0; } },
        audio: {
          primeSkill() {},
          play(event) {
            calls.push(event);
            if (event.type === "cast") {
              return cast;
            }
            return {
              status: "ignored",
              finished: Promise.resolve({
                status: "ignored"
              })
            };
          }
        }
      });

    const action = {
      skill: {
        id: "short-cast",
        form: "contact",
        approachMode: "ground"
      },
      preparationMs: 300,
      travelMs: 200,
      targetId: "opponent"
    };

    presenter.presentPreparation({
      action,
      actorSlot: "player"
    });
    presenter.presentRelease({
      action,
      actorSlot: "player",
      targetSlot: "opponent"
    });

    assert.equal(
      cast.stopped,
      expectedStopped
    );
    presenter.dispose();
  }
});

test("impact sound follows the same semantic impact plan as impact FX", () => {
  for (const outcome of [
    "hit",
    "blocked",
    "reflected",
    "immune"
  ]) {
    const order = [];
    const presenter =
      createCombatResolutionPresenter({
        visuals: visuals(),
        fx: {
          cancelProjectileFor() {
            return 0;
          },
          play(plan) {
            order.push("fx:" + plan.type);
            return { status: "ignored" };
          }
        },
        audio: {
          play(event) {
            order.push("audio:" + event.type);
            return {
              status: "running",
              loop: false,
              finished: Promise.resolve({
                status: "finished"
              }),
              stop() {}
            };
          }
        }
      });

    presenter.presentOutcome({
      resolution: {
        ok: true,
        actorId: "player",
        targetId: "opponent",
        skillId: "test-skill",
        outcome,
        events: [
          {
            type: "skill-release",
            skillId: "test-skill",
            form: "contact"
          },
          {
            type: "skill-arrive",
            skillId: "test-skill"
          },
          {
            type: "hit",
            actorId: "opponent",
            hpAfter: 90,
            reflected:
              outcome === "reflected"
          }
        ]
      },
      actorSlot: "player",
      targetSlot: "opponent"
    });

    assert.equal(
      order.filter(
        (item) => item === "audio:impact"
      ).length,
      1,
      outcome + " must play one impact sound"
    );
    assert.ok(
      order.includes("fx:impact"),
      outcome + " must have impact FX"
    );
  }
});

test("audio adapter can prime a skill and reuse the prepared media element", () => {
  const created = [];
  const played = [];

  const audio = createDomCombatAudio({
    presentationForSkill() {
      return {
        castSound: {
          assetId: "gensrpg:sound:cast",
          volume: 1,
          loop: false
        },
        impactSound: {
          assetId: "gensrpg:sound:impact",
          volume: 1,
          loop: false
        }
      };
    },
    resolveAudioAsset(assetId) {
      return {
        assetId,
        url:
          "https://example.test/" +
          assetId.split(":").at(-1) +
          ".mp3"
      };
    },
    createAudio(url) {
      const node = {
        url,
        preload: "",
        volume: 1,
        loop: false,
        currentTime: 0,
        onended: null,
        onerror: null,
        loaded: 0,
        load() {
          node.loaded += 1;
        },
        play() {
          played.push(node);
          return Promise.resolve();
        },
        pause() {}
      };
      created.push(node);
      return node;
    }
  });

  const primed = audio.primeSkill(
    "test-skill",
    {
      actorSlot: "player",
      targetSlot: "opponent"
    }
  );

  assert.equal(primed.status, "primed");
  assert.equal(created.length, 2);
  assert.equal(
    created.every(
      (node) =>
        node.preload === "auto" &&
        node.loaded === 1
    ),
    true
  );

  const impact = audio.play({
    type: "impact",
    skillId: "test-skill",
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.equal(impact.status, "running");
  assert.equal(
    created.length,
    2,
    "play must reuse the primed impact media instead of creating a third element"
  );
  assert.equal(played.length, 1);
  impact.stop();
});
