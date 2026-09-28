import {
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  normalizeCaptureCreatureEditorDraftV3
} from "../../../contracts/capture-creature-editor-draft-v3.js";
import {
  projectCreaturePresentationV2ToV1
} from "../../capture/creature-presentation-v2-to-v1.js";
import {
  exportCaptureEditorDraftsToCombatExportV2
} from "./capture-editor-exporter-v2.js";

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}

function arrayValue(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array`);
  }
  return value;
}

function projectDraftV3ToV2(draft) {
  return Object.freeze({
    schema: "capture-creature-editor-draft-v2",
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
      projectCreaturePresentationV2ToV1(
        draft.presentation
      )
  });
}

export function exportCaptureEditorDraftsToCombatExportV3(input) {
  const value = objectValue(
    input,
    "CaptureEditorExportV3Input"
  );

  const creatureDrafts = arrayValue(
    value.creatureDrafts,
    "creatureDrafts"
  ).map((draft) =>
    normalizeCaptureCreatureEditorDraftV3(draft)
  );

  const exported = exportCaptureEditorDraftsToCombatExportV2({
    battleSetup: value.battleSetup,
    creatureDrafts: creatureDrafts.map(
      projectDraftV3ToV2
    ),
    skillDrafts: value.skillDrafts,
    loadouts: value.loadouts,
    metadata: value.metadata ?? {}
  });

  const presentations = Object.fromEntries(
    creatureDrafts
      .filter((draft) => draft.presentation !== null)
      .map((draft) => [
        draft.presentation.id,
        draft.presentation
      ])
  );

  return normalizeCaptureCombatExportV1({
    ...exported,
    presentation: {
      ...exported.presentation,
      creatures: presentations
    }
  });
}
