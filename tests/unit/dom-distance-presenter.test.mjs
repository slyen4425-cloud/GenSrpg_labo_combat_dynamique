import test from "node:test";
import assert from "node:assert/strict";

import { createDomDistancePresenter } from "../../src/adapters/renderer/dom-distance-presenter.js";

function styleHarness() {
  const values = {};
  return {
    left: "",
    top: "",
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

test("player anchors move diagonally from bottom-left toward center", () => {
  const { presenter } = setup();

  presenter.presentMovement({
    result: moved("medium", "long"),
    actorSlot: "player"
  });
  const long = presenter.snapshot();

  presenter.presentMovement({
    result: moved("long", "medium"),
    actorSlot: "player"
  });
  const medium = presenter.snapshot();

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "player"
  });
  const short = presenter.snapshot();

  assert.deepEqual(
    {
      longX: long.player,
      longY: long.playerY,
      mediumX: medium.player,
      mediumY: medium.playerY,
      shortX: short.player,
      shortY: short.playerY
    },
    {
      longX: 0.16,
      longY: 0.72,
      mediumX: 0.28,
      mediumY: 0.64,
      shortX: 0.39,
      shortY: 0.56
    }
  );

  assert.ok(long.player < medium.player);
  assert.ok(medium.player < short.player);
  assert.ok(long.playerY > medium.playerY);
  assert.ok(medium.playerY > short.playerY);
});

test("opponent anchors mirror the diagonal from top-right toward center", () => {
  const { presenter } = setup();

  presenter.presentMovement({
    result: moved("medium", "long"),
    actorSlot: "opponent"
  });
  const long = presenter.snapshot();

  presenter.presentMovement({
    result: moved("long", "medium"),
    actorSlot: "opponent"
  });
  const medium = presenter.snapshot();

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "opponent"
  });
  const short = presenter.snapshot();

  assert.deepEqual(
    {
      longX: long.opponent,
      longY: long.opponentY,
      mediumX: medium.opponent,
      mediumY: medium.opponentY,
      shortX: short.opponent,
      shortY: short.opponentY
    },
    {
      longX: 0.84,
      longY: 0.24,
      mediumX: 0.72,
      mediumY: 0.32,
      shortX: 0.61,
      shortY: 0.40
    }
  );

  assert.ok(long.opponent > medium.opponent);
  assert.ok(medium.opponent > short.opponent);
  assert.ok(long.opponentY < medium.opponentY);
  assert.ok(medium.opponentY < short.opponentY);
});

test("camera perspective uses opposite scale curves for player and opponent", () => {
  const { presenter } = setup();

  presenter.presentMovement({
    result: moved("medium", "long"),
    actorSlot: "player"
  });
  const playerLong = presenter.snapshot().playerScale;

  presenter.presentMovement({
    result: moved("long", "medium"),
    actorSlot: "player"
  });
  const playerMedium = presenter.snapshot().playerScale;

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "player"
  });
  const playerShort = presenter.snapshot().playerScale;

  presenter.reset();

  presenter.presentMovement({
    result: moved("medium", "long"),
    actorSlot: "opponent"
  });
  const opponentLong = presenter.snapshot().opponentScale;

  presenter.presentMovement({
    result: moved("long", "medium"),
    actorSlot: "opponent"
  });
  const opponentMedium = presenter.snapshot().opponentScale;

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "opponent"
  });
  const opponentShort = presenter.snapshot().opponentScale;

  assert.deepEqual(
    {
      playerLong,
      playerMedium,
      playerShort,
      opponentLong,
      opponentMedium,
      opponentShort
    },
    {
      playerLong: 1.08,
      playerMedium: 0.98,
      playerShort: 0.88,
      opponentLong: 0.88,
      opponentMedium: 0.98,
      opponentShort: 1.08
    }
  );

  assert.ok(playerLong > playerMedium);
  assert.ok(playerMedium > playerShort);
  assert.ok(opponentLong < opponentMedium);
  assert.ok(opponentMedium < opponentShort);
});

test("only the moving fighter changes x y and scale", () => {
  const { presenter } = setup();
  const before = presenter.snapshot();

  presenter.presentMovement({
    result: moved("medium", "short"),
    actorSlot: "player"
  });

  const after = presenter.snapshot();
  assert.equal(after.player, 0.39);
  assert.equal(after.playerY, 0.56);
  assert.equal(after.playerScale, 0.88);
  assert.equal(after.opponent, before.opponent);
  assert.equal(after.opponentY, before.opponentY);
  assert.equal(after.opponentScale, before.opponentScale);
});

test("reset restores medium x y anchors and scales", () => {
  const { player, opponent, presenter } = setup();

  presenter.presentMovement({
    result: moved("medium", "long"),
    actorSlot: "player"
  });
  presenter.reset();

  assert.deepEqual(presenter.snapshot(), {
    player: 0.28,
    playerY: 0.64,
    opponent: 0.72,
    opponentY: 0.32,
    playerScale: 0.98,
    opponentScale: 0.98
  });
  assert.equal(player.style.left, "28.00%");
  assert.equal(player.style.top, "64.00%");
  assert.equal(opponent.style.left, "72.00%");
  assert.equal(opponent.style.top, "32.00%");
  assert.equal(player.style.getPropertyValue("--distance-scale"), "0.98");
  assert.equal(opponent.style.getPropertyValue("--distance-scale"), "0.98");
});
