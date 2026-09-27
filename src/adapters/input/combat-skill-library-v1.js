import {
  normalizeSkillDefinition
} from "../../contracts/skill-definition.js";

export const COMBAT_SKILL_LIBRARY_V1_SCHEMA =
  "combat-skill-library-v1";

const ENTRY_FIELDS = new Set([
  "id",
  "source"
]);

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

function assertKnownFields(value, allowed, field) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        field + " contains unknown field: " + key
      );
    }
  }
}

function safeRelativeSource(value, field) {
  const source = requiredString(value, field);

  if (
    source.startsWith("/") ||
    source.includes("://") ||
    source.startsWith("../") ||
    source.includes("/../") ||
    !/^[A-Za-z0-9._-]+\.skill\.json$/.test(source)
  ) {
    throw new TypeError(
      field + " must be a safe relative .skill.json source"
    );
  }

  return source;
}

export function normalizeCombatSkillLibraryManifestV1(input) {
  const value = objectValue(
    input,
    "CombatSkillLibraryV1"
  );

  assertKnownFields(
    value,
    new Set(["schema", "entries"]),
    "CombatSkillLibraryV1"
  );

  if (value.schema !== COMBAT_SKILL_LIBRARY_V1_SCHEMA) {
    throw new RangeError(
      "schema must be " +
      COMBAT_SKILL_LIBRARY_V1_SCHEMA
    );
  }

  if (!Array.isArray(value.entries)) {
    throw new TypeError(
      "entries must be an array"
    );
  }

  const entries = value.entries.map(
    (raw, index) => {
      const field = "entries[" + index + "]";
      const entry = objectValue(raw, field);

      assertKnownFields(
        entry,
        ENTRY_FIELDS,
        field
      );

      return Object.freeze({
        id: requiredString(
          entry.id,
          field + ".id"
        ),
        source: safeRelativeSource(
          entry.source,
          field + ".source"
        )
      });
    }
  );

  const ids = entries.map((entry) => entry.id);
  if (new Set(ids).size !== ids.length) {
    throw new RangeError(
      "entries contains duplicate skill ids"
    );
  }

  const sources = entries.map(
    (entry) => entry.source
  );
  if (new Set(sources).size !== sources.length) {
    throw new RangeError(
      "entries contains duplicate skill sources"
    );
  }

  return Object.freeze({
    schema: COMBAT_SKILL_LIBRARY_V1_SCHEMA,
    entries: Object.freeze(entries)
  });
}

export async function loadCombatSkillLibraryV1({
  manifest,
  loadDefinition
}) {
  if (typeof loadDefinition !== "function") {
    throw new TypeError(
      "loadDefinition must be a function"
    );
  }

  const normalizedManifest =
    normalizeCombatSkillLibraryManifestV1(
      manifest
    );

  const skills = [];
  const byId = {};

  for (const entry of normalizedManifest.entries) {
    const raw = await loadDefinition(
      entry.source
    );
    const definition =
      normalizeSkillDefinition(raw);

    if (definition.id !== entry.id) {
      throw new RangeError(
        "manifest id " +
        entry.id +
        " does not match definition id " +
        definition.id
      );
    }

    skills.push(definition);
    byId[definition.id] = definition;
  }

  return Object.freeze({
    schema: COMBAT_SKILL_LIBRARY_V1_SCHEMA,
    entries: normalizedManifest.entries,
    skills: Object.freeze(skills),
    byId: Object.freeze(byId)
  });
}
