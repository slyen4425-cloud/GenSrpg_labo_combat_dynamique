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
    events: [{ type: "distance-changed", from, to }]
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

test("player anchors are unambiguous: long < medium < short", () => {
  const { presenter } = setup();

  presenter.presentMovement({
    result: moved("medium", "long"),
    actorSlot: "player"
  });
  const longX = presenter.snapshot().player;

  presenter.presentMovement({
    result: moved("long", "medium"),
    actorSlot: "player"
  });
  const mediumX = presenter.snapshot().player;

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "player"
  });
  const shortX = presenter.snapshot().player;

  assert.deepEqual(
    { longX, mediumX, shortX },
    { longX: 0.18, mediumX: 0.28, shortX: 0.42 }
  );
  assert.ok(longX < mediumX);
  assert.ok(mediumX < shortX);
});

test("opponent anchors are symmetric: short < medium < long", () => {
  const { presenter } = setup();

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "opponent"
  });
  const shortX = presenter.snapshot().opponent;

  presenter.presentMovement({
    result: moved("short", "medium"),
    actorSlot: "opponent"
  });
  const mediumX = presenter.snapshot().opponent;

  presenter.presentMovement({
    result: moved("medium", "long"),
    actorSlot: "opponent"
  });
  const longX = presenter.snapshot().opponent;

  assert.deepEqual(
    { shortX, mediumX, longX },
    { shortX: 0.58, mediumX: 0.72, longX: 0.82 }
  );
  assert.ok(shortX < mediumX);
  assert.ok(mediumX < longX);
});

test("only the moving fighter changes anchor and scale", () => {
  const { presenter } = setup();
  const before = presenter.snapshot();

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "player"
  });

  const after = presenter.snapshot();
  assert.equal(after.player, 0.42);
  assert.equal(after.playerScale, 1);
  assert.equal(after.opponent, before.opponent);
  assert.equal(after.opponentScale, before.opponentScale);
});

test("reset restores medium anchors and scales", () => {
  const { player, opponent, presenter } = setup();

  presenter.presentMovement({
    result: moved("medium", "long"),
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
  assert.equal(player.style.getPropertyValue("--distance-scale"), "0.96");
  assert.equal(opponent.style.getPropertyValue("--distance-scale"), "0.96");
});
