import test from "node:test";
import assert from "node:assert/strict";

import { createDomDistancePresenter } from "../../src/adapters/renderer/dom-distance-presenter.js";

function styleHarness() {
  const values = {};
  return {
    left: "",
    setProperty(name, value) {
      values[name] = value;
    },
    getPropertyValue(name) {
      return values[name] ?? "";
    }
  };
}

function moved(from, to) {
  return {
    ok: true,
    outcome: "moved",
    events: [
      {
        type: "distance-changed",
        from,
        to
      }
    ]
  };
}

test("player medium to short moves toward center and keeps opponent fixed", () => {
  const player = { style: styleHarness() };
  const opponent = { style: styleHarness() };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  const opponentBefore = presenter.snapshot().opponent;
  const result = presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "player"
  });

  assert.equal(result.status, "moved");
  assert.equal(result.from, "medium");
  assert.equal(result.to, "short");
  assert.equal(result.x, 0.38);
  assert.equal(presenter.snapshot().opponent, opponentBefore);
  assert.equal(player.style.left, "38.00%");
  assert.equal(player.style.getPropertyValue("--distance-scale"), "1.00");
});

test("player medium to long moves outward without leaving arena", () => {
  const player = { style: styleHarness() };
  const opponent = { style: styleHarness() };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  const result = presenter.presentMovement({
    result: moved("medium", "long"),
    actorSlot: "player"
  });

  assert.equal(result.x, 0.20);
  assert.equal(player.style.left, "20.00%");
  assert.equal(player.style.getPropertyValue("--distance-scale"), "0.90");
  assert.ok(result.x >= 0.20);
});

test("opponent follows the symmetric distance direction convention", () => {
  const player = { style: styleHarness() };
  const opponent = { style: styleHarness() };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "opponent"
  });
  assert.equal(presenter.snapshot().opponent, 0.62);

  presenter.reset();
  presenter.presentMovement({
    result: moved("medium", "long"),
    actorSlot: "opponent"
  });
  assert.equal(presenter.snapshot().opponent, 0.80);
});

test("two-band player transition preserves intuitive direction", () => {
  const player = { style: styleHarness() };
  const opponent = { style: styleHarness() };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "player"
  });
  const shortX = presenter.snapshot().player;

  presenter.presentMovement({
    result: moved("short", "long"),
    actorSlot: "player"
  });
  const longX = presenter.snapshot().player;

  assert.ok(shortX > longX);
  assert.equal(longX, 0.20);
});

test("distance reset restores medium positions and scales", () => {
  const player = { style: styleHarness() };
  const opponent = { style: styleHarness() };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "player"
  });
  presenter.reset();

  assert.deepEqual(presenter.snapshot(), {
    player: 0.28,
    opponent: 0.72,
    playerScale: 0.96,
    opponentScale: 0.96
  });
  assert.equal(player.style.left, "28.00%");
  assert.equal(opponent.style.left, "72.00%");
});
