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
  normalizeCapturePartyV1
} from "../../../contracts/capture-party-v1.js";
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

function capturePartyByRef(
  partyDefinitions,
  partyRef
) {
  if (!Array.isArray(partyDefinitions)) {
    throw new TypeError(
      "partyDefinitions must be an array"
    );
  }

  const parties = partyDefinitions.map(
    (party) =>
      normalizeCapturePartyV1(
        party
      )
  );

  const ids =
    parties.map((party) => party.id);

  if (
    new Set(ids).size !==
    ids.length
  ) {
    throw new RangeError(
      "partyDefinitions contains duplicate ids"
    );
  }

  const party =
    parties.find(
      (entry) =>
        entry.id === partyRef
    ) ?? null;

  if (!party) {
    throw new RangeError(
      "unknown Capture partyRef: " +
        partyRef
    );
  }

  return party;
}

function configuredTransfersById({
  configuredCreatureTransfers,
  statRegistry
}) {
  if (
    !Array.isArray(
      configuredCreatureTransfers
    )
  ) {
    throw new TypeError(
      "configuredCreatureTransfers must be an array"
    );
  }

  const byId = new Map();

  for (
    const rawTransfer of
      configuredCreatureTransfers
  ) {
    const transfer =
      normalizeCaptureCreatureTransferV1(
        rawTransfer,
        statRegistry
      );

    const creatureId =
      transfer.draft.id;

    if (byId.has(creatureId)) {
      throw new RangeError(
        "duplicate configured creature transfer: " +
          creatureId
      );
    }

    if (!transfer.loadout) {
      throw new TypeError(
        "configured party creature requires a loadout: " +
          creatureId
      );
    }

    if (!transfer.statValues) {
      throw new TypeError(
        "configured party creature requires statValues: " +
          creatureId
      );
    }

    byId.set(
      creatureId,
      transfer
    );
  }

  return byId;
}

function configuredPartyMembers({
  party,
  transfersById,
  combatRules
}) {
  return party.members.map(
    (member) => {
      const transfer =
        transfersById.get(
          member.creatureId
        ) ?? null;

      if (!transfer) {
        throw new RangeError(
          "Capture party references unknown configured creature: " +
            member.creatureId
        );
      }

      return Object.freeze({
        member,
        transfer,
        combatDraft:
          applyCaptureCombatRulesToCreatureDraftV1({
            creatureDraft:
              transfer.draft,
            combatRules
          })
      });
    }
  );
}

function battleSetup({
  snapshot,
  party,
  localMembers,
  enemyDraft
}) {
  const active =
    localMembers.find(
      (entry) =>
        entry.member.id ===
        party.activeMemberId
    ) ?? null;

  if (!active) {
    throw new RangeError(
      "Capture party active member is unresolved"
    );
  }

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
            creatureId:
              active.combatDraft.id,
            displayName:
              active.combatDraft.displayName,
            controllerId:
              "human-local",
            roster: Object.freeze({
              activeMemberId:
                party.activeMemberId,
              meexport function buildExplorationEncounterCombatSourceV1({
  snapshot: rawSnapshot,
  creatureRecords,
  partyDefinitions = [],
  configuredCreatureTransfers = [],
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

  const party =
    capturePartyByRef(
      partyDefinitions,
      snapshot.player.partyRef
    );

  const transfersById =
    configuredTransfersById({
      configuredCreatureTransfers,
      statRegistry: registry
    });

  const localMembers =
    configuredPartyMembers({
      party,
      transfersById,
      combatRules
    });

  const activeLocal =
    localMembers.find(
      (entry) =>
        entry.member.id ===
        party.activeMemberId
    ) ?? null;

  if (!activeLocal) {
    throw new RangeError(
      "Capture party active member is unresolved"
    );
  }

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

  const localLoadouts =
    localMembers.map(
      (entry) =>
        entry.transfer.loadout
    );

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
        ...localLoadouts,
        enemyLoadout
      ],
      skillsById
    );

  const exported =
    exportCaptureEditorDraftsToCombatExportV3({
      battleSetup: battleSetup({
        snapshot,
        party,
        localMembers,
        enemyDraft:
          enemyCombatDraft
      }),
      creatureDrafts: [
        ...localMembers.map(
          (entry) =>
            entry.combatDraft
        ),
        enemyCombatDraft
      ],
      skillDrafts,
      loadouts: [
        ...localLoadouts,
        enemyLoadout
      ],
      statRegistry: registry,
      statValues:
        localMembers.map(
          (entry) =>
            entry.transfer.statValues
        ),
      metadata: {
        producer:
          "exploration-encounter-bridge-v1",
        encounterId:
          snapshot.encounterId,
        returnToken:
          snapshot.returnToken,
        playerPartyRef:
          party.id,
        playerPartySource:
          "capture-party-v1"
      }
    });

  return adaptCaptureCombatExportStackV1(
    exported
  );
}
