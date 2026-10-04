import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
import { createAnimationPlan } from "../../src/core/animation/animation-plan.js";
import { composeDomTransform } from "../../src/adapters/renderer/dom-keyframes.js";
import { createDomActorRenderer } from "../../src/adapters/renderer/dom-actor-renderer.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function actor() {
  return normalizeVisualActor({
    id: "player-actor",
    creatureId: "loup",
    profile: "quadruped",
    asset: "loup.webp",
    view: "player",
    position: { x: 0, y: 0 },
    scale: 1
  });
}

test("renderer can stop an active moving attack at its visible pose and return continuously to base", async () => {
  const currentActor = actor();
  const created = [];

  function animate(_element, keyframes, options) {
    const done = deferred();
    const animation = {
      finished: done.promise,
      keyframes,
      options,
      cancel() {
        const error = new Error("cancelled");
        error.name = "AbortError";
        done.reject(error);
      }
    };
    created.push({ animation, done, keyframes, options });
    return animation;
  }

  const element = { style: {} };
  const renderer = createDomActorRenderer({
    element,
    actor: currentActor,
    animate,
    readComputedStyle() {
      return {
        transform: "matrix(1, 0, 0, 1, 126, -8)",
        opacity: "0.94",
        filter: "none"
      };
    }
  });

  const movingPlan = createAnimationPlan({
    actorId: currentActor.id,
    eventType: "ground-attack",
    segments: [
      {
        label: "ground-approach-impact",
        durationMs: 1000,
        easing: "linear",
        transform: {
          translateX: 260,
          translateY: -16,
          scaleX: 1,
          scaleY: 1,
          rotateDeg: 0
        }
      },
      {
        label: "ground-home",
        durationMs: 300,
        easing: "ease-out",
        transform: {
          translateX: 0,
          translateY: 0,
          scaleX: 1,
          scaleY: 1,
          rotateDeg: 0
        }
      }
    ]
  });

  const outbound = renderer.play(movingPlan);
  assert.equal(created.length, 1);

  assert.equal(
    typeof renderer.returnActiveToBaseFromCurrent,
    "function",
    "the renderer must own the contact return instead of adding a second visual controller"
  );

  const returning = renderer.returnActiveToBaseFromCurrent();

  assert.equal(returning.status, "returning");
  assert.equal(created.length, 2);
  assert.equal(
    created[1].keyframes[0].transform,
    "matrix(1, 0, 0, 1, 126, -8)",
    "return must start from the actually visible contact pose"
  );
  assert.equal(
    created[1].keyframes.at(-1).transform,
    composeDomTransform(currentActor)
  );
  assert.equal(
    created[1].options.duration,
    300,
    "return timing must come from the AnimationPlan home segment"
  );

  const outboundResult = await outbound.finished;
  assert.equal(outboundResult.status, "cancelled");

  created[1].done.resolve();
  const returnResult = await returning.finished;
  assert.equal(returnResult.status, "finished");
  assert.equal(renderer.hasActiveAnimation, false);
  assert.equal(element.style.transform, composeDomTransform(currentActor));
});

test("continuous contact approaches wire the visible contact to renderer-owned return before reporting gameplay contact", async () => {
  const source = await readFile(
    new URL("../../src/ui/demo-app.js", import.meta.url),
    "utf8"
  );

  assert.match(
    source,
    /watchVisibleModelContact[\s\S]*onContact[\s\S]*returnActiveToBaseFromCurrent/,
    "ground/aerial contact must stop outbound motion through the existing renderer"
  );
  assert.match(
    source,
    /approachMode\s*!==\s*"teleport"[\s\S]*returnActiveToBaseFromCurrent/,
    "teleport keeps its dedicated return while continuous approaches are contact-stopped"
  );
});
