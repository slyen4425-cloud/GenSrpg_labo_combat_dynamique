import {
  normalizeCaptureEncounterSnapshotV1
} from "../../../contracts/capture-encounter-snapshot-v1.js";
import {
  importMonsterCaptureCreatureRecordV1
} from "./monster-capture-creature-import-v1.js";
import {
  applyCaptureCombatRulesToCreatureDraftV1
} from "./capture-combat-rules-overlay-v1.js";
import {
  requireCaptureCombatRulesetV1
} from "../../../catalogs/capture-combat-ruleset-catalog-v1.js";
import {
  buildCaptureCreatureHistoricalLoadoutV1
} from "../../../catalogs/capture-creature-historical-loadout-v1.js";
import {
  capturePortableNativeSkillDraftsV1
} from "../../../catalogs/capture-portable-native-skill-catalog-v1.js";
import {
  captureComplexNativeSkillDraftsV1
} from "../../../catalogs/capture-complex-native-skill-catalog-v1.js";
import {
  normalizeCaptureCreatureTransferV1
} from "../../../contracts/capture-creature-transfer-v1.js";
import {
  normalizeCaptureSkillTransferV1
} from "../../../contracts/capture-skill-transfer-v1.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../../../contracts/capture-skill-editor-draft-v1.js";
import {
  normalizeCaptureStatRegistryV1
} from "../../../contracts/capture-stat-registry-v1.js";
import {
  exportCaptureEditorDraftsToCombatExportV3
} from "./capture-editor-exporter-v3.js";
import {
  adaptCaptureCombatExportStackV1
} from "./capture-export-adapter-stack-v1.js";

const PREVIEW_PARTIES = Object.freeze({
  "capture-party-preview":
    Object.freeze({
      creatureId: "crea-loup"
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

function nativeCatalogDrafts(catalog) {
  const entries =
    Array.isArray(catalog?.entries)
      ? catalog.entries
      : [];

  return entries.map((entry) =>
    normalizeCaptureSkillEditorDraftV1({
      schema: "capture-skill-editor-draft-v1",
      id: entry.definition?.id ?? entry.id,
      description:
        "Capacité native du laboratoire.",
      requiredLevel: 1,
      usageScopes: ["capture", "combat"],
      definition: entry.definition,
      presentation: null
    })
  );
}

function configuredSkillDrafts({
  nativeSkillCatalog,
  showcaseSkillTransfers
}) {
  const byId = new Map();

  for (
    const draft of
      nativeCatalogDrafts(nativeSkillCatalog)
  ) {
    byId.set(draft.id, draft);
  }

  for (
    const draft of
      capturePortableNativeSkillDraftsV1()
  ) {
    byId.set(draft.id, draft);
  }

  for (
    const draft of
      captureComplexNativeSkillDraftsV1()
  ) {
    byId.set(draft.id, draft);
  }

  for (
    const transfer of
      showcaseSkillTransfers ?? []
  ) {
    const normalized =
      normalizeCaptureSkillTransferV1(
        transfer
      );
    byId.set(
      normalized.draft.id,
      normalized.draft
    );
  }

  return byId;
}

function requireSkills(
  loadouts,
  skillsById
) {
  const ids = [
    ...new Set(
      loadouts.flatMap((loadout) =>
        loadout.slots
          .map((slot) => slot.skillId)
          .filter(Boolean)
      )
    )
  ];

  return ids.map((id) => {
    const draft =
      skillsById.get(id);

    if (!draft) {
      throw new RangeError(
        "Encounter Combat references unknown configured skill: " +
          id
      );
    }

    return draft;
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
      abilityIds:
        sourceRecord.abilityIds ?? [],
      runtimeSkillIds,
      maxMoves: 4
    });

  const active =
    result.loadout.slots.filter(
      (slot) => slot.skillId !== null
    );

  if (active.length === 0) {
    throw new RangeError(
      "Capture creature has no runtime-compatible combat skill: " +
        imported.draft.id
    );
  }

  return result.loadout;
}

function configuredPreviewParty({
  partyRef,
  previewPartyTransfer,
  statRegistry
}) {
  const definition =
    PREVIEW_PARTIES[partyRef] ?? null;

  if (!definition) {
    throw new RangeError(
      "unsupported preview partyRef: " +
        partyRef
    );
  }

  if (
    !previewPartyTransfer ||
    typeof previewPartyTransfer !== "object" ||
    Array.isArray(previewPartyTransfer)
  ) {
    throw new TypeError(
      "previewPartyTransfer is required for " +
        partyRef
    );
  }

  const party =
    normalizeCaptureCreatureTransferV1(
      previewPartyTransfer,
      statRegistry
    );

  if (
    party.draft.id !==
    definition.creatureId
  ) {
    throw new RangeError(
      "preview party transfer mismatch: expected " +
        definition.creatureId +
        ", received " +
        party.draft.id
    );
  }

  if (!party.loadout) {
    throw new TypeError(
      "configured preview party requires a loadout"
    );
  }

  if (!party.statValues) {
    throw new TypeError(
      "configured preview party requires statValues"
    );
  }

  return party;
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
  creatureRecords,
  previewPartyTransfer,
  showcaseSkillTransfers = [],
  nativeSkillCatalog,
  statRegistry
}) {
  const snapshot =
    normalizeCaptureEncounterSnapshotV1(
      rawSnapshot
    );

  const combatRules =
    requireCaptureCombatRulesetV1(
      snapshot.rules.rulesetId
    );

  const registry =
    normalizeCaptureStatRegistryV1(
      statRegistry
    );

  const localParty =
    configuredPreviewParty({
      partyRef:
        snapshot.player.partyRef,
      previewPartyTransfer,
      statRegistry: registry
    });

  const enemySource =
    sourceRecordById(
      creatureRecords,
      snapshot.opponents[0].creatureId,
      "opponent"
    );

  const enemyImported =
    importMonsterCaptureCreatureRecordV1(
      enemySource
    );

  const localCombatDraft =
    applyCaptureCombatRulesToCreatureDraftV1({
      creatureDraft:
        localParty.draft,
      combatRules
    });

  const enemyCombatDraft =
    applyCaptureCombatRulesToCreatureDraftV1({
      creatureDraft:
        enemyImported.draft,
      combatRules
    });

  const skillsById =
    configuredSkillDrafts({
      nativeSkillCatalog,
      showcaseSkillTransfers
    });
  const runtimeSkillIds =
    new Set(
      skillsById.keys()
    );

  const localLoadout =
    localParty.loadout;
  const enemyLoadout =
    activeLoadoutFor(
      enemySource,
      {
        ...enemyImported,
        draft: enemyCombatDraft
      },
      runtimeSkillIds
    );

  const skillDrafts =
    requireSkills(
      [
        localLoadout,
        enemyLoadout
      ],
      skillsById
    );

  const exported =
    exportCaptureEditorDraftsToCombatExportV3({
      battleSetup: battleSetup({
        snapshot,
        localDraft:
          localCombatDraft,
        enemyDraft:
          enemyCombatDraft
      }),
      creatureDrafts: [
        localCombatDraft,
        enemyCombatDraft
      ],
      skillDrafts,
      loadouts: [
        localLoadout,
        enemyLoadout
      ],
      statRegistry: registry,
      statValues: [
        localParty.statValues
      ],
      metadata: {
        producer:
          "exploration-encounter-bridge-v1",
        encounterId:
          snapshot.encounterId,
        returnToken:
          snapshot.returnToken,
        previewPartySource:
          "capture-creature-transfer-v1"
      }
    });

  return adaptCaptureCombatExportStackV1(
    exported
  );
}
