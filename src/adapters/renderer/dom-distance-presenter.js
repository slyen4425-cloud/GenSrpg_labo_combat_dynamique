const SEPARATION_BY_DISTANCE = Object.freeze({
  short: 0.44,
  medium: 0.60,
  long: 0.78
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createDomDistancePresenter({
  fighters,
  minX = 0.05,
  maxX = 0.95
}) {
  if (
    !fighters?.player?.style ||
    !fighters?.opponent?.style
  ) {
    throw new TypeError("fighters.player and fighters.opponent with style are required");
  }

  const positions = {
    player: 0.2,
    opponent: 0.8
  };

  function apply(slot) {
    fighters[slot].style.left = `${(positions[slot] * 100).toFixed(2)}%`;
  }

  function reset() {
    positions.player = 0.2;
    positions.opponent = 0.8;
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

    const separation = SEPARATION_BY_DISTANCE[distanceEvent.to];
    if (!Number.isFinite(separation)) {
      throw new RangeError(`Unsupported visual distance: ${distanceEvent.to}`);
    }

    const otherSlot = actorSlot === "player" ? "opponent" : "player";
    const direction = actorSlot === "player" ? -1 : 1;
    positions[actorSlot] = clamp(
      positions[otherSlot] + direction * separation,
      minX,
      maxX
    );

    apply(actorSlot);

    return Object.freeze({
      status: "moved",
      actorSlot,
      x: positions[actorSlot],
      stationarySlot: otherSlot,
      stationaryX: positions[otherSlot]
    });
  }

  reset();

  return Object.freeze({
    presentMovement,
    reset,
    snapshot() {
      return Object.freeze({ ...positions });
    }
  });
}
