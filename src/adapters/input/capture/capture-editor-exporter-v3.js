import {
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  normalizeCaptureCreatureEditorDraftV3
} from "../../../contracts/capture-creature-editor-draft-v3.js";
import {
  exportCaptureEditorDraftsToCombatExportV2
} from "./capture-editor-exporter-v2.js";

const INPUT_FIELDS = new Set([
  "battleSetup",
  "creatureDrafts",
  "skillDrafts",
  "loadouts",
  "metadata"
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
      throw new TypeError(
        `${field} contains unknown field: ${key}`
      );
    }
  }
}

function arrayValue(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(
      `${field} must be an array`
    );
  }
  return value;
}

function presentationV2ToV1Input(presentation) {
  if (presentation == null) {
    return null;
  }

  return {
    id: presentation.id,
    version: 1,
    subjectType: presentation.subjectType,
    subjectId: presentation.subjectId,
    profileId: presentation.profileId,
    visual: presentation.visual,
    sockets: presentation.sockets,
    audio: presentation.audio
  };
}

function creatureV3ToV2Input(draft) {
  return {
    schema:
      "capture-creature-editor-draft-v2",
    id: draft.id,
    displayName: draft.displayName,
    description: draft.description,
    level: draft.level,
    sourceStats: draft.sourceStats,
    elements: draft.elements,
    resistances: draft.resistances,
    capture: draft.capture,
    combat: draft.combat,
    skillIds: draft.skillIds,
    presentation:
      presentationV2ToV1Input(
        draft.presentation
      )
  };
}

export function exportCaptureEditorDraftsToCombatExportV3(input) {
  const value = objectValue(
    input,
    "CaptureEditorExportV3Input"
  );

  assertKnownFields(
    value,
    INPUT_FIELDS,
    "CaptureEditorExportV3Input"
  );

  const creatureDrafts = arrayValue(
    value.creatureDrafts,
    "creatureDrafts"
  ).map((draft) =>
    normalizeCaptureCreatureEditorDraftV3(
      draft
    )
  );

  const exportedV2 =
    exportCaptureEditorDraftsToCombatExportV2({
      battleSetup: value.battleSetup,
      creatureDrafts:
        creatureDrafts.map(
          creatureV3ToV2Input
        ),
      skillDrafts: value.skillDrafts,
      loadouts: value.loadouts,
      metadata: value.metadata ?? {}
    });

  const creaturePresentations =
    creatureDrafts
      .map((draft) => draft.presentation)
      .filter(
        (presentation) =>
          presentation !== null
      );

  return normalizeCaptureCombatExportV1({
    ...exportedV2,
    presentation: {
      ...exportedV2.presentation,
      creatures: Object.fromEntries(
        creaturePresentations.map(
          (presentation) => [
            presentation.id,
            presentation
          ]
        )
      )
    }
  });
}
