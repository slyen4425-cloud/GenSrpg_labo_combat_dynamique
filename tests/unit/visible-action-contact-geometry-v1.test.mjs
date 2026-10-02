import test from "node:test";
import assert from "node:assert/strict";

import {
  opaqueMaskFromRgba,
  sweptVisibleModelsContact
} from "../../src/adapters/renderer/dom-visible-model-contact.js";

function mask(width, height, opaqueCells) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const [x, y] of opaqueCells) {
    data[(y * width + x) * 4 + 3] = 255;
  }
  return opaqueMaskFromRgba({ width, height, data });
}

function frame(left, top, width = 40, height = 40) {
  return Object.freeze({
    origin: Object.freeze({ x: left, y: top }),
    axisX: Object.freeze({ x: left + width, y: top }),
    axisY: Object.freeze({ x: left, y: top + height })
  });
}

function snapshot(maskValue, frameValue) {
  return Object.freeze({
    mask: maskValue,
    ...frameValue
  });
}

test("two opaque visible models collide even when their source rectangles contain transparent margins", () => {
  const attackerMask = mask(4, 4, [
    [2, 1], [2, 2]
  ]);
  const targetMask = mask(4, 4, [
    [1, 1], [1, 2]
  ]);

  const previousSource = snapshot(
    attackerMask,
    frame(0, 0)
  );
  const source = snapshot(
    attackerMask,
    frame(22, 0)
  );
  const previousTarget = snapshot(
    targetMask,
    frame(50, 0)
  );
  const target = snapshot(
    targetMask,
    frame(50, 0)
  );

  assert.equal(
    sweptVisibleModelsContact({
      previousSource,
      source,
      previousTarget,
      target
    }),
    true
  );
});

test("transparent-only overlap between model rectangles is not a visible contact", () => {
  const attackerMask = mask(4, 4, [
    [0, 0]
  ]);
  const targetMask = mask(4, 4, [
    [3, 3]
  ]);

  const source = snapshot(
    attackerMask,
    frame(20, 20)
  );
  const target = snapshot(
    targetMask,
    frame(20, 20)
  );

  assert.equal(
    sweptVisibleModelsContact({
      previousSource: source,
      source,
      previousTarget: target,
      target
    }),
    false
  );
});

test("model collision remains continuous when both visible models move between frames", () => {
  const solid = mask(3, 3, [
    [0,0],[1,0],[2,0],
    [0,1],[1,1],[2,1],
    [0,2],[1,2],[2,2]
  ]);

  assert.equal(
    sweptVisibleModelsContact({
      previousSource: snapshot(solid, frame(0, 0, 20, 20)),
      source: snapshot(solid, frame(80, 0, 20, 20)),
      previousTarget: snapshot(solid, frame(80, 0, 20, 20)),
      target: snapshot(solid, frame(0, 0, 20, 20))
    }),
    true
  );
});
