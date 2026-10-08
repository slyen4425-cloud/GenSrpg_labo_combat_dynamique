import {
  normalizeSkillDefinition
} from "./skill-definition.js";

const GAME_OPTION_FIELDS =
  new Set(["dodge"]);
const DODGE_FIELDS =
  new Set([
    "enabled",
    "maxCharges",
    "rechargeMs",
    "activeWindowMs"
  ]);

function objectValue(value, field) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(
      field + " must be an object"
    );
  }
  return value;
}

function assertKnownFields(
  value,
  allowed,
  field
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        field +
          " contains unknown field: " +
          key
      );
    }
  }
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

function positiveFinite(value, field) {
  const number = Number(value);
  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    throw new RangeError(
      field +
        " must be a positive finite number"
    );
  }
  return number;
}

export const CAPTURE_GAME_OPTIONS_V1_DEFAULT =
  Object.freeze({
    dodge: Object.freeze({
      enabled: false,
      maxCharges: 1,
      rechargeMs: 30000,
      activeWindowMs: 250
    })
  });

export function normalizeCaptureGameOptionsV1(
  input = CAPTURE_GAME_OPTIONS_V1_DEFAULT
) {
  const value = objectValue(
    input,
    "CaptureGameOptionsV1"
  );
  assertKnownFields(
    value,
    GAME_OPTION_FIELDS,
    "CaptureGameOptionsV1"
  );

  const rawDodge =
    value.dodge ??
    CAPTURE_GAME_OPTIONS_V1_DEFAULT.dodge;
  const dodge = objectValue(
    rawDodge,
    "CaptureGameOptionsV1.dodge"
  );
  assertKnownFields(
    dodge,
    DODGE_FIELDS,
    "CaptureGameOptionsV1.dodge"
  );

  if (
    typeof dodge.enabled !== "boolean"
  ) {
    throw new TypeError(
      "CaptureGameOptionsV1.dodge.enabled must be boolean"
    );
  }

  return Object.freeze({
    dodge: Object.freeze({
      enabled: dodge.enabled,
      maxCharges: positiveInteger(
        dodge.maxCharges,
        "CaptureGameOptionsV1.dodge.maxCharges"
      ),
      rechargeMs: nonNegative(
        dodge.rechargeMs,
        "CaptureGameOptionsV1.dodge.rechargeMs"
      ),
      ...(
        Object.prototype.hasOwnProperty.call(
          dodge,
          "activeWindowMs"
        )
          ? {
              activeWindowMs: positiveFinite(
                dodge.activeWindowMs,
                "CaptureGameOptionsV1.dodge.activeWindowMs"
              )
            }
          : {}
      )
    })
  });
}

export function captureDodgeActiveWindowMsV1(
  input = CAPTURE_GAME_OPTIONS_V1_DEFAULT
) {
  const options =
    normalizeCaptureGameOptionsV1(input);
  return positiveFinite(
    options.dodge.activeWindowMs ??
      CAPTURE_GAME_OPTIONS_V1_DEFAULT.dodge
        .activeWindowMs,
    "CaptureGameOptionsV1.dodge.activeWindowMs"
  );
}

export function buildCaptureDodgeReactionSkillV1(
  input
) {
  const options =
    normalizeCaptureGameOptionsV1(input);
  if (!options.dodge.enabled) {
    return null;
  }

  return normalizeSkillDefinition({
    id: "capture-game-dodge",
    name: "Esquive",
    category: "defensive",
    form: "self",
    element: null,
    approachMode: "none",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    maxUsesPerCombat: null,
    allowedDistances: [
      "short",
      "medium",
      "long"
    ],
    targetRelations: ["self"],
    reaction: {
      evadeForms: [
        "contact",
        "projectile",
        "beam",
        "area",
        "aura"
      ],
      evadeApproaches: [
        "ground",
        "aerial",
        "teleport",
        "burrow"
      ]
    },
    effect: {
      damage: 0,
      heal: 0,
      interruptsPreparation: false,
      stunMs: 0,
      tags: []
    }
  });
}
