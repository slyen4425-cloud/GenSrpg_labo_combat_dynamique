import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeCombatVisualEvent } from "../../src/contracts/combat-visual-event.js";
import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
import { planAnimation } from "../../src/core/animation/plan-animation.js";
import { createProfileRegistry } from "../../src/core/profiles/profile-registry.js";
import {
  animationPlanToDomTimeline,
  composeDomTransform
} from "../../src/adapters/renderer/dom-keyframes.js";
import { createDomActorRenderer } from "../../src/adapters/renderer/dom-actor-renderer.js";

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const serpentine = await loadJson("data/profiles/serpentine.profile.json");
const drake = await loadJson("data/profiles/drake.profile.json");
const registry = createProfileRegistry([serpentine, drake]);

function maraileronPlayer() {
  return normalizeVisualActor({
    id: "maraileron-player",
    creatureId: "maraileron",
    profile: "serpentine",
    asset: "maraileron_player.png",
    view: "player",
    position: { x: 12, y: -4 },
    scale: 1.1
  });
}

test("real path event -> profile -> plan -> DOM timeline stays deterministic", () => {
  const actor = maraileronPlayer();
  const event = normalizeCombatVisualEvent({
    type: "attack",
    actorId: actor.id,
    targetId: "braisombre-opponent"
  });
  const plan = planAnimation({
    event,
    actor,
    profile: registry.get(actor.profile)
  });

  const timeline = animationPlanToDomTimeline(plan, actor);

  assert.equal(timeline.totalDurationMs, 680);
  assert.equal(timeline.options.iterations, 1);
  assert.equal(timeline.keyframes[0].offset, 0);
  assert.equal(timeline.keyframes.at(-1).offset, 1);
  assert.match(
    timeline.keyframes[0].transform,
    /translate3d\(12px, -4px, 0\)/
  );
  assert.match(
    timeline.keyframes[2].transform,
    /translate3d\(52px, -12px, 0\)/
  );
  assert.equal(
    timeline.keyframes.at(-1).transform,
    composeDomTransform(actor)
  );
});

test("idle DOM timeline loops without inventing a permanent state", () => {
  const actor = maraileronPlayer();
  const plan = planAnimation({
    event: normalizeCombatVisualEvent({ type: "idle", actorId: actor.id }),
    actor,
    profile: registry.get(actor.profile)
  });

  const timeline = animationPlanToDomTimeline(plan, actor);
  assert.equal(timeline.options.iterations, Infinity);
  assert.equal(
    timeline.keyframes.at(-1).transform,
    composeDomTransform(actor)
  );
});

test("renderer restores base state after a completed finite animation", async () => {
  const actor = maraileronPlayer();
  const done = deferred();
  const fakeAnimation = {
    finished: done.promise,
    cancel() {}
  };
  const element = {
    style: {},
    animate() {
      return fakeAnimation;
    }
  };

  const renderer = createDomActorRenderer({ element, actor });
  const plan = planAnimation({
    event: normalizeCombatVisualEvent({ type: "hit", actorId: actor.id }),
    actor,
    profile: registry.get(actor.profile)
  });

  const handle = renderer.play(plan);
  assert.equal(renderer.hasActiveAnimation, true);

  element.style.transform = "temporary-drift";
  element.style.opacity = "0.5";
  done.resolve();

  const result = await handle.finished;

  assert.equal(result.status, "finished");
  assert.equal(renderer.hasActiveAnimation, false);
  assert.equal(element.style.transform, composeDomTransform(actor));
  assert.equal(element.style.opacity, "1");
});

test("starting a new animation cancels the previous owner", () => {
  const actor = maraileronPlayer();
  let cancellations = 0;
  const created = [];

  function animate() {
    const pending = deferred();
    const animation = {
      finished: pending.promise,
      cancel() {
        cancellations += 1;
        const error = new Error("cancelled");
        error.name = "AbortError";
        pending.reject(error);
      }
    };
    created.push(animation);
    return animation;
  }

  const element = { style: {} };
  const renderer = createDomActorRenderer({ element, actor, animate });

  const idle = planAnimation({
    event: normalizeCombatVisualEvent({ type: "idle", actorId: actor.id }),
    actor,
    profile: registry.get(actor.profile)
  });
  const attack = planAnimation({
    event: normalizeCombatVisualEvent({ type: "attack", actorId: actor.id }),
    actor,
    profile: registry.get(actor.profile)
  });

  renderer.play(idle);
  renderer.play(attack);

  assert.equal(cancellations, 1);
  assert.equal(created.length, 2);
  assert.equal(renderer.hasActiveAnimation, true);
});

test("dispose cancels ownership and releases rendering hint", () => {
  const actor = maraileronPlayer();
  let cancelled = false;
  const element = { style: {} };

  const renderer = createDomActorRenderer({
    element,
    actor,
    animate() {
      return {
        finished: new Promise(() => {}),
        cancel() {
          cancelled = true;
        }
      };
    }
  });

  const idle = planAnimation({
    event: normalizeCombatVisualEvent({ type: "idle", actorId: actor.id }),
    actor,
    profile: registry.get(actor.profile)
  });

  renderer.play(idle);
  renderer.dispose();

  assert.equal(cancelled, true);
  assert.equal(renderer.isDisposed, true);
  assert.equal(renderer.hasActiveAnimation, false);
  assert.equal(element.style.willChange, "");
  assert.equal(element.style.transform, composeDomTransform(actor));
});

test("renderer adapter does not import Demo UI or GenSrpG", async () => {
  const source = [
    await readFile("src/adapters/renderer/dom-keyframes.js", "utf8"),
    await readFile("src/adapters/renderer/dom-actor-renderer.js", "utf8")
  ].join("\n");

  assert.doesNotMatch(source, /src\/ui|Zombicide-40k|GenSrpG\/Capture/);
});

test("renderer applies actor-owned transform origin", () => {
  const actor = normalizeVisualActor({
    id: "braisombre-anchor",
    creatureId: "braisombre",
    profile: "drake",
    asset: "braisombre_opponent.png",
    view: "opponent",
    transformOrigin: { x: "50%", y: "88%" }
  });
  const element = { style: {} };

  createDomActorRenderer({
    element,
    actor,
    animate() {
      return {
        finished: Promise.resolve(),
        cancel() {}
      };
    }
  });

  assert.equal(element.style.transformOrigin, "50% 88%");
});
