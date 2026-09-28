import {
  normalizeCaptureCreatureEditorDraftV2
} from "./capture-creature-editor-draft-v2.js";
import {
  normalizeCreaturePresentationBindingV2,
  projectCreaturePresentationBindingV2ToV1
} from "./creature-presentation-binding-v2.js";

export const CAPTURE_CREATURE_EDITOR_DRAFT_V3_SCHEMA =
  "capture-creature-editor-draft-v3";

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

export function normalizeCaptureCreatureEditorDraftV3(input) {
  const value = objectValue(
    input,
    "CaptureCreatureEditorDraftV3"
  );

  assertKnownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CaptureCreatureEditorDraftV3"
  );

  if (value.schema !== CAPTURE_CREATURE_EDITOR_DRAFT_V3_SCHEMA) {
    throw new RangeError(
      `schema must be ${CAPTURE_CREATURE_EDITOR_DRAFT_V3_SCHEMA}`
    );
  }

  const presentation =
    value.presentation == null
      ? null
      : normalizeCreaturePresentationBindingV2(
          value.presentation
        );

  const base = normalizeCaptureCreatureEditorDraftV2({
    schema: "capture-creature-editor-draft-v2",
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
    presentation:
      projectCreaturePresentationBindingV2ToV1(presentation)
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
    schema: CAPTURE_CREATURE_EDITOR_DRAFT_V3_SCHEMA,
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
