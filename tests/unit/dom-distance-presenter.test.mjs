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

test("distance presenter moves and rescales only the fighter that paid", () => {
  const player = { style: styleHarness() };
  const opponent = { style: styleHarness() };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  const opponentLeft = opponent.style.left;
  const opponentScale = opponent.style.getPropertyValue("--distance-scale");

  const result = presenter.presentMovement({
    result: moved("long"),
    actorSlot: "player"
  });

  assert.equal(result.status, "moved");
  assert.equal(opponent.style.left, opponentLeft);
  assert.equal(
    opponent.style.getPropertyValue("--distance-scale"),
    opponentScale
  );
  assert.equal(player.style.left, "14.00%");
  assert.equal(
    player.style.getPropertyValue("--distance-scale"),
    "0.90"
  );
});

test("long distance stays inside configured arena center bounds", () => {
  const player = { style: styleHarness() };
  const opponent = { style: styleHarness() };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  presenter.presentMovement({
    result: moved("long"),
    actorSlot: "opponent"
  });

  const snapshot = presenter.snapshot();
  assert.ok(snapshot.opponent <= 0.86);
  assert.ok(snapshot.opponent >= 0.14);
  assert.equal(snapshot.opponentScale, 0.9);
});

test("distance scale is light and ordered short greater than medium greater than long", () => {
  const player = { style: styleHarness() };
  const opponent = { style: styleHarness() };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  presenter.presentMovement({
    result: moved("short"),
    actorSlot: "player"
  });
  const shortScale = presenter.snapshot().playerScale;

  presenter.reset();
  const mediumScale = presenter.snapshot().playerScale;

  presenter.presentMovement({
    result: moved("long"),
    actorSlot: "player"
  });
  const longScale = presenter.snapshot().playerScale;

  assert.ok(shortScale > mediumScale);
  assert.ok(mediumScale > longScale);
  assert.ok(shortScale - longScale <= 0.12);
});

test("distance reset restores medium positions and scales", () => {
  const player = { style: styleHarness() };
  const opponent = { style: styleHarness() };
  const presenter = createDomDistancePresenter({
    fighters: { player, opponent }
  });

  presenter.presentMovement({
    result: moved("short"),
    actorSlot: "player"
  });
  presenter.reset();

  assert.deepEqual(presenter.snapshot(), {
    player: 0.23,
    opponent: 0.77,
    playerScale: 0.96,
    opponentScale: 0.96
  });
  assert.equal(player.style.left, "23.00%");
  assert.equal(opponent.style.left, "77.00%");
  assert.equal(
    player.style.getPropertyValue("--distance-scale"),
    "0.96"
  );
  assert.equal(
    opponent.style.getPropertyValue("--distance-scale"),
    "0.96"
  );
});
