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
  capturePortableNativeSkillDraftsV1
} from "../../../catalogs/capture-portable-native-skill-catalog-v1.js";
import {
  captureComplexNativeSkillDraftsV1
} from "../../../catalogs/capture-complex-native-skill-catalog-v1.js";
import {
  exportCaptureEditorDraftsToCombatExportV3
} from "./capture-editor-exporter-v3.js";
import {
  adaptCaptureCombatExportStackV1
} from "./capture-export-adapter-stack-v1.js";

function nativeCatalogDrafts(catalog) {
  const entries =
    Array.isArray(catalog?.entries)
      ? catalog.entries
      : [];

  return entries.map((entry) =>
    normalizeCaptureSkillEditorDraftV1({
      schema: "capture-skill-editor-draft-v1",
      id: entry.definition?.id ?? entry.id,
      description: "Capacité native du laboratoire.",
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

  for (const draft of nativeCatalogDrafts(nativeSkillCatalog)) {
    byId.set(draft.id, draft);
  }

  for (const draft of capturePortableNativeSkillDraftsV1()) {
    byId.set(draft.id, draft);
  }

  for (const draft of captureComplexNativeSkillDraftsV1()) {
    byId.set(draft.id, draft);
  }

  for (const transfer of showcaseSkillTransfers ?? []) {
    const normalized =
      normalizeCaptureSkillTransferV1(transfer);
    byId.set(
      normalized.draft.id,
      normalized.draft
    );
  }

  return byId;
}

function requireSkills(loadouts, skillsById) {
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
    const draft = skillsById.get(id);

    if (!draft) {
      throw new RangeError(
        "Configured showcase duel references unknown skill: " +
          id
      );
    }

    return draft;
  });
}

function battleSetup(moussados, loup) {
  return Object.freeze({
    schema:
      "capture-battle-setup-editor-draft-v1",
    id:
      "showcase-moussados-vs-loup-volcanique",
    localActorId: "local-1",
    arenaId: "lava",
    skillSpeedMultiplier: 1,
    teams: Object.freeze([
      Object.freeze({
        id: "local-team",
        slots: Object.freeze([
          Object.freeze({
            actorId: "local-1",
            creatureId: moussados.draft.id,
            displayName:
              moussados.draft.displayName,
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
            creatureId: loup.draft.id,
            displayName:
              loup.draft.displayName,
            controllerId: "ai-enemy",
            roster: null
          })
        ])
      })
    ])
  });
}

export function buildShowcaseMoussadosLoupDuelSourceV1({
  moussadosTransfer,
  loupTransfer,
  showcaseSkillTransfers,
  nativeSkillCatalog,
  statRegistry
}) {
  const registry =
    normalizeCaptureStatRegistryV1(
      statRegistry
    );

  const moussados =
    normalizeCaptureCreatureTransferV1(
      moussadosTransfer,
      registry
    );
  const loup =
    normalizeCaptureCreatureTransferV1(
      loupTransfer,
      registry
    );

  if (moussados.draft.id !== "crea_mossback") {
    throw new RangeError(
      "Moussados showcase duel requires crea_mossback"
    );
  }

  if (loup.draft.id !== "crea-loup") {
    throw new RangeError(
      "Loup showcase duel requires crea-loup"
    );
  }

  const skillsById = configuredSkillDrafts({
    nativeSkillCatalog,
    showcaseSkillTransfers
  });

  const loadouts = [
    moussados.loadout,
    loup.loadout
  ];

  const skillDrafts =
    requireSkills(
      loadouts,
      skillsById
    );

  const exported =
    exportCaptureEditorDraftsToCombatExportV3({
      battleSetup:
        battleSetup(
          moussados,
          loup
        ),
      creatureDrafts: [
        moussados.draft,
        loup.draft
      ],
      skillDrafts,
      loadouts,
      statRegistry: registry,
      statValues: [
        moussados.statValues,
        loup.statValues
      ],
      metadata: {
        producer:
          "showcase-moussados-loup-duel-v1"
      }
    });

  return adaptCaptureCombatExportStackV1(
    exported
  );
}
