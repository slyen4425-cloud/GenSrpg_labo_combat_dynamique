import {
  normalizeCaptureEncounterSnapshotV1
} from "../../../contracts/capture-encounter-snapshot-v1.js";
import {
  importMonsterCaptureCreatureRecordV1
} from "./monster-capture-creature-import-v1.js";
import {
  buildCaptureCreatureHistoricalLoadoutV1
} from "../../../catalogs/capture-creature-historical-loadout-v1.js";
import {
  capturePortableNativeSkillDraftsV1
} from "../../../catalogs/capture-portable-native-skill-catalog-v1.js";
import {
  exportCaptureEditorDraftsToCombatExportV2
} from "./capture-editor-exporter-v2.js";
import {
  adaptCaptureCombatExportStackV1
} from "./capture-export-adapter-stack-v1.js";

const PREVIEW_PARTIES = Object.freeze({
  "capture-party-preview":
    Object.freeze({
      creatureId: "crea_maraileron"
    })
});

const ARENA_BY_TERRAIN = Object.freeze({
  forest: "forest",
  snow: "snow",
  volcano: "lava",
  mountain: "cave",
  sea: "cave",
  plain: "forest",
  road: "forest",
  sand: "forest"
});

function sourceRecordById(
  records,
  creatureId,
  field
) {
  if (!Array.isArray(records)) {
    throw new TypeError(
      "creatureRecords must be an array"
    );
  }

  const record =
    records.find(
      (entry) =>
        entry?.id === creatureId
    ) ?? null;

  if (!record) {
    throw new RangeError(
      field +
        " references unknown Capture creature: " +
        creatureId
    );
  }

  return record;
}

function draftV2FromImported(record) {
  const draft = record.draft;

  return Object.freeze({
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
    presentation: null
  });
}

function activeLoadoutFor(
  sourceRecord,
  imported,
  runtimeSkillIds
) {
  const result =
    buildCaptureCreatureHistoricalLoadoutV1({
      creatureId: imported.draft.id,
      level: imported.draft.level,
      abilityIds: sourceRecord.abilityIds ?? [],
      runtimeSkillIds,
      maxMoves: 4
    });

  const active = result.loadout.slots
    .filter((slot) => slot.skillId !== null);

  if (active.length === 0) {
    throw new RangeError(
      "Capture creature has no runtime-compatible combat skill: " +
        imported.draft.id
    );
  }

  return result.loadout;
}

function battleSetup({
  snapshot,
  localDraft,
  enemyDraft
}) {
  return Object.freeze({
    schema:
      "capture-battle-setup-editor-draft-v1",
    id:
      "exploration-" +
      snapshot.encounterId,
    localActorId: "local-1",
    arenaId:
      ARENA_BY_TERRAIN[
        snapshot.context.terrainFamilyId
      ] ?? "forest",
    skillSpeedMultiplier: 1,
    teams: Object.freeze([
      Object.freeze({
        id: "local-team",
        slots: Object.freeze([
          Object.freeze({
            actorId: "local-1",
            creatureId: localDraft.id,
            displayName:
              localDraft.displayName,
            controllerId: "human-local",
            roster: null
          })
        ])
      }),
      Object.freeze({
        id: "enemy-team",
        slots: Object.freeze([
          Object.freeze({
            actorId: "enemy-1",
            creatureId: enemyDraft.id,
            displayName:
              enemyDraft.displayName,
            controllerId: "ai-enemy",
            roster: null
          })
        ])
      })
    ])
  });
}

export function buildExplorationEncounterCombatSourceV1({
  snapshot: rawSnapshot,
  creatureRecords
}) {
  const snapshot =
    normalizeCaptureEncounterSnapshotV1(
      rawSnapshot
    );

  const party =
    PREVIEW_PARTIES[
      snapshot.player.partyRef
    ] ?? null;

  if (!party) {
    throw new RangeError(
      "unsupported preview partyRef: " +
        snapshot.player.partyRef
    );
  }

  const localSource = sourceRecordById(
    creatureRecords,
    party.creatureId,
    "partyRef"
  );
  const enemySource = sourceRecordById(
    creatureRecords,
    snapshot.opponents[0].creatureId,
    "opponent"
  );

  const localImported =
    importMonsterCaptureCreatureRecordV1(
      localSource
    );
  const enemyImported =
    importMonsterCaptureCreatureRecordV1(
      enemySource
    );

  const runtimeSkillDrafts =
    capturePortableNativeSkillDraftsV1();
  const runtimeSkillIds =
    new Set(
      runtimeSkillDrafts.map(
        (draft) => draft.id
      )
    );

  const localLoadout = activeLoadoutFor(
    localSource,
    localImported,
    runtimeSkillIds
  );
  const enemyLoadout = activeLoadoutFor(
    enemySource,
    enemyImported,
    runtimeSkillIds
  );

  const equippedIds =
    new Set([
      ...localLoadout.slots,
      ...enemyLoadout.slots
    ]
      .map((slot) => slot.skillId)
      .filter(Boolean));

  const skillDrafts =
    runtimeSkillDrafts.filter(
      (draft) => equippedIds.has(draft.id)
    );

  const exported =
    exportCaptureEditorDraftsToCombatExportV2({
      battleSetup: battleSetup({
        snapshot,
        localDraft: localImported.draft,
        enemyDraft: enemyImported.draft
      }),
      creatureDrafts: [
        draftV2FromImported(localImported),
        draftV2FromImported(enemyImported)
      ],
      skillDrafts,
      loadouts: [
        localLoadout,
        enemyLoadout
      ],
      metadata: {
        producer:
          "exploration-encounter-bridge-v1",
        encounterId:
          snapshot.encounterId,
        returnToken:
          snapshot.returnToken
      }
    });

  return adaptCaptureCombatExportStackV1(
    exported
  );
}
