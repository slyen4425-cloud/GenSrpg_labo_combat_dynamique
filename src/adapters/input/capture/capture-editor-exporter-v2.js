import {
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  normalizeCaptureBattleSetupEditorDraftV1
} from "../../../contracts/capture-battle-setup-editor-draft-v1.js";
import {
  normalizeCaptureCreatureEditorDraftV2
} from "../../../contracts/capture-creature-editor-draft-v2.js";
import {
  captureActiveSkillIdsV1,
  normalizeCaptureActiveSkillLoadoutV1
} from "../../../contracts/capture-active-skill-loadout-v1.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../../../contracts/capture-skill-editor-draft-v1.js";
import {
  exportCaptureEditorDraftsToCombatExportV1
} from "./capture-editor-exporter-v1.js";
import {
  validateCaptureLoadoutSkillSlotsV1
} from "./capture-loadout-skill-slot-v1.js";

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
      throw new RangeError(`duplicate ${field}: ${id}`);
    }
    seen.add(id);
  }
}

function toV1CreatureDraft(draft, loadout) {
  return {
    schema: "capture-creature-editor-draft-v1",
    id: draft.id,
    displayName: draft.displayName,
    description: draft.description,
    level: draft.level,
    sourceStats: draft.sourceStats,
    elements: draft.elements,
    resistances: draft.resistances,
    capture: draft.capture,
    combat: draft.combat,
    skillIds: captureActiveSkillIdsV1(loadout),
    presentationId:
      draft.presentation == null
        ? null
        : draft.presentation.id
  };
}

function battleTopology(setup) {
  const teams = {};
  const actors = [];
  const rosters = [];

  for (const team of setup.teams) {
    teams[team.id] = team.slots.map(
      (slot) => slot.actorId
    );

    for (const slot of team.slots) {
      actors.push({
        actorId: slot.actorId,
        teamId: team.id,
        creatureId: slot.creatureId,
        displayName: slot.displayName,
        controllerId: slot.controllerId
      });

      if (slot.roster !== null) {
        rosters.push({
          slotId: slot.actorId,
          activeMemberId: slot.roster.activeMemberId,
          members: slot.roster.members
        });
      }
    }
  }

  return {
    battle: {
      id: setup.id,
      localActorId: setup.localActorId,
      skillSpeedMultiplier:
        setup.skillSpeedMultiplier
    },
    teams,
    actors,
    rosters
  };
}

export function exportCaptureEditorDraftsToCombatExportV2(input) {
  const value = objectValue(
    input,
    "CaptureEditorExportV2Input"
  );

  assertKnownFields(
    value,
    INPUT_FIELDS,
    "CaptureEditorExportV2Input"
  );

  const battleSetup =
    normalizeCaptureBattleSetupEditorDraftV1(
      value.battleSetup
    );

  const creatureDrafts = arrayValue(
    value.creatureDrafts,
    "creatureDrafts"
  ).map((draft) =>
    normalizeCaptureCreatureEditorDraftV2(draft)
  );

  const skillDrafts = arrayValue(
    value.skillDrafts,
    "skillDrafts"
  ).map((draft) =>
    normalizeCaptureSkillEditorDraftV1(draft)
  );

  const loadouts = arrayValue(
    value.loadouts,
    "loadouts"
  ).map((loadout) =>
    normalizeCaptureActiveSkillLoadoutV1(loadout)
  );

  assertUnique(
    creatureDrafts,
    "creature draft id",
    (draft) => draft.id
  );
  assertUnique(
    skillDrafts,
    "skill draft id",
    (draft) => draft.id
  );
  assertUnique(
    loadouts,
    "loadout creatureId",
    (loadout) => loadout.creatureId
  );

  const creatureById = new Map(
    creatureDrafts.map((draft) => [draft.id, draft])
  );
  const skillById = new Map(
    skillDrafts.map((draft) => [draft.id, draft])
  );
  const loadoutByCreatureId = new Map(
    loadouts.map((loadout) => [
      loadout.creatureId,
      loadout
    ])
  );

  for (const loadout of loadouts) {
    validateCaptureLoadoutSkillSlotsV1({
      loadout,
      skillDrafts
    });

    if (!creatureById.has(loadout.creatureId)) {
      throw new RangeError(
        `loadout references unknown creature: ${loadout.creatureId}`
      );
    }
  }

  for (const draft of creatureDrafts) {
    const loadout = loadoutByCreatureId.get(draft.id);

    if (!loadout) {
      throw new RangeError(
        `missing loadout for creature: ${draft.id}`
      );
    }

    const linked = new Set(draft.skillIds);

    for (const skillId of captureActiveSkillIdsV1(loadout)) {
      if (!linked.has(skillId)) {
        throw new RangeError(
          `equipped skill ${skillId} is not linked to creature ${draft.id}`
        );
      }

      if (!skillById.has(skillId)) {
        throw new RangeError(
          `equipped skill ${skillId} is unknown`
        );
      }
    }
  }

  const creaturePresentations = creatureDrafts
    .map((draft) => draft.presentation)
    .filter((binding) => binding !== null);

  assertUnique(
    creaturePresentations,
    "creature presentation id",
    (binding) => binding.id
  );

  const topology = battleTopology(battleSetup);

  const exportedV1 =
    exportCaptureEditorDraftsToCombatExportV1({
      ...topology,
      creatureDrafts: creatureDrafts.map((draft) =>
        toV1CreatureDraft(
          draft,
          loadoutByCreatureId.get(draft.id)
        )
      ),
      skillDrafts,
      metadata: value.metadata ?? {}
    });

  const enrichedCreatures = exportedV1.creatures.map(
    (creature) => {
      const draft = creatureById.get(creature.id);

      return {
        ...creature,
        metadata: {
          ...creature.metadata,
          editor: {
            ...creature.metadata.editor,
            linkedSkillIds: draft.skillIds
          }
        }
      };
    }
  );

  return normalizeCaptureCombatExportV1({
    ...exportedV1,
    creatures: enrichedCreatures,
    presentation: {
      ...exportedV1.presentation,
      ...(
        battleSetup.arenaId === null
          ? {}
          : { arenaId: battleSetup.arenaId }
      ),
      creatures: Object.fromEntries(
        creaturePresentations.map((binding) => [
          binding.id,
          binding
        ])
      )
    }
  });
}
