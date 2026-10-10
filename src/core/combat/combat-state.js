import { assertCombatDistance } from "./distance.js";
import {
  normalizeStatEffectRulesByIdV1
} from "../../contracts/stat-effect-rules-v1.js";
import {
  normalizeStatusEffectRuntimeInstanceV1
} from "./status-effect-instance-v1.js";
import {
  advanceEnergyTicks,
  normalizeChargeTimeEffect
} from "./combat-timing.js";

function finiteNonNegative(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(`${field} must be a non-negative finite number`);
  }
  return number;
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new RangeError(`${field} must be a finite number`);
  }
  return number;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(
    object,
    key
  );
}

function normalizePercentByChannel(
  input,
  field,
  { allowSigned = false } = {}
) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new TypeError(
      field + " must be an object"
    );
  }

  const output = {};
  for (const [channelRaw, value] of Object.entries(input)) {
    const channel = String(channelRaw ?? "").trim();
    if (!channel) {
      throw new TypeError(
        field + " key must be non-empty"
      );
    }
    output[channel] = (
      allowSigned
        ? finiteNumber
        : finiteNonNegative
    )(
      value,
      field + "." + channel
    );
  }
  return Object.freeze(output);
}

function normalizeStatValuesById(input, field) {
  if (input == null) {
    return Object.freeze({});
  }
  if (
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new TypeError(
      field + " must be an object"
    );
  }

  const output = {};
  for (const [statIdRaw, value] of Object.entries(input)) {
    const statId = String(statIdRaw ?? "").trim();
    if (!statId) {
      throw new TypeError(
        field + " key must be non-empty"
      );
    }
    output[statId] = finiteNonNegative(
      value,
      field + "." + statId
    );
  }
  return Object.freeze(output);
}

function normalizeStatusEffects(input, fighterId) {
  const list = input ?? [];
  if (!Array.isArray(list)) {
    throw new TypeError(
      fighterId + ".statusEffects must be an array"
    );
  }

  const normalized = list.map(
    (entry, index) =>
      normalizeStatusEffectRuntimeInstanceV1(
        entry,
        fighterId +
          ".statusEffects[" +
          index +
          "]"
      )
  );

  const ids = normalized.map(
    (entry) => entry.definition.id
  );
  if (new Set(ids).size !== ids.length) {
    throw new RangeError(
      fighterId +
        ".statusEffects must not contain duplicate definition ids"
    );
  }

  return Object.freeze(normalized);
}

function normalizeSkillCooldowns(input, fighterId) {
  if (input == null) {
    return Object.freeze({});
  }
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError(`${fighterId}.skillCooldowns must be an object`);
  }

  const cooldowns = {};
  for (const [skillIdRaw, readyAtRaw] of Object.entries(input)) {
    const skillId = String(skillIdRaw ?? "").trim();
    if (!skillId) {
      throw new TypeError(`${fighterId}.skillCooldowns key must be non-empty`);
    }
    cooldowns[skillId] = finiteNonNegative(
      readyAtRaw,
      `${fighterId}.skillCooldowns.${skillId}`
    );
  }
  return Object.freeze(cooldowns);
}

function normalizeSkillUseCounts(input, fighterId) {
  if (input == null) {
    return Object.freeze({});
  }
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError(
      `${fighterId}.skillUseCounts must be an object`
    );
  }

  const counts = {};
  for (const [skillIdRaw, countRaw] of Object.entries(input)) {
    const skillId = String(skillIdRaw ?? "").trim();
    if (!skillId) {
      throw new TypeError(
        `${fighterId}.skillUseCounts key must be non-empty`
      );
    }
    const count = Number(countRaw);
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError(
        `${fighterId}.skillUseCounts.${skillId} must be a non-negative integer`
      );
    }
    counts[skillId] = count;
  }
  return Object.freeze(counts);
}

