import {
  CAPTURE_COMBAT_EXPORT_SCHEMA,
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  normalizeCaptureCreatureEditorDraftV1
} from "../../../contracts/capture-creature-editor-draft-v1.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../../../contracts/capture-skill-editor-draft-v1.js";

const INPUT_FIELDS = new Set([
  "battle",
  "teams",
  "actors",
  "rosters",
  "creatureDrafts",
  "skillDrafts",
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
      throw new TypeError(`${field} contains unknown field: ${key}`);
    }
  }
}

function arrayValue(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array`);
  }
  return value;
}

function assertUnique(items, field, idOf) {
  const seen = new Set();

  for (const item of items) {
    const id = idOf(item);
    if (seen.has(id)) {
      throw new RangeError(`duplicate ${field} id: ${id}`);
    }
    seen.add(id);
  }
}

function exportCreatureDraft(draft) {
  return {
    id: draft.id,
    displayName: draft.displayName,
    combat: draft.combat,
    skillIds: draft.skillIds,
    presentationId: draft.presentationId,
    metadata: {
      editor: {
        description: draft.description,
        level: draft.level,
        sourceStats: draft.sourceStats,
        elements: draft.elements,
        resistances: draft.resistances,
        capture: draft.capture
      }
    }
  };
}

function exportSkillDraft(draft) {
  return {
    id: draft.id,
    definition: draft.definition,
    presentationId:
      draft.presentation == null
        ? null
        : draft.presentation.id,
    metadata: {
      editor: {
        description: draft.description,
        requiredLevel: draft.requiredLevel,
        usageScopes: draft.usageScopes
      }
    }
  };
}

export function exportCaptureEditorDraftsToCombatExportV1(input) {
  const value = objectValue(input, "CaptureEditorExportInput");
  assertKnownFields(
    value,
    INPUT_FIELDS,
    "CaptureEditorExportInput"
  );

  const creatureDrafts = arrayValue(
    value.creatureDrafts,
    "creatureDrafts"
  ).map((draft) =>
    normalizeCaptureCreatureEditorDraftV1(draft)
  );

  const skillDrafts = arrayValue(
    value.skillDrafts,
    "skillDrafts"
  ).map((draft) =>
    normalizeCaptureSkillEditorDraftV1(draft)
  );

  assertUnique(
    creatureDrafts,
    "creature draft",
    (draft) => draft.id
  );
  assertUnique(
    skillDrafts,
    "skill draft",
    (draft) => draft.id
  );

  const presentationDrafts = skillDrafts
    .map((draft) => draft.presentation)
    .filter((binding) => binding !== null);

  assertUnique(
    presentationDrafts,
    "presentation binding",
    (binding) => binding.id
  );

  const raw = {
    schema: CAPTURE_COMBAT_EXPORT_SCHEMA,
    battle: value.battle,
    teams: value.teams,
    actors: value.actors,
    creatures: creatureDrafts.map(exportCreatureDraft),
    skills: skillDrafts.map(exportSkillDraft),
    rosters: value.rosters ?? [],
    presentation: {
      skills: Object.fromEntries(
        presentationDrafts.map((binding) => [
          binding.id,
          binding
        ])
      )
    },
    metadata: value.metadata ?? {}
  };

  return normalizeCaptureCombatExportV1(raw);
}
