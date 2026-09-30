import {
  normalizeCaptureSkillEditorDraftV1
} from "./capture-skill-editor-draft-v1.js";

export const CAPTURE_SKILL_TRANSFER_V1_SCHEMA =
  "capture-skill-transfer-v1";

export const CAPTURE_SKILL_TRANSFER_V1_VERSION = 1;

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "version",
  "draft"
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

export function normalizeCaptureSkillTransferV1(
  input
) {
  const value = objectValue(
    input,
    "CaptureSkillTransferV1"
  );

  for (const key of Object.keys(value)) {
    if (!TOP_LEVEL_FIELDS.has(key)) {
      throw new TypeError(
        "CaptureSkillTransferV1 contains unknown field: " +
          key
      );
    }
  }

  if (
    value.schema !==
    CAPTURE_SKILL_TRANSFER_V1_SCHEMA
  ) {
    throw new RangeError(
      "schema must be " +
        CAPTURE_SKILL_TRANSFER_V1_SCHEMA
    );
  }

  if (
    value.version !==
    CAPTURE_SKILL_TRANSFER_V1_VERSION
  ) {
    throw new RangeError(
      "version must be " +
        CAPTURE_SKILL_TRANSFER_V1_VERSION
    );
  }

  return Object.freeze({
    schema:
      CAPTURE_SKILL_TRANSFER_V1_SCHEMA,
    version:
      CAPTURE_SKILL_TRANSFER_V1_VERSION,
    draft:
      normalizeCaptureSkillEditorDraftV1(
        value.draft
      )
  });
}
