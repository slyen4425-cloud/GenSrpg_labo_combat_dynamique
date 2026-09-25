import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";
import {
  createCombatResolutionPresenter
} from "../../src/adapters/renderer/combat-resolution-presenter.js";

test("FX renderer cancels only the projectile owned by the clashed actor", () => {
  const cancelled = [];
  const removed = [];

  const arena = {
    ownerDocument: {
      createElement() {
        const node = {
          className: "",
          dataset: {},
          style: {},
          append() {},
          remove() {
            removed.push(node);
          }
        };
        return node;
      }
    },
    append() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 400, height: 300 };
    }
  };

  const anchors = {
    player: {
      getBoundingClientRect() {
        return { left: 40, top: 220, width: 40, height: 40 };
      }
    },
    opponent: {
      getBoundingClientRect() {
        return { left: 300, top: 120, width: 40, height: 40 };
      }
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    animate(node) {
      return {
        finished: new Promise(() => {}),
        cancel() {
          cancelled.push(node.dataset.skillId);
        }
      };
    }
  });

  renderer.play({
    type: "projectile",
    skillId: "player-fireball",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 700
  });
  renderer.play({
    type: "projectile",
    skillId: "opponent-fireball",
    fromSlot: "opponent",
    targetSlot: "player",
    durationMs: 700
  });

  assert.equal(renderer.activeCount, 2);
  assert.equal(renderer.cancelProjectileFor("player"), 1);
  assert.equal(renderer.activeCount, 1);
  assert.deepEqual(cancelled, ["player-fireball"]);
  assert.equal(removed.length, 1);

  assert.equal(renderer.cancelProjectileFor("opponent"), 1);
  assert.equal(renderer.activeCount, 0);
  assert.deepEqual(cancelled, [
    "player-fireball",
    "opponent-fireball"
  ]);
  assert.equal(removed.length, 2);
});

test("Presenter stops a clashed projectile without inventing a hit animation", async () => {
  const visualCalls = [];
  const cancelledProjectiles = [];

  const presenter = createCombatResolutionPresenter({
    visuals: {
      playEventFor(slot, event) {
        visualCalls.push(["play", slot, event]);
        return Promise.resolve({ status: "finished" });
      },
      cancelFor(slot) {
        visualCalls.push(["cancel", slot]);
      }
    },
    fx: {
      play() {
        return { status: "ignored" };
      },
      cancelProjectileFor(slot) {
        cancelledProjectiles.push(slot);
        return 1;
      }
    }
  });

  const result = presenter.presentOutcome({
    resolution: {
      ok: true,
      actionType: "skill",
      actorId: "player",
      targetId: "opponent",
      skillId: "fireball",
      outcome: "clashed",
      events: []
    },
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.equal(result.outcome, "clashed");
  assert.deepEqual(cancelledProjectiles, ["player"]);
  assert.deepEqual(visualCalls, []);
  assert.deepEqual(
    await result.finished,
    { status: "presented" }
  );
});

test("Demo UI exposes a readable clash result without owning clash rules", async () => {
  const source = await readFile(
    "src/ui/combat-test-ui.js",
    "utf8"
  );

  assert.match(
    source,
    /clashed:\s*"Projectiles annulés"/
  );
  assert.doesNotMatch(
    source,
    /projectileClash\.group\s*===/
  );
});
