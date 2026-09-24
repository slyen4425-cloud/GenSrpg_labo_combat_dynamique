const SEPARATION_BY_DISTANCE = Object.freeze({
  short: 0.30,
  medium: 0.44,
  long: 0.56
});

const SCALE_BY_DISTANCE = Object.freeze({
  short: 1.00,
  medium: 0.96,
  long: 0.90
});

const RESET_POSITIONS = Object.freeze({
  player: 0.28,
  opponent: 0.72
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function canonicalPosition(value) {
  return Math.round(value * 10000) / 10000;
}

function separationFor(distance) {
  const separation = SEPARATION_BY_DISTANCE[distance];
  if (!Number.isFinite(separation)) {
    throw new RangeError(`Unsupported visual distance: ${distance}`);
  }
  return separation;
}

export function createDomDistancePresenter({
  fighters,
  minX = 0.20,
  maxX = 0.80
}) {
  if (
    !fighters?.player?.style ||
    !fighters?.opponent?.style
  ) {
    throw new TypeError("fighters.player and fighters.opponent with style are required");
  }

  const positions = {
    player: RESET_POSITIONS.player,
    opponent: RESET_POSITIONS.opponent
  };

  const scales = {
    player: SCALE_BY_DISTANCE.medium,
    opponent: SCALE_BY_DISTANCE.medium
  };

  function apply(slot) {
    fighters[slot].style.left = `${(positions[slot] * 100).toFixed(2)}%`;
    fighters[slot].style.setProperty?.(
      "--distance-scale",
      scales[slot].toFixed(2)
    );
  }

  function reset() {
    positions.player = RESET_POSITIONS.player;
    positions.opponent = RESET_POSITIONS.opponent;
    scales.player = SCALE_BY_DISTANCE.medium;
    scales.opponent = SCALE_BY_DISTANCE.medium;
    apply("player");
    apply("opponent");
  }

  function presentMovement({ result, actorSlot }) {
    if (!result?.ok || result.outcome !== "moved") {
      return Object.freeze({ status: "ignored" });
    }
    if (actorSlot !== "player" && actorSlot !== "opponent") {
      throw new RangeError(`Unknown actor slot: ${actorSlot}`);
    }

    const distanceEvent = result.events.find(
      (item) => item.type === "distance-changed"
    );
    if (!distanceEvent) {
      throw new Error("movement result has no distance-changed event");
    }

    const otherSlot = actorSlot === "player" ? "opponent" : "player";
    const separation = separationFor(distanceEvent.to);

    const rawTarget =
      actorSlot === "player"
        ? positions[otherSlot] - separation
        : positions[otherSlot] + separation;

    positions[actorSlot] = canonicalPosition(
      clamp(rawTarget, minX, maxX)
    );
    scales[actorSlot] = SCALE_BY_DISTANCE[distanceEvent.to];

    apply(actorSlot);

    return Object.freeze({
      status: "moved",
      actorSlot,
      from: distanceEvent.from,
      to: distanceEvent.to,
      x: positions[actorSlot],
      scale: scales[actorSlot],
      separation,
      stationarySlot: otherSlot,
      stationaryX: positions[otherSlot],
      stationaryScale: scales[otherSlot]
    });
  }

  reset();

  return Object.freeze({
    presentMovement,
    reset,
    snapshot() {
      return Object.freeze({
        player: positions.player,
        opponent: positions.opponent,
        playerScale: scales.player,
        opponentScale: scales.opponent
      });
    }
  });
}
