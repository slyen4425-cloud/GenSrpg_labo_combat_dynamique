import test from "node:test";
import assert from "node:assert/strict";

import { createDomDistancePresenter } from "../../src/adapters/renderer/dom-distance-presenter.js";

function moved(to) {
  return {
    ok: true,
    outcome: "moved",
    events: [
      {
        type: "distance-changed",
        from: "medium",
        to
      }
    ]
  };
}

test("distance presenter moves only the fighter that paid for movement", () => {
  const player = { style: {} };
  const opponent = { style: {} };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  const opponentBefore = opponent.style.left;
  const result = presenter.presentMovement({
    result: moved("long"),
    actorSlot: "player"
  });

  assert.equal(result.status, "moved");
  assert.equal(opponent.style.left, opponentBefore);
  assert.notEqual(player.style.left, "20.00%");
});

test("opponent movement leaves player position untouched", () => {
  const player = { style: {} };
  const opponent = { style: {} };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  const playerBefore = player.style.left;
  presenter.presentMovement({
    result: moved("short"),
    actorSlot: "opponent"
  });

  assert.equal(player.style.left, playerBefore);
  assert.notEqual(opponent.style.left, "80.00%");
});

test("distance reset restores a wider readable medium spacing", () => {
  const player = { style: {} };
  const opponent = { style: {} };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  presenter.presentMovement({
    result: moved("short"),
    actorSlot: "player"
  });
  presenter.reset();

  assert.deepEqual(presenter.snapshot(), {
    player: 0.2,
    opponent: 0.8
  });
  assert.equal(player.style.left, "20.00%");
  assert.equal(opponent.style.left, "80.00%");
});
