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
  "dispel"
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
    "channel"
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

  return Object.freeze(output);
}
