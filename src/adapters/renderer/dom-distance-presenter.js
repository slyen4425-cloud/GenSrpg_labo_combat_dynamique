const SCENE_BY_DISTANCE = Object.freeze({
  short: Object.freeze({ separation: 0.38, scale: 1.00 }),
  medium: Object.freeze({ separation: 0.54, scale: 0.96 }),
  long: Object.freeze({ separation: 0.68, scale: 0.90 })
});

const RESET_POSITIONS = Object.freeze({
  player: 0.23,
  opponent: 0.77
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createDomDistancePresenter({
  fighters,
  minX = 0.14,
  maxX = 0.86
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
    player: SCENE_BY_DISTANCE.medium.scale,
    opponent: SCENE_BY_DISTANCE.medium.scale
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
    scales.player = SCENE_BY_DISTANCE.medium.scale;
    scales.opponent = SCENE_BY_DISTANCE.medium.scale;
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

    const scene = SCENE_BY_DISTANCE[distanceEvent.to];
    if (!scene) {
      throw new RangeError(`Unsupported visual distance: ${distanceEvent.to}`);
    }

    const otherSlot = actorSlot === "player" ? "opponent" : "player";
    const direction = actorSlot === "player" ? -1 : 1;

    positions[actorSlot] = clamp(
      positions[otherSlot] + direction * scene.separation,
      minX,
      maxX
    );
    scales[actorSlot] = scene.scale;

    apply(actorSlot);

    return Object.freeze({
      status: "moved",
      actorSlot,
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
