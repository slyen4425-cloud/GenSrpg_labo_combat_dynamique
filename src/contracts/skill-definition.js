export const SKILL_CATEGORIES = Object.freeze([
  "offensive",
  "defensive",
  "heal",
  "buff_debuff",
  "counter"
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
  "teleport"
]);

export const COMBAT_DISTANCES = Object.freeze(["short", "medium", "long"]);

export const SKILL_EVASION_WINDOWS = Object.freeze([
  "travel"
]);

const CATEGORY_SET = new Set(SKILL_CATEGORIES);
const FORM_SET = new Set(SKILL_FORMS);
const APPROACH_SET = new Set(SKILL_APPROACH_MODES);
const DISTANCE_SET = new Set(COMBAT_DISTANCES);
const EVASION_WINDOW_SET = new Set(SKILL_EVASION_WINDOWS);

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

export function normalizeSkillDefinition(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("SkillDefinition must be an object");
  }

  const id = nonEmptyString(input.id, "id");
  const name = nonEmptyString(input.name, "name");
  const category = nonEmptyString(input.category, "category");
  const form = nonEmptyString(input.form, "form");

  if (!CATEGORY_SET.has(category)) {
    throw new RangeError(`Unsupported skill category: ${category}`);
  }
  if (!FORM_SET.has(form)) {
    throw new RangeError(`Unsupported skill form: ${form}`);
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

  const effect = input.effect ?? {};
  if (typeof effect !== "object" || Array.isArray(effect)) {
    throw new TypeError("effect must be an object");
  }

  return Object.freeze({
    id,
    name,
    category,
    form,
    element,
    approachMode,
    energyCost: nonNegativeNumber(input.energyCost, "energyCost"),
    preparationMs: nonNegativeNumber(input.preparationMs, "preparationMs"),
    travelMs: nonNegativeNumber(input.travelMs, "travelMs"),
    recoveryMs: nonNegativeNumber(input.recoveryMs, "recoveryMs"),
    interruptibleDuringPreparation:
      input.interruptibleDuringPreparation !== false,
    allowedDistances,
    evasion: Object.freeze({
      window: evasionWindow,
      incomingForms: evasionIncomingForms
    }),
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
    effect: Object.freeze({
      damage: nonNegativeNumber(effect.damage, "effect.damage"),
      heal: nonNegativeNumber(effect.heal, "effect.heal"),
      interruptsPreparation: effect.interruptsPreparation === true,
      stunMs: nonNegativeNumber(effect.stunMs, "effect.stunMs"),
      tags: stringArray(effect.tags, "effect.tags")
    })
  });
}
