import {
  normalizeCaptureCreatureEditorDraftV1
} from "./capture-creature-editor-draft-v1.js";
import {
  normalizeCreaturePresentationBindingV1
} from "./creature-presentation-binding-v1.js";

export const CAPTURE_CREATURE_EDITOR_DRAFT_V2_SCHEMA =
  "capture-creature-editor-draft-v2";

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

function normalizePresentation(raw) {
  if (raw == null) {
    return null;
  }
  return normalizeCreaturePresentationBindingV1(raw);
}

export function normalizeCaptureCreatureEditorDraftV2(input) {
  const value = objectValue(
    input,
    "CaptureCreatureEditorDraftV2"
  );

  assertKnownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CaptureCreatureEditorDraftV2"
  );

  if (value.schema !== CAPTURE_CREATURE_EDITOR_DRAFT_V2_SCHEMA) {
    throw new RangeError(
      `schema must be ${CAPTURE_CREATURE_EDITOR_DRAFT_V2_SCHEMA}`
    );
  }

  const presentation = normalizePresentation(value.presentation);

  const base = normalizeCaptureCreatureEditorDraftV1({
    schema: "capture-creature-editor-draft-v1",
    id: value.id,
    displayName: value.displayName,
    description: value.description,
    level: value.level,
    sourceStats: value.sourceStats,
    elements: value.elements,
    resistances: value.resistances,
    capture: value.capture,
    combat: value.combat,
    skillIds: value.skillIds,
    presentationId:
      presentation == null ? null : presentation.id
  });

  if (
    presentation !== null &&
    presentation.subjectId !== base.id
  ) {
    throw new RangeError(
      "presentation.subjectId must match creature id"
    );
  }

  return Object.freeze({
    schema: CAPTURE_CREATURE_EDITOR_DRAFT_V2_SCHEMA,
    id: base.id,
    displayName: base.displayName,
    description: base.description,
    level: base.level,
    sourceStats: base.sourceStats,
    elements: base.elements,
    resistances: base.resistances,
    capture: base.capture,
    combat: base.combat,
    skillIds: base.skillIds,
    presentation
  });
}
