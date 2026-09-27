export const CAPTURE_CREATURE_EDITOR_DRAFT_SCHEMA =
  "capture-creature-editor-draft-v1";

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "id",
  "displayName",
  "description",
  "level",
  "sourceStats",
  "elements",
  "resistances",
  "capture",
  "combat",
  "skillIds",
  "presentationId"
]);

const SOURCE_STAT_FIELDS = Object.freeze([
  "force",
  "agility",
  "intelligence",
  "spirit",
  "endurance",
  "initiative"
]);

const CAPTURE_FIELDS = new Set([
  "capturable",
  "captureRate",
  "spawnChance",
  "spawnTags",
  "evolution"
]);

const EVOLUTION_FIELDS = new Set([
  "condition",
  "level",
  "targetId"
]);

const COMBAT_FIELDS = new Set([
  "maxHp",
  "initialHp",
  "maxEnergy",
  "initialEnergy",
  "energyChargeAmount",
  "energyChargeIntervalMs",
  "movementEnergyPerStep",
  "chargeTimeModifierPct"
]);

const RESISTANCE_FIELDS = new Set([
  "kind",
  "value"
]);

const EVOLUTION_CONDITIONS = new Set([
  "level",
  "manual"
]);

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}

function assertKnownFields(value, allowed, field) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(`${field} contains unknown field: ${key}`);
    }
  }
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value, field) {
  return value == null ? null : requiredString(value, field);
}

function finiteNumber(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${field} must be a finite number`);
  }
  return value;
}

function nonNegativeNumber(value, field) {
  const number = finiteNumber(value, field);
  if (number < 0) {
    throw new RangeError(`${field} must be a non-negative finite number`);
  }
  return number;
}

function positiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${field} must be a positive integer`);
  }
  return value;
}

function percentage(value, field) {
  const number = finiteNumber(value, field);
  if (number < 0 || number > 100) {
    throw new RangeError(`${field} must be between 0 and 100`);
  }
  return number;
}

function requiredBoolean(value, field) {
  if (typeof value !== "boolean") {
    throw new TypeError(`${field} must be a boolean`);
  }
  return value;
}

function uniqueStrings(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array`);
  }

  const result = value.map((item, index) =>
    requiredString(item, `${field}[${index}]`)
  );

  if (new Set(result).size !== result.length) {
    throw new RangeError(`${field} must not contain duplicate values`);
  }

  return Object.freeze(result);
}

function normalizeSourceStats(raw) {
  const value = objectValue(raw, "sourceStats");
  assertKnownFields(value, new Set(SOURCE_STAT_FIELDS), "sourceStats");

  const output = {};
  for (const field of SOURCE_STAT_FIELDS) {
    output[field] = nonNegativeNumber(
      value[field],
      `sourceStats.${field}`
    );
  }

  return Object.freeze(output);
}

function normalizeResistances(raw) {
  if (!Array.isArray(raw)) {
    throw new TypeError("resistances must be an array");
  }

  const result = raw.map((item, index) => {
    const value = objectValue(item, `resistances[${index}]`);
    assertKnownFields(
      value,
      RESISTANCE_FIELDS,
      `resistances[${index}]`
    );

    return Object.freeze({
      kind: requiredString(
        value.kind,
        `resistances[${index}].kind`
      ),
      value: finiteNumber(
        value.value,
        `resistances[${index}].value`
      )
    });
  });

  const kinds = result.map((item) => item.kind);
  if (new Set(kinds).size !== kinds.length) {
    throw new RangeError(
      "resistances must not contain duplicate kinds"
    );
  }

  return Object.freeze(result);
}

function normalizeEvolution(raw) {
  if (raw == null) {
    return null;
  }

  const value = objectValue(raw, "capture.evolution");
  assertKnownFields(
    value,
    EVOLUTION_FIELDS,
    "capture.evolution"
  );

  const condition = requiredString(
    value.condition,
    "capture.evolution.condition"
  );

  if (!EVOLUTION_CONDITIONS.has(condition)) {
    throw new RangeError(
      `Unsupported capture.evolution.condition: ${condition}`
    );
  }

  return Object.freeze({
    condition,
    level:
      condition === "level"
        ? positiveInteger(
            value.level,
            "capture.evolution.level"
          )
        : null,
    targetId: requiredString(
      value.targetId,
      "capture.evolution.targetId"
    )
  });
}

function normalizeCapture(raw) {
  const value = objectValue(raw, "capture");
  assertKnownFields(value, CAPTURE_FIELDS, "capture");

  return Object.freeze({
    capturable: requiredBoolean(
      value.capturable,
      "capture.capturable"
    ),
    captureRate: percentage(
      value.captureRate,
      "capture.captureRate"
    ),
    spawnChance: percentage(
      value.spawnChance,
      "capture.spawnChance"
    ),
    spawnTags: uniqueStrings(
      value.spawnTags ?? [],
      "capture.spawnTags"
    ),
    evolution: normalizeEvolution(value.evolution)
  });
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function normalizeCombat(raw) {
  const value = objectValue(raw, "combat");
  assertKnownFields(value, COMBAT_FIELDS, "combat");

  const output = {
    maxHp: nonNegativeNumber(value.maxHp, "combat.maxHp"),
    maxEnergy: nonNegativeNumber(
      value.maxEnergy,
      "combat.maxEnergy"
    )
  };

  for (const field of [
    "initialHp",
    "initialEnergy",
    "energyChargeAmount",
    "energyChargeIntervalMs",
    "movementEnergyPerStep"
  ]) {
    if (hasOwn(value, field)) {
      output[field] = nonNegativeNumber(
        value[field],
        `combat.${field}`
      );
    }
  }

  if (hasOwn(value, "chargeTimeModifierPct")) {
    output.chargeTimeModifierPct = finiteNumber(
      value.chargeTimeModifierPct,
      "combat.chargeTimeModifierPct"
    );
  }

  if (
    hasOwn(output, "initialHp") &&
    output.initialHp > output.maxHp
  ) {
    throw new RangeError(
      "combat.initialHp cannot exceed combat.maxHp"
    );
  }

  if (
    hasOwn(output, "initialEnergy") &&
    output.initialEnergy > output.maxEnergy
  ) {
    throw new RangeError(
      "combat.initialEnergy cannot exceed combat.maxEnergy"
    );
  }

  return Object.freeze(output);
}

export function normalizeCaptureCreatureEditorDraftV1(input) {
  const value = objectValue(
    input,
    "CaptureCreatureEditorDraftV1"
  );
  assertKnownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CaptureCreatureEditorDraftV1"
  );

  if (value.schema !== CAPTURE_CREATURE_EDITOR_DRAFT_SCHEMA) {
    throw new RangeError(
      `schema must be ${CAPTURE_CREATURE_EDITOR_DRAFT_SCHEMA}`
    );
  }

  return Object.freeze({
    schema: CAPTURE_CREATURE_EDITOR_DRAFT_SCHEMA,
    id: requiredString(value.id, "id"),
    displayName: requiredString(
      value.displayName,
      "displayName"
    ),
    description:
      optionalString(value.description, "description") ?? "",
    level: positiveInteger(value.level, "level"),
    sourceStats: normalizeSourceStats(value.sourceStats),
    elements: uniqueStrings(value.elements ?? [], "elements"),
    resistances: normalizeResistances(
      value.resistances ?? []
    ),
    capture: normalizeCapture(value.capture),
    combat: normalizeCombat(value.combat),
    skillIds: uniqueStrings(value.skillIds ?? [], "skillIds"),
    presentationId: optionalString(
      value.presentationId,
      "presentationId"
    )
  });
}
