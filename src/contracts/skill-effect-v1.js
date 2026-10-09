import {
  normalizeStatusEffectV1
} from "./status-effect-v1.js";

export const SKILL_EFFECT_V1_KINDS = Object.freeze([
  "damage",
  "heal",
  "energy_restore",
  "energy_drain",
  "apply_status",
  "cleanse",
  "dispel",
  "persistent_zone",
  "scheduled_effect"
]);

export const SKILL_EFFECT_V1_TARGET_SCOPES =
  Object.freeze([
    "target",
    "self",
    "all_enemies",
    "all_allies",
    "all_except_self"
  ]);

const KIND_SET = new Set(SKILL_EFFECT_V1_KINDS);
const TARGET_SCOPE_SET = new Set(
  SKILL_EFFECT_V1_TARGET_SCOPES
);

const COMMON_FIELDS = new Set([
  "kind",
  "targetScope"
]);

const FIELDS_BY_KIND = Object.freeze({
  damage: new Set([
    ...COMMON_FIELDS,
    "amount",
    "channel",
    "ignoreResistancePct",
    "ignoreDamageReductionPct"
  ]),
  heal: new Set([
    ...COMMON_FIELDS,
    "amount"
  ]),
  energy_restore: new Set([
    ...COMMON_FIELDS,
    "amount"
  ]),
  energy_drain: new Set([
    ...COMMON_FIELDS,
    "amount"
  ]),
  apply_status: new Set([
    ...COMMON_FIELDS,
    "status"
  ]),
  cleanse: new Set([
    ...COMMON_FIELDS,
    "statusTags"
  ]),
  dispel: new Set([
    ...COMMON_FIELDS,
    "statusTags"
  ]),
  persistent_zone: new Set([
    ...COMMON_FIELDS,
    "zoneId",
    "radius",
    "durationMs",
    "tickIntervalMs",
    "reactivation",
    "maxActivations",
    "radiusGrowthSteps",
    "tickEffect",
    "statusBehavior"
  ]),
  scheduled_effect: new Set([
    ...COMMON_FIELDS,
    "trigger",
    "effects"
  ])
});

function objectValue(value, field) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(field + " must be an object");
  }
  return value;
}

function requiredString(value, field) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new TypeError(
      field + " must be a non-empty string"
    );
  }
  return value.trim();
}

function nonNegativeNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(
      field +
        " must be a non-negative finite number"
    );
  }
  return number;
}

function penetrationPercentV1(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100) {
    throw new RangeError(field + " must be between 0 and 100");
  }
  return number;
}

function positiveNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(
      field +
        " must be a positive finite number"
    );
  }
  return number;
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(
      field +
        " must be an integer greater than or equal to 1"
    );
  }
  return number;
}

function nonNegativeInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new RangeError(
      field +
        " must be a non-negative integer"
    );
  }
  return number;
}

function stringArray(value, field) {
  const list = value ?? [];
  if (!Array.isArray(list)) {
    throw new TypeError(field + " must be an array");
  }
  return Object.freeze([
    ...new Set(
      list.map((entry, index) =>
        requiredString(
          entry,
          field + "[" + index + "]"
        )
      )
    )
  ]);
}

function assertKnownFields(
  value,
  allowed,
  field
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        field + " contains unknown field: " + key
      );
    }
  }
}

