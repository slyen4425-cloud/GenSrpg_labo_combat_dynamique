import test from "node:test";
import assert from "node:assert/strict";

import {
  opaqueMaskFromRgba,
  visibleModelsOverlap,
  sweptVisibleModelsOverlap
} from "../../src/adapters/renderer/dom-visible-model-contact.js";

function mask({
  width = 5,
  height = 5,
  opaquePixels = []
} = {}) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (const [x, y] of opaquePixels) {
    data[(y * width + x) * 4 + 3] = 255;
  }
  return opaqueMaskFromRgba({ width, height, data });
}

function solidMask(width = 3, height = 3) {
  const opaquePixels = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      opaquePixels.push([x, y]);
    }
  }
  return mask({ width, height, opaquePixels });
}

function frame({
  left = 0,
  top = 0,
  width = 50,
  height = 50
} = {}) {
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

test("overlapping transparent margins do not count as model contact", () => {
  const sparse = mask({
    opaquePixels: [[2, 2]]
  });

  const left = snapshot(
    sparse,
    frame({ left: 0, top: 0, width: 50, height: 50 })
  );
  const right = snapshot(
    sparse,
    frame({ left: 35, top: 0, width: 50, height: 50 })
  );

  assert.equal(
    visibleModelsOverlap(left, right),
    false
  );
});

test("visible opaque silhouettes count as contact under transformed frames", () => {
  const solid = solidMask();

  const left = snapshot(
    solid,
    Object.freeze({
      origin: Object.freeze({ x: 0, y: 0 }),
      axisX: Object.freeze({ x: 30, y: 0 }),
      axisY: Object.freeze({ x: 0, y: 30 })
    })
  );
  const right = snapshot(
    solid,
    Object.freeze({
      origin: Object.freeze({ x: 20, y: 5 }),
      axisX: Object.freeze({ x: 20, y: 35 }),
      axisY: Object.freeze({ x: -10, y: 5 })
    })
  );

  assert.equal(
    visibleModelsOverlap(left, right),
    true
  );
});

test("continuous model contact catches a fast ground/aerial crossing between frames", () => {
  const actorMask = solidMask(3, 3);
  const targetMask = solidMask(3, 3);

  assert.equal(
    sweptVisibleModelsOverlap({
      previousLeft: snapshot(
        actorMask,
        frame({ left: 0, top: 0, width: 20, height: 20 })
      ),
      left: snapshot(
        actorMask,
        frame({ left: 90, top: 0, width: 20, height: 20 })
      ),
      previousRight: snapshot(
        targetMask,
        frame({ left: 45, top: 0, width: 20, height: 20 })
      ),
      right: snapshot(
        targetMask,
        frame({ left: 45, top: 0, width: 20, height: 20 })
      ),
      continuous: true
    }),
    true
  );
});

test("continuous model contact uses relative motion when both creatures cross", () => {
  const actorMask = solidMask(3, 3);
  const targetMask = solidMask(3, 3);

  assert.equal(
    sweptVisibleModelsOverlap({
      previousLeft: snapshot(
        actorMask,
        frame({ left: 0, top: 0, width: 20, height: 20 })
      ),
      left: snapshot(
        actorMask,
        frame({ left: 70, top: 0, width: 20, height: 20 })
      ),
      previousRight: snapshot(
        targetMask,
        frame({ left: 70, top: 0, width: 20, height: 20 })
      ),
      right: snapshot(
        targetMask,
        frame({ left: 0, top: 0, width: 20, height: 20 })
      ),
      continuous: true
    }),
    true
  );
});

test("teleport contact does not invent collision along the invisible spatial jump", () => {
  const actorMask = solidMask(3, 3);
  const targetMask = solidMask(3, 3);

  assert.equal(
    sweptVisibleModelsOverlap({
      previousLeft: snapshot(
        actorMask,
        frame({ left: 0, top: 0, width: 20, height: 20 })
      ),
      left: snapshot(
        actorMask,
        frame({ left: 90, top: 0, width: 20, height: 20 })
      ),
      previousRight: snapshot(
        targetMask,
        frame({ left: 45, top: 0, width: 20, height: 20 })
      ),
      right: snapshot(
        targetMask,
        frame({ left: 45, top: 0, width: 20, height: 20 })
      ),
      continuous: false
    }),
    false
  );
});
