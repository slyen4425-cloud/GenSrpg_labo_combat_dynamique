const POSITION_BY_SLOT_AND_DISTANCE = Object.freeze({
  player: Object.freeze({
    long: 0.18,
    medium: 0.28,
    short: 0.42
  }),
  opponent: Object.freeze({
    short: 0.58,
    medium: 0.72,
    long: 0.82
  })
});

const SCALE_BY_DISTANCE = Object.freeze({
  short: 1.00,
  medium: 0.96,
  long: 0.90
});

function positionFor(slot, distance) {
  const position = POSITION_BY_SLOT_AND_DISTANCE[slot]?.[distance];
  if (!Number.isFinite(position)) {
    throw new RangeError(`Unsupported visual slot/distance: ${slot}/${distance}`);
  }
  return position;
}

function scaleFor(distance) {
  const scale = SCALE_BY_DISTANCE[distance];
  if (!Number.isFinite(scale)) {
    throw new RangeError(`Unsupported visual distance: ${distance}`);
  }
  return scale;
}

export function createDomDistancePresenter({ fighters }) {
  if (!fighters?.player?.style || !fighters?.opponent?.style) {
    throw new TypeError("fighters.player and fighters.opponent with style are required");
  }

  const positions = {
    player: positionFor("player", "medium"),
    opponent: positionFor("opponent", "medium")
  };

  const scales = {
    player: scaleFor("medium"),
    opponent: scaleFor("medium")
  };

  function apply(slot) {
    fighters[slot].style.left = `${(positions[slot] * 100).toFixed(2)}%`;
    fighters[slot].style.setProperty?.(
      "--distance-scale",
      scales[slot].toFixed(2)
    );
  }

  function reset() {
    positions.player = positionFor("player", "medium");
    positions.opponent = positionFor("opponent", "medium");
    scales.player = scaleFor("medium");
    scales.opponent = scaleFor("medium");
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

    positions[actorSlot] = positionFor(actorSlot, distanceEvent.to);
    scales[actorSlot] = scaleFor(distanceEvent.to);
    apply(actorSlot);

    return Object.freeze({
      status: "moved",
      actorSlot,
      from: distanceEvent.from,
      to: distanceEvent.to,
      x: positions[actorSlot],
      scale: scales[actorSlot],
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