export function normalizeSkillEffectV1(input) {
  const value = objectValue(
    input,
    "SkillEffectV1"
  );

  const kind = requiredString(
    value.kind,
    "SkillEffectV1.kind"
  );
  if (!KIND_SET.has(kind)) {
    throw new RangeError(
      "Unsupported SkillEffectV1.kind: " + kind
    );
  }

  assertKnownFields(
    value,
    FIELDS_BY_KIND[kind],
    "SkillEffectV1"
  );

  const targetScope = requiredString(
    value.targetScope,
    "SkillEffectV1.targetScope"
  );
  if (!TARGET_SCOPE_SET.has(targetScope)) {
    throw new RangeError(
      "Unsupported SkillEffectV1.targetScope: " +
        targetScope
    );
  }

  const output = {
    kind,
    targetScope
  };

  if (
    kind === "damage" ||
    kind === "heal" ||
    kind === "energy_restore" ||
    kind === "energy_drain"
  ) {
    output.amount = nonNegativeNumber(
      value.amount,
      "SkillEffectV1.amount"
    );
  }

  if (kind === "damage") {
    output.channel =
      value.channel == null
        ? null
        : requiredString(
            value.channel,
            "SkillEffectV1.channel"
          );
    for (const key of [
      "ignoreResistancePct",
      "ignoreDamageReductionPct"
    ]) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        output[key] = penetrationPercentV1(
          value[key],
          "SkillEffectV1." + key
        );
      }
    }
  }

  if (kind === "apply_status") {
    output.status = normalizeStatusEffectV1(
      value.status
    );
  }

  if (
    kind === "cleanse" ||
    kind === "dispel"
  ) {
    output.statusTags = stringArray(
      value.statusTags,
      "SkillEffectV1.statusTags"
    );
  }

  if (kind === "scheduled_effect") {
    if (targetScope !== "target") {
      throw new RangeError(
        "scheduled_effect targetScope must be target in V1"
      );
    }

    const trigger = objectValue(
      value.trigger,
      "SkillEffectV1.trigger"
    );
    for (const key of Object.keys(trigger)) {
      if (!["type", "delayMs"].includes(key)) {
        throw new TypeError(
          "SkillEffectV1.trigger contains unknown field: " +
            key
        );
      }
    }

    const triggerType = requiredString(
      trigger.type,
      "SkillEffectV1.trigger.type"
    );
    if (triggerType !== "after_ms") {
      throw new RangeError(
        "Unsupported SkillEffectV1.trigger.type: " +
          triggerType
      );
    }

    const delayMs = nonNegativeNumber(
      trigger.delayMs,
      "SkillEffectV1.trigger.delayMs"
    );

    if (!Array.isArray(value.effects)) {
      throw new TypeError(
        "SkillEffectV1.effects must be an array"
      );
    }
    if (value.effects.length === 0) {
      throw new TypeError(
        "scheduled_effect effects must contain at least one effect"
      );
    }

    const nestedEffects = Object.freeze(
      value.effects.map((entry) =>
        normalizeSkillEffectV1(entry)
      )
    );

    for (const nested of nestedEffects) {
      if (
        nested.kind === "scheduled_effect" ||
        nested.kind === "persistent_zone"
      ) {
        throw new RangeError(
          "scheduled_effect cannot contain " +
            nested.kind +
            " in V1"
        );
      }
    }

    output.trigger = Object.freeze({
      type: triggerType,
      delayMs
    });
    output.effects = nestedEffects;
  }

  if (kind === "persistent_zone") {
    output.zoneId = requiredString(
      value.zoneId,
      "SkillEffectV1.zoneId"
    );

    output.radius = requiredString(
      value.radius,
      "SkillEffectV1.radius"
    );
    if (
      !["short", "medium", "long"].includes(
        output.radius
      )
    ) {
      throw new RangeError(
        "Unsupported SkillEffectV1.radius: " +
          output.radius
      );
    }

    output.durationMs = positiveNumber(
      value.durationMs,
      "SkillEffectV1.durationMs"
    );
    output.tickIntervalMs = positiveNumber(
      value.tickIntervalMs,
      "SkillEffectV1.tickIntervalMs"
    );

    output.reactivation = requiredString(
      value.reactivation ?? "refresh",
      "SkillEffectV1.reactivation"
    );
    if (
      !["refresh", "reinforce"].includes(
        output.reactivation
      )
    ) {
      throw new RangeError(
        "Unsupported SkillEffectV1.reactivation: " +
          output.reactivation
      );
    }

    output.maxActivations = positiveInteger(
      value.maxActivations ?? 1,
      "SkillEffectV1.maxActivations"
    );
    output.radiusGrowthSteps =
      nonNegativeInteger(
        value.radiusGrowthSteps ?? 0,
        "SkillEffectV1.radiusGrowthSteps"
      );

    output.tickEffect =
      normalizeSkillEffectV1(
        objectValue(
          value.tickEffect,
          "SkillEffectV1.tickEffect"
        )
      );

    if (
      output.tickEffect.kind ===
      "persistent_zone"
    ) {
      throw new RangeError(
        "persistent_zone cannot contain another persistent_zone"
      );
    }

    if (!["damage", "apply_status"].includes(output.tickEffect.kind)) {
      throw new RangeError("persistent_zone tickEffect must be damage or apply_status");
    }
    if (output.tickEffect.kind === "apply_status") {
      output.statusBehavior = requiredString(
        value.statusBehavior ?? "while_inside",
        "SkillEffectV1.statusBehavior"
      );
      if (!["while_inside", "on_enter"].includes(output.statusBehavior)) {
        throw new RangeError("Unsupported SkillEffectV1.statusBehavior: " + output.statusBehavior);
      }
    } else if (value.statusBehavior != null) {
      throw new TypeError("SkillEffectV1.statusBehavior is only valid for status zones");
    }
  }

  return Object.freeze(output);
}
