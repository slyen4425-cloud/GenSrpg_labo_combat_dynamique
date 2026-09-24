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

function setup() {
  const player = { style: styleHarness() };
  const opponent = { style: styleHarness() };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });
  return { player, opponent, presenter };
}

test("player short is closer to center than medium, and long is farther out", () => {
  const { presenter } = setup();

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "player"
  });
  const shortX = presenter.snapshot().player;

  presenter.reset();
  const mediumX = presenter.snapshot().player;

  presenter.presentMovement({
    result: moved("medium", "long"),
    actorSlot: "player"
  });
  const longX = presenter.snapshot().player;

  assert.ok(shortX > mediumX);
  assert.ok(mediumX > longX);
  assert.equal(shortX, 0.42);
  assert.equal(mediumX, 0.28);
  assert.equal(longX, 0.20);
});

test("player target is derived from stationary opponent and explicit separation", () => {
  const { presenter } = setup();

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "opponent"
  });
  const opponentX = presenter.snapshot().opponent;
  const playerBefore = presenter.snapshot().player;

  const result = presenter.presentMovement({
    result: moved("short", "medium"),
    actorSlot: "player"
  });

  assert.equal(opponentX, 0.58);
  assert.equal(result.stationaryX, 0.58);
  assert.equal(result.separation, 0.44);
  assert.equal(result.x, 0.20);
  assert.equal(presenter.snapshot().opponent, opponentX);
  assert.notEqual(result.x, playerBefore);
});

test("opponent uses symmetric short medium long ordering", () => {
  const { presenter } = setup();

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "opponent"
  });
  const shortX = presenter.snapshot().opponent;

  presenter.reset();
  const mediumX = presenter.snapshot().opponent;

  presenter.presentMovement({
    result: moved("medium", "long"),
    actorSlot: "opponent"
  });
  const longX = presenter.snapshot().opponent;

  assert.ok(shortX < mediumX);
  assert.ok(mediumX < longX);
  assert.equal(shortX, 0.58);
  assert.equal(mediumX, 0.72);
  assert.equal(longX, 0.80);
});

test("only the fighter that moved changes position and scene scale", () => {
  const { presenter } = setup();
  const before = presenter.snapshot();

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "player"
  });

  const after = presenter.snapshot();
  assert.notEqual(after.player, before.player);
  assert.notEqual(after.playerScale, before.playerScale);
  assert.equal(after.opponent, before.opponent);
  assert.equal(after.opponentScale, before.opponentScale);
});

test("distance scale remains light and ordered short greater than medium greater than long", () => {
  const { presenter } = setup();

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "player"
  });
  const shortScale = presenter.snapshot().playerScale;

  presenter.reset();
  const mediumScale = presenter.snapshot().playerScale;

  presenter.presentMovement({
    result: moved("medium", "long"),
    actorSlot: "player"
  });
  const longScale = presenter.snapshot().playerScale;

  assert.ok(shortScale > mediumScale);
  assert.ok(mediumScale > longScale);
  assert.ok(shortScale - longScale <= 0.12);
});

test("distance reset restores medium positions and scales", () => {
  const { player, opponent, presenter } = setup();

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
