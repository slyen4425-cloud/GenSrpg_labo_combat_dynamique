import {
  normalizeSkillDefinition
} from "./skill-definition.js";
import {
  normalizeSkillPresentationBindingV1
} from "./skill-presentation-binding-v1.js";

export const CAPTURE_SKILL_EDITOR_DRAFT_SCHEMA =
  "capture-skill-editor-draft-v1";

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "id",
  "description",
  "requiredLevel",
  "usageScopes",
  "definition",
  "presentation"
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

function positiveInteger(value, field) {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${field} must be a positive integer`);
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

function normalizePresentation(raw, skillId) {
  if (raw == null) {
    return null;
  }

  const presentation =
    normalizeSkillPresentationBindingV1(raw);

  if (presentation.subjectId !== skillId) {
    throw new RangeError(
      "presentation.subjectId must match draft id"
    );
  }

  return presentation;
}

export function normalizeCaptureSkillEditorDraftV1(input) {
  const value = objectValue(
    input,
    "CaptureSkillEditorDraftV1"
  );

  assertKnownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CaptureSkillEditorDraftV1"
  );

  if (value.schema !== CAPTURE_SKILL_EDITOR_DRAFT_SCHEMA) {
    throw new RangeError(
      `schema must be ${CAPTURE_SKILL_EDITOR_DRAFT_SCHEMA}`
    );
  }

  const id = requiredString(value.id, "id");
  const definitionInput = objectValue(
    value.definition,
    "definition"
  );
  const definitionId = requiredString(
    definitionInput.id,
    "definition.id"
  );

  if (definitionId !== id) {
    throw new RangeError(
      "definition.id must match draft id"
    );
  }

  const definition =
    normalizeSkillDefinition(definitionInput);

  return Object.freeze({
    schema: CAPTURE_SKILL_EDITOR_DRAFT_SCHEMA,
    id,
    description:
      optionalString(value.description, "description") ?? "",
    requiredLevel: positiveInteger(
      value.requiredLevel,
      "requiredLevel"
    ),
    usageScopes: uniqueStrings(
      value.usageScopes ?? [],
      "usageScopes"
    ),
    definition,
    presentation: normalizePresentation(
      value.presentation,
      id
    )
  });
}
