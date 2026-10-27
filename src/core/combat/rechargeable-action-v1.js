function requiredId(value, field) {
  const id = String(value ?? "").trim();
  if (!id) {
    throw new TypeError(
      field + " must be a non-empty string"
    );
  }
  return id;
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (
    !Number.isInteger(number) ||
    number < 1
  ) {
    throw new RangeError(
      field + " must be a positive integer"
    );
  }
  return number;
}

function nonNegative(value, field) {
  const number = Number(value);
  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    throw new RangeError(
      field +
        " must be a non-negative finite number"
    );
  }
  return number;
}

function historyFor(
  state,
  actorId,
  actionId
) {
  return (
    state.rechargeableActions?.[
      actorId
    ]?.[actionId]?.spentAtMs ?? []
  );
}

function activeSpentAtMs({
  state,
  actorId,
  actionId,
  rechargeMs,
  atMs
}) {
  if (rechargeMs === 0) {
    return [];
  }
  return historyFor(
    state,
    actorId,
    actionId
  ).filter(
    (spentAtMs) =>
      spentAtMs + rechargeMs > atMs
  );
}

export function rechargeableActionAvailabilityV1({
  state,
  actorId,
  actionId,
  maxCharges,
  rechargeMs,
  atMs = state.elapsedMs
}) {
  const actor = requiredId(
    actorId,
    "actorId"
  );
  const action = requiredId(
    actionId,
    "actionId"
  );
  const maximum = positiveInteger(
    maxCharges,
    "maxCharges"
  );
  const recharge = nonNegative(
    rechargeMs,
    "rechargeMs"
  );
  const now = nonNegative(
    atMs,
    "atMs"
  );

  if (!state.fighters?.[actor]) {
    throw new RangeError(
      "Unknown fighter: " + actor
    );
  }

  const active = activeSpentAtMs({
    state,
    actorId: actor,
    actionId: action,
    rechargeMs: recharge,
    atMs: now
  });

  const charges = Math.max(
    0,
    maximum - active.length
  );
  const nextRechargeMs =
    active.length === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            ...active.map(
              (spentAtMs) =>
                spentAtMs + recharge
            )
          ) - now
        );

  return Object.freeze({
    actorId: actor,
    actionId: action,
    maxCharges: maximum,
    charges,
    rechargeMs: recharge,
    nextRechargeMs
  });
}

export function consumeRechargeableActionChargeV1({
  state,
  actorId,
  actionId,
  maxCharges,
  rechargeMs,
  atMs = state.elapsedMs
}) {
  const availability =
    rechargeableActionAvailabilityV1({
      state,
      actorId,
      actionId,
      maxCharges,
      rechargeMs,
      atMs
    });

  if (availability.charges <= 0) {
    return Object.freeze({
      ok: false,
      outcome: "no_charges",
      state,
      availability
    });
  }

  const active = activeSpentAtMs({
    state,
    actorId:
      availability.actorId,
    actionId:
      availability.actionId,
    rechargeMs:
      availability.rechargeMs,
    atMs
  });

  const nextActive =
    availability.rechargeMs === 0
      ? [Number(atMs)]
      : [...active, Number(atMs)];

  const actorActions = {
    ...(
      state.rechargeableActions?.[
        availability.actorId
      ] ?? {}
    ),
    [availability.actionId]:
      Object.freeze({
        spentAtMs:
          Object.freeze(nextActive)
      })
  };

  const nextState = Object.freeze({
    ...state,
    rechargeableActions:
      Object.freeze({
        ...(state.rechargeableActions ?? {}),
        [availability.actorId]:
          Object.freeze(actorActions)
      })
  });

  return Object.freeze({
    ok: true,
    outcome: "charge_consumed",
    state: nextState,
    availability:
      rechargeableActionAvailabilityV1({
        state: nextState,
        actorId:
          availability.actorId,
        actionId:
          availability.actionId,
        maxCharges:
          availability.maxCharges,
        rechargeMs:
          availability.rechargeMs,
        atMs
      })
  });
}


export function rechargeableActionWindowStatusV1({
  state,
  actorId,
  actionId,
  activeWindowMs,
  atMs = state.elapsedMs
}) {
  const actor = requiredId(
    actorId,
    "actorId"
  );
  const action = requiredId(
    actionId,
    "actionId"
  );
  const duration = nonNegative(
    activeWindowMs,
    "activeWindowMs"
  );
  const now = nonNegative(
    atMs,
    "atMs"
  );

  if (!state.fighters?.[actor]) {
    throw new RangeError(
      "Unknown fighter: " + actor
    );
  }

  const spent = historyFor(
    state,
    actor,
    action
  ).filter(
    (spentAtMs) =>
      Number(spentAtMs) <= now
  );
  const activatedAtMs =
    spent.length === 0
      ? null
      : Math.max(
          ...spent.map(Number)
        );
  const activeUntilMs =
    activatedAtMs === null
      ? null
      : activatedAtMs + duration;
  const active =
    activatedAtMs !== null &&
    duration > 0 &&
    activeUntilMs > now;

  return Object.freeze({
    actorId: actor,
    actionId: action,
    activeWindowMs: duration,
    activatedAtMs,
    activeUntilMs,
    active,
    remainingMs:
      active
        ? Math.max(
            0,
            activeUntilMs - now
          )
        : 0
  });
}

export function activateRechargeableActionV1({
  state,
  actorId,
  actionId,
  maxCharges,
  rechargeMs,
  activeWindowMs,
  atMs = state.elapsedMs
}) {
  const before =
    rechargeableActionWindowStatusV1({
      state,
      actorId,
      actionId,
      activeWindowMs,
      atMs
    });

  if (before.active) {
    return Object.freeze({
      ok: false,
      outcome: "already_active",
      state,
      availability:
        rechargeableActionAvailabilityV1({
          state,
          actorId,
          actionId,
          maxCharges,
          rechargeMs,
          atMs
        }),
      window: before
    });
  }

  const consumed =
    consumeRechargeableActionChargeV1({
      state,
      actorId,
      actionId,
      maxCharges,
      rechargeMs,
      atMs
    });

  if (!consumed.ok) {
    return Object.freeze({
      ...consumed,
      window: before
    });
  }

  return Object.freeze({
    ...consumed,
    outcome: "activated",
    window:
      rechargeableActionWindowStatusV1({
        state: consumed.state,
        actorId,
        actionId,
        activeWindowMs,
        atMs
      })
  });
}
