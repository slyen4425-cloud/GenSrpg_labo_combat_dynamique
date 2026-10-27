import {
  normalizeCaptureCreatureEditorDraftV3
} from "./capture-creature-editor-draft-v3.js";
import {
  normalizeCaptureCreatureStatValuesV1
} from "./capture-creature-stat-values-v1.js";
import {
  normalizeCaptureActiveSkillLoadoutV1
} from "./capture-active-skill-loadout-v1.js";

export const CAPTURE_CREATURE_TRANSFER_V1_SCHEMA =
  "capture-creature-transfer-v1";

export const CAPTURE_CREATURE_TRANSFER_V1_VERSION = 1;

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "version",
  "draft",
  "statValues",
  "loadout"
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

export function normalizeCaptureCreatureTransferV1(
  input,
  statRegistry
) {
  const value = objectValue(
    input,
    "CaptureCreatureTransferV1"
  );

  for (const key of Object.keys(value)) {
    if (!TOP_LEVEL_FIELDS.has(key)) {
      throw new TypeError(
        "CaptureCreatureTransferV1 contains unknown field: " +
          key
      );
    }
  }

  if (
    value.schema !==
    CAPTURE_CREATURE_TRANSFER_V1_SCHEMA
  ) {
    throw new RangeError(
      "schema must be " +
        CAPTURE_CREATURE_TRANSFER_V1_SCHEMA
    );
  }

  if (
    value.version !==
    CAPTURE_CREATURE_TRANSFER_V1_VERSION
  ) {
    throw new RangeError(
      "version must be " +
        CAPTURE_CREATURE_TRANSFER_V1_VERSION
    );
  }

  const draft =
    normalizeCaptureCreatureEditorDraftV3(
      value.draft
    );
  const statValues =
    normalizeCaptureCreatureStatValuesV1(
      value.statValues,
      statRegistry
    );
  const loadout =
    normalizeCaptureActiveSkillLoadoutV1(
      value.loadout
    );

  if (
    statValues.creatureId !== draft.id
  ) {
    throw new RangeError(
      "statValues.creatureId must match draft.id"
    );
  }

  if (
    loadout.creatureId !== draft.id
  ) {
    throw new RangeError(
      "loadout.creatureId must match draft.id"
    );
  }

  return Object.freeze({
    schema:
      CAPTURE_CREATURE_TRANSFER_V1_SCHEMA,
    version:
      CAPTURE_CREATURE_TRANSFER_V1_VERSION,
    draft,
    statValues,
    loadout
  });
}
