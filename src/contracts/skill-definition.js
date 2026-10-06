import {
  normalizeSkillEffectV1
} from "./skill-effect-v1.js";
import {
  normalizeProjectilePowerV1
} from "./projectile-power-v1.js";

export const SKILL_CATEGORIES = Object.freeze([
  "offensive",
  "defensive",
  "heal",
  "buff_debuff",
  "counter"
]);

export const SKILL_LOADOUT_SLOTS = Object.freeze([
  "standard",
  "ultimate"
]);

export const SKILL_FORMS = Object.freeze([
  "contact",
  "projectile",
  "beam",
  "area",
  "self",
  "aura"
]);

export const SKILL_APPROACH_MODES = Object.freeze([
  "none",
  "ground",
  "aerial",
  "teleport",
  "burrow"
]);

export const COMBAT_DISTANCES = Object.freeze(["short", "medium", "long"]);

export const COMBAT_PRESENCE_STATES = Object.freeze([
  "surface",
  "airborne",
  "underground"
]);

export const SKILL_EVASION_WINDOWS = Object.freeze([
  "travel"
]);

export const SKILL_TARGET_RELATIONS = Object.freeze([
  "enemy",
  "ally",
  "self",
  "any"
]);

export const SKILL_ACTIVATION_REQUIREMENT_MODES =
  Object.freeze([
    "all",
    "any"
  ]);

export const SKILL_ACTIVATION_REQUIREMENT_TYPES =
  Object.freeze([
    "combat_elapsed_ms",
    "damage_dealt",
    "damage_taken",
    "hp_at_or_below_pct",
    "allies_defeated",
    "enemies_defeated",
    "kills_by_self"
  ]);

const CATEGORY_SET = new Set(SKILL_CATEGORIES);
const LOADOUT_SLOT_SET =
  new Set(SKILL_LOADOUT_SLOTS);
const FORM_SET = new Set(SKILL_FORMS);
const APPROACH_SET = new Set(SKILL_APPROACH_MODES);
const DISTANCE_SET = new Set(COMBAT_DISTANCES);
const PRESENCE_SET =
  new Set(COMBAT_PRESENCE_STATES);
const EVASION_WINDOW_SET = new Set(SKILL_EVASION_WINDOWS);
const TARGET_RELATION_SET = new Set(SKILL_TARGET_RELATIONS);
const ACTIVATION_REQUIREMENT_MODE_SET =
  new Set(SKILL_ACTIVATION_REQUIREMENT_MODES);
const ACTIVATION_REQUIREMENT_TYPE_SET =
  new Set(SKILL_ACTIVATION_REQUIREMENT_TYPES);

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function nonNegativeNumber(value, field) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(`${field} must be a non-negative finite number`);
  }
  return number;
}

function positiveIntegerOrNull(value, field) {
  if (value == null) {
    return null;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(
      `${field} must be a positive integer or null`
    );
  }
  return number;
}

function stringArray(value, field, allowed = null) {
  const list = value ?? [];
  if (!Array.isArray(list)) {
    throw new TypeError(`${field} must be an array`);
  }
  const normalized = list.map((item, index) =>
    nonEmptyString(item, `${field}[${index}]`)
  );
  if (allowed) {
    for (const item of normalized) {
      if (!allowed.has(item)) {
        throw new RangeError(`Unsupported ${field} value: ${item}`);
      }
    }
  }
  return Object.freeze([...new Set(normalized)]);
}