function normalizeFighter(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("fighter must be an object");
  }

  const id = String(input.id ?? "").trim();
  if (!id) {
    throw new TypeError("fighter.id must be a non-empty string");
  }

  const maxHp = finiteNonNegative(input.maxHp ?? 100, `${id}.maxHp`);
  const hp = finiteNonNegative(
    input.initialHp ?? input.hp ?? maxHp,
    `${id}.initialHp`
  );
  if (hp > maxHp) {
    throw new RangeError(`${id}.initialHp cannot exceed maxHp`);
  }

  const maxEnergy = finiteNonNegative(input.maxEnergy, `${id}.maxEnergy`);
  const energy = finiteNonNegative(
    input.initialEnergy ?? input.energy ?? 0,
    `${id}.initialEnergy`
  );
  if (energy > maxEnergy) {
    throw new RangeError(`${id}.initialEnergy cannot exceed maxEnergy`);
  }

  const effects = (input.chargeTimeEffects ?? []).map((effect) =>
    normalizeChargeTimeEffect(effect, effect.appliedAtMs ?? 0)
  );

  const output = {
    id,
    maxHp,
    hp,
    maxEnergy,
    energy,
    energyChargeAmount: finiteNonNegative(
      input.energyChargeAmount ?? 1,
      `${id}.energyChargeAmount`
    ),
    energyChargeIntervalMs: finiteNonNegative(
      input.energyChargeIntervalMs ?? 2000,
      `${id}.energyChargeIntervalMs`
    ),
    energyChargeProgressMs: finiteNonNegative(
      input.energyChargeProgressMs ?? 0,
      `${id}.energyChargeProgressMs`
    ),
    movementEnergyPerStep: finiteNonNegative(
      input.movementEnergyPerStep ?? 0,
      `${id}.movementEnergyPerStep`
    ),
    damageDealtTotal: finiteNonNegative(
      input.damageDealtTotal ?? 0,
      `${id}.damageDealtTotal`
    ),
    damageTakenTotal: finiteNonNegative(
      input.damageTakenTotal ?? 0,
      `${id}.damageTakenTotal`
    ),
    knockoutsTotal: finiteNonNegative(
      input.knockoutsTotal ?? 0,
      `${id}.knockoutsTotal`
    ),
    chargeTimeModifierPct: finiteNumber(
      input.chargeTimeModifierPct ?? 0,
      `${id}.chargeTimeModifierPct`
    ),
    approachTimeModifierPct: finiteNumber(
      input.approachTimeModifierPct ?? 0,
      `${id}.approachTimeModifierPct`
    ),
    chargeTimeEffects: Object.freeze(effects),
    skillCooldowns: normalizeSkillCooldowns(
      input.skillCooldowns,
      id
    ),
    skillUseCounts: normalizeSkillUseCounts(
      input.skillUseCounts,
      id
    ),
    statusEffects: normalizeStatusEffects(
      input.statusEffects,
      id
    ),
    statEffectRulesById:
      normalizeStatEffectRulesByIdV1(
        input.statEffectRulesById,
        id + ".statEffectRulesById"
      ),
    statValuesById:
      normalizeStatValuesById(
        input.statValuesById,
        id + ".statValuesById"
      ),
    damageReductionPct: finiteNonNegative(
      input.damageReductionPct ?? 0,
      id + ".damageReductionPct"
    )
  };

  if (hasOwn(input, "damagePctByChannel")) {
    output.damagePctByChannel =
      normalizePercentByChannel(
        input.damagePctByChannel,
        `${id}.damagePctByChannel`
      );
  }

  if (hasOwn(input, "resistancePctByChannel")) {
    output.resistancePctByChannel =
      normalizePercentByChannel(
        input.resistancePctByChannel,
        `${id}.resistancePctByChannel`,
        { allowSigned: true }
      );
  }

  return Object.freeze(output);
}

export function createCombatState({
  distance = "medium",
  fighters,
  elapsedMs = 0
}) {
  assertCombatDistance(distance);
  if (!Array.isArray(fighters) || fighters.length < 2) {
    throw new TypeError("fighters must contain at least two fighters");
  }

  const entries = fighters.map((fighter) => {
    const normalized = normalizeFighter(fighter);
    return [normalized.id, normalized];
  });

  return Object.freeze({
    distance,
    elapsedMs: finiteNonNegative(elapsedMs, "elapsedMs"),
    fighters: Object.freeze(Object.fromEntries(entries)),
    persistentZones: Object.freeze([]),
    scheduledEffects: Object.freeze([])
  });
}

