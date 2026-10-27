function finiteHp(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(
      field + " must be a non-negative finite number"
    );
  }
  return number;
}

function fighterMap(state, field) {
  if (
    !state ||
    typeof state !== "object" ||
    Array.isArray(state)
  ) {
    throw new TypeError(field + " must be an object");
  }
  if (
    !state.fighters ||
    typeof state.fighters !== "object" ||
    Array.isArray(state.fighters)
  ) {
    throw new TypeError(
      field + ".fighters must be an object"
    );
  }
  return state.fighters;
}

export function combatHealthDeltaEventsV1(
  previousState,
  nextState
) {
  const previousFighters =
    fighterMap(previousState, "previousState");
  const nextFighters =
    fighterMap(nextState, "nextState");
  const atMs = Number(nextState.elapsedMs ?? 0);

  if (!Number.isFinite(atMs) || atMs < 0) {
    throw new RangeError(
      "nextState.elapsedMs must be a non-negative finite number"
    );
  }

  const events = [];

  for (
    const [actorId, nextFighter] of
    Object.entries(nextFighters)
  ) {
    const previousFighter =
      previousFighters[actorId] ?? null;
    if (!previousFighter) {
      continue;
    }

    const hpBefore = finiteHp(
      previousFighter.hp,
      actorId + ".hpBefore"
    );
    const hpAfter = finiteHp(
      nextFighter.hp,
      actorId + ".hpAfter"
    );
    const delta = hpAfter - hpBefore;

    if (delta === 0) {
      continue;
    }

    events.push(Object.freeze({
      type: "health-delta",
      kind:
        delta < 0
          ? "damage"
          : "heal",
      actorId,
      amount: Math.abs(delta),
      delta,
      hpBefore,
      hpAfter,
      atMs
    }));
  }

  return Object.freeze(events);
}