function normalizeActivationRequirements(raw) {
  const input = raw ?? {};
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new TypeError(
      "activationRequirements must be an object"
    );
  }

  for (const key of Object.keys(input)) {
    if (!["mode", "conditions"].includes(key)) {
      throw new TypeError(
        "activationRequirements contains unknown field: " +
          key
      );
    }
  }

  const mode = nonEmptyString(
    input.mode ?? "all",
    "activationRequirements.mode"
  );
  if (!ACTIVATION_REQUIREMENT_MODE_SET.has(mode)) {
    throw new RangeError(
      "Unsupported activation requirement mode: " +
        mode
    );
  }

  const rawConditions = input.conditions ?? [];
  if (!Array.isArray(rawConditions)) {
    throw new TypeError(
      "activationRequirements.conditions must be an array"
    );
  }

  const conditions = rawConditions.map(
    (rawCondition, index) => {
      const field =
        `activationRequirements.conditions[${index}]`;
      if (
        !rawCondition ||
        typeof rawCondition !== "object" ||
        Array.isArray(rawCondition)
      ) {
        throw new TypeError(
          field + " must be an object"
        );
      }

      for (const key of Object.keys(rawCondition)) {
        if (!["type", "threshold"].includes(key)) {
          throw new TypeError(
            field + " contains unknown field: " + key
          );
        }
      }

      const type = nonEmptyString(
        rawCondition.type,
        field + ".type"
      );
      if (!ACTIVATION_REQUIREMENT_TYPE_SET.has(type)) {
        throw new RangeError(
          "Unsupported activation requirement condition type: " +
            type
        );
      }

      const threshold = nonNegativeNumber(
        rawCondition.threshold,
        field + ".threshold"
      );

      if (
        type === "hp_at_or_below_pct" &&
        threshold > 100
      ) {
        throw new RangeError(
          field +
            ".threshold HP percentage must be between 0 and 100"
        );
      }

      return Object.freeze({
        type,
        threshold
      });
    }
  );

  return Object.freeze({
    mode,
    conditions: Object.freeze(conditions)
  });
}

