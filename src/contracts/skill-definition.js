import {
  normalizeSkillEffectV1,
  isReserveEffectTargetScopeV2
} from "./skill-effect-v1.js";
import { normalizeContactHoldV1 } from "./contact-hold-v1.js";
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

export const SKILL_PROJECTILE_TARGETINGS = Object.freeze(["direct", "fixed_point", "expanding_wave"]);

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

export const SKILL_TARGET_LOCATIONS = Object.freeze([
  "active",
  "reserve"
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
const PROJECTILE_TARGETING_SET = new Set(SKILL_PROJECTILE_TARGETINGS);
const APPROACH_SET = new Set(SKILL_APPROACH_MODES);
const DISTANCE_SET = new Set(COMBAT_DISTANCES);
const PRESENCE_SET =
  new Set(COMBAT_PRESENCE_STATES);
const EVASION_WINDOW_SET = new Set(SKILL_EVASION_WINDOWS);
const TARGET_RELATION_SET = new Set(SKILL_TARGET_RELATIONS);
const TARGET_LOCATION_SET =
  new Set(SKILL_TARGET_LOCATIONS);
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

function booleanOrDefault(
  value,
  field,
  fallback
) {
  if (value == null) {
    return fallback;
  }
  if (typeof value !== "boolean") {
    throw new TypeError(
      field + " must be a boolean"
    );
  }
  return value;
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

function normalizeSkillMarkerCostV1(input) {
  if (input == null) return null;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("markerCost must be an object");
  }
  for (const key of Object.keys(input)) {
    if (!["markerId", "count", "source"].includes(key)) {
      throw new TypeError("Unknown markerCost field: " + key);
    }
  }
  const markerId = nonEmptyString(input.markerId, "markerCost.markerId");
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(markerId)) {
    throw new RangeError("markerCost.markerId must be a stable shared marker slug");
  }
  const count = positiveIntegerOrNull(input.count, "markerCost.count");
  if (count === null || count > 99) throw new RangeError("markerCost.count must be 1..99");
  const source = nonEmptyString(input.source ?? "self", "markerCost.source");
  if (!["self", "target"].includes(source)) {
    throw new RangeError("markerCost.source must be self or target");
  }
  return Object.freeze({markerId, count, source});
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

  const projectileTargeting = nonEmptyString(input.projectileTargeting ?? "direct", "projectileTargeting");
  if (!PROJECTILE_TARGETING_SET.has(projectileTargeting)) throw new RangeError(`Unsupported projectileTargeting: ${projectileTargeting}`);

  if (projectileTargeting === "expanding_wave" && form !== "projectile") {
    throw new RangeError("expanding_wave requires projectile form");
  }
  if (projectileTargeting !== "expanding_wave" && input.expandingWave != null) {
    throw new RangeError("expandingWave requires expanding_wave projectileTargeting");
  }
  const wave = input.expandingWave ?? {};
  if (projectileTargeting === "expanding_wave" && (!wave || typeof wave !== "object" || Array.isArray(wave))) {
    throw new TypeError("expandingWave must be an object");
  }
  if (projectileTargeting === "expanding_wave") {
    for (const key of Object.keys(wave)) {
      if (!["startRadiusPct","endRadiusPct","thicknessPct"].includes(key)) {
        throw new TypeError("expandingWave contains unknown field: " + key);
      }
    }
  }
  const startRadiusPct = Number(wave?.startRadiusPct ?? 3);
  const endRadiusPct = Number(wave?.endRadiusPct ?? 65);
  const thicknessPct = Number(wave?.thicknessPct ?? 6);
  if (projectileTargeting === "expanding_wave" && (
    !Number.isFinite(startRadiusPct) || startRadiusPct < 1 || startRadiusPct > 60 ||
    !Number.isFinite(endRadiusPct) || endRadiusPct <= startRadiusPct || endRadiusPct > 150 ||
    !Number.isFinite(thicknessPct) || thicknessPct < 0.5 || thicknessPct > endRadiusPct
  )) {
    throw new RangeError("expandingWave requires 1..60% start, larger end up to 150%, and 0.5..end% thickness");
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

  const contactHold = input.contactHold == null ? null : normalizeContactHoldV1(input.contactHold);
  if (contactHold && (form !== "contact" || approachMode !== "ground")) {
    throw new RangeError("contactHold requires contact form and ground approach");
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

  const targetLocations = stringArray(
    input.targetLocations ?? ["active"],
    "targetLocations",
    TARGET_LOCATION_SET
  );
  if (targetLocations.length === 0) {
    throw new TypeError(
      "targetLocations must contain at least one location"
    );
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

  // One optional native owner for repeated taps during the PREPARATION phase.
  // Its direct damage replaces legacy/tactical damage; no second damage authority.
  let chargedAttack = null;
  if (input.chargedAttack != null) {
    const config = input.chargedAttack;
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      throw new TypeError("chargedAttack must be an object");
    }
    for (const key of Object.keys(config)) {
      if (!["baseDamage","bonusDamagePerCharge","maxCharges","reactivationWindowMs","sizeIncreasePct"].includes(key)) {
        throw new TypeError("Unknown chargedAttack field: " + key);
      }
    }
    if (form !== "projectile" || projectileTargeting !== "direct" || contactHold) {
      throw new RangeError("chargedAttack requires a direct projectile without contact hold");
    }
    const baseDamage = Number(config.baseDamage);
    const bonusDamagePerCharge = Number(config.bonusDamagePerCharge);
    const maxCharges = Number(config.maxCharges);
    const reactivationWindowMs = Number(config.reactivationWindowMs);
    const sizeIncreasePct = Number(config.sizeIncreasePct ?? 10);
    if (!Number.isFinite(baseDamage) || baseDamage < 0 ||
        !Number.isFinite(bonusDamagePerCharge) || bonusDamagePerCharge < 0) {
      throw new RangeError("chargedAttack damage values must be nonnegative finite numbers");
    }
    if (!Number.isInteger(maxCharges) || maxCharges < 2 || maxCharges > 20) {
      throw new RangeError("chargedAttack.maxCharges must be 2..20 total activations");
    }
    if (!Number.isFinite(reactivationWindowMs) || reactivationWindowMs <= 0 ||
        reactivationWindowMs > Number(input.preparationMs)) {
      throw new RangeError("chargedAttack.reactivationWindowMs requires a positive preparationMs and a window <= preparation");
    }
    if (!Number.isFinite(sizeIncreasePct) || sizeIncreasePct < 0 || sizeIncreasePct > 100) {
      throw new RangeError("chargedAttack.sizeIncreasePct must be 0..100");
    }
    chargedAttack = Object.freeze({baseDamage,bonusDamagePerCharge,maxCharges,reactivationWindowMs,sizeIncreasePct});
  }

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

  // The single canonical owner of forced switching is RosterSession.
  // Never route this through active-target Combat Rules or ally recall.
  const forced = effects.filter(entry => entry.kind === "force_reserve_switch");
  if (forced.length > 0 && (
    forced.length !== 1 || targetLocations.length !== 1 ||
    targetLocations[0] !== "reserve" ||
    targetRelations.length !== 1 || targetRelations[0] !== "enemy" ||
    effects.some(entry => entry.targetScope !== "target") ||
    normalizedLegacyEffect.damage > 0 || normalizedLegacyEffect.heal > 0
  )) {
    throw new RangeError("force_reserve_switch requires exactly one enemy reserve target and target-scoped effects");
  }

  if (effects.some(entry => isReserveEffectTargetScopeV2(entry.targetScope)) &&
      !targetLocations.includes("active")) {
    throw new RangeError("Reserve splash effects require an active target location");
  }

  if (
    normalizedLegacyEffect.damage > 0 &&
    effects.some((entry) => entry.kind === "damage" && entry.condition == null)
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

  if (chargedAttack && (normalizedLegacyEffect.damage !== 0 ||
      effects.some(entry => ["damage","life_steal"].includes(entry.kind)))) {
    throw new RangeError("chargedAttack must be the only direct damage authority");
  }

  return Object.freeze({
    id,
    name,
    category,
    form,
    projectileTargeting,
    ...(chargedAttack ? {chargedAttack} : {}),
    ...(projectileTargeting === "expanding_wave" ? { expandingWave: Object.freeze({startRadiusPct,endRadiusPct,thicknessPct}) } : {}),
    loadoutSlot,
    element,
    approachMode,
    ...(contactHold ? { contactHold } : {}),
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
    targetLocations,
    hitPresenceStates,
    dodgeable: booleanOrDefault(
      input.dodgeable,
      "dodgeable",
      true
    ),
    hitsIntangible: booleanOrDefault(input.hitsIntangible, "hitsIntangible", false),
    activationRequirements:
      normalizeActivationRequirements(
        input.activationRequirements
      ),
    ...(input.markerCost == null ? {} : {markerCost: normalizeSkillMarkerCostV1(input.markerCost)}),
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