export function withScheduledEffects(
  state,
  scheduledEffects
) {
  if (!Array.isArray(scheduledEffects)) {
    throw new TypeError(
      "scheduledEffects must be an array"
    );
  }

  return Object.freeze({
    ...state,
    scheduledEffects: Object.freeze([
      ...scheduledEffects
    ])
  });
}

export function withPersistentZones(
  state,
  persistentZones
) {
  if (!Array.isArray(persistentZones)) {
    throw new TypeError(
      "persistentZones must be an array"
    );
  }

  return Object.freeze({
    ...state,
    persistentZones: Object.freeze([
      ...persistentZones
    ])
  });
}

export function withFighterEnergy(state, fighterId, energy) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }

  const nextEnergy = Math.max(0, Math.min(fighter.maxEnergy, Number(energy)));
  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [fighterId]: Object.freeze({
        ...fighter,
        energy: nextEnergy
      })
    })
  });
}

export function skillCooldownRemainingMs(
  state,
  fighterId,
  skillId
) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }
  const id = String(skillId ?? "").trim();
  if (!id) {
    throw new TypeError("skillId must be a non-empty string");
  }
  const readyAtMs = fighter.skillCooldowns[id];
  if (readyAtMs == null) {
    return 0;
  }
  return Math.max(0, readyAtMs - state.elapsedMs);
}

export function withSkillCooldown(
  state,
  fighterId,
  skillId,
  cooldownMs
) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }
  const id = String(skillId ?? "").trim();
  if (!id) {
    throw new TypeError("skillId must be a non-empty string");
  }
  const duration = finiteNonNegative(cooldownMs, "cooldownMs");
  if (duration === 0) {
    return state;
  }

  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [fighterId]: Object.freeze({
        ...fighter,
        skillCooldowns: Object.freeze({
          ...fighter.skillCooldowns,
          [id]: state.elapsedMs + duration
        })
      })
    })
  });
}


export function skillUseCount(
  state,
  fighterId,
  skillId
) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }
  const id = String(skillId ?? "").trim();
  if (!id) {
    throw new TypeError(
      "skillId must be a non-empty string"
    );
  }
  return fighter.skillUseCounts[id] ?? 0;
}

export function withSkillUseRecorded(
  state,
  fighterId,
  skillId
) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }
  const id = String(skillId ?? "").trim();
  if (!id) {
    throw new TypeError(
      "skillId must be a non-empty string"
    );
  }

  const current = fighter.skillUseCounts[id] ?? 0;
  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [fighterId]: Object.freeze({
        ...fighter,
        skillUseCounts: Object.freeze({
          ...fighter.skillUseCounts,
          [id]: current + 1
        })
      })
    })
  });
}

export function withFighterHp(state, fighterId, hp) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }

  const nextHp = Math.max(0, Math.min(fighter.maxHp, Number(hp)));
  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [fighterId]: Object.freeze({
        ...fighter,
        hp: nextHp
      })
    })
  });
}

export function recordFighterDamage(
  state,
  {
    sourceActorId,
    targetActorId,
    amount
  }
) {
  const source = state.fighters[sourceActorId];
  const target = state.fighters[targetActorId];

  if (!source) {
    throw new RangeError(
      `Unknown fighter: ${sourceActorId}`
    );
  }
  if (!target) {
    throw new RangeError(
      `Unknown fighter: ${targetActorId}`
    );
  }

  const damage = finiteNonNegative(
    amount,
    "damage amount"
  );
  if (damage === 0) {
    return state;
  }

  if (sourceActorId === targetActorId) {
    return Object.freeze({
      ...state,
      fighters: Object.freeze({
        ...state.fighters,
        [sourceActorId]: Object.freeze({
          ...source,
          damageDealtTotal:
            source.damageDealtTotal + damage,
          damageTakenTotal:
            source.damageTakenTotal + damage
        })
      })
    });
  }

  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [sourceActorId]: Object.freeze({
        ...source,
        damageDealtTotal:
          source.damageDealtTotal + damage
      }),
      [targetActorId]: Object.freeze({
        ...target,
        damageTakenTotal:
          target.damageTakenTotal + damage
      })
    })
  });
}