export function normalizeSkillDefinition(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("SkillDefinition must be an object");
  }

  const id = nonEmptyString(input.id, "id");
  const name = nonEmptyString(input.name, "name");
  const category = nonEmptyString(input.category, "category");
  const form = nonEmptyString(input.form, "form");
  const loadoutSlot = nonEmptyString(
    input.loadoutSlot ?? "standard",
    "loadoutSlot"
  );

  if (!CATEGORY_SET.has(category)) {
    throw new RangeError(`Unsupported skill category: ${category}`);
  }
  if (!FORM_SET.has(form)) {
    throw new RangeError(`Unsupported skill form: ${form}`);
  }
  if (!LOADOUT_SLOT_SET.has(loadoutSlot)) {
    throw new RangeError(
      `Unsupported loadoutSlot: ${loadoutSlot}`
    );
  }

  const element = input.element == null
    ? null
    : nonEmptyString(input.element, "element");

  const approachMode = nonEmptyString(
    input.approachMode ?? "none",
    "approachMode"
  );
  if (!APPROACH_SET.has(approachMode)) {
    throw new RangeError(`Unsupported skill approachMode: ${approachMode}`);
  }

  const allowedDistances = stringArray(
    input.allowedDistances ?? COMBAT_DISTANCES,
    "allowedDistances",
    DISTANCE_SET
  );
  const targetRelations = stringArray(
    input.targetRelations ?? ["enemy"],
    "targetRelations",
    TARGET_RELATION_SET
  );
  if (targetRelations.length === 0) {
    throw new TypeError("targetRelations must contain at least one relation");
  }

  const hitPresenceStates =
    input.hitPresenceStates == null
      ? null
      : stringArray(
          input.hitPresenceStates,
          "hitPresenceStates",
          PRESENCE_SET
        );
  if (
    hitPresenceStates !== null &&
    hitPresenceStates.length === 0
  ) {
    throw new TypeError(
      "hitPresenceStates must contain at least one presence state"
    );
  }

  const reaction = input.reaction ?? {};
  if (typeof reaction !== "object" || Array.isArray(reaction)) {
    throw new TypeError("reaction must be an object");
  }

  const evasion = input.evasion ?? {};
  if (typeof evasion !== "object" || Array.isArray(evasion)) {
    throw new TypeError("evasion must be an object");
  }

  const evasionWindow =
    evasion.window == null
      ? null
      : nonEmptyString(evasion.window, "evasion.window");

  if (
    evasionWindow !== null &&
    !EVASION_WINDOW_SET.has(evasionWindow)
  ) {
    throw new RangeError(
      `Unsupported evasion.window: ${evasionWindow}`
    );
  }

  const evasionIncomingForms = stringArray(
    evasion.incomingForms,
    "evasion.incomingForms",
    FORM_SET
  );

  if (
    evasionWindow === null &&
    evasionIncomingForms.length > 0
  ) {
    throw new TypeError(
      "evasion.window is required when evasion.incomingForms is configured"
    );
  }

  const projectileClash =
    normalizeProjectilePowerV1(
      input.projectileClash,
      { form }
    );

  const effect = input.effect ?? {};
  if (typeof effect !== "object" || Array.isArray(effect)) {
    throw new TypeError("effect must be an object");
  }

  const normalizedLegacyEffect = Object.freeze({
    damage: nonNegativeNumber(effect.damage, "effect.damage"),
    heal: nonNegativeNumber(effect.heal, "effect.heal"),
    interruptsPreparation: effect.interruptsPreparation === true,
    stunMs: nonNegativeNumber(effect.stunMs, "effect.stunMs"),
    tags: stringArray(effect.tags, "effect.tags")
  });

  const rawEffects = input.effects ?? [];
  if (!Array.isArray(rawEffects)) {
    throw new TypeError("effects must be an array");
  }
  const effects = Object.freeze(
    rawEffects.map((entry) =>
      normalizeSkillEffectV1(entry)
    )
  );

  if (
    normalizedLegacyEffect.damage > 0 &&
    effects.some((entry) => entry.kind === "damage")
  ) {
    throw new RangeError(
      "duplicate damage authority between effect and effects"
    );
  }

  if (
    normalizedLegacyEffect.heal > 0 &&
    effects.some((entry) => entry.kind === "heal")
  ) {
    throw new RangeError(
      "duplicate heal authority between effect and effects"
    );
  }

  return Object.freeze({
    id,
    name,
    category,
    form,
    loadoutSlot,
    element,
    approachMode,
    energyCost: nonNegativeNumber(input.energyCost, "energyCost"),
    preparationMs: nonNegativeNumber(input.preparationMs, "preparationMs"),
    travelMs: nonNegativeNumber(input.travelMs, "travelMs"),
    recoveryMs: nonNegativeNumber(input.recoveryMs, "recoveryMs"),
    cooldownMs: nonNegativeNumber(input.cooldownMs, "cooldownMs"),
    maxUsesPerCombat: positiveIntegerOrNull(
      input.maxUsesPerCombat,
      "maxUsesPerCombat"
    ),
    interruptibleDuringPreparation:
      input.interruptibleDuringPreparation !== false,
    allowedDistances,
    targetRelations,
    hitPresenceStates,
    activationRequirements:
      normalizeActivationRequirements(
        input.activationRequirements
      ),
    evasion: Object.freeze({
      window: evasionWindow,
      incomingForms: evasionIncomingForms
    }),
    projectileClash,
    reaction: Object.freeze({
      blockForms: stringArray(reaction.blockForms, "reaction.blockForms", FORM_SET),
      reflectForms: stringArray(reaction.reflectForms, "reaction.reflectForms", FORM_SET),
      immuneElements: stringArray(reaction.immuneElements, "reaction.immuneElements"),
      counterForms: stringArray(reaction.counterForms, "reaction.counterForms", FORM_SET),
      evadeForms: stringArray(reaction.evadeForms, "reaction.evadeForms", FORM_SET),
      evadeApproaches: stringArray(
        reaction.evadeApproaches,
        "reaction.evadeApproaches",
        APPROACH_SET
      )
    }),
    effect: normalizedLegacyEffect,
    effects
  });
}
