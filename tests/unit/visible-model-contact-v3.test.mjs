import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  opaqueMaskFromRgba,
  screenPointToModelUnit,
  sweptPointHitsOpaqueMask,
  visibleModelOpaqueRect
} from "../../src/adapters/renderer/dom-visible-model-contact.js";

function maskFixture() {
  const width = 6;
  const height = 4;
  const data = new Uint8ClampedArray(width * height * 4);

  const setOpaque = (x, y) => {
    data[(y * width + x) * 4 + 3] = 255;
  };

  // Visible body occupies only the middle of the source image.
  for (let y = 1; y <= 2; y += 1) {
    for (let x = 2; x <= 4; x += 1) {
      setOpaque(x, y);
    }
  }

  return opaqueMaskFromRgba({ width, height, data });
}

function frame({
  origin = { x: 100, y: 100 },
  axisX = { x: 160, y: 100 },
  axisY = { x: 100, y: 140 }
} = {}) {
  return Object.freeze({ origin, axisX, axisY });
}



test("visible target rect follows the opaque sprite bounds instead of transparent canvas margins", () => {
  const mask = maskFixture();
  const rect = visibleModelOpaqueRect({
    ...frame(),
    mask
  });

  assert.deepEqual(rect, {
    left: 120,
    top: 110,
    width: 30,
    height: 20,
    right: 150,
    bottom: 130
  });
});

test("visible target rect follows the same scaled visual frame used by collision", () => {
  const mask = maskFixture();
  const rect = visibleModelOpaqueRect({
    ...frame({
      origin: { x: 200, y: 100 },
      axisX: { x: 320, y: 100 },
      axisY: { x: 200, y: 180 }
    }),
    mask
  });

  assert.deepEqual(rect, {
    left: 240,
    top: 120,
    width: 60,
    height: 40,
    right: 300,
    bottom: 160
  });
});

test("transparent sprite margin is not a collision but an opaque pixel is", () => {
  const mask = maskFixture();
  const targetFrame = frame();

  assert.equal(
    sweptPointHitsOpaqueMask({
      mask,
      previousPoint: { x: 105, y: 105 },
      point: { x: 110, y: 108 },
      previousFrame: targetFrame,
      frame: targetFrame
    }),
    false
  );

  assert.equal(
    sweptPointHitsOpaqueMask({
      mask,
      previousPoint: { x: 128, y: 114 },
      point: { x: 132, y: 118 },
      previousFrame: targetFrame,
      frame: targetFrame
    }),
    true
  );
});

test("screen-to-model mapping follows the same translated scaled and rotated visual frame", () => {
  const rotated = frame({
    origin: { x: 200, y: 100 },
    axisX: { x: 200, y: 220 },
    axisY: { x: 120, y: 100 }
  });

  const local = screenPointToModelUnit(
    rotated,
    { x: 180, y: 160 }
  );

  assert.ok(local);
  assert.ok(Math.abs(local.u - 0.5) < 1e-9);
  assert.ok(Math.abs(local.v - 0.25) < 1e-9);
});

test("swept projectile core cannot tunnel through an opaque model between frames", () => {
  const mask = maskFixture();
  const targetFrame = frame();

  assert.equal(
    sweptPointHitsOpaqueMask({
      mask,
      previousPoint: { x: 110, y: 120 },
      point: { x: 155, y: 120 },
      previousFrame: targetFrame,
      frame: targetFrame
    }),
    true
  );
});

test("combat clients consume the Visual Controller collision model as the only target geometry", async () => {
  const [duel, coop, demo] = await Promise.all([
    readFile(new URL("../../src/ui/combat-test-ui.js", import.meta.url), "utf8"),
    readFile(new URL("../../src/ui/combat-2v2-test-ui.js", import.meta.url), "utf8"),
    readFile(new URL("../../src/ui/demo-app.js", import.meta.url), "utf8")
  ]);

  assert.match(
    demo,
    /getCollisionModelFor\(slotKey\)[\s\S]{0,100}slotOf\(slotKey\)\.collisionModel/
  );
  assert.match(
    demo,
    /getVisibleTargetRectFor\(slotKey\)[\s\S]{0,160}visibleModelOpaqueRect/
  );

  for (const source of [duel, coop]) {
    assert.match(
      source,
      /targetCollisionModelFor\(slotId\)[\s\S]{0,120}visuals\.getCollisionModelFor\(slotId\)/
    );
    assert.match(
      source,
      /targetAnchorFor\(slotId\)[\s\S]{0,180}visuals\.getVisibleTargetRectFor\(\s*slotId\s*\)/
    );
    assert.doesNotMatch(
      source,
      /targetCollisionModelFor\(slotId\)[\s\S]{0,220}getBoundingClientRect/
    );
  }
});