export function recordFighterKnockout(
  state,
  sourceActorId,
  targetActorId
) {
  const source = state.fighters[sourceActorId];
  const target = state.fighters[targetActorId];

  if (!source) {
    throw new RangeError(
      `Unknown fighter: ${sourceActorId}`
    );
  }
  if (!target) {
    throw new RangeError(
      `Unknown fighter: ${targetActorId}`
    );
  }
  if (sourceActorId === targetActorId) {
    return state;
  }

  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [sourceActorId]: Object.freeze({
        ...source,
        knockoutsTotal:
          source.knockoutsTotal + 1
      })
    })
  });
}

export function withFighterStatusEffects(
  state,
  fighterId,
  statusEffects
) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(
      `Unknown fighter: ${fighterId}`
    );
  }

  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [fighterId]: Object.freeze({
        ...fighter,
        statusEffects:
          normalizeStatusEffects(
            statusEffects,
            fighterId
          )
      })
    })
  });
}

export function replaceFighter(state, fighterId, input) {
  if (!state.fighters[fighterId]) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }

  const normalized = normalizeFighter({
    ...input,
    id: fighterId
  });

  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [fighterId]: normalized
    })
  });
}

export function withDistance(state, distance) {
  assertCombatDistance(distance);
  return Object.freeze({ ...state, distance });
}

export function addChargeTimeEffect(state, fighterId, effect) {
  const fighter = state.fighters[fighterId];
  if (!fighter) {
    throw new RangeError(`Unknown fighter: ${fighterId}`);
  }

  const normalized = normalizeChargeTimeEffect(effect, state.elapsedMs);

  return Object.freeze({
    ...state,
    fighters: Object.freeze({
      ...state.fighters,
      [fighterId]: Object.freeze({
        ...fighter,
        chargeTimeEffects: Object.freeze([
          ...fighter.chargeTimeEffects.filter((item) => item.id !== normalized.id),
          normalized
        ])
      })
    })
  });
}

export function advanceCombatTime(state, deltaMs, { energyStatusAtStart = {} } = {}) {
  const delta = finiteNonNegative(deltaMs, "deltaMs");
  if (delta === 0) {
    return state;
  }

  const elapsedMs = state.elapsedMs + delta;
  const fighters = {};

  for (const fighter of Object.values(state.fighters)) {
    // StatusRuntime may have discarded statuses expiring inside this advance.
    // Retain their original lifetime only for energy tick evaluation, while
    // newly applied statuses remain gated by their appliedAtMs timestamp.
    const prior = energyStatusAtStart[fighter.id] ?? [];
    const current = fighter.statusEffects.filter(
      instance => instance.definition.kind === "energy_regen_modifier"
    );
    const energyStatusEffects = [
      ...prior.map(old => {
        const replacement = current.find(instance =>
          instance.definition.id === old.definition.id &&
          instance.appliedAtMs !== old.appliedAtMs
        );
        return replacement && old.expiresAtMs !== null
          ? { ...old, expiresAtMs: Math.min(old.expiresAtMs, replacement.appliedAtMs) }
          : old;
      }).filter(old => !current.some(instance =>
        instance.definition.id === old.definition.id &&
        instance.appliedAtMs === old.appliedAtMs
      )),
      // Latest refresh wins when the same ID keeps its original appliedAtMs.
      ...current
    ];
    const charged = advanceEnergyTicks({
      energy: fighter.energy,
      maxEnergy: fighter.maxEnergy,
      progressMs: fighter.energyChargeProgressMs,
      amount: fighter.energyChargeAmount,
      intervalMs: fighter.energyChargeIntervalMs,
      deltaMs: delta,
      atMs: state.elapsedMs,
      energyStatusEffects
    });

    fighters[fighter.id] = Object.freeze({
      ...fighter,
      energy: charged.energy,
      energyChargeProgressMs: charged.progressMs,
      chargeTimeEffects: Object.freeze(
        fighter.chargeTimeEffects.filter((effect) => effect.expiresAtMs > elapsedMs)
      ),
      skillCooldowns: Object.freeze(
        Object.fromEntries(
          Object.entries(fighter.skillCooldowns).filter(
            ([, readyAtMs]) => readyAtMs > elapsedMs
          )
        )
      )
    });
  }

  return Object.freeze({
    ...state,
    elapsedMs,
    fighters: Object.freeze(fighters)
  });
}
