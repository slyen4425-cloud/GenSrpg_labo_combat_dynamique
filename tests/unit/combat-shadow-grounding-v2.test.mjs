import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createDomActorRenderer
} from "../../src/adapters/renderer/dom-actor-renderer.js";
import {
  shadowGeometryFromOpaqueMaskV2
} from "../../src/adapters/renderer/dom-ground-shadow-v2.js";

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test("ground shadow geometry follows the useful opaque model footprint and ignores sparse noise", () => {
  const width = 100;
  const height = 100;
  const opaque = new Uint8Array(width * height);

  for (let y = 18; y <= 88; y += 1) {
    for (let x = 20; x <= 80; x += 1) {
      opaque[y * width + x] = 1;
    }
  }
  opaque[0] = 1;
  opaque[99] = 1;

  const geometry = shadowGeometryFromOpaqueMaskV2({
    width,
    height,
    opaque
  });

  assert.ok(
    geometry.widthPct >= 64 &&
    geometry.widthPct <= 72,
    "shadow width should follow the model footprint, not sparse edge noise"
  );
  assert.ok(
    geometry.heightPct >= 9 &&
    geometry.heightPct <= 14
  );
});

test("actor renderer animates the real shadow element on the same timeline without pseudoElement ownership", async () => {
  const bodyDone = deferred();
  const shadowDone = deferred();
  const calls = [];

  const element = { style: {} };
  const shadowElement = { style: {} };
  const actor = {
    id: "actor",
    creatureId: "creature",
    profile: "biped",
    view: "player",
    asset: "test.webp",
    scale: 1.2,
    position: { x: 4, y: -2 },
    transformOrigin: { x: "50%", y: "88%" }
  };

  const renderer = createDomActorRenderer({
    element,
    shadowElement,
    actor,
    animate(target, keyframes, options) {
      const index = calls.length;
      const done = index === 0 ? bodyDone : shadowDone;
      const animation = {
        ready: Promise.resolve(),
        startTime: index === 0 ? 20 : 40,
        finished: done.promise,
        cancel() {}
      };
      calls.push({
        target,
        keyframes,
        options,
        animation
      });
      return animation;
    }
  });

  const handle = renderer.play({
    actorId: "actor",
    eventType: "attack",
    restoreBaseState: true,
    loop: false,
    segments: [
      {
        label: "attack-out",
        durationMs: 100,
        easing: "linear",
        transform: {
          translateX: 120,
          translateY: -30,
          scaleX: 1,
          scaleY: 1,
          rotateDeg: 0
        },
        ground: {
          translateX: 120,
          translateY: -30,
          scale: 1
        },
        opacity: 1,
        filter: {}
      },
      {
        label: "attack-home",
        durationMs: 100,
        easing: "linear",
        transform: {
          translateX: 0,
          translateY: 0,
          scaleX: 1,
          scaleY: 1,
          rotateDeg: 0
        },
        ground: {
          translateX: 0,
          translateY: 0,
          scale: 1
        },
        opacity: 1,
        filter: {}
      }
    ]
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[1].target, shadowElement);
  assert.equal(
    "pseudoElement" in calls[1].options,
    false,
    "real shadow node must be animated directly"
  );
  assert.match(
    calls[1].keyframes[1].transform,
    /translate3d\(124px, -32px, 0\)/,
    "shadow must follow the attack ground translation"
  );

  bodyDone.resolve();
  shadowDone.resolve();
  await handle.finished;
});

test("combat surfaces provide an explicit shadow node for every fighter", async () => {
  for (const path of [
    "../../examples/dom-demo/index.html",
    "../../examples/dom-demo/coop-2v2.html",
    "../../examples/dom-demo/capture-editor-v2.html"
  ]) {
    const source = await readFile(
      new URL(path, import.meta.url),
      "utf8"
    );
    const motions =
      source.match(/data-demo-motion/g)?.length ?? 0;
    const shadows =
      source.match(/data-demo-shadow/g)?.length ?? 0;

    assert.ok(motions > 0, path + " has no combat motion surface");
    assert.equal(
      shadows,
      motions,
      path + " must expose one real shadow for each motion surface"
    );
  }
});
