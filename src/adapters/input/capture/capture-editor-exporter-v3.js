import {
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  normalizeCaptureCreatureEditorDraftV3
} from "../../../contracts/capture-creature-editor-draft-v3.js";
import {
  exportCaptureEditorDraftsToCombatExportV2
} from "./capture-editor-exporter-v2.js";
import {
  normalizeCaptureStatRegistryV1
} from "../../../contracts/capture-stat-registry-v1.js";
import {
  normalizeCaptureCreatureStatValuesV1
} from "../../../contracts/capture-creature-stat-values-v1.js";
import {
  projectCaptureStatEffectsV1
} from "../../../core/combat/capture-stat-effects-v1.js";
import {
  projectCapturePlannedLoadoutsToCombatV1
} from "./capture-planned-loadout-to-combat-v1.js";

const INPUT_FIELDS = new Set([
  "battleSetup",
  "creatureDrafts",
  "skillDrafts",
  "loadouts",
  "statRegistry",
  "statValues",
  "progressionRules",
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

  const combatLoadouts =
    value.progressionRules == null
      ? value.loadouts
      : projectCapturePlannedLoadoutsToCombatV1({
          progressionRules:
            value.progressionRules,
          creatureDrafts,
          skillDrafts: value.skillDrafts,
          loadouts: value.loadouts
        });

  const exportedV2 =
    exportCaptureEditorDraftsToCombatExportV2({
      battleSetup: value.battleSetup,
      creatureDrafts:
        creatureDrafts.map(
          creatureV3ToV2Input
        ),
      skillDrafts: value.skillDrafts,
      loadouts: combatLoadouts,
      metadata: value.metadata ?? {}
    });

  let statEffectsByCreatureId = null;
  let statEffectRulesById = null;

  if (
    value.statRegistry != null ||
    value.statValues != null
  ) {
    if (
      value.statRegistry == null ||
      value.statValues == null
    ) {
      throw new TypeError(
        "statRegistry and statValues must be provided together"
      );
    }

    const registry =
      normalizeCaptureStatRegistryV1(
        value.statRegistry
      );

    statEffectRulesById = Object.freeze(
      Object.fromEntries(
        registry.stats.map((definition) => [
          definition.id,
          Object.freeze({
            damageChannel:
              definition.damageChannel,
            resistanceChannel:
              definition.resistanceChannel,
            damagePctPerPoint:
              definition.damagePctPerPoint,
            resistancePctPerPoint:
              definition.resistancePctPerPoint,
            chargeTimeReductionPctPerPoint:
              definition
                .chargeTimeReductionPctPerPoint,
            ...(
              (
                definition
                  .damageReductionPctPerPoint ??
                0
              ) !== 0
                ? {
                    damageReductionPctPerPoint:
                      definition
                        .damageReductionPctPerPoint
                  }
                : {}
            )
          })
        ])
      )
    );
    const rawStatValues = arrayValue(
      value.statValues,
      "statValues"
    );
    const normalizedStatValues =
      rawStatValues.map((entry) =>
        normalizeCaptureCreatureStatValuesV1(
          entry,
          registry
        )
      );

    const knownCreatureIds = new Set(
      creatureDrafts.map((draft) => draft.id)
    );
    const seenCreatureIds = new Set();

    for (const entry of normalizedStatValues) {
      if (!knownCreatureIds.has(entry.creatureId)) {
        throw new RangeError(
          "statValues references unknown creature: " +
            entry.creatureId
        );
      }
      if (seenCreatureIds.has(entry.creatureId)) {
        throw new RangeError(
          "duplicate statValues creatureId: " +
            entry.creatureId
        );
      }
      seenCreatureIds.add(entry.creatureId);
    }

    statEffectsByCreatureId = new Map(
      normalizedStatValues.map((entry) => {
        const projected =
          projectCaptureStatEffectsV1({
            registry,
            statValues: entry
          });

        return [
          entry.creatureId,
          Object.freeze({
            damagePctByChannel:
              projected.damagePctByChannel,
            resistancePctByChannel:
              projected.resistancePctByChannel,
            chargeTimeReductionPct:
              projected.chargeTimeReductionPct,
            damageReductionPct:
              projected.damageReductionPct,
            maxHp:
              projected.maxHp,
            hasMaxHpProjection:
              projected.hasMaxHpProjection,
            statValuesById:
              Object.freeze({
                ...entry.values
              })
          })
        ];
      })
    );
  }

  const creaturePresentations =
    creatureDrafts
      .map((draft) => draft.presentation)
      .filter(
        (presentation) =>
          presentation !== null
      );

  const creatures =
    statEffectsByCreatureId === null
      ? exportedV2.creatures
      : exportedV2.creatures.map((creature) => {
          const statEffects =
            statEffectsByCreatureId.get(
              creature.id
            );

          if (statEffects === undefined) {
            return creature;
          }

          const {
            initialHp: _legacyInitialHp,
            ...baseCombat
          } = creature.combat;

          return {
            ...creature,
            combat: {
              ...baseCombat,
              ...(
                statEffects.hasMaxHpProjection
                  ? {
                      maxHp:
                        statEffects.maxHp
                    }
                  : {}
              ),
              statEffects: Object.freeze({
                damagePctByChannel:
                  statEffects.damagePctByChannel,
                resistancePctByChannel:
                  statEffects.resistancePctByChannel,
                chargeTimeReductionPct:
                  statEffects.chargeTimeReductionPct,
                ...(
                  statEffects.damageReductionPct !== 0
                    ? {
                        damageReductionPct:
                          statEffects.damageReductionPct
                      }
                    : {}
                )
              }),
              statEffectRulesById,
              statValuesById:
                statEffects.statValuesById
            }
          };
        });

  return normalizeCaptureCombatExportV1({
    ...exportedV2,
    creatures,
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
