const ANCHOR_BY_SLOT_AND_DISTANCE = Object.freeze({
  player: Object.freeze({
    long: Object.freeze({ x: 0.16, y: 0.72 }),
    medium: Object.freeze({ x: 0.28, y: 0.64 }),
    short: Object.freeze({ x: 0.39, y: 0.56 })
  }),
  opponent: Object.freeze({
    short: Object.freeze({ x: 0.61, y: 0.40 }),
    medium: Object.freeze({ x: 0.72, y: 0.32 }),
    long: Object.freeze({ x: 0.84, y: 0.24 })
  })
});

const SCALE_BY_DISTANCE = Object.freeze({
  short: 1.00,
  medium: 0.96,
  long: 0.90
});

function anchorFor(slot, distance) {
  const anchor = ANCHOR_BY_SLOT_AND_DISTANCE[slot]?.[distance];
  if (
    !anchor ||
    !Number.isFinite(anchor.x) ||
    !Number.isFinite(anchor.y)
  ) {
    throw new RangeError(
      `Unsupported visual slot/distance: ${slot}/${distance}`
    );
  }
  return anchor;
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
    throw new TypeError(
      "fighters.player and fighters.opponent with style are required"
    );
  }

  const anchors = {
    player: { ...anchorFor("player", "medium") },
    opponent: { ...anchorFor("opponent", "medium") }
  };

  const scales = {
    player: scaleFor("medium"),
    opponent: scaleFor("medium")
  };

  function apply(slot) {
    fighters[slot].style.left =
      `${(anchors[slot].x * 100).toFixed(2)}%`;
    fighters[slot].style.top =
      `${(anchors[slot].y * 100).toFixed(2)}%`;
    fighters[slot].style.setProperty?.(
      "--distance-scale",
      scales[slot].toFixed(2)
    );
  }

  function reset() {
    anchors.player = { ...anchorFor("player", "medium") };
    anchors.opponent = { ...anchorFor("opponent", "medium") };
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

    const otherSlot =
      actorSlot === "player" ? "opponent" : "player";

    anchors[actorSlot] = {
      ...anchorFor(actorSlot, distanceEvent.to)
    };
    scales[actorSlot] = scaleFor(distanceEvent.to);
    apply(actorSlot);

    return Object.freeze({
      status: "moved",
      actorSlot,
      from: distanceEvent.from,
      to: distanceEvent.to,
      x: anchors[actorSlot].x,
      y: anchors[actorSlot].y,
      scale: scales[actorSlot],
      stationarySlot: otherSlot,
      stationaryX: anchors[otherSlot].x,
      stationaryY: anchors[otherSlot].y,
      stationaryScale: scales[otherSlot]
    });
  }

  reset();

  return Object.freeze({
    presentMovement,
    reset,
    snapshot() {
      return Object.freeze({
        player: anchors.player.x,
        playerY: anchors.player.y,
        opponent: anchors.opponent.x,
        opponentY: anchors.opponent.y,
        playerScale: scales.player,
        opponentScale: scales.opponent
      });
    }
  });
}
