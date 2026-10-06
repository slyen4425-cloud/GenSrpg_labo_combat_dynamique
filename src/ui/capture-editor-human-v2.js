import { buildCaptureEditorCombatTestV1, prepareCaptureEditorCombatEditsV1, mountCaptureEditorCombatTeamControlsV1 } from "./capture-editor-combat-test-v1.js";
import {
  skillSpriteControlsFromFieldsV1,
  skillSpriteControlFieldsFromVisualsV1,
  readSkillSpriteControlsV1,
  writeSkillSpriteControlsV1,
  appendStatusSpriteControlsV1,
  readStatusSpriteControlsV1
} from "./capture-editor-sprite-controls-v1.js";
import {
  normalizeCaptureCreatureEditorDraftV2
} from "../contracts/capture-creature-editor-draft-v2.js";
import {
  normalizeCaptureCreatureEditorDraftV3
} from "../contracts/capture-creature-editor-draft-v3.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../contracts/capture-skill-editor-draft-v1.js";
import {
  normalizeSkillDefinition,
  SKILL_ACTIVATION_REQUIREMENT_MODES,
  SKILL_ACTIVATION_REQUIREMENT_TYPES
} from "../contracts/skill-definition.js";
import {
  normalizeSkillEffectV1,
  SKILL_EFFECT_V1_KINDS,
  SKILL_EFFECT_V1_TARGET_SCOPES
} from "../contracts/skill-effect-v1.js";
import {
  STATUS_EFFECT_V1_KINDS,
  STATUS_EFFECT_V1_POLARITIES,
  STATUS_EFFECT_V1_STACKING
} from "../contracts/status-effect-v1.js";
import {
  CAPTURE_ULTIMATE_SKILL_SLOT_ID,
  normalizeCaptureActiveSkillLoadoutV1
} from "../contracts/capture-active-skill-loadout-v1.js";
import {
  normalizeCaptureBattleSetupEditorDraftV1,
  CAPTURE_COMBAT_REFERENCE_SPEED_V1,
  captureCombatPaceToSkillSpeedV1
} from "../contracts/capture-battle-setup-editor-draft-v1.js";
import {
  exportCaptureEditorDraftsToCombatExportV2
} from "../adapters/input/capture/capture-editor-exporter-v2.js";
import {
  exportCaptureEditorDraftsToCombatExportV3
} from "../adapters/input/capture/capture-editor-exporter-v3.js";
import {
  GLOBAL_VISUAL_LIBRARY,
  globalVisualAssetUrl
} from "../assets/global-visual-library.js";
import {
  capturePortableNativeSkillDraftsV1
} from "../catalogs/capture-portable-native-skill-catalog-v1.js";
import {
  captureComplexNativeSkillDraftsV1
} from "../catalogs/capture-complex-native-skill-catalog-v1.js";
import {
  canonicalCaptureCreatureRecordsV1
} from "../catalogs/capture-canonical-creature-catalog-v1.js";
import {
  buildPrivateAudioRoleGroupsV1
} from "./private-audio-role-groups-v1.js";
import {
  resolveCaptureSkillSaveModeV1,
  nextCaptureSkillDraftIdV1
} from "./capture-editor-skill-save-mode-v1.js";
import {
  resolveCaptureCreatureSaveModeV1,
  nextCaptureCreatureDraftIdV1
} from "./capture-editor-creature-save-mode-v1.js";
import {
  importMonsterCaptureCreatureRecordV1
} from "../adapters/input/capture/monster-capture-creature-import-v1.js";
import {
  normalizeCaptureCombatRulesEditorDraftV1
} from "../contracts/capture-combat-rules-editor-draft-v1.js";
import {
  CAPTURE_CREATURE_VISUAL_BINDINGS_V1,
  captureCreatureVisualBindingForIdV1
} from "../catalogs/capture-creature-visual-bindings-v1.js";
import {
  applyCaptureCreatureVisualBindingV1
} from "../adapters/input/capture/capture-creature-visual-binding-v1.js";
import {
  buildCaptureCreatureHistoricalLoadoutV1
} from "../catalogs/capture-creature-historical-loadout-v1.js";
import {
  CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1
} from "../catalogs/capture-showcase-creature-presets-v1.js";
import {
  CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1
} from "../catalogs/capture-showcase-skill-presets-v1.js";
import {
  CAPTURE_FX_STARTER_PROFILES_V1,
  captureFxStarterProfileByIdV1,
  applyCaptureFxStarterProfileV1
} from "../catalogs/capture-fx-starter-profile-catalog-v1.js";
import {
  CAPTURE_FX_GLOW_PRESETS_V1,
  captureFxGlowPresetByIdV1,
  applyCaptureFxGlowPresetV1,
  captureFxGlowPresetIdForValuesV1
} from "../catalogs/capture-fx-glow-presets-v1.js";
import {
  captureFxParticlePresetByIdV1,
  applyCaptureFxParticlePresetV1,
  captureFxParticlePresetIdForValuesV1
} from "../catalogs/capture-fx-particle-presets-v1.js";
import {
  normalizeCaptureStatRegistryV1
} from "../contracts/capture-stat-registry-v1.js";
import {
  normalizeCaptureCreatureStatValuesV1
} from "../contracts/capture-creature-stat-values-v1.js";
import {
  projectCaptureStatDefinitionEffectsV1,
  projectCaptureStatEffectsV1
} from "../core/combat/capture-stat-effects-v1.js";
import {
  normalizeCaptureProgressionRulesV1,
  captureActiveSkillSlotsForLevelV1
} from "../contracts/capture-progression-rules-v1.js";
import {
  importMonsterCaptureStatValuesV1
} from "../adapters/input/capture/monster-capture-stat-values-v1.js";
import {
  exportCaptureCreatureTransferJsonV1,
  exportCaptureSkillTransferJsonV1,
  importCaptureTransferJsonV1,
  planCaptureTransferImportV1
} from "../adapters/input/capture/capture-entity-transfer-v1.js";
import {
  exportCaptureDatabaseJsonV1
} from "../adapters/input/capture/capture-database-transfer-v1.js";
import {
  buildCaptureEditorDatabaseV1,
  applyCaptureTransferPlanToEditorStateV1,
  applyCaptureTransferBatchToEditorStateV1
} from "./capture-editor-file-transfer-v1.js";
import {
  validateCaptureLoadoutSkillSlotsV1
} from "../adapters/input/capture/capture-loadout-skill-slot-v1.js";

const PRIVATE_AUDIO_CATALOG_URL = new URL(
  "../../data/presentation/audio/private-audio-catalog.v1.json",
  import.meta.url
);

const NATIVE_SKILL_CATALOG_URL = new URL(
  "../../data/combat/skills/catalog.v1.json",
  import.meta.url
);

const MONSTER_CAPTURE_CREATURE_CATALOG_URL = new URL(
  "../../data/capture/monster-capture-creatures.v1.json",
  import.meta.url
);

const MONSTER_CAPTURE_STAT_REGISTRY_URL = new URL(
  "../../data/capture/monster-capture-stat-registry.v1.json",
  import.meta.url
);

const MONSTER_CAPTURE_PROGRESSION_RULES_URL = new URL(
  "../../data/capture/monster-capture-progression-rules.v1.json",
  import.meta.url
);

const EDITOR_VISUAL_ASSETS_BY_ROOT =
  new WeakMap();

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(field + " est obligatoire");
  }
  return value.trim();
}

function optionalText(value) {
  if (value == null) {
    return null;
  }
  const text = String(value).trim();
  return text === "" ? null : text;
}


const HUMAN_MOBILITY_TEMPO_PRESETS_V1 =
  Object.freeze({
    "very-fast": -40,
    fast: -20,
    normal: 0,
    slow: 25,
    "very-slow": 50
  });

export function humanMobilityTempoPresetValueV1(
  presetId
) {
  const id = String(presetId ?? "").trim();
  if (
    !Object.prototype.hasOwnProperty.call(
      HUMAN_MOBILITY_TEMPO_PRESETS_V1,
      id
    )
  ) {
    throw new RangeError(
      "Preset de mobilité inconnu : " + id
    );
  }
  return HUMAN_MOBILITY_TEMPO_PRESETS_V1[id];
}

export function humanMobilityTempoPresetIdV1(
  modifierPct
) {
  const value = finiteNumber(
    modifierPct,
    "Tempo de mobilité"
  );
  for (
    const [id, presetValue] of
    Object.entries(
      HUMAN_MOBILITY_TEMPO_PRESETS_V1
    )
  ) {
    if (presetValue === value) {
      return id;
    }
  }
  return "custom";
}


export function humanTacticalSecondsToMsV1(value) {
  const number = finiteNumber(
    value,
    "Durée tactique"
  );
  if (number < 0) {
    throw new RangeError(
      "Durée tactique doit être positive ou nulle"
    );
  }
  return Math.round(number * 1000);
}

export function humanTacticalMsToSecondsV1(value) {
  const number = finiteNumber(
    value,
    "Durée tactique"
  );
  if (number < 0) {
    throw new RangeError(
      "Durée tactique doit être positive ou nulle"
    );
  }
  return number / 1000;
}

export function humanTacticalStatusStatIdsV1(
  registry
) {
  return normalizeCaptureStatRegistryV1(
    registry
  ).stats.map((entry) => entry.id);
}

function humanTacticalStatusToContractV1(
  status,
  {
    defaultDamageChannel = null
  } = {}
) {
  if (
    !status ||
    typeof status !== "object" ||
    Array.isArray(status)
  ) {
    throw new TypeError(
      "Statut tactique invalide"
    );
  }

  const output = {
    id: requiredText(
      status.id,
      "ID du statut"
    ),
    kind: requiredText(
      status.kind,
      "Type du statut"
    ),
    polarity: requiredText(
      status.polarity,
      "Polarité du statut"
    ),
    durationMs:
      status.durationMs != null
        ? finiteNumber(
            status.durationMs,
            "Durée du statut"
          )
        : humanTacticalSecondsToMsV1(
            status.durationSeconds
          ),
    stacking:
      status.stacking ?? "refresh",
    tags: stableIds(status.tags)
  };

  if (
    output.stacking === "stack"
  ) {
    output.maxStacks = positiveInteger(
      status.maxStacks ?? 1,
      "Stacks max"
    );
  }

  if (output.kind === "stat_modifier") {
    output.statId = requiredText(
      status.statId,
      "Statistique du statut"
    );
    output.deltaPoints = finiteNumber(
      status.deltaPoints,
      "Variation de statistique"
    );
  }

  if (output.kind === "approach_time_modifier") {
    output.modifierPct = finiteNumber(status.modifierPct, "Variation du temps de trajet (%)");
  }

  if (
    output.kind === "damage_over_time" ||
    output.kind === "heal_over_time"
  ) {
    output.amount = finiteNumber(
      status.amount,
      "Valeur périodique"
    );
    output.tickIntervalMs =
      status.tickIntervalMs != null
        ? finiteNumber(
            status.tickIntervalMs,
            "Intervalle du statut"
          )
        : humanTacticalSecondsToMsV1(
            status.tickSeconds
          );
  }

  if (output.kind === "damage_over_time") {
    const damageChannel =
      optionalText(status.channel) ??
      optionalText(defaultDamageChannel);

    output.channel = requiredText(
      damageChannel,
      "Élément des dégâts périodiques"
    );
  }

  if (output.kind === "shield") {
    output.amount = finiteNumber(
      status.amount,
      "Valeur du bouclier"
    );
  }

  if (output.kind === "immunity") {
    output.domains = stableIds(
      status.domains
    );
  }

  return output;
}

export function buildHumanTacticalSkillEffectsV1(
  effects,
  {
    defaultDamageChannel = null
  } = {}
) {
  if (!Array.isArray(effects)) {
    throw new TypeError(
      "Les effets tactiques doivent être une liste"
    );
  }

  return effects.map((effect) => {
    if (
      !effect ||
      typeof effect !== "object" ||
      Array.isArray(effect)
    ) {
      throw new TypeError(
        "Effet tactique invalide"
      );
    }

    const kind = requiredText(
      effect.kind,
      "Type d’effet tactique"
    );
    const targetScope = requiredText(
      effect.targetScope,
      "Cible d’effet tactique"
    );

    if (kind === "scheduled_effect") {
      const delayMs =
        effect.trigger?.delayMs != null
          ? finiteNumber(
              effect.trigger.delayMs,
              "Délai de l’effet programmé"
            )
          : humanTacticalSecondsToMsV1(
              effect.delaySeconds
            );

      return normalizeSkillEffectV1({
        kind,
        targetScope,
        trigger: {
          type: "after_ms",
          delayMs
        },
        effects:
          buildHumanTacticalSkillEffectsV1(
            effect.effects ?? [],
            {
              defaultDamageChannel
            }
          )
      });
    }

    if (kind === "scheduled_effect") {
      const nestedKind = row.querySelector(
        "[data-skill-scheduled-effect-kind]"
      ).value;
      const nested = {
        kind: nestedKind,
        targetScope: "target",
        amount: Number(
          row.querySelector(
            "[data-skill-scheduled-effect-amount]"
          ).value
        )
      };
      if (nestedKind === "damage") {
        nested.channel =
          row.querySelector(
            "[data-skill-scheduled-effect-channel]"
          ).value || null;
      }

      return {
        kind,
        targetScope: "target",
        delaySeconds: Number(
          row.querySelector(
            "[data-skill-scheduled-delay-seconds]"
          ).value
        ),
        effects: [nested]
      };
    }

    if (kind === "persistent_zone") {
      const tickEffect =
        effect.tickEffect ?? {};

      const radiusGrowthSteps =
        finiteNumber(
          effect.radiusGrowthSteps ?? 0,
          "Croissance du rayon"
        );
      if (
        !Number.isInteger(radiusGrowthSteps) ||
        radiusGrowthSteps < 0
      ) {
        throw new RangeError(
          "Croissance du rayon doit être un entier positif ou nul"
        );
      }

      return normalizeSkillEffectV1({
        kind,
        targetScope,
        zoneId: requiredText(
          effect.zoneId,
          "ID de zone"
        ),
        radius: requiredText(
          effect.radius ?? "short",
          "Rayon initial"
        ),
        durationMs:
          effect.durationMs != null
            ? finiteNumber(
                effect.durationMs,
                "Durée de zone"
              )
            : humanTacticalSecondsToMsV1(
                effect.durationSeconds
              ),
        tickIntervalMs:
          effect.tickIntervalMs != null
            ? finiteNumber(
                effect.tickIntervalMs,
                "Intervalle de zone"
              )
            : humanTacticalSecondsToMsV1(
                effect.tickSeconds
              ),
        reactivation: requiredText(
          effect.reactivation ?? "refresh",
          "Réactivation de zone"
        ),
        maxActivations: positiveInteger(
          effect.maxActivations ?? 1,
          "Activations max de zone"
        ),
        radiusGrowthSteps,
        tickEffect: {
          kind: "damage",
          targetScope:
            tickEffect.targetScope ??
            targetScope,
          amount: finiteNumber(
            tickEffect.amount ??
              effect.tickDamage ??
              0,
            "Dégâts par tick de zone"
          ),
          channel:
            optionalText(
              tickEffect.channel ??
              effect.channel
            )
        }
      });
    }

    if (kind === "apply_status") {
      return normalizeSkillEffectV1({
        kind,
        targetScope,
        status:
          humanTacticalStatusToContractV1(
            effect.status,
            {
              defaultDamageChannel
            }
          )
      });
    }

    if (
      kind === "cleanse" ||
      kind === "dispel"
    ) {
      return normalizeSkillEffectV1({
        kind,
        targetScope,
        statusTags: stableIds(
          effect.statusTags
        )
      });
    }

    if (kind === "damage") {
      return normalizeSkillEffectV1({
        kind,
        targetScope,
        amount: finiteNumber(
          effect.amount,
          "Dégâts tactiques"
        ),
        channel:
          optionalText(effect.channel)
      });
    }

    return normalizeSkillEffectV1({
      kind,
      targetScope,
      amount: finiteNumber(
        effect.amount,
        "Valeur d’effet tactique"
      )
    });
  });
}


const CAPTURE_EDITOR_COMPAT_DISTANCES_V1 =
  Object.freeze([
    "short",
    "medium",
    "long"
  ]);

const TARGET_RELATION_ORDER_V1 =
  Object.freeze([
    "enemy",
    "ally",
    "self"
  ]);

function addTargetRelationsV1(target, relations) {
  for (const relation of relations) {
    target.add(relation);
  }
}

function targetRelationsForTargetScopedEffectV1(effect) {
  switch (effect.kind) {
    case "damage":
    case "energy_drain":
    case "dispel":
      return ["enemy"];

    case "heal":
    case "energy_restore":
    case "cleanse":
      return ["ally", "self"];

    case "apply_status": {
      const polarity =
        effect.status?.polarity ?? "neutral";
      if (polarity === "detrimental") {
        return ["enemy"];
      }
      if (polarity === "beneficial") {
        return ["ally", "self"];
      }
      return ["enemy", "ally", "self"];
    }

    default:
      return ["enemy"];
  }
}

export function humanSkillTargetRelationsFromTacticalEffectsV1(
  effects,
  {
    form = null
  } = {}
) {
  if (!Array.isArray(effects)) {
    throw new TypeError(
      "Les effets tactiques doivent être une liste"
    );
  }

  const relations = new Set();

  for (const effect of effects) {
    switch (effect.targetScope) {
      case "self":
        relations.add("self");
        break;

      case "all_enemies":
        relations.add("enemy");
        break;

      case "all_allies":
        addTargetRelationsV1(
          relations,
          ["ally", "self"]
        );
        break;

      case "all_except_self":
        addTargetRelationsV1(
          relations,
          ["enemy", "ally"]
        );
        break;

      case "target":
        addTargetRelationsV1(
          relations,
          targetRelationsForTargetScopedEffectV1(
            effect
          )
        );
        break;

      default:
        throw new RangeError(
          "Cible d’effet tactique inconnue : " +
            effect.targetScope
        );
    }
  }

  if (relations.size === 0) {
    relations.add(
      form === "self"
        ? "self"
        : "enemy"
    );
  }

  return TARGET_RELATION_ORDER_V1.filter(
    (relation) => relations.has(relation)
  );
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(field + " doit être un nombre");
  }
  return number;
}

function positiveInteger(value, field) {
  const number = finiteNumber(value, field);
  if (!Number.isInteger(number) || number < 1) {
    throw new RangeError(field + " doit être un entier supérieur ou égal à 1");
  }
  return number;
}

function stableIds(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .map((value) => optionalText(value))
    .filter((value) => value !== null);
}


function activationRequirementTypeMetaV1(type) {
  switch (type) {
    case "combat_elapsed_ms":
      return Object.freeze({
        label: "Temps de combat écoulé",
        unit: "secondes",
        step: 0.1,
        max: null
      });
    case "damage_dealt":
      return Object.freeze({
        label: "Dégâts infligés",
        unit: "dégâts",
        step: 1,
        max: null
      });
    case "damage_taken":
      return Object.freeze({
        label: "Dégâts subis",
        unit: "dégâts",
        step: 1,
        max: null
      });
    case "hp_at_or_below_pct":
      return Object.freeze({
        label: "PV ≤",
        unit: "% PV max",
        step: 1,
        max: 100
      });
    case "allies_defeated":
      return Object.freeze({
        label: "Alliés KO",
        unit: "allié(s)",
        step: 1,
        max: null
      });
    case "enemies_defeated":
      return Object.freeze({
        label: "Ennemis KO",
        unit: "ennemi(s)",
        step: 1,
        max: null
      });
    case "kills_by_self":
      return Object.freeze({
        label: "KO réalisés par le lanceur",
        unit: "KO",
        step: 1,
        max: null
      });
    default:
      throw new RangeError(
        "Type de condition d’activation inconnu : " +
          type
      );
  }
}

export function humanSkillActivationThresholdToContractV1(
  type,
  value
) {
  if (
    !SKILL_ACTIVATION_REQUIREMENT_TYPES.includes(type)
  ) {
    throw new RangeError(
      "Type de condition d’activation inconnu : " +
        type
    );
  }

  const number = finiteNumber(
    value,
    "Seuil d’activation"
  );
  if (number < 0) {
    throw new RangeError(
      "Seuil d’activation doit être positif ou nul"
    );
  }

  if (
    type === "hp_at_or_below_pct" &&
    number > 100
  ) {
    throw new RangeError(
      "Le seuil de PV doit être compris entre 0 et 100 %"
    );
  }

  return type === "combat_elapsed_ms"
    ? number * 1000
    : number;
}

export function humanSkillActivationThresholdFromContractV1(
  type,
  threshold
) {
  if (
    !SKILL_ACTIVATION_REQUIREMENT_TYPES.includes(type)
  ) {
    throw new RangeError(
      "Type de condition d’activation inconnu : " +
        type
    );
  }

  const number = finiteNumber(
    threshold,
    "Seuil d’activation"
  );

  return type === "combat_elapsed_ms"
    ? number / 1000
    : number;
}

export function buildHumanSkillActivationRequirementsV1({
  enabled,
  mode = "all",
  conditions = []
}) {
  if (enabled !== true) {
    return {
      mode: "all",
      conditions: []
    };
  }

  if (
    !SKILL_ACTIVATION_REQUIREMENT_MODES.includes(mode)
  ) {
    throw new RangeError(
      "Mode de conditions d’activation inconnu"
    );
  }

  if (
    !Array.isArray(conditions) ||
    conditions.length === 0
  ) {
    throw new RangeError(
      "Ajoute au moins une condition d’activation"
    );
  }

  return {
    mode,
    conditions: conditions.map(
      (condition) => ({
        type: requiredText(
          condition.type,
          "Type de condition"
        ),
        threshold:
          humanSkillActivationThresholdToContractV1(
            condition.type,
            condition.value
          )
      })
    )
  };
}

export function buildHumanCreatureStatValuesV1({
  creatureId,
  values,
  registry
}) {
  return normalizeCaptureCreatureStatValuesV1(
    {
      schema: "capture-creature-stat-values-v1",
      creatureId: requiredText(
        creatureId,
        "ID créature"
      ),
      values: values ?? {}
    },
    registry
  );
}

export function buildHumanStatRegistryV1({
  definitions
}) {
  return normalizeCaptureStatRegistryV1({
    schema: "capture-stat-registry-v1",
    stats: Array.isArray(definitions)
      ? definitions
      : []
  });
}

export function addHumanCustomStatDefinitionV1({
  registry,
  definition
}) {
  const current =
    normalizeCaptureStatRegistryV1(registry);

  return buildHumanStatRegistryV1({
    definitions: [
      ...current.stats,
      definition
    ]
  });
}

export function buildHumanEvolutionV1({
  enabled,
  targetId,
  level
}) {
  if (enabled !== true) {
    return null;
  }

  return Object.freeze({
    condition: "level",
    level: positiveInteger(
      level,
      "Niveau d’évolution"
    ),
    targetId: requiredText(
      targetId,
      "Créature cible de l’évolution"
    )
  });
}

export function buildHumanProgressionRulesV1({
  maxActiveSkills,
  slotUnlockSchedule
}) {
  const rules =
    normalizeCaptureProgressionRulesV1({
      schema: "capture-progression-rules-v1",
      maxActiveSkills: positiveInteger(
        maxActiveSkills,
        "Maximum de capacités actives"
      ),
      slotUnlockSchedule:
        Array.isArray(slotUnlockSchedule)
          ? slotUnlockSchedule
          : []
    });

  if (rules.maxActiveSkills > 4) {
    throw new RangeError(
      "Le loadout Capture V1 accepte au maximum 4 capacités actives"
    );
  }

  return rules;
}

export function humanLoadoutAvailabilityV1({
  progressionRules,
  creatureLevel
}) {
  const rules =
    normalizeCaptureProgressionRulesV1(
      progressionRules
    );
  const unlocked =
    captureActiveSkillSlotsForLevelV1(
      rules,
      positiveInteger(
        creatureLevel,
        "Niveau créature"
      )
    );

  return Object.freeze(
    [0, 1, 2, 3].map(
      (index) =>
        index < Math.min(4, unlocked)
    )
  );
}

export function validateHumanLoadoutProgressionV1({
  loadout,
  progressionRules,
  creatureLevel,
  skillDrafts = []
}) {
  if (
    !loadout ||
    !Array.isArray(loadout.slots)
  ) {
    throw new TypeError(
      "Loadout Capture invalide"
    );
  }

  humanLoadoutAvailabilityV1({
    progressionRules,
    creatureLevel: positiveInteger(
      creatureLevel,
      "Niveau créature"
    )
  });

  validateCaptureLoadoutSkillSlotsV1({
    loadout,
    skillDrafts
  });

  return loadout;
}

function legacySourceStatsV1(previousDraft) {
  const source =
    previousDraft?.sourceStats;

  if (
    source &&
    typeof source === "object"
  ) {
    return {
      force: Number(source.force) || 0,
      agility: Number(source.agility) || 0,
      intelligence:
        Number(source.intelligence) || 0,
      spirit: Number(source.spirit) || 0,
      endurance: Number(source.endurance) || 0,
      initiative:
        Number(source.initiative) || 0
    };
  }

  return {
    force: 0,
    agility: 0,
    intelligence: 0,
    spirit: 0,
    endurance: 0,
    initiative: 0
  };
}

function resistanceEntries(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (!raw || typeof raw !== "object") {
    return [];
  }

  return Object.entries(raw)
    .filter(([, value]) => value !== "" && value != null)
    .map(([element, value]) => ({
      kind: element.includes(":") ? element : "element:" + element,
      value: finiteNumber(value, "Résistance " + element)
    }));
}

function audioSlots(raw) {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const output = {};
  for (const role of ["attack", "hit", "ko"]) {
    const entry = raw[role];
    if (entry == null || entry === "") {
      continue;
    }

    if (typeof entry === "string") {
      output[role] = {
        assetId: requiredText(entry, "Son " + role)
      };
      continue;
    }

    output[role] = {
      assetId: requiredText(
        entry.assetId,
        "Son " + role
      ),
      ...(entry.volume == null
        ? {}
        : { volume: finiteNumber(entry.volume, "Volume " + role) })
    };
  }

  return output;
}

function visualSlot(assetId, {
  attachment,
  trigger,
  anchor = null,
  layerByView = null,
  displayScale = 1,
  displayScaleX = 1,
  displayScaleY = 1,
  offsetX = 0,
  offsetY = 0,
  durationMs = null,
  playbackMode = "once"
}) {
  const id = optionalText(assetId);
  if (id === null) {
    return null;
  }

  const normalizedScale = finiteNumber(
    displayScale,
    "Scale FX"
  );
  if (
    normalizedScale < 0.25 ||
    normalizedScale > 8
  ) {
    throw new RangeError(
      "Scale FX doit être compris entre 0.25 et 8"
    );
  }

  const normalizedScaleX = finiteNumber(
    displayScaleX,
    "Scale horizontal FX"
  );
  const normalizedScaleY = finiteNumber(
    displayScaleY,
    "Scale vertical FX"
  );
  for (const [label, value] of [
    ["horizontal", normalizedScaleX],
    ["vertical", normalizedScaleY]
  ]) {
    if (value < 0.25 || value > 8) {
      throw new RangeError(
        `Scale ${label} FX doit être compris entre 0.25 et 8`
      );
    }
  }

  return {
    assetId: id,
    attachment,
    trigger,
    anchor,
    displayScale: normalizedScale,
    displayScaleX: normalizedScaleX,
    displayScaleY: normalizedScaleY,
    layerByView: {
      player:
        layerByView?.player ?? "front",
      opponent:
        layerByView?.opponent ?? "front"
    },
    playbackMode,
    ...(durationMs == null ? {} : { durationMs }),
    offsetX: finiteNumber(
      offsetX,
      "Décalage horizontal FX"
    ),
    offsetY: finiteNumber(
      offsetY,
      "Décalage vertical FX"
    ),
    rotationDeg: 0,
    opacity: 1
  };
}

function audioSkillSlot(
  assetId,
  { loop = false } = {}
) {
  const id = optionalText(assetId);
  return id === null
    ? null
    : {
        assetId: id,
        volume: 1,
        loop: loop === true
      };
}

function presentationFeedbackFromFieldsV1(
  presentation
) {
  const glowStrength = Math.max(
    0,
    Math.min(
      1,
      Number(
        presentation.fxGlowStrength
      ) || 0
    )
  );
  const flashOpacity = Math.max(
    0,
    Math.min(
      1,
      Number(
        presentation.impactFlashOpacity
      ) || 0
    )
  );
  const shakeAmplitude = Math.max(
    0,
    Number(
      presentation.impactShakeAmplitudePx
    ) || 0
  );

  function boundedParticleCount(
    value,
    maximum,
    field
  ) {
    const number = Number(value) || 0;
    if (
      !Number.isInteger(number) ||
      number < 0 ||
      number > maximum
    ) {
      throw new RangeError(
        field +
          " doit être un entier entre 0 et " +
          maximum
      );
    }
    return number;
  }

  const trailCount =
    boundedParticleCount(
      presentation.projectileTrailCount,
      10,
      "Particules de traînée"
    );
  const burstCount =
    boundedParticleCount(
      presentation.impactBurstCount,
      18,
      "Particules d’impact"
    );
  const castBurstCount =
    boundedParticleCount(
      presentation.castBurstCount,
      12,
      "Particules de Cast"
    );
  const smokeCount =
    boundedParticleCount(
      presentation.aftermathSmokeCount,
      8,
      "Volutes de fumée"
    );

  if (
    glowStrength <= 0 &&
    flashOpacity <= 0 &&
    shakeAmplitude <= 0 &&
    castBurstCount <= 0 &&
    trailCount <= 0 &&
    burstCount <= 0 &&
    smokeCount <= 0
  ) {
    return null;
  }

  const feedback = {};

  if (glowStrength > 0) {
    feedback.glow = {
      color:
        String(
          presentation.fxGlowColor ??
            "#ffffff"
        ),
      strength: glowStrength,
      radiusPx: Math.max(
        1,
        finiteNumber(
          presentation.fxGlowRadiusPx ?? 16,
          "Rayon glow FX"
        )
      )
    };
  }

  if (flashOpacity > 0) {
    feedback.impactFlash = {
      color:
        String(
          presentation.impactFlashColor ??
            "#ffffff"
        ),
      opacity: flashOpacity,
      durationMs: Math.max(
        1,
        finiteNumber(
          presentation.impactFlashDurationMs ??
            120,
          "Durée flash impact"
        )
      ),
      scale: Math.max(
        0.1,
        finiteNumber(
          presentation.impactFlashScale ??
            1.5,
          "Scale flash impact"
        )
      )
    };
  }

  if (shakeAmplitude > 0) {
    feedback.cameraShake = {
      amplitudePx: shakeAmplitude,
      durationMs: Math.max(
        1,
        finiteNumber(
          presentation.impactShakeDurationMs ??
            140,
          "Durée shake impact"
        )
      )
    };
  }

  if (castBurstCount > 0) {
    feedback.castBurst = {
      color:
        String(
          presentation.castBurstColor ??
            presentation.fxGlowColor ??
            "#ffffff"
        ),
      count: castBurstCount,
      spreadPx: Math.max(
        1,
        finiteNumber(
          presentation.castBurstSpreadPx,
          "Dispersion particules Cast"
        )
      ),
      sizePx: Math.max(
        1,
        finiteNumber(
          presentation.castBurstSizePx,
          "Taille particule Cast"
        )
      ),
      risePx: Math.max(
        1,
        finiteNumber(
          presentation.castBurstRisePx,
          "Montée particules Cast"
        )
      ),
      durationMs: Math.max(
        1,
        finiteNumber(
          presentation.castBurstDurationMs,
          "Durée particules Cast"
        )
      ),
      opacity: Math.max(
        0,
        Math.min(
          1,
          finiteNumber(
            presentation.castBurstOpacity,
            "Opacité particules Cast"
          )
        )
      )
    };
  }

  if (trailCount > 0) {
    feedback.projectileTrail = {
      color:
        String(
          presentation.projectileTrailColor ??
            presentation.fxGlowColor ??
            "#ffffff"
        ),
      count: trailCount,
      lengthPx: Math.max(
        1,
        finiteNumber(
          presentation.projectileTrailLengthPx,
          "Longueur traînée"
        )
      ),
      sizePx: Math.max(
        1,
        finiteNumber(
          presentation.projectileTrailSizePx,
          "Taille particule traînée"
        )
      ),
      opacity: Math.max(
        0,
        Math.min(
          1,
          finiteNumber(
            presentation.projectileTrailOpacity,
            "Opacité traînée"
          )
        )
      ),
      anchorX: Math.max(
        0,
        Math.min(
          1,
          finiteNumber(
            presentation.projectileTrailAnchorX ?? 0.5,
            "Ancrage horizontal traînée"
          )
        )
      ),
      anchorY: Math.max(
        0,
        Math.min(
          1,
          finiteNumber(
            presentation.projectileTrailAnchorY ?? 0.5,
            "Ancrage vertical traînée"
          )
        )
      )
    };
  }

  if (burstCount > 0) {
    feedback.impactBurst = {
      color:
        String(
          presentation.impactBurstColor ??
            presentation.impactFlashColor ??
            presentation.fxGlowColor ??
            "#ffffff"
        ),
      count: burstCount,
      spreadPx: Math.max(
        1,
        finiteNumber(
          presentation.impactBurstSpreadPx,
          "Dispersion particules impact"
        )
      ),
      sizePx: Math.max(
        1,
        finiteNumber(
          presentation.impactBurstSizePx,
          "Taille particule impact"
        )
      ),
      durationMs: Math.max(
        1,
        finiteNumber(
          presentation.impactBurstDurationMs,
          "Durée particules impact"
        )
      ),
      opacity: Math.max(
        0,
        Math.min(
          1,
          finiteNumber(
            presentation.impactBurstOpacity,
            "Opacité particules impact"
          )
        )
      )
    };
  }

  if (smokeCount > 0) {
    feedback.aftermathSmoke = {
      color:
        String(
          presentation.aftermathSmokeColor ??
            "#594943"
        ),
      count: smokeCount,
      spreadPx: Math.max(
        1,
        finiteNumber(
          presentation.aftermathSmokeSpreadPx,
          "Dispersion fumée"
        )
      ),
      sizePx: Math.max(
        1,
        finiteNumber(
          presentation.aftermathSmokeSizePx,
          "Taille fumée"
        )
      ),
      risePx: Math.max(
        1,
        finiteNumber(
          presentation.aftermathSmokeRisePx,
          "Montée fumée"
        )
      ),
      durationMs: Math.max(
        1,
        finiteNumber(
          presentation.aftermathSmokeDurationMs,
          "Durée fumée"
        )
      ),
      opacity: Math.max(
        0,
        Math.min(
          1,
          finiteNumber(
            presentation.aftermathSmokeOpacity,
            "Opacité fumée"
          )
        )
      )
    };
  }

  return feedback;
}

function presentationForSkill(fields) {
  const presentation = fields.presentation ?? {};
  const iconAssetId = optionalText(
    presentation.iconAssetId
  );
  const socketId = optionalText(
    presentation.socketId
  );
  const statusVisuals =
    presentation.statusVisuals &&
    typeof presentation.statusVisuals === "object"
      ? presentation.statusVisuals
      : {};
  const hasStatusVisuals =
    Object.keys(statusVisuals).length > 0;
  const feedback =
    presentationFeedbackFromFieldsV1(
      presentation
    );
  const hasFeedback =
    feedback !== null;

  const cast = visualSlot(
    presentation.castAssetId,
    {
      attachment: "source",
      trigger: "preparation-start",
      anchor: socketId,
      displayScale:
        presentation.castDisplayScale ?? 1,
      layerByView: {
        player:
          presentation.castLayerPlayer ??
          "front",
        opponent:
          presentation.castLayerOpponent ??
          "front"
      },
      ...skillSpriteControlsFromFieldsV1(presentation, "cast")
    }
  );
  const travel = visualSlot(
    presentation.travelAssetId,
    {
      attachment: "trajectory",
      trigger: "travel-start",
      anchor: socketId,
      displayScale:
        presentation.travelDisplayScale ?? 1,
      playbackMode:
        presentation.travelPlaybackMode ?? "stretch",
      layerByView: {
        player:
          presentation.travelLayerPlayer ??
          "front",
        opponent:
          presentation.travelLayerOpponent ??
          "front"
      }
    }
  );
  const impact = visualSlot(
    presentation.impactAssetId,
    {
      attachment: "fixed-target",
      trigger: "impact",
      anchor: null,
      displayScale:
        presentation.impactDisplayScale ?? 1,
      durationMs: presentation.impactDurationMs == null || presentation.impactDurationMs === 0
        ? null : finiteNumber(presentation.impactDurationMs, "Durée visuelle de l’impact"),
      playbackMode: presentation.impactDurationMs > 0 ? "stretch" : "once",
      offsetX: presentation.impactOffsetX ?? 0,
      offsetY: presentation.impactOffsetY ?? 0,
      ...skillSpriteControlsFromFieldsV1(presentation, "impact")
    }
  );
  const persistentZone = visualSlot(
    presentation.zoneAssetId,
    {
      attachment: "source",
      trigger: "impact",
      anchor: null,
      displayScale:
        presentation.zoneDisplayScale ?? 1,
      displayScaleX:
        presentation.zoneDisplayScaleX ?? 1,
      displayScaleY:
        presentation.zoneDisplayScaleY ?? 1,
      offsetX:
        presentation.zoneOffsetX ?? 0,
      offsetY:
        presentation.zoneOffsetY ?? 0,
      layerByView: {
        player: "behind",
        opponent: "behind"
      },
      ...skillSpriteControlsFromFieldsV1(presentation, "zone")
    }
  );

  const castAudio = audioSkillSlot(
    presentation.castAudioAssetId
  );
  const travelAudio = audioSkillSlot(
    presentation.travelAudioAssetId,
    { loop: true }
  );
  const impactAudio = audioSkillSlot(
    presentation.impactAudioAssetId
  );
  const auraAudio = audioSkillSlot(
    presentation.zoneAudioAssetId,
    { loop: true }
  );

  const hasVisual =
    iconAssetId !== null ||
    cast !== null ||
    travel !== null ||
    impact !== null ||
    persistentZone !== null;
  const hasAudio =
    castAudio !== null ||
    travelAudio !== null ||
    impactAudio !== null ||
    auraAudio !== null;

  if (
    !hasVisual &&
    !hasAudio &&
    !hasStatusVisuals &&
    !hasFeedback
  ) {
    return null;
  }

  const visual = {};
  if (iconAssetId !== null) {
    visual.icon = { assetId: iconAssetId };
  }
  if (cast !== null) {
    visual.cast = cast;
  }
  if (travel !== null) {
    visual.travel = travel;
  }
  if (impact !== null) {
    visual.impact = impact;
  }
  if (persistentZone !== null) {
    visual.aura = persistentZone;
  }

  const audio = {};
  if (castAudio !== null) {
    audio.cast = castAudio;
  }
  if (travelAudio !== null) {
    audio.travel = travelAudio;
  }
  if (impactAudio !== null) {
    audio.impact = impactAudio;
  }
  if (auraAudio !== null) {
    audio.aura = auraAudio;
  }

  return {
    id:
      "skill:" +
      requiredText(
        fields.id,
        "ID capacité"
      ),
    version:
      feedback?.projectileTrail
        ? 8
        : feedback?.castBurst
          ? 7
          : feedback?.aftermathSmoke
            ? 6
            : feedback?.impactBurst
              ? 5
              : hasFeedback
                ? 4
                : hasStatusVisuals
                  ? 3
                  : 2,
    subjectType: "skill",
    subjectId: requiredText(
      fields.id,
      "ID capacité"
    ),
    visual,
    audio,
    ...(hasFeedback
      ? {
          statusVisuals,
          feedback
        }
      : hasStatusVisuals
        ? { statusVisuals }
        : {})
  };
}

export function normalizedSocketPointV2({
  clientX,
  clientY,
  rect
}) {
  if (
    !rect ||
    !Number.isFinite(rect.left) ||
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height) ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    throw new TypeError("rect doit décrire une surface valide");
  }

  return Object.freeze({
    x: clamp01((clientX - rect.left) / rect.width),
    y: clamp01((clientY - rect.top) / rect.height)
  });
}

export function buildHumanCreatureDraftV2(fields) {
  if (!fields || typeof fields !== "object") {
    throw new TypeError("Données créature invalides");
  }

  const id = requiredText(fields.id, "ID créature");
  const visual = fields.visual ?? {};
  const frontAssetId = optionalText(
    visual.frontAssetId
  );
  const backAssetId = optionalText(
    visual.backAssetId
  );
  const iconAssetId = optionalText(
    visual.iconAssetId
  );
  const sockets = Array.isArray(fields.sockets)
    ? fields.sockets
    : [];

  let presentation = null;

  if (frontAssetId !== null) {
    const presentationVisual = {
      front: { assetId: frontAssetId }
    };

    if (backAssetId !== null) {
      presentationVisual.back = {
        assetId: backAssetId
      };
    }

    if (iconAssetId !== null) {
      presentationVisual.icon = {
        assetId: iconAssetId
      };
    }

    presentation = {
      id: "creature:" + id,
      version: 1,
      subjectType: "creature",
      subjectId: id,
      profileId: requiredText(
        fields.profileId,
        "Style de position"
      ),
      visual: presentationVisual,
      sockets,
      audio: audioSlots(fields.audio)
    };
  }

  return normalizeCaptureCreatureEditorDraftV2({
    schema: "capture-creature-editor-draft-v2",
    id,
    displayName: requiredText(
      fields.displayName,
      "Nom créature"
    ),
    description: optionalText(fields.description),
    level: positiveInteger(fields.level, "Niveau"),
    sourceStats: {
      force: finiteNumber(fields.sourceStats?.force, "Force"),
      agility: finiteNumber(fields.sourceStats?.agility, "Agilité"),
      intelligence: finiteNumber(
        fields.sourceStats?.intelligence,
        "Intelligence"
      ),
      spirit: finiteNumber(fields.sourceStats?.spirit, "Esprit"),
      endurance: finiteNumber(
        fields.sourceStats?.endurance,
        "Endurance"
      ),
      initiative: finiteNumber(
        fields.sourceStats?.initiative,
        "Initiative"
      )
    },
    elements: stableIds(fields.elements),
    resistances: resistanceEntries(fields.resistances),
    capture: {
      capturable: fields.capture?.capturable === true,
      captureRate: finiteNumber(
        fields.capture?.captureRate,
        "Taux de capture"
      ),
      spawnChance: finiteNumber(
        fields.capture?.spawnChance,
        "Chance d’apparition"
      ),
      spawnTags: stableIds(fields.capture?.spawnTags),
      evolution: fields.capture?.evolution ?? null
    },
    combat: {
      maxHp: finiteNumber(fields.combat?.maxHp, "PV max"),
      maxEnergy: finiteNumber(
        fields.combat?.maxEnergy,
        "Énergie max"
      ),
      initialEnergy: finiteNumber(
        fields.combat?.initialEnergy,
        "Énergie initiale"
      ),
      energyChargeAmount: finiteNumber(
        fields.combat?.energyChargeAmount,
        "Énergie récupérée"
      ),
      energyChargeIntervalMs: finiteNumber(
        fields.combat?.energyChargeIntervalMs,
        "Intervalle de récupération"
      ),
      movementEnergyPerStep: finiteNumber(
        fields.combat?.movementEnergyPerStep,
        "Coût de déplacement"
      ),
      chargeTimeModifierPct: finiteNumber(
        fields.combat?.chargeTimeModifierPct,
        "Modificateur de charge"
      ),
      approachTimeModifierPct: finiteNumber(
        fields.combat?.approachTimeModifierPct ?? 0,
        "Tempo de mobilité"
      )
    },
    skillIds: stableIds(fields.linkedSkillIds),
    presentation
  });
}


export function buildHumanCreatureDraftV3(fields) {
  const base = buildHumanCreatureDraftV2(fields);
  const displayScale = finiteNumber(
    fields?.displayScale ?? 1,
    "Taille en combat"
  );

  return normalizeCaptureCreatureEditorDraftV3({
    ...base,
    schema: "capture-creature-editor-draft-v3",
    presentation:
      base.presentation === null
        ? null
        : {
            ...base.presentation,
            version: 2,
            displayScale,
            ...(fields?.viewOverrides == null ? {} : { viewOverrides: fields.viewOverrides }),
            position:
              fields?.position ?? {
                x: 0,
                y: 0
              },
            transformOrigin:
              fields?.transformOrigin ?? {
                x: "50%",
                y: "50%"
              }
          }
  });
}

export function hydrateInitialSkillEffectsFromNativeV1(
  fields,
  nativeDraft
) {
  if (!fields || typeof fields !== "object") {
    throw new TypeError("Données capacité initiale invalides");
  }

  const existingEffects = Array.isArray(fields.effects)
    ? fields.effects
    : [];

  if (existingEffects.length > 0) {
    return fields;
  }

  const nativeDefinition = nativeDraft?.definition;
  if (
    !nativeDefinition ||
    nativeDefinition.id !== fields.id
  ) {
    return fields;
  }

  const hydratedEffects = [];
  const legacyDamage =
    Number(nativeDefinition.effect?.damage ?? 0);

  if (legacyDamage > 0) {
    hydratedEffects.push({
      kind: "damage",
      targetScope: "target",
      amount: legacyDamage,
      channel: nativeDefinition.element ?? null
    });
  }

  if (hydratedEffects.length === 0) {
    return fields;
  }

  return {
    ...fields,
    effects: hydratedEffects
  };
}


const HUMAN_SKILL_ELEMENT_GROUP_META_V1 = Object.freeze([
  Object.freeze({ element: "fire", label: "Feu" }),
  Object.freeze({ element: "water", label: "Eau" }),
  Object.freeze({ element: "earth", label: "Terre" }),
  Object.freeze({ element: "air", label: "Air" }),
  Object.freeze({ element: "electric", label: "Électricité" }),
  Object.freeze({ element: "light", label: "Lumière" }),
  Object.freeze({ element: "shadow", label: "Ombre" }),
  Object.freeze({ element: "nature", label: "Nature" }),
  Object.freeze({ element: "ice", label: "Glace" }),
  Object.freeze({ element: "poison", label: "Poison" }),
  Object.freeze({ element: "steel", label: "Acier" }),
  Object.freeze({ element: "psy", label: "Psy" }),
  Object.freeze({ element: "spirit", label: "Esprit" })
]);

const HUMAN_SKILL_ELEMENT_META_BY_ID_V1 = new Map(
  HUMAN_SKILL_ELEMENT_GROUP_META_V1.map(
    (entry, index) => [
      entry.element,
      Object.freeze({
        ...entry,
        order: index
      })
    ]
  )
);

function humanSkillSelectorElementMetaV1(element) {
  const normalized =
    typeof element === "string" &&
    element.trim() !== ""
      ? element.trim()
      : null;

  if (normalized === null) {
    return Object.freeze({
      element: null,
      label: "Neutre",
      order:
        HUMAN_SKILL_ELEMENT_GROUP_META_V1.length +
        1000
    });
  }

  const known =
    HUMAN_SKILL_ELEMENT_META_BY_ID_V1.get(
      normalized
    );
  if (known) {
    return known;
  }

  return Object.freeze({
    element: normalized,
    label:
      normalized.slice(0, 1).toLocaleUpperCase("fr") +
      normalized.slice(1),
    order:
      HUMAN_SKILL_ELEMENT_GROUP_META_V1.length +
      100
  });
}

export function humanSkillSelectorGroupsV1(entries) {
  if (!Array.isArray(entries)) {
    throw new TypeError(
      "skill selector entries must be an array"
    );
  }

  const groupsByElement = new Map();

  for (const entry of entries) {
    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry)
    ) {
      throw new TypeError(
        "skill selector entry must be an object"
      );
    }

    const meta =
      humanSkillSelectorElementMetaV1(
        entry.element
      );
    const key = meta.element ?? "__neutral__";

    if (!groupsByElement.has(key)) {
      groupsByElement.set(key, {
        element: meta.element,
        label: meta.label,
        order: meta.order,
        entries: []
      });
    }

    groupsByElement.get(key).entries.push(entry);
  }

  const groups = [...groupsByElement.values()];

  groups.sort((left, right) => {
    const order =
      left.order - right.order;
    if (order !== 0) {
      return order;
    }
    return left.label.localeCompare(
      right.label,
      "fr",
      { sensitivity: "base" }
    );
  });

  for (const group of groups) {
    group.entries.sort((left, right) => {
      const leftLevel = Number(
        left.requiredLevel
      );
      const rightLevel = Number(
        right.requiredLevel
      );
      const level =
        (Number.isFinite(leftLevel)
          ? leftLevel
          : Number.POSITIVE_INFINITY) -
        (Number.isFinite(rightLevel)
          ? rightLevel
          : Number.POSITIVE_INFINITY);

      if (level !== 0) {
        return level;
      }

      const name = String(
        left.name ?? ""
      ).localeCompare(
        String(right.name ?? ""),
        "fr",
        { sensitivity: "base" }
      );
      if (name !== 0) {
        return name;
      }

      return String(
        left.id ?? ""
      ).localeCompare(
        String(right.id ?? ""),
        "fr",
        { sensitivity: "base" }
      );
    });
  }

  return Object.freeze(
    groups.map((group) =>
      Object.freeze({
        element: group.element,
        label: group.label,
        entries: Object.freeze(
          [...group.entries]
        )
      })
    )
  );
}


export function humanConfiguredSkillLibraryEntriesV1(
  configuredSkills
) {
  if (!(configuredSkills instanceof Map)) {
    throw new TypeError(
      "configuredSkills must be a Map"
    );
  }

  return Object.freeze(
    [...configuredSkills.values()].map(
      (draft) =>
        Object.freeze({
          id: draft.id,
          name: draft.definition.name,
          element:
            draft.definition.element ?? null,
          requiredLevel: draft.requiredLevel,
          loadoutSlot:
            draft.definition.loadoutSlot ??
            "standard"
        })
    )
  );
}

export function humanSkillEditorFieldsFromDraftV1(
  input
) {
  const draft =
    normalizeCaptureSkillEditorDraftV1(input);
  const definition = draft.definition;
  const presentation =
    draft.presentation ?? {};
  const visual = presentation.visual ?? {};
  const audio = presentation.audio ?? {};
  const cast = visual.cast ?? null;
  const travel = visual.travel ?? null;
  const impact = visual.impact ?? null;
  const zone = visual.aura ?? null;

  const fields = {
    id: draft.id,
    name: definition.name,
    description: draft.description ?? "",
    requiredLevel: draft.requiredLevel,
    usageScopes: [...draft.usageScopes],
    loadoutSlot:
      definition.loadoutSlot ?? "standard",
    category: definition.category,
    form: definition.form,
    element: definition.element,
    approachMode:
      definition.approachMode ?? "none",
    hitPresenceStates:
      definition.hitPresenceStates == null
        ? null
        : [...definition.hitPresenceStates],
    dodgeable:
      definition.dodgeable !== false,
    targetLocations:
      [...(definition.targetLocations ?? ["active"])],
    energyCost: definition.energyCost,
    preparationMs: definition.preparationMs,
    travelMs: definition.travelMs,
    recoveryMs: definition.recoveryMs,
    cooldownMs: definition.cooldownMs ?? 0,
    maxUsesPerCombat:
      definition.maxUsesPerCombat ?? null,
    activationRequirements:
      definition.activationRequirements,
    effects: [...(definition.effects ?? [])],
    reaction: definition.reaction,
    evasion: definition.evasion,
    projectileClash:
      definition.projectileClash,
    effectTags:
      [...(definition.effect?.tags ?? [])],
    presentation: {
      ...skillSpriteControlFieldsFromVisualsV1(visual),
      statusVisuals:
        presentation.statusVisuals ?? {},
      iconAssetId:
        visual.icon?.assetId ?? "",
      castAssetId:
        cast?.assetId ?? "",
      castDisplayScale:
        cast?.displayScale ?? 1,
      travelAssetId:
        travel?.assetId ?? "",
      travelDisplayScale:
        travel?.displayScale ?? 1,
      travelPlaybackMode:
        travel?.playbackMode ?? "stretch",
      castLayerPlayer:
        cast?.layerByView?.player ??
        "front",
      castLayerOpponent:
        cast?.layerByView?.opponent ??
        "front",
      travelLayerPlayer:
        travel?.layerByView?.player ??
        "front",
      travelLayerOpponent:
        travel?.layerByView?.opponent ??
        "front",
      impactAssetId:
        impact?.assetId ?? "",
      impactDisplayScale:
        impact?.displayScale ?? 1,
      impactDurationMs: impact?.durationMs ?? 0,
      impactOffsetX: impact?.offsetX ?? 0,
      impactOffsetY: impact?.offsetY ?? 0,
      zoneAssetId:
        zone?.assetId ?? "",
      zoneDisplayScale:
        zone?.displayScale ?? 1,
      zoneDisplayScaleX:
        zone?.displayScaleX ?? 1,
      zoneDisplayScaleY:
        zone?.displayScaleY ?? 1,
      zoneOffsetX:
        zone?.offsetX ?? 0,
      zoneOffsetY:
        zone?.offsetY ?? 0,
      socketId:
        cast?.anchor ??
        travel?.anchor ??
        null,
      castAudioAssetId:
        audio.cast?.assetId ?? "",
      travelAudioAssetId:
        audio.travel?.assetId ?? "",
      impactAudioAssetId:
        audio.impact?.assetId ?? "",
      zoneAudioAssetId:
        audio.aura?.assetId ?? "",
      fxGlowColor:
        presentation.feedback?.glow?.color ??
        "#ffffff",
      fxGlowStrength:
        presentation.feedback?.glow?.strength ??
        0,
      fxGlowRadiusPx:
        presentation.feedback?.glow?.radiusPx ??
        16,
      impactFlashColor:
        presentation.feedback?.impactFlash
          ?.color ?? "#ffffff",
      impactFlashOpacity:
        presentation.feedback?.impactFlash
          ?.opacity ?? 0,
      impactFlashDurationMs:
        presentation.feedback?.impactFlash
          ?.durationMs ?? 120,
      impactFlashScale:
        presentation.feedback?.impactFlash
          ?.scale ?? 1.5,
      impactShakeAmplitudePx:
        presentation.feedback?.cameraShake
          ?.amplitudePx ?? 0,
      impactShakeDurationMs:
        presentation.feedback?.cameraShake
          ?.durationMs ?? 140,
      castBurstColor:
        presentation.feedback?.castBurst
          ?.color ?? "#ffffff",
      castBurstCount:
        presentation.feedback?.castBurst
          ?.count ?? 0,
      castBurstSpreadPx:
        presentation.feedback?.castBurst
          ?.spreadPx ?? 0,
      castBurstSizePx:
        presentation.feedback?.castBurst
          ?.sizePx ?? 0,
      castBurstRisePx:
        presentation.feedback?.castBurst
          ?.risePx ?? 0,
      castBurstDurationMs:
        presentation.feedback?.castBurst
          ?.durationMs ?? 0,
      castBurstOpacity:
        presentation.feedback?.castBurst
          ?.opacity ?? 0,
      projectileTrailColor:
        presentation.feedback?.projectileTrail
          ?.color ?? "#ffffff",
      projectileTrailCount:
        presentation.feedback?.projectileTrail
          ?.count ?? 0,
      projectileTrailLengthPx:
        presentation.feedback?.projectileTrail
          ?.lengthPx ?? 0,
      projectileTrailSizePx:
        presentation.feedback?.projectileTrail
          ?.sizePx ?? 0,
      projectileTrailOpacity:
        presentation.feedback?.projectileTrail
          ?.opacity ?? 0,
      projectileTrailAnchorX:
        presentation.feedback?.projectileTrail
          ?.anchorX ?? 0.5,
      projectileTrailAnchorY:
        presentation.feedback?.projectileTrail
          ?.anchorY ?? 0.5,
      impactBurstColor:
        presentation.feedback?.impactBurst
          ?.color ?? "#ffffff",
      impactBurstCount:
        presentation.feedback?.impactBurst
          ?.count ?? 0,
      impactBurstSpreadPx:
        presentation.feedback?.impactBurst
          ?.spreadPx ?? 0,
      impactBurstSizePx:
        presentation.feedback?.impactBurst
          ?.sizePx ?? 0,
      impactBurstDurationMs:
        presentation.feedback?.impactBurst
          ?.durationMs ?? 0,
      impactBurstOpacity:
        presentation.feedback?.impactBurst
          ?.opacity ?? 0,
      aftermathSmokeColor:
        presentation.feedback?.aftermathSmoke
          ?.color ?? "#594943",
      aftermathSmokeCount:
        presentation.feedback?.aftermathSmoke
          ?.count ?? 0,
      aftermathSmokeSpreadPx:
        presentation.feedback?.aftermathSmoke
          ?.spreadPx ?? 0,
      aftermathSmokeSizePx:
        presentation.feedback?.aftermathSmoke
          ?.sizePx ?? 0,
      aftermathSmokeRisePx:
        presentation.feedback?.aftermathSmoke
          ?.risePx ?? 0,
      aftermathSmokeDurationMs:
        presentation.feedback?.aftermathSmoke
          ?.durationMs ?? 0,
      aftermathSmokeOpacity:
        presentation.feedback?.aftermathSmoke
          ?.opacity ?? 0
    }
  };

  return hydrateInitialSkillEffectsFromNativeV1(
    fields,
    draft
  );
}

export function buildHumanSkillDraftV1(fields) {
  if (!fields || typeof fields !== "object") {
    throw new TypeError("Données capacité invalides");
  }

  const id = requiredText(fields.id, "ID capacité");
  const reaction = fields.reaction ?? {};
  const projectileClash = fields.projectileClash ?? {};
  const usesTacticalEffects =
    Object.prototype.hasOwnProperty.call(
      fields,
      "effects"
    );
  const tacticalEffects =
    usesTacticalEffects
      ? buildHumanTacticalSkillEffectsV1(
          fields.effects ?? [],
          {
            defaultDamageChannel:
              fields.element ?? null
          }
        )
      : [];

  return normalizeCaptureSkillEditorDraftV1({
    schema: "capture-skill-editor-draft-v1",
    id,
    description: optionalText(fields.description),
    requiredLevel: positiveInteger(
      fields.requiredLevel,
      "Niveau requis"
    ),
    usageScopes: stableIds(fields.usageScopes),
    definition: {
      id,
      name: requiredText(fields.name, "Nom capacité"),
      category: requiredText(
        fields.category,
        "Type de capacité"
      ),
      form: requiredText(fields.form, "Style de capacité"),
      loadoutSlot:
        fields.loadoutSlot === "ultimate"
          ? "ultimate"
          : "standard",
      element: optionalText(fields.element),
      approachMode: requiredText(
        fields.approachMode ?? "none",
        "Déplacement"
      ),
      hitPresenceStates:
        fields.hitPresenceStates == null
          ? null
          : stableIds(
              fields.hitPresenceStates
            ),
      dodgeable:
        fields.dodgeable !== false,
      targetLocations:
        stableIds(
          fields.targetLocations ?? ["active"]
        ),
      energyCost: finiteNumber(
        fields.energyCost,
        "Coût énergie"
      ),
      preparationMs: finiteNumber(
        fields.preparationMs,
        "Temps de préparation"
      ),
      travelMs: finiteNumber(
        fields.travelMs,
        "Temps pour atteindre la cible"
      ),
      recoveryMs: finiteNumber(
        fields.recoveryMs,
        "Temps de récupération"
      ),
      cooldownMs: finiteNumber(
        fields.cooldownMs,
        "Temps de recharge"
      ),
      maxUsesPerCombat:
        fields.maxUsesPerCombat == null ||
        Number(fields.maxUsesPerCombat) === 0
          ? null
          : positiveInteger(
              fields.maxUsesPerCombat,
              "Utilisations max par combat"
            ),
      allowedDistances:
        usesTacticalEffects
          ? [...CAPTURE_EDITOR_COMPAT_DISTANCES_V1]
          : stableIds(
              fields.allowedDistances
            ),
      targetRelations:
        usesTacticalEffects
          ? humanSkillTargetRelationsFromTacticalEffectsV1(
              tacticalEffects,
              { form: fields.form }
            )
          : stableIds(
              fields.targetRelations
            ),
      activationRequirements:
        fields.activationRequirements ?? {
          mode: "all",
          conditions: []
        },
      reaction: {
        blockForms: stableIds(reaction.blockForms),
        reflectForms: stableIds(reaction.reflectForms),
        immuneElements: stableIds(
          reaction.immuneElements
        ),
        counterForms: stableIds(
          reaction.counterForms
        ),
        evadeForms: stableIds(reaction.evadeForms),
        evadeApproaches: stableIds(
          reaction.evadeApproaches
        )
      },
      evasion:
        fields.evasion ?? {
          window: null,
          incomingForms: []
        },
      projectileClash: {
        power: finiteNumber(
          projectileClash.power ?? 0,
          "Puissance du projectile"
        )
      },
      effect: {
        damage:
          usesTacticalEffects
            ? 0
            : finiteNumber(
                fields.damage ?? 0,
                "Dégâts"
              ),
        heal:
          usesTacticalEffects
            ? 0
            : finiteNumber(
                fields.heal ?? 0,
                "Soin"
              ),
        stunMs:
          usesTacticalEffects
            ? 0
            : finiteNumber(
                fields.stunMs ?? 0,
                "Stun"
              ),
        interruptsPreparation:
          usesTacticalEffects
            ? false
            : fields.interruptsPreparation === true,
        tags: stableIds(fields.effectTags)
      },
      effects: tacticalEffects
    },
    presentation: presentationForSkill(fields)
  });
}

export function captureSkillDraftHasUnsavedChangesV1({
  currentDraft,
  configuredSkills
}) {
  if (
    !currentDraft ||
    typeof currentDraft !== "object" ||
    Array.isArray(currentDraft)
  ) {
    throw new TypeError(
      "currentDraft must be a skill draft"
    );
  }
  if (!(configuredSkills instanceof Map)) {
    throw new TypeError(
      "configuredSkills must be a Map"
    );
  }

  const id = requiredText(
    currentDraft.id,
    "ID capacité"
  );
  const savedDraft =
    configuredSkills.get(id) ?? null;

  if (savedDraft === null) {
    return true;
  }

  return (
    JSON.stringify(currentDraft) !==
    JSON.stringify(savedDraft)
  );
}

export function buildHumanLoadoutV1({
  creatureId,
  skillIds,
  ultimateSkillId = null
}) {
  const ids = Array.isArray(skillIds)
    ? [...skillIds]
    : [];

  if (ids.length > 4) {
    throw new RangeError(
      "Le loadout standard ne peut pas dépasser 4 capacités"
    );
  }

  while (ids.length < 4) {
    ids.push(null);
  }

  return normalizeCaptureActiveSkillLoadoutV1({
    schema: "capture-active-skill-loadout-v1",
    creatureId: requiredText(
      creatureId,
      "Créature du loadout"
    ),
    slots: [
      ...ids.map((skillId, index) => ({
        id: "slot-" + (index + 1),
        skillId: optionalText(skillId)
      })),
      {
        id: CAPTURE_ULTIMATE_SKILL_SLOT_ID,
        skillId:
          optionalText(ultimateSkillId)
      }
    ]
  });
}

export function buildHumanBattleSetupV1({
  battleId,
  localCreatureId,
  localDisplayName,
  opponentCreatureId,
  opponentDisplayName,
  arenaId,
  activePerTeam,
  skillSpeedMultiplier = CAPTURE_COMBAT_REFERENCE_SPEED_V1
}) {
  const count = positiveInteger(
    activePerTeam,
    "Nombre de créatures actives"
  );

  if (count > 2) {
    throw new RangeError(
      "Le combat Capture accepte uniquement 1v1 ou 2v2"
    );
  }

  const localSlots = [];
  const enemySlots = [];

  for (let index = 0; index < count; index += 1) {
    const number = index + 1;

    localSlots.push({
      actorId: "local-" + number,
      creatureId: requiredText(
        localCreatureId,
        "Créature locale"
      ),
      displayName: requiredText(
        localDisplayName,
        "Nom créature locale"
      ),
      controllerId:
        index === 0
          ? "human-local"
          : "ai-ally",
      roster: null
    });

    enemySlots.push({
      actorId: "opponent-" + number,
      creatureId: requiredText(
        opponentCreatureId,
        "Créature adverse"
      ),
      displayName: requiredText(
        opponentDisplayName,
        "Nom créature adverse"
      ),
      controllerId: "ai-enemy",
      roster: null
    });
  }

  return normalizeCaptureBattleSetupEditorDraftV1({
    schema: "capture-battle-setup-editor-draft-v1",
    id: requiredText(battleId, "ID combat"),
    localActorId: "local-1",
    arenaId: requiredText(
      arenaId,
      "Arène du combat"
    ),
    skillSpeedMultiplier,
    teams: [
      {
        id: "local-team",
        slots: localSlots
      },
      {
        id: "enemy-team",
        slots: enemySlots
      }
    ]
  });
}

// Two preview actors may reference the same configured definition.
// Only identical rows are shared; conflicting IDs still reach the exporter guard.
function uniqueHumanPreviewRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const serialized = JSON.stringify(record);
    if (seen.has(serialized)) return false;
    seen.add(serialized);
    return true;
  });
}

export function buildHumanEditorExportV2({
  creatureDraft,
  skillDrafts,
  loadout,
  battleSetup,
  opponentCreatureDraft,
  opponentSkillDrafts,
  opponentLoadout
}) {
  return exportCaptureEditorDraftsToCombatExportV2({
    battleSetup,
    creatureDrafts: uniqueHumanPreviewRecords([
      creatureDraft,
      opponentCreatureDraft
    ]),
    skillDrafts: [
      ...skillDrafts,
      ...opponentSkillDrafts
    ],
    loadouts: uniqueHumanPreviewRecords([
      loadout,
      opponentLoadout
    ]),
    metadata: {
      editor: "capture-human-v2"
    }
  });
}


export function buildHumanEditorExportV3({
  creatureDraft,
  skillDrafts,
  loadout,
  battleSetup,
  opponentCreatureDraft,
  opponentSkillDrafts,
  opponentLoadout,
  statRegistry = null,
  statValues = [],
  progressionRules = null
}) {
  const statsInput =
    statRegistry === null
      ? {}
      : {
          statRegistry,
          statValues: uniqueHumanPreviewRecords(statValues)
        };
  const progressionInput =
    progressionRules === null
      ? {}
      : {
          progressionRules
        };

  return exportCaptureEditorDraftsToCombatExportV3({
    battleSetup,
    creatureDrafts: uniqueHumanPreviewRecords([
      creatureDraft,
      opponentCreatureDraft
    ]),
    skillDrafts: [
      ...skillDrafts,
      ...opponentSkillDrafts
    ],
    loadouts: uniqueHumanPreviewRecords([
      loadout,
      opponentLoadout
    ]),
    ...statsInput,
    ...progressionInput,
    metadata: {
      editor: "capture-human-v2"
    }
  });
}

function one(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(
      "Élément éditeur introuvable : " + selector
    );
  }
  return element;
}

function checkedValues(root, selector) {
  return [...root.querySelectorAll(selector)]
    .filter((element) => element.checked)
    .map((element) => element.value);
}

function selectedValue(root, selector) {
  return one(root, selector).value;
}

function numericValue(root, selector) {
  return Number(selectedValue(root, selector));
}

export function readHumanCombatRulesV1(root) {
  return normalizeCaptureCombatRulesEditorDraftV1({
    schema: "capture-combat-rules-editor-draft-v1",
    maxEnergy: numericValue(
      root,
      "[data-max-energy]"
    ),
    initialEnergy: numericValue(
      root,
      "[data-initial-energy]"
    ),
    energyChargeAmount: numericValue(
      root,
      "[data-energy-charge-amount]"
    ),
    energyChargeIntervalMs: numericValue(
      root,
      "[data-energy-charge-interval]"
    ),
    movementEnergyPerStep: numericValue(
      root,
      "[data-movement-energy]"
    ),
    chargeTimeModifierPct: numericValue(
      root,
      "[data-charge-time-modifier]"
    )
  });
}

function renderHumanProjectilePowerV1(
  root,
  projectileClash
) {
  one(
    root,
    "[data-skill-projectile-power]"
  ).value = String(
    projectileClash?.power ?? 0
  );
}

function readHumanProjectilePowerV1(
  root,
  form
) {
  return {
    power:
      form === "projectile"
        ? numericValue(
            root,
            "[data-skill-projectile-power]"
          )
        : 0
  };
}

function writeSkillTemplateFields(
  root,
  fields,
  statRegistry = null
) {
  const mapping = [
    ["[data-skill-id]", fields.id],
    ["[data-skill-name]", fields.name],
    ["[data-skill-description]", fields.description],
    ["[data-skill-category]", fields.category],
    ["[data-skill-element]", fields.element ?? ""],
    ["[data-skill-required-level]", fields.requiredLevel],
    [
      "[data-skill-max-uses-per-combat]",
      fields.maxUsesPerCombat ?? 0
    ]
  ];

  one(
    root,
    "[data-skill-ultimate]"
  ).checked =
    fields.loadoutSlot === "ultimate";

  for (const [selector, value] of mapping) {
    one(root, selector).value = String(value ?? "");
  }

  if (
    Object.prototype.hasOwnProperty.call(
      fields,
      "activationRequirements"
    )
  ) {
    renderHumanSkillActivationRequirementsV1(
      root,
      fields.activationRequirements
    );
  }

  renderHumanSkillEffectsV1(
    root,
    fields.effects ?? [],
    statRegistry
  );

  if (
    Object.prototype.hasOwnProperty.call(
      fields,
      "projectileClash"
    )
  ) {
    renderHumanProjectilePowerV1(
      root,
      fields.projectileClash
    );
  }
}

function writeSkillDraftFields(
  root,
  draft,
  statRegistry = null
) {
  const fields =
    humanSkillEditorFieldsFromDraftV1(
      draft
    );

  writeSkillSpriteControlsV1(root, fields.presentation);
  writeSkillFeedbackControlsV1(
    root,
    fields.presentation
  );
  const values = [
    ["[data-skill-id]", fields.id],
    ["[data-skill-name]", fields.name],
    [
      "[data-skill-description]",
      fields.description
    ],
    [
      "[data-skill-category]",
      fields.category
    ],
    ["[data-skill-form]", fields.form],
    [
      "[data-skill-element]",
      fields.element ?? ""
    ],
    [
      "[data-skill-energy-cost]",
      fields.energyCost
    ],
    [
      "[data-skill-required-level]",
      fields.requiredLevel
    ],
    [
      "[data-skill-approach]",
      fields.approachMode
    ],
    [
      "[data-skill-preparation]",
      fields.preparationMs
    ],
    [
      "[data-skill-travel-time]",
      fields.travelMs
    ],
    [
      "[data-skill-recovery]",
      fields.recoveryMs
    ],
    [
      "[data-skill-cooldown]",
      fields.cooldownMs
    ],
    [
      "[data-skill-max-uses-per-combat]",
      fields.maxUsesPerCombat ?? 0
    ],
    [
      "[data-skill-icon]",
      fields.presentation.iconAssetId
    ],
    [
      "[data-skill-socket]",
      fields.presentation.socketId ?? ""
    ],
    [
      "[data-skill-cast-fx]",
      fields.presentation.castAssetId
    ],
    [
      "[data-skill-cast-scale]",
      fields.presentation.castDisplayScale
    ],
    [
      "[data-skill-travel-fx]",
      fields.presentation.travelAssetId
    ],
    [
      "[data-skill-travel-scale]",
      fields.presentation.travelDisplayScale
    ],
    [
      "[data-skill-travel-playback]",
      fields.presentation.travelPlaybackMode
    ],
    [
      "[data-skill-cast-layer-player]",
      fields.presentation.castLayerPlayer
    ],
    [
      "[data-skill-cast-layer-opponent]",
      fields.presentation.castLayerOpponent
    ],
    [
      "[data-skill-travel-layer-player]",
      fields.presentation.travelLayerPlayer
    ],
    [
      "[data-skill-travel-layer-opponent]",
      fields.presentation.travelLayerOpponent
    ],
    [
      "[data-skill-impact-fx]",
      fields.presentation.impactAssetId
    ],
    [
      "[data-skill-impact-scale]",
      fields.presentation.impactDisplayScale
    ],
    ["[data-skill-impact-duration]", fields.presentation.impactDurationMs],
    ["[data-skill-impact-offset-x]", fields.presentation.impactOffsetX],
    ["[data-skill-impact-offset-y]", fields.presentation.impactOffsetY],
    [
      "[data-skill-zone-fx]",
      fields.presentation.zoneAssetId
    ],
    [
      "[data-skill-zone-scale]",
      fields.presentation.zoneDisplayScale
    ],
    [
      "[data-skill-zone-scale-x]",
      fields.presentation.zoneDisplayScaleX
    ],
    [
      "[data-skill-zone-scale-y]",
      fields.presentation.zoneDisplayScaleY
    ],
    [
      "[data-skill-zone-offset-x]",
      fields.presentation.zoneOffsetX
    ],
    [
      "[data-skill-zone-offset-y]",
      fields.presentation.zoneOffsetY
    ],
    [
      "[data-skill-cast-audio]",
      fields.presentation.castAudioAssetId
    ],
    [
      "[data-skill-travel-audio]",
      fields.presentation.travelAudioAssetId
    ],
    [
      "[data-skill-impact-audio]",
      fields.presentation.impactAudioAssetId
    ],
    [
      "[data-skill-zone-audio]",
      fields.presentation.zoneAudioAssetId
    ]
  ];

  for (const [selector, value] of values) {
    one(root, selector).value =
      String(value ?? "");
  }

  one(
    root,
    "[data-skill-ultimate]"
  ).checked =
    fields.loadoutSlot === "ultimate";

  const reachEnabled =
    fields.hitPresenceStates !== null;
  one(
    root,
    "[data-skill-hit-presence-enabled]"
  ).checked = reachEnabled;
  for (
    const input of root.querySelectorAll(
      "[data-skill-hit-presence]"
    )
  ) {
    input.checked =
      reachEnabled
        ? fields.hitPresenceStates.includes(
            input.value
          )
        : input.value === "surface";
    input.disabled = !reachEnabled;
  }

  one(
    root,
    "[data-skill-dodgeable]"
  ).checked =
    fields.dodgeable !== false;

  for (
    const input of root.querySelectorAll(
      "[data-skill-target-location]"
    )
  ) {
    input.checked =
      fields.targetLocations.includes(
        input.value
      );
  }

  renderHumanSkillActivationRequirementsV1(
    root,
    fields.activationRequirements
  );
  renderHumanSkillEffectsV1(
    root,
    fields.effects,
    statRegistry,
    fields.presentation.statusVisuals
  );
  renderHumanProjectilePowerV1(
    root,
    fields.projectileClash
  );

  return fields;
}

function prepareNewSkillDraftFields(
  root,
  id,
  statRegistry = null
) {
  writeSkillSpriteControlsV1(root);
  const values = [
    ["[data-skill-id]", id],
    ["[data-skill-name]", "Nouvelle capacité"],
    ["[data-skill-description]", ""],
    ["[data-skill-category]", "offensive"],
    ["[data-skill-form]", "contact"],
    ["[data-skill-element]", ""],
    ["[data-skill-energy-cost]", 0],
    ["[data-skill-required-level]", 1],
    ["[data-skill-approach]", "none"],
    ["[data-skill-preparation]", 0],
    ["[data-skill-travel-time]", 0],
    ["[data-skill-recovery]", 0],
    ["[data-skill-cooldown]", 0],
    ["[data-skill-max-uses-per-combat]", 0],
    ["[data-skill-projectile-power]", 0],
    ["[data-skill-icon]", ""],
    ["[data-skill-socket]", ""],
    ["[data-skill-cast-fx]", ""],
    ["[data-skill-cast-scale]", 1],
    ["[data-skill-travel-fx]", ""],
    ["[data-skill-travel-scale]", 1],
    ["[data-skill-travel-playback]", "stretch"],
    ["[data-skill-cast-layer-player]", "front"],
    ["[data-skill-cast-layer-opponent]", "front"],
    ["[data-skill-travel-layer-player]", "front"],
    ["[data-skill-travel-layer-opponent]", "front"],
    ["[data-skill-impact-fx]", ""],
    ["[data-skill-impact-scale]", 1],
    ["[data-skill-impact-duration]", 0],
    ["[data-skill-impact-offset-x]", 0],
    ["[data-skill-impact-offset-y]", 0],
    ["[data-skill-zone-fx]", ""],
    ["[data-skill-zone-scale]", 1],
    ["[data-skill-zone-scale-x]", 1],
    ["[data-skill-zone-scale-y]", 1],
    ["[data-skill-zone-offset-x]", 0],
    ["[data-skill-zone-offset-y]", 0],
    ["[data-skill-cast-audio]", ""],
    ["[data-skill-travel-audio]", ""],
    ["[data-skill-impact-audio]", ""],
    ["[data-skill-zone-audio]", ""]
  ];

  for (const [selector, value] of values) {
    one(root, selector).value = String(value);
  }

  one(
    root,
    "[data-skill-ultimate]"
  ).checked = false;

  one(
    root,
    "[data-skill-hit-presence-enabled]"
  ).checked = false;
  for (
    const input of root.querySelectorAll(
      "[data-skill-hit-presence]"
    )
  ) {
    input.checked =
      input.value === "surface";
    input.disabled = true;
  }
  one(
    root,
    "[data-skill-dodgeable]"
  ).checked = true;
  for (
    const input of root.querySelectorAll(
      "[data-skill-target-location]"
    )
  ) {
    input.checked =
      input.value === "active";
  }

  renderHumanProjectilePowerV1(
    root,
    {
      power: 0
    }
  );
  renderHumanSkillActivationRequirementsV1(
    root,
    {
      mode: "all",
      conditions: []
    }
  );
  renderHumanSkillEffectsV1(
    root,
    [],
    statRegistry
  );
  writeSkillFeedbackControlsV1(
    root,
    {}
  );

}

function creatureAudioAssetId(entry) {
  return entry?.assetId ?? "";
}

function creatureResistanceValue(draft, element) {
  const kind = "element:" + element;
  return (
    draft.resistances.find(
      (entry) => entry.kind === kind
    )?.value ?? 0
  );
}

function setFieldValue(root, selector, value) {
  one(root, selector).value = String(value ?? "");
}

function dispatchFieldEvent(element, type) {
  element.dispatchEvent(new Event(type, {
    bubbles: true
  }));
}

function replaceCreatureSockets(
  root,
  sockets,
  presentation
) {
  sockets.clear();

  for (
    const marker of root.querySelectorAll(
      ".socket-marker"
    )
  ) {
    marker.remove();
  }

  for (const socket of presentation?.sockets ?? []) {
    sockets.set(socket.id, {
      id: socket.id,
      label: socket.label,
      front: socket.front
        ? { ...socket.front }
        : null,
      back: socket.back
        ? { ...socket.back }
        : null
    });
  }

  syncSkillSocketSelect(root, sockets);
  syncCreatureSocketMarkers(root, sockets);
}

function writeCreatureRecordFields(
  root,
  record,
  sockets,
  statRegistry = null
) {
  const draft = record.draft;
  const loadout = record.loadout;
  const presentation = draft.presentation;
  one(root, "[data-creature-custom-views]").checked = Boolean(
    presentation?.viewOverrides && Object.keys(presentation.viewOverrides).length
  );

  const fields = [
    ["[data-creature-id]", draft.id],
    ["[data-creature-name]", draft.displayName],
    ["[data-creature-description]", draft.description],
    ["[data-creature-level]", draft.level],
    [
      "[data-creature-profile]",
      presentation?.profileId ?? "biped"
    ],
    [
      "[data-creature-display-scale]",
      presentation?.displayScale ?? 1
    ],
    [
      "[data-creature-approach-time-modifier]",
      draft.combat?.approachTimeModifierPct ?? 0
    ],
    ["[data-creature-player-scale]", presentation?.viewOverrides?.player?.displayScale ?? presentation?.displayScale ?? 1],
    ["[data-creature-opponent-scale]", presentation?.viewOverrides?.opponent?.displayScale ?? presentation?.displayScale ?? 1],
    ["[data-creature-player-x]", presentation?.viewOverrides?.player?.position?.x ?? presentation?.position?.x ?? 0],
    ["[data-creature-player-y]", presentation?.viewOverrides?.player?.position?.y ?? presentation?.position?.y ?? 0],
    ["[data-creature-opponent-x]", presentation?.viewOverrides?.opponent?.position?.x ?? presentation?.position?.x ?? 0],
    ["[data-creature-opponent-y]", presentation?.viewOverrides?.opponent?.position?.y ?? presentation?.position?.y ?? 0],
    [
      "[data-capture-rate]",
      draft.capture.captureRate
    ],
    [
      "[data-spawn-chance]",
      draft.capture.spawnChance
    ],
    [
      "[data-creature-front-select]",
      presentation?.visual?.front?.assetId ?? ""
    ],
    [
      "[data-creature-back-select]",
      presentation?.visual?.back?.assetId ?? ""
    ],
    [
      "[data-creature-icon-select]",
      presentation?.visual?.icon?.assetId ?? ""
    ],
    [
      "[data-creature-audio-attack]",
      creatureAudioAssetId(
        presentation?.audio?.attack
      )
    ],
    [
      "[data-creature-audio-hit]",
      creatureAudioAssetId(
        presentation?.audio?.hit
      )
    ],
    [
      "[data-creature-audio-ko]",
      creatureAudioAssetId(
        presentation?.audio?.ko
      )
    ]
  ];

  for (const [selector, value] of fields) {
    setFieldValue(root, selector, value);
  }

  one(
    root,
    "[data-creature-mobility-preset]"
  ).value =
    humanMobilityTempoPresetIdV1(
      draft.combat?.approachTimeModifierPct ?? 0
    );

  one(root, "[data-capturable]").checked =
    draft.capture.capturable;

  const evolution =
    draft.capture.evolution;
  const evolutionEnabled = one(
    root,
    "[data-evolution-enabled]"
  );
  const evolutionTarget = one(
    root,
    "[data-evolution-target]"
  );
  const evolutionLevel = one(
    root,
    "[data-evolution-level]"
  );

  evolutionEnabled.checked =
    evolution !== null;

  if (
    evolution?.targetId &&
    ![
      ...evolutionTarget.options
    ].some(
      (option) =>
        option.value ===
        evolution.targetId
    )
  ) {
    createOption(
      evolutionTarget,
      evolution.targetId,
      evolution.targetId
    );
  }

  evolutionTarget.value =
    evolution?.targetId ?? "";
  evolutionLevel.value = String(
    evolution?.level ??
      Math.max(2, draft.level + 1)
  );
  syncEvolutionControlsV1(root);

  if (statRegistry !== null) {
    renderHumanStatValuesV1(
      root,
      statRegistry,
      record.statValues ?? null
    );
  }

  for (
    const input of root.querySelectorAll(
      "[data-element]"
    )
  ) {
    input.checked =
      draft.elements.includes(input.value);
  }

  for (
    const input of root.querySelectorAll(
      "[data-resistance]"
    )
  ) {
    input.value = String(
      creatureResistanceValue(
        draft,
        input.dataset.resistance
      )
    );
  }

  const standardSlots = [
    ...root.querySelectorAll(
      '[data-loadout-slot-type="standard"]'
    )
  ];
  for (
    let index = 0;
    index < standardSlots.length;
    index += 1
  ) {
    standardSlots[index].value =
      loadout.slots[index]?.skillId ?? "";
  }

  one(
    root,
    '[data-loadout-slot-type="ultimate"]'
  ).value =
    loadout.slots.find(
      (slot) =>
        slot.id ===
        CAPTURE_ULTIMATE_SKILL_SLOT_ID
    )?.skillId ?? "";

  replaceCreatureSockets(
    root,
    sockets,
    presentation
  );

  for (const selector of [
    "[data-creature-front-select]",
    "[data-creature-back-select]",
    "[data-creature-icon-select]"
  ]) {
    dispatchFieldEvent(
      one(root, selector),
      "change"
    );
  }

  dispatchFieldEvent(
    one(root, "[data-creature-display-scale]"),
    "input"
  );
}

function prepareNewCreatureDraftFields(
  root,
  id,
  sockets,
  statRegistry = null
) {
  one(root, "[data-creature-custom-views]").checked = false;
  const defaults = [
    ["[data-creature-id]", id],
    ["[data-creature-name]", "Nouvelle créature"],
    ["[data-creature-description]", ""],
    ["[data-creature-level]", 1],
    ["[data-creature-profile]", "biped"],
    ["[data-creature-mobility-preset]", "normal"],
    ["[data-creature-approach-time-modifier]", 0],
    ["[data-creature-display-scale]", 1],
    ["[data-creature-player-scale]", 1],
    ["[data-creature-opponent-scale]", 1],
    ["[data-creature-player-x]", 0],
    ["[data-creature-player-y]", 0],
    ["[data-creature-opponent-x]", 0],
    ["[data-creature-opponent-y]", 0],
    ["[data-creature-front-select]", ""],
    ["[data-creature-back-select]", ""],
    ["[data-creature-icon-select]", ""],
    ["[data-creature-audio-attack]", ""],
    ["[data-creature-audio-hit]", ""],
    ["[data-creature-audio-ko]", ""],
    ["[data-capture-rate]", 30],
    ["[data-spawn-chance]", 10],
  ];

  for (const [selector, value] of defaults) {
    setFieldValue(root, selector, value);
  }

  one(root, "[data-capturable]").checked = true;
  one(
    root,
    "[data-evolution-enabled]"
  ).checked = false;
  one(
    root,
    "[data-evolution-target]"
  ).value = "";
  one(
    root,
    "[data-evolution-level]"
  ).value = "10";
  syncEvolutionControlsV1(root);

  if (statRegistry !== null) {
    renderHumanStatValuesV1(
      root,
      statRegistry,
      null
    );
  }

  for (
    const input of root.querySelectorAll(
      "[data-element]"
    )
  ) {
    input.checked = false;
  }
  for (
    const input of root.querySelectorAll(
      "[data-resistance]"
    )
  ) {
    input.value = "0";
  }
  for (
    const select of root.querySelectorAll(
      "[data-loadout-slot]"
    )
  ) {
    select.value = "";
  }

  replaceCreatureSockets(root, sockets, null);

  for (const selector of [
    "[data-creature-front-select]",
    "[data-creature-back-select]",
    "[data-creature-icon-select]"
  ]) {
    dispatchFieldEvent(
      one(root, selector),
      "change"
    );
  }

  dispatchFieldEvent(
    one(root, "[data-creature-display-scale]"),
    "input"
  );
}

function setStatus(root, message, tone = "info") {
  const status = one(root, "[data-editor-status]");
  status.textContent = message;
  status.dataset.tone = tone;
}

function setTab(root, tabId) {
  for (const button of root.querySelectorAll("[data-editor-tab]")) {
    button.dataset.active =
      button.dataset.editorTab === tabId
        ? "true"
        : "false";
  }

  for (const panel of root.querySelectorAll("[data-editor-panel]")) {
    panel.hidden =
      panel.dataset.editorPanel !== tabId;
  }
}

function createOption(select, value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.append(option);
  return option;
}


function syncHumanSkillActivationConditionRowV1(
  row
) {
  const type = row.querySelector(
    "[data-skill-activation-condition-type]"
  ).value;
  const input = row.querySelector(
    "[data-skill-activation-condition-threshold]"
  );
  const unit = row.querySelector(
    "[data-skill-activation-condition-unit]"
  );
  const meta = activationRequirementTypeMetaV1(
    type
  );

  input.step = String(meta.step);
  input.min = "0";
  if (meta.max === null) {
    input.removeAttribute("max");
  } else {
    input.max = String(meta.max);
  }
  unit.textContent = meta.unit;
}

function appendHumanSkillActivationConditionV1(
  root,
  condition = {
    type: "combat_elapsed_ms",
    threshold: 10000
  }
) {
  const host = one(
    root,
    "[data-skill-activation-conditions-host]"
  );
  const row = document.createElement("div");
  row.className = "skill-activation-condition";
  row.dataset.skillActivationCondition = "true";

  const typeLabel = document.createElement("label");
  typeLabel.textContent = "Condition";
  const type = document.createElement("select");
  type.dataset.skillActivationConditionType =
    "true";

  for (
    const conditionType of
    SKILL_ACTIVATION_REQUIREMENT_TYPES
  ) {
    const meta =
      activationRequirementTypeMetaV1(
        conditionType
      );
    createOption(
      type,
      conditionType,
      meta.label
    );
  }
  type.value = condition.type;

  const thresholdLabel =
    document.createElement("label");
  thresholdLabel.textContent = "Seuil";
  const threshold =
    document.createElement("input");
  threshold.type = "number";
  threshold.dataset.skillActivationConditionThreshold =
    "true";
  threshold.value = String(
    humanSkillActivationThresholdFromContractV1(
      condition.type,
      condition.threshold
    )
  );

  const unit = document.createElement("span");
  unit.className =
    "skill-activation-condition__unit";
  unit.dataset.skillActivationConditionUnit =
    "true";

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "small-action";
  remove.textContent = "Retirer";
  remove.dataset.skillActivationRemove = "true";

  typeLabel.append(type);
  thresholdLabel.append(threshold);
  row.append(
    typeLabel,
    thresholdLabel,
    unit,
    remove
  );
  host.append(row);
  syncHumanSkillActivationConditionRowV1(
    row
  );

  return row;
}

function renderHumanSkillActivationRequirementsV1(
  root,
  requirements
) {
  const value =
    requirements ?? {
      mode: "all",
      conditions: []
    };
  const conditions =
    Array.isArray(value.conditions)
      ? value.conditions
      : [];
  const enabled = conditions.length > 0;
  const toggle = one(
    root,
    "[data-skill-activation-enabled]"
  );
  const config = one(
    root,
    "[data-skill-activation-config]"
  );
  const mode = one(
    root,
    "[data-skill-activation-mode]"
  );
  const host = one(
    root,
    "[data-skill-activation-conditions-host]"
  );

  toggle.checked = enabled;
  config.hidden = !enabled;
  mode.value =
    SKILL_ACTIVATION_REQUIREMENT_MODES.includes(
      value.mode
    )
      ? value.mode
      : "all";
  host.textContent = "";

  for (const condition of conditions) {
    appendHumanSkillActivationConditionV1(
      root,
      condition
    );
  }
}

function readHumanSkillActivationRequirementsV1(
  root
) {
  const enabled = one(
    root,
    "[data-skill-activation-enabled]"
  ).checked;
  const mode = selectedValue(
    root,
    "[data-skill-activation-mode]"
  );

  const conditions = [
    ...root.querySelectorAll(
      "[data-skill-activation-condition]"
    )
  ].map((row) => ({
    type: row.querySelector(
      "[data-skill-activation-condition-type]"
    ).value,
    value: Number(
      row.querySelector(
        "[data-skill-activation-condition-threshold]"
      ).value
    )
  }));

  return buildHumanSkillActivationRequirementsV1({
    enabled,
    mode,
    conditions
  });
}

function tacticalEffectKindLabelV1(kind) {
  return {
    damage: "Dégâts / Dégâts de zone",
    heal: "Soin",
    energy_restore: "Gain d’énergie",
    energy_drain: "Drain d’énergie",
    apply_status: "Buff / Debuff / Statut",
    cleanse: "Nettoyage",
    dispel: "Dissipation",
    persistent_zone: "Zone persistante",
    scheduled_effect: "Effet différé"
  }[kind] ?? kind;
}

function tacticalTargetScopeLabelV1(scope) {
  return {
    target: "Cible",
    self: "Soi-même",
    all_enemies: "Tous les ennemis",
    all_allies: "Tous les alliés",
    all_except_self: "Tous sauf soi"
  }[scope] ?? scope;
}

function tacticalStatusKindLabelV1(kind) {
  return {
    stat_modifier: "Modification de stat",
    approach_time_modifier: "Temps de trajet de la créature",
    damage_over_time: "Dégâts périodiques",
    heal_over_time: "Soin périodique",
    shield: "Bouclier",
    immunity: "Immunité",
    immobilize: "Immobilisation",
    silence: "Silence",
    stun: "Stun",
    taunt: "Provocation"
  }[kind] ?? kind;
}

function tacticalPolarityLabelV1(polarity) {
  return {
    beneficial: "Bénéfique",
    detrimental: "Négatif",
    neutral: "Neutre"
  }[polarity] ?? polarity;
}

function tacticalStackingLabelV1(stacking) {
  return {
    replace: "Remplacer",
    refresh: "Rafraîchir la durée",
    stack: "Empiler"
  }[stacking] ?? stacking;
}

function tacticalFieldV1(
  caption,
  input,
  className = ""
) {
  const label = document.createElement("label");
  if (className) {
    label.className = className;
  }
  label.textContent = caption;
  label.append(input);
  return label;
}

function tacticalNumberInputV1(
  datasetKey,
  value,
  {
    min = null,
    max = null,
    step = "1"
  } = {}
) {
  const input = document.createElement("input");
  input.type = "number";
  input.step = String(step);
  if (min !== null) {
    input.min = String(min);
  }
  if (max !== null) {
    input.max = String(max);
  }
  input.value = String(value ?? 0);
  input.dataset[datasetKey] = "true";
  return input;
}

function tacticalTextInputV1(
  datasetKey,
  value
) {
  const input = document.createElement("input");
  input.value = String(value ?? "");
  input.dataset[datasetKey] = "true";
  return input;
}

const TACTICAL_DAMAGE_ELEMENTS_V1 = Object.freeze([
  ["fire", "Feu"],
  ["water", "Eau"],
  ["earth", "Terre"],
  ["air", "Air"],
  ["electric", "Électricité"],
  ["light", "Lumière"],
  ["shadow", "Ombre"],
  ["nature", "Nature"],
  ["ice", "Glace"],
  ["poison", "Poison"],
  ["steel", "Acier"],
  ["psy", "Psy"],
  ["spirit", "Esprit"]
]);

function tacticalDamageElementSelectV1(
  datasetKey,
  value
) {
  const select = document.createElement("select");
  select.dataset[datasetKey] = "true";
  createOption(
    select,
    "",
    "Même élément que la capacité"
  );
  for (const [element, label] of TACTICAL_DAMAGE_ELEMENTS_V1) {
    createOption(select, element, label);
  }
  select.value = String(value ?? "");
  return select;
}

function fillStatusStatSelectV1(
  select,
  statRegistry,
  selectedId = ""
) {
  select.textContent = "";
  const stats =
    statRegistry?.stats ?? [];

  if (stats.length === 0) {
    createOption(
      select,
      "",
      "Aucune statistique disponible"
    );
  } else {
    for (const stat of stats) {
      createOption(
        select,
        stat.id,
        stat.label + " (" + stat.id + ")"
      );
    }
  }

  if (
    selectedId &&
    !stats.some(
      (stat) => stat.id === selectedId
    )
  ) {
    createOption(
      select,
      selectedId,
      selectedId + " — hors registre actuel"
    );
  }

  select.value = selectedId || "";
}

function defaultHumanStatusTintColorV1(
  status
) {
  const fingerprint = [
    status?.id,
    status?.channel,
    ...(status?.tags ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("fr");

  if (
    fingerprint.includes("poison") ||
    fingerprint.includes("toxic")
  ) {
    return "#39b54a";
  }
  if (
    fingerprint.includes("burn") ||
    fingerprint.includes("brul") ||
    fingerprint.includes("fire")
  ) {
    return "#e84b32";
  }
  if (
    fingerprint.includes("ice") ||
    fingerprint.includes("freeze") ||
    fingerprint.includes("frost")
  ) {
    return "#5bc8ff";
  }
  if (
    fingerprint.includes("electric") ||
    fingerprint.includes("shock")
  ) {
    return "#f5d742";
  }

  return "#9b59d0";
}

function populateHumanStatusVisualAssetV1(
  root,
  select,
  selectedId = ""
) {
  const assets =
    EDITOR_VISUAL_ASSETS_BY_ROOT.get(
      root
    ) ?? [];

  select.dataset.assetRole = "status";
  select.textContent = "";
  createOption(select, "", "Aucun");

  for (const asset of assets) {
    if (
      captureEditorAssetMatchesRoleV1(
        asset,
        "status"
      )
    ) {
      createOption(
        select,
        asset.id,
        asset.label || asset.id
      );
    }
  }

  if (
    selectedId &&
    ![...select.options].some(
      (option) =>
        option.value === selectedId
    )
  ) {
    createOption(
      select,
      selectedId,
      selectedId + " — hors catalogue"
    );
  }

  select.value = selectedId || "";
}

function syncHumanStatusVisualFieldsV1(
  row
) {
  const mode =
    row.querySelector(
      "[data-skill-status-visual-mode]"
    )?.value ?? "none";

  const tintFields =
    row.querySelector(
      "[data-skill-status-visual-tint-fields]"
    );
  if (tintFields) {
    tintFields.hidden =
      !["tint", "both"].includes(mode);
  }

  const spriteFields =
    row.querySelector(
      "[data-skill-status-visual-sprite-fields]"
    );
  if (spriteFields) {
    spriteFields.hidden =
      !["sprite", "both"].includes(mode);
  }
}

function syncHumanSkillEffectRowV1(
  row
) {
  const kind = row.querySelector(
    "[data-skill-effect-kind]"
  ).value;

  const scope = row.querySelector(
    "[data-skill-effect-scope]"
  );
  if (scope) {
    if (kind === "scheduled_effect") {
      scope.value = "target";
      scope.disabled = true;
    } else {
      scope.disabled = false;
    }
  }

  for (const node of row.querySelectorAll(
    "[data-skill-effect-config-kind]"
  )) {
    const kinds = node.dataset
      .skillEffectConfigKind
      .split(",")
      .map((value) => value.trim());
    node.hidden = !kinds.includes(kind);
  }

  const statusKind =
    row.querySelector(
      "[data-skill-status-kind]"
    )?.value ?? "";

  for (const node of row.querySelectorAll(
    "[data-skill-status-config-kind]"
  )) {
    const kinds = node.dataset
      .skillStatusConfigKind
      .split(",")
      .map((value) => value.trim());
    node.hidden = !kinds.includes(statusKind);
  }

  const stacking =
    row.querySelector(
      "[data-skill-status-stacking]"
    )?.value ?? "refresh";
  const maxStacks = row.querySelector(
    "[data-skill-status-max-stacks-field]"
  );
  if (maxStacks) {
    maxStacks.hidden = stacking !== "stack";
  }

  syncHumanStatusVisualFieldsV1(
    row
  );
}

function appendHumanSkillEffectV1(
  root,
  effect = null,
  statRegistry = null,
  statusPresentation = null
) {
  const host = one(
    root,
    "[data-skill-effects-host]"
  );
  const row = document.createElement("div");
  row.className = "skill-effect-row";
  row.dataset.skillEffectRow = "true";

  const header = document.createElement("div");
  header.className = "skill-effect-row__header";

  const kind = document.createElement("select");
  kind.dataset.skillEffectKind = "true";
  for (const value of SKILL_EFFECT_V1_KINDS) {
    createOption(
      kind,
      value,
      tacticalEffectKindLabelV1(value)
    );
  }

  const scope = document.createElement("select");
  scope.dataset.skillEffectScope = "true";
  for (
    const value of
    SKILL_EFFECT_V1_TARGET_SCOPES
  ) {
    createOption(
      scope,
      value,
      tacticalTargetScopeLabelV1(value)
    );
  }

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "small-action";
  remove.textContent = "Retirer";
  remove.dataset.skillEffectRemove = "true";

  header.append(
    tacticalFieldV1("Effet", kind),
    tacticalFieldV1("Portée", scope),
    remove
  );

  const config = document.createElement("div");
  config.className = "skill-effect-row__config";

  const amount = tacticalNumberInputV1(
    "skillEffectAmount",
    effect?.amount ?? 0,
    { min: 0, step: "0.1" }
  );
  const amountField = tacticalFieldV1(
    "Valeur",
    amount
  );
  amountField.dataset.skillEffectConfigKind =
    "damage,heal,energy_restore,energy_drain";

  const channel = tacticalTextInputV1(
    "skillEffectChannel",
    effect?.channel ?? ""
  );
  const channelField = tacticalFieldV1(
    "Canal / élément",
    channel
  );
  channelField.dataset.skillEffectConfigKind =
    "damage";

  const filterTags = tacticalTextInputV1(
    "skillEffectStatusTags",
    (effect?.statusTags ?? []).join(", ")
  );
  const filterTagsField = tacticalFieldV1(
    "Tags à cibler (séparés par des virgules)",
    filterTags
  );
  filterTagsField.dataset.skillEffectConfigKind =
    "cleanse,dispel";

  const statusBox =
    document.createElement("div");
  statusBox.className = "skill-status-config";
  statusBox.dataset.skillEffectConfigKind =
    "apply_status";

  const status = effect?.status ?? {};

  const statusId = tacticalTextInputV1(
    "skillStatusId",
    status.id ?? "status"
  );
  const statusKind =
    document.createElement("select");
  statusKind.dataset.skillStatusKind = "true";
  for (const value of STATUS_EFFECT_V1_KINDS) {
    createOption(
      statusKind,
      value,
      tacticalStatusKindLabelV1(value)
    );
  }

  const polarity =
    document.createElement("select");
  polarity.dataset.skillStatusPolarity =
    "true";
  for (
    const value of
    STATUS_EFFECT_V1_POLARITIES
  ) {
    createOption(
      polarity,
      value,
      tacticalPolarityLabelV1(value)
    );
  }

  const duration =
    tacticalNumberInputV1(
      "skillStatusDurationSeconds",
      status.durationMs == null
        ? 3
        : humanTacticalMsToSecondsV1(
            status.durationMs
          ),
      { min: 0.1, step: "0.1" }
    );

  const stacking =
    document.createElement("select");
  stacking.dataset.skillStatusStacking =
    "true";
  for (
    const value of
    STATUS_EFFECT_V1_STACKING
  ) {
    createOption(
      stacking,
      value,
      tacticalStackingLabelV1(value)
    );
  }

  const maxStacks =
    tacticalNumberInputV1(
      "skillStatusMaxStacks",
      status.maxStacks ?? 2,
      { min: 1, step: "1" }
    );
  const maxStacksField = tacticalFieldV1(
    "Stacks max",
    maxStacks
  );
  maxStacksField.dataset
    .skillStatusMaxStacksField = "true";

  row.dataset.skillStatusStoredTags =
    JSON.stringify(
      Array.isArray(status.tags)
        ? status.tags
        : []
    );

  const common = document.createElement("div");
  common.className = "skill-status-config__grid";
  common.append(
    tacticalFieldV1("ID statut", statusId),
    tacticalFieldV1("Type de statut", statusKind),
    tacticalFieldV1("Polarité", polarity),
    tacticalFieldV1("Durée (secondes)", duration),
    tacticalFieldV1("Stacking", stacking),
    maxStacksField
  );

  const statId = document.createElement("select");
  statId.dataset.skillStatusStatId = "true";
  fillStatusStatSelectV1(
    statId,
    statRegistry,
    status.statId ?? ""
  );
  const deltaPoints =
    tacticalNumberInputV1(
      "skillStatusDeltaPoints",
      status.deltaPoints ?? 0,
      { step: "0.1" }
    );
  const statConfig = document.createElement("div");
  statConfig.className =
    "skill-status-config__specific";
  statConfig.dataset.skillStatusConfigKind =
    "stat_modifier";
  statConfig.append(
    tacticalFieldV1("Statistique", statId),
    tacticalFieldV1(
      "Variation en points",
      deltaPoints
    )
  );

  const approachPct = tacticalNumberInputV1(
    "skillStatusApproachModifierPct", status.modifierPct ?? 50, { step: "1" }
  );
  const approachConfig = document.createElement("div");
  approachConfig.className = "skill-status-config__specific";
  approachConfig.dataset.skillStatusConfigKind = "approach_time_modifier";
  const approachNote = document.createElement("p");
  approachNote.textContent = "Positif : trajet plus lent ; négatif : plus rapide. +50 % transforme 1,3 s en 1,95 s. Agit sur les approches au sol et aériennes, indépendamment de la préparation et du cooldown.";
  approachConfig.append(tacticalFieldV1("Variation du temps de trajet (%)", approachPct), approachNote);

  const statusAmount =
    tacticalNumberInputV1(
      "skillStatusAmount",
      status.amount ?? 1,
      { min: 0, step: "0.1" }
    );
  const tickSeconds =
    tacticalNumberInputV1(
      "skillStatusTickSeconds",
      status.tickIntervalMs == null
        ? 1
        : humanTacticalMsToSecondsV1(
            status.tickIntervalMs
          ),
      { min: 0.1, step: "0.1" }
    );
  const statusChannel =
    tacticalDamageElementSelectV1(
      "skillStatusChannel",
      status.channel ?? ""
    );

  const dotConfig = document.createElement("div");
  dotConfig.className =
    "skill-status-config__specific";
  dotConfig.dataset.skillStatusConfigKind =
    "damage_over_time";
  dotConfig.append(
    tacticalFieldV1(
      "Dégâts à chaque intervalle",
      statusAmount
    ),
    tacticalFieldV1(
      "Intervalle (secondes)",
      tickSeconds
    ),
    tacticalFieldV1(
      "Élément des dégâts",
      statusChannel
    )
  );

  const hotAmount =
    tacticalNumberInputV1(
      "skillStatusHotAmount",
      status.amount ?? 1,
      { min: 0, step: "0.1" }
    );
  const hotTick =
    tacticalNumberInputV1(
      "skillStatusHotTickSeconds",
      status.tickIntervalMs == null
        ? 1
        : humanTacticalMsToSecondsV1(
            status.tickIntervalMs
          ),
      { min: 0.1, step: "0.1" }
    );
  const hotConfig = document.createElement("div");
  hotConfig.className =
    "skill-status-config__specific";
  hotConfig.dataset.skillStatusConfigKind =
    "heal_over_time";
  hotConfig.append(
    tacticalFieldV1("Soin par tick", hotAmount),
    tacticalFieldV1(
      "Intervalle (secondes)",
      hotTick
    )
  );

  const shieldAmount =
    tacticalNumberInputV1(
      "skillStatusShieldAmount",
      status.amount ?? 1,
      { min: 0, step: "0.1" }
    );
  const shieldConfig =
    document.createElement("div");
  shieldConfig.className =
    "skill-status-config__specific";
  shieldConfig.dataset.skillStatusConfigKind =
    "shield";
  shieldConfig.append(
    tacticalFieldV1(
      "Points de bouclier",
      shieldAmount
    )
  );

  const immunityConfig =
    document.createElement("div");
  immunityConfig.className =
    "skill-status-config__specific";
  immunityConfig.dataset.skillStatusConfigKind =
    "immunity";

  for (const [value, label] of [
    ["damage", "Immunité aux dégâts"],
    [
      "negative_status",
      "Immunité aux états négatifs"
    ]
  ]) {
    const field =
      document.createElement("label");
    field.className = "check";
    const input =
      document.createElement("input");
    input.type = "checkbox";
    input.value = value;
    input.dataset
      .skillStatusImmunityDomain =
        "true";
    input.checked =
      (status.domains ?? [
        "damage",
        "negative_status"
      ]).includes(value);
    field.append(
      input,
      document.createTextNode(label)
    );
    immunityConfig.append(field);
  }

  const statusVisualBox =
    document.createElement("div");
  statusVisualBox.className =
    "skill-status-visual-config";

  const statusVisualMode =
    document.createElement("select");
  statusVisualMode.dataset.skillStatusVisualMode =
    "true";
  for (const [value, label] of [
    ["none", "Aucun"],
    ["tint", "Coloration du modèle"],
    ["sprite", "Sprite autour du modèle"],
    ["both", "Sprite + coloration"]
  ]) {
    createOption(
      statusVisualMode,
      value,
      label
    );
  }

  const statusTintColor =
    document.createElement("input");
  statusTintColor.type = "color";
  statusTintColor.dataset.skillStatusTintColor =
    "true";
  statusTintColor.value =
    statusPresentation?.tintColor ??
    defaultHumanStatusTintColorV1(
      status
    );

  const statusTintOpacity =
    tacticalNumberInputV1(
      "skillStatusTintOpacity",
      statusPresentation?.tintOpacity ??
        0.35,
      {
        min: 0,
        max: 1,
        step: "0.05"
      }
    );

  const statusVisualAsset =
    document.createElement("select");
  statusVisualAsset.dataset.skillStatusVisualAsset =
    "true";
  populateHumanStatusVisualAssetV1(
    root,
    statusVisualAsset,
    statusPresentation?.sprite?.assetId ??
      ""
  );

  const statusVisualScale =
    tacticalNumberInputV1(
      "skillStatusVisualScale",
      statusPresentation?.sprite
        ?.displayScale ?? 1,
      {
        min: 0.25,
        max: 8,
        step: "0.05"
      }
    );

  const statusVisualOpacity =
    tacticalNumberInputV1(
      "skillStatusVisualOpacity",
      statusPresentation?.sprite
        ?.opacity ?? 0.85,
      {
        min: 0.05,
        max: 1,
        step: "0.05"
      }
    );

  const tintFields =
    document.createElement("div");
  tintFields.className =
    "skill-status-config__specific";
  tintFields.dataset.skillStatusVisualTintFields =
    "true";
  tintFields.append(
    tacticalFieldV1(
      "Couleur du statut",
      statusTintColor
    ),
    tacticalFieldV1(
      "Intensité coloration (0 à 1)",
      statusTintOpacity
    )
  );

  const spriteFields =
    document.createElement("div");
  spriteFields.className =
    "skill-status-config__specific";
  spriteFields.dataset.skillStatusVisualSpriteFields =
    "true";
  spriteFields.append(
    tacticalFieldV1(
      "Sprite du statut",
      statusVisualAsset
    ),
    tacticalFieldV1(
      "Échelle du sprite",
      statusVisualScale
    ),
    tacticalFieldV1(
      "Opacité du sprite",
      statusVisualOpacity
    )
  );

  appendStatusSpriteControlsV1(spriteFields, statusPresentation?.sprite ?? {});

  const statusVisualNote =
    document.createElement("small");
  statusVisualNote.className = "note";
  statusVisualNote.textContent =
    "Ce visuel appartient uniquement à la présentation. Il suit automatiquement la durée réelle du statut et disparaît à son expiration ou lorsqu'il est retiré.";

  statusVisualBox.append(
    tacticalFieldV1(
      "Visuel persistant du statut",
      statusVisualMode
    ),
    tintFields,
    spriteFields,
    statusVisualNote
  );

  statusBox.append(
    common,
    statConfig,
    approachConfig,
    dotConfig,
    hotConfig,
    shieldConfig,
    immunityConfig,
    statusVisualBox
  );

  const scheduledBox =
    document.createElement("div");
  scheduledBox.className =
    "skill-status-config";
  scheduledBox.dataset.skillEffectConfigKind =
    "scheduled_effect";

  const scheduledDelay =
    tacticalNumberInputV1(
      "skillScheduledDelaySeconds",
      effect?.trigger?.delayMs == null
        ? 1
        : humanTacticalMsToSecondsV1(
            effect.trigger.delayMs
          ),
      { min: 0, step: "0.1" }
    );

  const nestedEffect =
    effect?.effects?.[0] ?? {
      kind: "damage",
      targetScope: "target",
      amount: 1,
      channel: ""
    };

  const scheduledKind =
    document.createElement("select");
  scheduledKind.dataset
    .skillScheduledEffectKind = "true";
  for (const value of [
    "damage",
    "heal",
    "energy_restore",
    "energy_drain"
  ]) {
    createOption(
      scheduledKind,
      value,
      tacticalEffectKindLabelV1(value)
    );
  }
  scheduledKind.value =
    nestedEffect.kind ?? "damage";

  const scheduledAmount =
    tacticalNumberInputV1(
      "skillScheduledEffectAmount",
      nestedEffect.amount ?? 1,
      { min: 0, step: "0.1" }
    );

  const scheduledChannel =
    tacticalTextInputV1(
      "skillScheduledEffectChannel",
      nestedEffect.channel ?? ""
    );

  scheduledBox.append(
    tacticalFieldV1(
      "Délai avant déclenchement (secondes)",
      scheduledDelay
    ),
    tacticalFieldV1(
      "Effet déclenché",
      scheduledKind
    ),
    tacticalFieldV1(
      "Valeur",
      scheduledAmount
    ),
    tacticalFieldV1(
      "Canal / élément (si dégâts)",
      scheduledChannel
    )
  );

  const scheduledNote =
    document.createElement("small");
  scheduledNote.className = "note";
  scheduledNote.textContent =
    "Le délai utilise l’horloge combat existante. Aucun timer navigateur n’est créé par la capacité.";
  scheduledBox.append(scheduledNote);

  const zoneBox =
    document.createElement("div");
  zoneBox.className =
    "skill-status-config";
  zoneBox.dataset.skillEffectConfigKind =
    "persistent_zone";

  const zoneId = tacticalTextInputV1(
    "skillZoneId",
    effect?.zoneId ?? "zone"
  );

  const zoneRadius =
    document.createElement("select");
  zoneRadius.dataset.skillZoneRadius =
    "true";
  for (const [value, label] of [
    ["short", "Proche"],
    ["medium", "Moyen"],
    ["long", "Loin"]
  ]) {
    createOption(
      zoneRadius,
      value,
      label
    );
  }

  const zoneDuration =
    tacticalNumberInputV1(
      "skillZoneDurationSeconds",
      effect?.durationMs == null
        ? 10
        : humanTacticalMsToSecondsV1(
            effect.durationMs
          ),
      { min: 0.1, step: "0.1" }
    );

  const zoneTick =
    tacticalNumberInputV1(
      "skillZoneTickSeconds",
      effect?.tickIntervalMs == null
        ? 1
        : humanTacticalMsToSecondsV1(
            effect.tickIntervalMs
          ),
      { min: 0.1, step: "0.1" }
    );

  const zoneReactivation =
    document.createElement("select");
  zoneReactivation.dataset
    .skillZoneReactivation = "true";
  createOption(
    zoneReactivation,
    "refresh",
    "Garder la même taille"
  );
  createOption(
    zoneReactivation,
    "reinforce",
    "Agrandir la zone"
  );

  const zoneMaxActivations =
    tacticalNumberInputV1(
      "skillZoneMaxActivations",
      effect?.maxActivations ?? 1,
      { min: 1, step: "1" }
    );

  const zoneRadiusGrowth =
    tacticalNumberInputV1(
      "skillZoneRadiusGrowthSteps",
      effect?.radiusGrowthSteps ?? 0,
      { min: 0, max: 2, step: "1" }
    );

  const zoneTickDamage =
    tacticalNumberInputV1(
      "skillZoneTickDamage",
      effect?.tickEffect?.amount ?? 1,
      { min: 0, step: "0.1" }
    );

  const zoneChannel =
    tacticalDamageElementSelectV1(
      "skillZoneChannel",
      effect?.tickEffect?.channel ?? ""
    );

  const zoneGrid =
    document.createElement("div");
  zoneGrid.className =
    "skill-status-config__grid";
  zoneGrid.append(
    tacticalFieldV1(
      "ID de zone",
      zoneId
    ),
    tacticalFieldV1(
      "Rayon initial",
      zoneRadius
    ),
    tacticalFieldV1(
      "Durée (secondes)",
      zoneDuration
    ),
    tacticalFieldV1(
      "Intervalle entre les dégâts (secondes)",
      zoneTick
    ),
    tacticalFieldV1(
      "Réactivation",
      zoneReactivation
    ),
    tacticalFieldV1(
      "Activations max",
      zoneMaxActivations
    ),
    tacticalFieldV1(
      "Croissance du rayon par activation",
      zoneRadiusGrowth
    ),
    tacticalFieldV1(
      "Dégâts à chaque intervalle",
      zoneTickDamage
    ),
    tacticalFieldV1(
      "Élément des dégâts",
      zoneChannel
    )
  );

  const zoneNote =
    document.createElement("small");
  zoneNote.className = "note";
  zoneNote.textContent =
    "Toute réactivation renouvelle la durée automatiquement. « Garder la même taille » conserve le rayon actuel. « Agrandir la zone » fait évoluer le rayon Proche → Moyen → Loin selon la croissance choisie et le maximum d’activations. Intervalle = temps entre deux applications de dégâts. « Même élément que la capacité » applique automatiquement son élément aux dégâts.";

  zoneBox.append(
    zoneGrid,
    zoneNote
  );

  config.append(
    amountField,
    channelField,
    filterTagsField,
    statusBox,
    scheduledBox,
    zoneBox
  );
  row.append(header, config);
  host.append(row);

  kind.value = effect?.kind ?? "damage";
  scope.value =
    effect?.targetScope ?? "target";
  statusKind.value =
    status.kind ?? "stat_modifier";
  polarity.value =
    status.polarity ?? "beneficial";
  stacking.value =
    status.stacking ?? "refresh";
  statusVisualMode.value =
    statusPresentation?.mode ?? "none";
  zoneRadius.value =
    effect?.radius ?? "short";
  zoneReactivation.value =
    effect?.reactivation ?? "refresh";

  syncHumanSkillEffectRowV1(row);
  return row;
}

function renderHumanSkillEffectsV1(
  root,
  effects,
  statRegistry = null,
  statusVisuals = {}
) {
  const host = one(
    root,
    "[data-skill-effects-host]"
  );
  host.textContent = "";

  for (const effect of effects ?? []) {
    const statusId =
      effect?.kind === "apply_status"
        ? effect?.status?.id ?? null
        : null;

    appendHumanSkillEffectV1(
      root,
      effect,
      statRegistry,
      statusId
        ? statusVisuals?.[statusId] ?? null
        : null
    );
  }
}

function refreshHumanSkillEffectStatOptionsV1(
  root,
  statRegistry
) {
  for (
    const select of root.querySelectorAll(
      "[data-skill-status-stat-id]"
    )
  ) {
    fillStatusStatSelectV1(
      select,
      statRegistry,
      select.value
    );
  }
}

function commaValuesV1(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readHumanSkillEffectsV1(root) {
  const rows = [
    ...root.querySelectorAll(
      "[data-skill-effect-row]"
    )
  ];

  const effects = rows.map((row) => {
    const kind = row.querySelector(
      "[data-skill-effect-kind]"
    ).value;
    const targetScope = row.querySelector(
      "[data-skill-effect-scope]"
    ).value;

    if (kind === "persistent_zone") {
      return {
        kind,
        targetScope,
        zoneId: row.querySelector(
          "[data-skill-zone-id]"
        ).value,
        radius: row.querySelector(
          "[data-skill-zone-radius]"
        ).value,
        durationSeconds: Number(
          row.querySelector(
            "[data-skill-zone-duration-seconds]"
          ).value
        ),
        tickSeconds: Number(
          row.querySelector(
            "[data-skill-zone-tick-seconds]"
          ).value
        ),
        reactivation: row.querySelector(
          "[data-skill-zone-reactivation]"
        ).value,
        maxActivations: Number(
          row.querySelector(
            "[data-skill-zone-max-activations]"
          ).value
        ),
        radiusGrowthSteps: Number(
          row.querySelector(
            "[data-skill-zone-radius-growth-steps]"
          ).value
        ),
        tickDamage: Number(
          row.querySelector(
            "[data-skill-zone-tick-damage]"
          ).value
        ),
        channel: row.querySelector(
          "[data-skill-zone-channel]"
        ).value || null
      };
    }

    if (kind === "apply_status") {
      const statusKind = row.querySelector(
        "[data-skill-status-kind]"
      ).value;
      const status = {
        id: row.querySelector(
          "[data-skill-status-id]"
        ).value,
        kind: statusKind,
        polarity: row.querySelector(
          "[data-skill-status-polarity]"
        ).value,
        durationSeconds: Number(
          row.querySelector(
            "[data-skill-status-duration-seconds]"
          ).value
        ),
        stacking: row.querySelector(
          "[data-skill-status-stacking]"
        ).value,
        maxStacks: Number(
          row.querySelector(
            "[data-skill-status-max-stacks]"
          ).value
        ),
        tags: (() => {
          try {
            const stored = JSON.parse(
              row.dataset
                .skillStatusStoredTags ??
                "[]"
            );
            return Array.isArray(stored)
              ? stored
              : [];
          } catch {
            return [];
          }
        })()
      };

      if (statusKind === "stat_modifier") {
        status.statId = row.querySelector(
          "[data-skill-status-stat-id]"
        ).value;
        status.deltaPoints = Number(
          row.querySelector(
            "[data-skill-status-delta-points]"
          ).value
        );
      } else if (statusKind === "approach_time_modifier") {
        status.modifierPct = Number(row.querySelector("[data-skill-status-approach-modifier-pct]").value);
      } else if (
        statusKind === "damage_over_time"
      ) {
        status.amount = Number(
          row.querySelector(
            "[data-skill-status-amount]"
          ).value
        );
        status.tickSeconds = Number(
          row.querySelector(
            "[data-skill-status-tick-seconds]"
          ).value
        );
        status.channel = row.querySelector(
          "[data-skill-status-channel]"
        ).value;
      } else if (
        statusKind === "heal_over_time"
      ) {
        status.amount = Number(
          row.querySelector(
            "[data-skill-status-hot-amount]"
          ).value
        );
        status.tickSeconds = Number(
          row.querySelector(
            "[data-skill-status-hot-tick-seconds]"
          ).value
        );
      } else if (statusKind === "shield") {
        status.amount = Number(
          row.querySelector(
            "[data-skill-status-shield-amount]"
          ).value
        );
      } else if (statusKind === "immunity") {
        status.domains = [
          ...row.querySelectorAll(
            "[data-skill-status-immunity-domain]"
          )
        ]
          .filter((input) => input.checked)
          .map((input) => input.value);
      }

      return {
        kind,
        targetScope,
        status
      };
    }

    if (
      kind === "cleanse" ||
      kind === "dispel"
    ) {
      return {
        kind,
        targetScope,
        statusTags: commaValuesV1(
          row.querySelector(
            "[data-skill-effect-status-tags]"
          ).value
        )
      };
    }

    const output = {
      kind,
      targetScope,
      amount: Number(
        row.querySelector(
          "[data-skill-effect-amount]"
        ).value
      )
    };

    if (kind === "damage") {
      output.channel =
        row.querySelector(
          "[data-skill-effect-channel]"
        ).value || null;
    }

    return output;
  });

  return buildHumanTacticalSkillEffectsV1(
    effects
  );
}

function readHumanStatusVisualsV1(root) {
  const output = {};

  for (
    const row of root.querySelectorAll(
      "[data-skill-effect-row]"
    )
  ) {
    if (
      row.querySelector(
        "[data-skill-effect-kind]"
      )?.value !== "apply_status"
    ) {
      continue;
    }

    const statusId = String(
      row.querySelector(
        "[data-skill-status-id]"
      )?.value ?? ""
    ).trim();
    const mode =
      row.querySelector(
        "[data-skill-status-visual-mode]"
      )?.value ?? "none";

    if (!statusId || mode === "none") {
      continue;
    }

    const presentation = {
      mode,
      tintColor:
        row.querySelector(
          "[data-skill-status-tint-color]"
        )?.value ?? "#9b59d0",
      tintOpacity: Number(
        row.querySelector(
          "[data-skill-status-tint-opacity]"
        )?.value ?? 0.35
      )
    };

    if (
      mode === "sprite" ||
      mode === "both"
    ) {
      const assetId = String(
        row.querySelector(
          "[data-skill-status-visual-asset]"
        )?.value ?? ""
      ).trim();

      if (!assetId) {
        throw new Error(
          "Choisis un sprite pour le visuel du statut « " +
            statusId +
            " »."
        );
      }

      presentation.sprite = {
        ...readStatusSpriteControlsV1(row),
        assetId,
        displayScale: Number(
          row.querySelector(
            "[data-skill-status-visual-scale]"
          )?.value ?? 1
        ),
        opacity: Number(
          row.querySelector(
            "[data-skill-status-visual-opacity]"
          )?.value ?? 0.85
        )
      };
    }

    const existing =
      output[statusId] ?? null;
    if (
      existing !== null &&
      JSON.stringify(existing) !==
        JSON.stringify(presentation)
    ) {
      throw new Error(
        "Le statut « " +
          statusId +
          " » possède deux présentations différentes dans la même capacité."
      );
    }

    output[statusId] = presentation;
  }

  return output;
}

function statEffectNumber(value) {
  const number = Number(value);
  return Number.isInteger(number)
    ? String(number)
    : String(
        Math.round(number * 100) / 100
      );
}

export function humanStatEffectSummaryV1({
  definition,
  value
}) {
  const normalized =
    normalizeCaptureStatRegistryV1({
      schema: "capture-stat-registry-v1",
      stats: [definition]
    }).stats[0];

  const points = Number(value ?? 0);
  const projected =
    projectCaptureStatDefinitionEffectsV1({
      definition: normalized,
      points
    });

  const perPoint = [];
  const current = [];

  if (normalized.damageChannel) {
    perPoint.push(
      "+" +
        statEffectNumber(
          normalized.damagePctPerPoint
        ) +
        " % dégâts " +
        normalized.label
    );
    current.push(
      "+" +
        statEffectNumber(projected.damagePct) +
        " % dégâts"
    );
  }

  if (normalized.resistanceChannel) {
    perPoint.push(
      "+" +
        statEffectNumber(
          normalized.resistancePctPerPoint
        ) +
        " % résistance " +
        normalized.label
    );
    current.push(
      "+" +
        statEffectNumber(
          projected.resistancePct
        ) +
        " % résistance"
    );
  }

  if (
    normalized.chargeTimeReductionPctPerPoint > 0
  ) {
    perPoint.push(
      "-" +
        statEffectNumber(
          normalized
            .chargeTimeReductionPctPerPoint
        ) +
        " % temps de charge"
    );
    current.push(
      "-" +
        statEffectNumber(
          projected.chargeTimeReductionPct
        ) +
        " % temps de charge"
    );
  }

  if (normalized.maxHpPerPoint > 0) {
    perPoint.push(
      "+" +
        statEffectNumber(
          normalized.maxHpPerPoint
        ) +
        " PV max"
    );
    current.push(
      statEffectNumber(projected.maxHp) +
        " PV max"
    );
  }

  if (
    normalized.damageReductionPctPerPoint > 0
  ) {
    perPoint.push(
      "-" +
        statEffectNumber(
          normalized.damageReductionPctPerPoint
        ) +
        " % dégâts reçus"
    );
    current.push(
      "-" +
        statEffectNumber(
          projected.damageReductionPct
        ) +
        " % dégâts reçus"
    );
  }

  if (perPoint.length === 0) {
    return "Aucun effet de combat configuré";
  }

  const pointLabel =
    points === 1 ? " point" : " points";

  return (
    "1 point = " +
    perPoint.join(" / ") +
    " · " +
    statEffectNumber(points) +
    pointLabel +
    " = " +
    current.join(" / ")
  );
}

function statDefinitionField(caption, input) {
  const field = document.createElement("label");
  field.className = "stat-definition-field";

  const title = document.createElement("small");
  title.textContent = caption;

  field.append(title, input);
  return field;
}

function renderHumanStatValuesV1(
  root,
  registry,
  statValues = null
) {
  const host = one(
    root,
    "[data-stat-values-host]"
  );
  const normalized =
    normalizeCaptureStatRegistryV1(registry);
  const values =
    statValues?.values ?? {};

  host.textContent = "";

  for (const definition of normalized.stats) {
    const label =
      document.createElement("label");
    label.className = "stat-value-card";

    const title =
      document.createElement("span");
    title.className = "stat-value-card__title";
    title.textContent = definition.label;

    const input =
      document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.value = String(
      values[definition.id] ?? 0
    );
    input.dataset.statValue =
      definition.id;

    const meta =
      document.createElement("small");
    meta.textContent =
      humanStatEffectSummaryV1({
        definition,
        value: values[definition.id] ?? 0
      });

    label.append(title, input, meta);
    host.append(label);
  }
}

function renderHumanStatRegistryV1(
  root,
  registry
) {
  const host = one(
    root,
    "[data-stat-registry-host]"
  );
  const normalized =
    normalizeCaptureStatRegistryV1(registry);

  host.textContent = "";

  for (const definition of normalized.stats) {
    const row =
      document.createElement("div");
    row.className = "stat-definition-row";
    row.dataset.statDefinition =
      definition.id;

    const id =
      document.createElement("strong");
    id.textContent = definition.id;

    const label =
      document.createElement("input");
    label.value = definition.label;
    label.dataset.statDefinitionLabel =
      "true";
    label.setAttribute(
      "aria-label",
      "Libellé " + definition.id
    );

    const damageChannel =
      document.createElement("input");
    damageChannel.value =
      definition.damageChannel ?? "";
    damageChannel.placeholder =
      "canal dégâts";
    damageChannel.dataset.statDefinitionDamageChannel =
      "true";

    const damageRate =
      document.createElement("input");
    damageRate.type = "number";
    damageRate.min = "0";
    damageRate.step = "0.05";
    damageRate.value = String(
      definition.damagePctPerPoint
    );
    damageRate.dataset.statDefinitionDamageRate =
      "true";

    const resistanceChannel =
      document.createElement("input");
    resistanceChannel.value =
      definition.resistanceChannel ?? "";
    resistanceChannel.placeholder =
      "canal résistance";
    resistanceChannel.dataset.statDefinitionResistanceChannel =
      "true";

    const resistanceRate =
      document.createElement("input");
    resistanceRate.type = "number";
    resistanceRate.min = "0";
    resistanceRate.step = "0.05";
    resistanceRate.value = String(
      definition.resistancePctPerPoint
    );
    resistanceRate.dataset.statDefinitionResistanceRate =
      "true";

    const chargeRate =
      document.createElement("input");
    chargeRate.type = "number";
    chargeRate.min = "0";
    chargeRate.step = "0.05";
    chargeRate.value = String(
      definition
        .chargeTimeReductionPctPerPoint
    );
    chargeRate.dataset.statDefinitionChargeRate =
      "true";

    const maxHpRate =
      document.createElement("input");
    maxHpRate.type = "number";
    maxHpRate.min = "0";
    maxHpRate.step = "0.1";
    maxHpRate.value = String(
      definition.maxHpPerPoint
    );
    maxHpRate.dataset.statDefinitionMaxHpRate =
      "true";

    const damageReductionRate =
      document.createElement("input");
    damageReductionRate.type = "number";
    damageReductionRate.min = "0";
    damageReductionRate.step = "0.05";
    damageReductionRate.value = String(
      definition.damageReductionPctPerPoint
    );
    damageReductionRate.dataset
      .statDefinitionDamageReductionRate =
        "true";

    const remove =
      document.createElement("button");
    remove.type = "button";
    remove.className = "small-action";
    remove.textContent = "Retirer";
    remove.dataset.statDefinitionRemove =
      definition.id;

    row.append(
      id,
      statDefinitionField("Nom", label),
      statDefinitionField(
        "Canal dégâts",
        damageChannel
      ),
      statDefinitionField(
        "Dégâts % / point",
        damageRate
      ),
      statDefinitionField(
        "Canal résistance",
        resistanceChannel
      ),
      statDefinitionField(
        "Résistance % / point",
        resistanceRate
      ),
      statDefinitionField(
        "Réduction charge % / point",
        chargeRate
      ),
      statDefinitionField(
        "Réduction dégâts reçus % / point",
        damageReductionRate
      ),
      statDefinitionField(
        "PV max / point",
        maxHpRate
      ),
      remove
    );
    host.append(row);
  }
}

function readHumanStatRegistryV1(root) {
  const definitions = [
    ...root.querySelectorAll(
      "[data-stat-definition]"
    )
  ].map((row) => {
    const damageChannel = optionalText(
      row.querySelector(
        "[data-stat-definition-damage-channel]"
      ).value
    );
    const resistanceChannel =
      optionalText(
        row.querySelector(
          "[data-stat-definition-resistance-channel]"
        ).value
      );

    return {
      id: row.dataset.statDefinition,
      label: row.querySelector(
        "[data-stat-definition-label]"
      ).value,
      damageChannel,
      resistanceChannel,
      damagePctPerPoint:
        damageChannel === null
          ? 0
          : finiteNumber(
              row.querySelector(
                "[data-stat-definition-damage-rate]"
              ).value,
              "Dégâts % par point"
            ),
      resistancePctPerPoint:
        resistanceChannel === null
          ? 0
          : finiteNumber(
              row.querySelector(
                "[data-stat-definition-resistance-rate]"
              ).value,
              "Résistance % par point"
            ),
      chargeTimeReductionPctPerPoint:
        finiteNumber(
          row.querySelector(
            "[data-stat-definition-charge-rate]"
          ).value,
          "Réduction charge % par point"
        ),
      damageReductionPctPerPoint:
        finiteNumber(
          row.querySelector(
            "[data-stat-definition-damage-reduction-rate]"
          ).value,
          "Réduction dégâts reçus % par point"
        ),
      maxHpPerPoint:
        finiteNumber(
          row.querySelector(
            "[data-stat-definition-max-hp-rate]"
          ).value,
          "PV max par point"
        )
    };
  });

  return buildHumanStatRegistryV1({
    definitions
  });
}

function readHumanCreatureStatValuesV1(
  root,
  creatureId,
  registry
) {
  const values = {};
  for (
    const input of root.querySelectorAll(
      "[data-stat-value]"
    )
  ) {
    values[input.dataset.statValue] =
      finiteNumber(
        input.value,
        "Stat " + input.dataset.statValue
      );
  }

  return buildHumanCreatureStatValuesV1({
    creatureId,
    values,
    registry
  });
}

function renderHumanProgressionRulesV1(
  root,
  progressionRules
) {
  const rules =
    normalizeCaptureProgressionRulesV1(
      progressionRules
    );
  one(
    root,
    "[data-progression-max-active]"
  ).value = String(rules.maxActiveSkills);

  const host = one(
    root,
    "[data-progression-schedule-host]"
  );
  host.textContent = "";

  rules.slotUnlockSchedule.forEach(
    (step, index) => {
      const row =
        document.createElement("div");
      row.className = "progression-row";
      row.dataset.progressionStep =
        String(index);

      const levelLabel =
        document.createElement("label");
      levelLabel.textContent = "Niveau";
      const levelInput =
        document.createElement("input");
      levelInput.type = "number";
      levelInput.min = "1";
      levelInput.value = String(step.level);
      levelInput.dataset.progressionLevel =
        "true";
      levelLabel.append(levelInput);

      const slotsLabel =
        document.createElement("label");
      slotsLabel.textContent =
        "Slots actifs";
      const slotsInput =
        document.createElement("input");
      slotsInput.type = "number";
      slotsInput.min = "1";
      slotsInput.max = "4";
      slotsInput.value = String(step.slots);
      slotsInput.dataset.progressionSlots =
        "true";
      slotsLabel.append(slotsInput);

      const remove =
        document.createElement("button");
      remove.type = "button";
      remove.className = "small-action";
      remove.textContent = "Retirer";
      remove.dataset.progressionRemove =
        String(index);
      remove.disabled =
        rules.slotUnlockSchedule.length <= 1;

      row.append(
        levelLabel,
        slotsLabel,
        remove
      );
      host.append(row);
    }
  );
}

function readHumanProgressionRulesV1(root) {
  const steps = [
    ...root.querySelectorAll(
      "[data-progression-step]"
    )
  ].map((row) => ({
    level: positiveInteger(
      Number(
        row.querySelector(
          "[data-progression-level]"
        ).value
      ),
      "Niveau du palier"
    ),
    slots: positiveInteger(
      Number(
        row.querySelector(
          "[data-progression-slots]"
        ).value
      ),
      "Slots du palier"
    )
  }));

  return buildHumanProgressionRulesV1({
    maxActiveSkills: positiveInteger(
      Number(
        one(
          root,
          "[data-progression-max-active]"
        ).value
      ),
      "Maximum de capacités actives"
    ),
    slotUnlockSchedule: steps
  });
}

function syncEvolutionControlsV1(root) {
  const enabled = one(
    root,
    "[data-evolution-enabled]"
  ).checked;
  one(
    root,
    "[data-evolution-target]"
  ).disabled = !enabled;
  one(
    root,
    "[data-evolution-level]"
  ).disabled = !enabled;
}

export function captureEditorAssetMatchesRoleV1(asset, role) {
  if (!asset?.compatibility?.uses?.includes("editor")) {
    return false;
  }

  if (role === "creature") {
    return (
      asset.category === "creature" ||
      (
        asset.assetType === "portrait" &&
        asset.tags?.includes("creature")
      )
    );
  }

  if (role === "icon") {
    return asset.assetType === "icon";
  }

  if (
    role === "cast" ||
    role === "travel" ||
    role === "impact" ||
    role === "zone" ||
    role === "status"
  ) {
    const tags = Array.isArray(asset.tags)
      ? asset.tags
      : [];
    const creatureOwned =
      asset.category === "creature" ||
      asset.assetType === "portrait" ||
      tags.includes("creature");

    return (
      !creatureOwned &&
      (role !== "travel" || asset.category === "travel") &&
      asset.mediaType === "image" &&
      (
        asset.assetType === "sprite" ||
        asset.assetType === "fx"
      )
    );
  }

  if (role === "audio") {
    return asset.mediaType === "audio";
  }

  return false;
}

export function captureEditorAssetLibraryGroupV1(asset) {
  return asset?.source?.scope === "user"
    ? "user"
    : "gensrpg";
}

function populateSelect(select, assets, role) {
  const previous = select.value;
  const allowEmpty =
    select.dataset.requiredAsset !== "true";

  select.textContent = "";

  if (allowEmpty) {
    createOption(select, "", "Aucun");
  }

  const matchingAssets = assets.filter(
    (asset) =>
      captureEditorAssetMatchesRoleV1(
        asset,
        role
      )
  );
  const libraryGroups = [
    {
      id: "gensrpg",
      label: "Bibliothèque GenSrpG"
    },
    {
      id: "user",
      label: "Mes assets"
    }
  ];

  for (const libraryGroup of libraryGroups) {
    const groupAssets =
      matchingAssets.filter(
        (asset) =>
          captureEditorAssetLibraryGroupV1(
            asset
          ) === libraryGroup.id
      );

    if (groupAssets.length === 0) {
      continue;
    }

    const group =
      document.createElement("optgroup");
    group.label = libraryGroup.label;
    group.dataset.assetOrigin =
      libraryGroup.id;

    for (const asset of groupAssets) {
      createOption(
        group,
        asset.id,
        asset.label || asset.id
      );
    }

    select.append(group);
  }

  if (previous) {
    if (
      ![...select.options].some(
        (option) =>
          option.value === previous
      )
    ) {
      createOption(
        select,
        previous,
        previous + " — hors catalogue"
      );
    }
    select.value = previous;
  }
}


function populatePrivateAudioSelect(select, entries) {
  const previous = select.value;
  const acceptedRoles = String(
    select.dataset.audioRoles ?? ""
  )
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  select.textContent = "";
  createOption(select, "", "Aucun");

  const groups =
    buildPrivateAudioRoleGroupsV1(
      entries,
      acceptedRoles
    );

  for (const audioGroup of groups) {
    const group = document.createElement("optgroup");
    group.label = audioGroup.label;
    group.dataset.audioRole = audioGroup.role;

    for (const entry of audioGroup.entries) {
      const option = document.createElement("option");
      option.value = entry.assetId;
      option.textContent = entry.displayLabel;
      option.dataset.audioRole = audioGroup.role;
      option.dataset.audioCategory = entry.category;
      group.append(option);
    }

    select.append(group);
  }

  if (
    previous &&
    [...select.options].some(
      (option) => option.value === previous
    )
  ) {
    select.value = previous;
  }
}

async function hydratePrivateAudioCatalog(root) {
  const response = await fetch(
    PRIVATE_AUDIO_CATALOG_URL,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      "Catalogue audio indisponible (" +
      response.status +
      ")"
    );
  }

  const catalog = await response.json();
  const entries = Array.isArray(catalog.entries)
    ? catalog.entries
    : [];

  for (
    const select of root.querySelectorAll(
      "[data-private-audio]"
    )
  ) {
    populatePrivateAudioSelect(select, entries);
  }

  return catalog;
}

async function hydrateCaptureStatRegistryV1() {
  const response = await fetch(
    MONSTER_CAPTURE_STAT_REGISTRY_URL,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      "Registre stats Monster Capture indisponible (" +
        response.status +
        ")"
    );
  }

  return normalizeCaptureStatRegistryV1(
    await response.json()
  );
}

async function hydrateCaptureProgressionRulesV1() {
  const response = await fetch(
    MONSTER_CAPTURE_PROGRESSION_RULES_URL,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      "Règles de progression Monster Capture indisponibles (" +
        response.status +
        ")"
    );
  }

  return buildHumanProgressionRulesV1(
    await response.json()
  );
}

async function hydrateMonsterCaptureCreatureCatalog(
  statRegistry
) {
  const response = await fetch(
    MONSTER_CAPTURE_CREATURE_CATALOG_URL,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      "Catalogue créatures Monster Capture indisponible (" +
        response.status +
        ")"
    );
  }

  const catalog = await response.json();
  const entries = Array.isArray(catalog.entries)
    ? catalog.entries
    : [];

  const expectedCount = Number(
    catalog.provenance?.sourceCount
  );

  if (
    !Number.isInteger(expectedCount) ||
    expectedCount < 1
  ) {
    throw new RangeError(
      "Le catalogue Monster Capture doit déclarer un sourceCount valide."
    );
  }

  if (entries.length !== expectedCount) {
    throw new RangeError(
      "Le catalogue Monster Capture contient " +
        entries.length +
        " créatures au lieu des " +
        expectedCount +
        " entrées historiques attendues."
    );
  }

  const uniqueIdCount = new Set(
    entries.map((entry) => entry.id)
  ).size;

  if (uniqueIdCount !== entries.length) {
    throw new RangeError(
      "Le catalogue Monster Capture contient des identifiants de créatures dupliqués."
    );
  }

  const canonicalEntries =
    canonicalCaptureCreatureRecordsV1(
      entries
    );

  return Object.freeze(
    canonicalEntries.map((entry) => {
      const record =
        importMonsterCaptureCreatureRecordV1(
          entry
        );
      return Object.freeze({
        ...record,
        statValues:
          importMonsterCaptureStatValuesV1(
            entry,
            statRegistry
          )
      });
    })
  );
}

async function hydrateCaptureShowcaseSkillPresetsV1() {
  const transfers = await Promise.all(
    CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.map(
      async (presetFile) => {
        const response = await fetch(
          new URL(
            "../../" + presetFile,
            import.meta.url
          ),
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(
            "Preset capacité vitrine Capture indisponible : " +
              presetFile +
              " (" +
              response.status +
              ")"
          );
        }

        const transfer =
          importCaptureTransferJsonV1(
            await response.text()
          );

        if (transfer.kind !== "skill") {
          throw new RangeError(
            "Un preset de capacité vitrine Capture doit être une capacité : " +
              presetFile
          );
        }

        return transfer;
      }
    )
  );

  const ids = transfers.map(
    (transfer) => transfer.value.draft.id
  );

  if (new Set(ids).size !== ids.length) {
    throw new RangeError(
      "Les presets de capacités vitrine Capture contiennent un identifiant dupliqué."
    );
  }

  return Object.freeze(transfers);
}

async function hydrateCaptureShowcaseCreaturePresetsV1(
  statRegistry
) {
  const transfers = await Promise.all(
    CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.map(
      async (presetFile) => {
        const response = await fetch(
          new URL(
            "../../" + presetFile,
            import.meta.url
          ),
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(
            "Preset vitrine Capture indisponible : " +
              presetFile +
              " (" +
              response.status +
              ")"
          );
        }

        const transfer =
          importCaptureTransferJsonV1(
            await response.text(),
            { statRegistry }
          );

        if (transfer.kind !== "creature") {
          throw new RangeError(
            "Un preset vitrine Capture doit être une créature : " +
              presetFile
          );
        }

        return transfer;
      }
    )
  );

  const ids = transfers.map(
    (transfer) => transfer.value.draft.id
  );

  if (new Set(ids).size !== ids.length) {
    throw new RangeError(
      "Les presets vitrine Capture contiennent un identifiant de créature dupliqué."
    );
  }

  return Object.freeze(transfers);
}

async function hydrateCaptureCreatureVisualMetadataV1() {
  const uniqueBindings = [
    ...new Map(
      CAPTURE_CREATURE_VISUAL_BINDINGS_V1.map(
        (binding) => [
          binding.metaId,
          binding
        ]
      )
    ).values()
  ];

  const entries = await Promise.all(
    uniqueBindings.map(async (binding) => {
      const response = await fetch(
        globalVisualAssetUrl(
          binding.metaFile
        ),
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(
          "Metadata visuelle créature indisponible : " +
            binding.metaId +
            " (" +
            response.status +
            ")"
        );
      }

      return [
        binding.metaId,
        await response.json()
      ];
    })
  );

  return Object.freeze(
    Object.fromEntries(entries)
  );
}

async function hydrateNativeSkillCatalog() {
  const response = await fetch(
    NATIVE_SKILL_CATALOG_URL,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      "Bibliothèque native indisponible (" +
      response.status +
      ")"
    );
  }

  const catalog = await response.json();
  const entries = Array.isArray(catalog.entries)
    ? catalog.entries
    : [];

  return new Map(
    entries.map((entry) => {
      const definition =
        normalizeSkillDefinition(entry.definition);

      const draft =
        normalizeCaptureSkillEditorDraftV1({
          schema: "capture-skill-editor-draft-v1",
          id: definition.id,
          description:
            "Capacité native du laboratoire.",
          requiredLevel: 1,
          usageScopes: ["capture", "combat"],
          definition,
          presentation: null
        });

      return [draft.id, draft];
    })
  );
}

async function hydrateAssetCatalog(root, listen, creatorVisualAssets = null) {
  const response = await fetch(
    GLOBAL_VISUAL_LIBRARY.catalogUrl,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      "Catalogue assets indisponible (" +
      response.status +
      ")"
    );
  }

  const catalog = await response.json();
  const assets = Array.isArray(catalog.assets)
    ? [...catalog.assets]
    : [];
  catalog.assets = assets;

  const byId = new Map(
    assets.map((asset) => [asset.id, asset])
  );
  EDITOR_VISUAL_ASSETS_BY_ROOT.set(
    root,
    Object.freeze([...assets])
  );

  for (const select of root.querySelectorAll("[data-asset-role]")) {
    populateSelect(
      select,
      assets,
      select.dataset.assetRole
    );
  }

  function preview(select, image) {
    const asset = byId.get(select.value);
    const runtimeUrl =
      asset?.resource?.runtimeUrl;
    const file = asset?.resource?.file;
    const url =
      typeof runtimeUrl === "string" &&
      runtimeUrl.trim() !== ""
        ? runtimeUrl
        : typeof file === "string" &&
            file.trim() !== ""
          ? globalVisualAssetUrl(file)
          : null;

    if (!url) {
      image.removeAttribute("src");
      image.dataset.empty = "true";
      return;
    }

    image.src = url;
    image.alt = asset.label || asset.id;
    image.dataset.empty = "false";
  }

  const frontSelect = one(
    root,
    "[data-creature-front-select]"
  );
  const backSelect = one(
    root,
    "[data-creature-back-select]"
  );
  const iconSelect = one(
    root,
    "[data-creature-icon-select]"
  );

  const frontImage = one(root, "[data-preview-front]");
  const backImage = one(root, "[data-preview-back]");
  const iconImage = one(root, "[data-preview-icon]");
  const socketFrontImage = one(
    root,
    "[data-socket-front-preview]"
  );
  const socketBackImage = one(
    root,
    "[data-socket-back-preview]"
  );

  function syncPreviews(select, images) {
    for (const image of images) {
      preview(select, image);
    }
  }

  for (const [select, images] of [
    [frontSelect, [frontImage, socketFrontImage]],
    [backSelect, [backImage, socketBackImage]],
    [iconSelect, [iconImage]]
  ]) {
    listen(
      select,
      "change",
      () => syncPreviews(select, images)
    );
    syncPreviews(select, images);
  }

  function refreshCreatorAssetLists() {
    EDITOR_VISUAL_ASSETS_BY_ROOT.set(
      root,
      Object.freeze([...assets])
    );
    for (
      const select of root.querySelectorAll(
        "[data-asset-role]"
      )
    ) {
      populateSelect(
        select,
        assets,
        select.dataset.assetRole
      );
    }
  }

  function mountCreatorVisualImporter(
    importer
  ) {
    const creatorImportButton =
      importer.querySelector(
        "[data-creator-visual-import]"
      );
    const creatorImportFile =
      importer.querySelector(
        "[data-creator-visual-file]"
      );
    const creatorImportRole =
      importer.querySelector(
        "[data-creator-visual-role]"
      );
    const creatorImportLabel =
      importer.querySelector(
        "[data-creator-visual-label]"
      );
    const creatorImportState =
      importer.querySelector(
        "[data-creator-visual-state]"
      );

    if (
      !creatorImportButton ||
      !creatorImportFile ||
      !creatorImportRole
    ) {
      return;
    }

    if (
      !creatorVisualAssets ||
      typeof creatorVisualAssets.importImage !==
        "function"
    ) {
      creatorImportButton.disabled = true;
      if (creatorImportState) {
        creatorImportState.textContent =
          "Import personnel indisponible dans ce contexte.";
        creatorImportState.dataset.tone =
          "warning";
      }
      return;
    }

    listen(
      creatorImportButton,
      "click",
      () => {
        try {
          const file =
            creatorImportFile.files?.[0];
          if (!file) {
            throw new Error(
              "Choisis une image PNG, WebP ou JPEG."
            );
          }

          const role =
            String(
              creatorImportRole.value ?? ""
            ).trim();
          const label =
            String(
              creatorImportLabel?.value ??
                file.name ??
                "Asset personnel"
            ).trim();

          const asset =
            creatorVisualAssets.importImage({
              file,
              label,
              role
            });

          assets.push(asset);
          byId.set(asset.id, asset);
          refreshCreatorAssetLists();

          const preferredSelect =
            role === "creature"
              ? frontSelect
              : root.querySelector(
                  '[data-asset-role="' +
                    role +
                    '"]'
                );

          if (preferredSelect) {
            preferredSelect.value =
              asset.id;
            preferredSelect.dispatchEvent(
              new Event("change", {
                bubbles: true
              })
            );
          }

          for (
            const state of root.querySelectorAll(
              "[data-creator-visual-state]"
            )
          ) {
            state.textContent =
              "Importé : " +
              asset.label +
              " (" +
              asset.id +
              ")";
            state.dataset.tone = "ok";
          }

          creatorImportFile.value = "";
          if (creatorImportLabel) {
            creatorImportLabel.value = "";
          }
        } catch (error) {
          if (creatorImportState) {
            creatorImportState.textContent =
              error.message;
            creatorImportState.dataset.tone =
              "error";
          }
        }
      }
    );
  }

  for (
    const importer of root.querySelectorAll(
      "[data-creator-visual-importer]"
    )
  ) {
    mountCreatorVisualImporter(importer);
  }

  const scaleInput = one(
    root,
    "[data-creature-display-scale]"
  );
  const scaleOutput = one(
    root,
    "[data-creature-scale-value]"
  );

  function syncScalePreview() {
    const scale = Number(scaleInput.value) || 1;
    scaleOutput.textContent =
      scale.toFixed(2) + "×";

    const custom = one(root, "[data-creature-custom-views]").checked;
    one(root, "[data-creature-view-settings]").hidden = !custom;
    for (const [view, images] of [
      ["opponent", [frontImage]],
      ["player", [backImage]]
    ]) {
      const viewScale = one(root, "[data-creature-" + view + "-scale]");
      if (!custom) viewScale.value = String(scale);
      for (const axis of ["scale", "x", "y"]) {
        one(root, "[data-creature-" + view + "-" + axis + "]").disabled = !custom;
      }
      const resolvedScale = custom ? Number(viewScale.value) || scale : scale;
      const x = custom ? numericValue(root, "[data-creature-" + view + "-x]") : 0;
      const y = custom ? numericValue(root, "[data-creature-" + view + "-y]") : 0;
      for (const image of images) {
        image.style.transform = `translate(${x}px, ${y}px) scale(${resolvedScale})`;
      }
    }
    // Keep the existing socket-editing reference frame separate from combat placement.
    for (const image of [socketFrontImage, socketBackImage]) {
      image.style.transform = `scale(${scale})`;
    }
  }

  listen(one(root, "[data-creature-custom-views]"), "change", syncScalePreview);
  for (const view of ["player", "opponent"]) {
    for (const axis of ["scale", "x", "y"]) {
      listen(one(root, "[data-creature-" + view + "-" + axis + "]"), "input", syncScalePreview);
    }
  }

  listen(
    scaleInput,
    "input",
    syncScalePreview
  );
  syncScalePreview();

  return catalog;
}

function initialSocketStore() {
  return new Map();
}

function socketList(store) {
  const sockets = [];

  for (const [id, value] of store.entries()) {
    if (!value.front) {
      continue;
    }

    sockets.push({
      id,
      label: value.label || id,
      front: value.front,
      back: value.back ?? null
    });
  }

  return sockets;
}

export function syncCaptureSkillSocketOptionsV1({
  existingValue = "",
  existingOptions = [],
  sockets = []
}) {
  const centerLabel =
    existingOptions.find(
      (option) => option.value === ""
    )?.label || "Centre par défaut";

  const options = [
    Object.freeze({
      value: "",
      label: centerLabel
    })
  ];

  const seen = new Set([""]);

  for (const socket of sockets) {
    if (
      !socket ||
      typeof socket.id !== "string" ||
      socket.id.trim() === "" ||
      !socket.front
    ) {
      continue;
    }

    const id = socket.id.trim();
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);

    options.push(
      Object.freeze({
        value: id,
        label:
          typeof socket.label === "string" &&
          socket.label.trim() !== ""
            ? socket.label.trim()
            : id
      })
    );
  }

  return Object.freeze({
    options: Object.freeze(options),
    value: seen.has(existingValue)
      ? existingValue
      : ""
  });
}

function syncSkillSocketSelect(root, sockets) {
  const select = one(
    root,
    "[data-skill-socket]"
  );
  const current = select.value;

  const result =
    syncCaptureSkillSocketOptionsV1({
      existingValue: current,
      existingOptions: [
        ...select.options
      ].map((option) => ({
        value: option.value,
        label: option.textContent
      })),
      sockets: socketList(sockets)
    });

  select.textContent = "";
  for (const option of result.options) {
    createOption(
      select,
      option.value,
      option.label
    );
  }
  select.value = result.value;
}

export function captureSelectedSocketPointV1({
  sockets,
  socketId,
  view
}) {
  if (!(sockets instanceof Map)) {
    throw new TypeError("sockets must be a Map");
  }
  if (view !== "front" && view !== "back") {
    throw new RangeError(
      "socket view must be front or back"
    );
  }

  const socket = sockets.get(socketId);
  const point = socket?.[view] ?? null;

  if (point === null) {
    return null;
  }

  return {
    x: Number(point.x),
    y: Number(point.y)
  };
}

function clearSocketMarker(surface) {
  surface.querySelector(
    "[data-socket-marker]"
  )?.remove();
}

function syncCreatureSocketMarkers(
  root,
  sockets
) {
  const socketId = selectedValue(
    root,
    "[data-socket-kind]"
  );

  for (
    const surface of root.querySelectorAll(
      "[data-socket-surface]"
    )
  ) {
    const point =
      captureSelectedSocketPointV1({
        sockets,
        socketId,
        view: surface.dataset.socketView
      });

    if (point === null) {
      clearSocketMarker(surface);
      continue;
    }

    updateSocketMarker(
      surface,
      point,
      socketId
    );
  }
}

function updateSocketMarker(
  surface,
  point,
  socketId = ""
) {
  let marker = surface.querySelector("[data-socket-marker]");
  if (!marker) {
    marker = document.createElement("span");
    marker.dataset.socketMarker = "true";
    marker.className = "socket-marker";
    surface.append(marker);
  }

  marker.dataset.socketId = socketId;
  marker.style.left = (point.x * 100) + "%";
  marker.style.top = (point.y * 100) + "%";
}

function readCreatureFields(
  root,
  sockets,
  previousDraft = null
) {
  const elements = checkedValues(
    root,
    "[data-element]:checked"
  );

  const resistances = {};
  for (const input of root.querySelectorAll("[data-resistance]")) {
    resistances[input.dataset.resistance] = input.value;
  }

  return {
    id: selectedValue(root, "[data-creature-id]"),
    displayName: selectedValue(
      root,
      "[data-creature-name]"
    ),
    description: selectedValue(
      root,
      "[data-creature-description]"
    ),
    level: numericValue(root, "[data-creature-level]"),
    sourceStats:
      legacySourceStatsV1(
        previousDraft
      ),
    elements,
    resistances,
    capture: {
      capturable: one(
        root,
        "[data-capturable]"
      ).checked,
      captureRate: numericValue(
        root,
        "[data-capture-rate]"
      ),
      spawnChance: numericValue(
        root,
        "[data-spawn-chance]"
      ),
      spawnTags: elements,
      evolution: buildHumanEvolutionV1({
        enabled: one(
          root,
          "[data-evolution-enabled]"
        ).checked,
        targetId: selectedValue(
          root,
          "[data-evolution-target]"
        ),
        level: numericValue(
          root,
          "[data-evolution-level]"
        )
      })
    },
    combat: {
      approachTimeModifierPct:
        numericValue(
          root,
          "[data-creature-approach-time-modifier]"
        )
    },
    linkedSkillIds: [
      selectedValue(root, "[data-skill-id]")
    ],
    profileId: selectedValue(
      root,
      "[data-creature-profile]"
    ),
    displayScale: numericValue(
      root,
      "[data-creature-display-scale]"
    ),
    ...(one(root, "[data-creature-custom-views]").checked ? {
      viewOverrides: Object.fromEntries(["player", "opponent"].map(view => [view, {
        displayScale: numericValue(root, "[data-creature-" + view + "-scale]"),
        position: {
          x: numericValue(root, "[data-creature-" + view + "-x]"),
          y: numericValue(root, "[data-creature-" + view + "-y]")
        }
      }]))
    } : {}),
    visual: {
      frontAssetId: selectedValue(
        root,
        "[data-creature-front-select]"
      ),
      backAssetId: selectedValue(
        root,
        "[data-creature-back-select]"
      ),
      iconAssetId: selectedValue(
        root,
        "[data-creature-icon-select]"
      )
    },
    sockets: socketList(sockets),
    audio: {
      attack: selectedValue(
        root,
        "[data-creature-audio-attack]"
      ),
      hit: selectedValue(
        root,
        "[data-creature-audio-hit]"
      ),
      ko: selectedValue(
        root,
        "[data-creature-audio-ko]"
      )
    }
  };
}

function readSkillFields(root) {
  const form = selectedValue(
    root,
    "[data-skill-form]"
  );

  return {
    id: selectedValue(root, "[data-skill-id]"),
    name: selectedValue(root, "[data-skill-name]"),
    description: selectedValue(
      root,
      "[data-skill-description]"
    ),
    requiredLevel: numericValue(
      root,
      "[data-skill-required-level]"
    ),
    loadoutSlot:
      one(
        root,
        "[data-skill-ultimate]"
      ).checked
        ? "ultimate"
        : "standard",
    usageScopes: ["capture", "combat"],
    category: selectedValue(
      root,
      "[data-skill-category]"
    ),
    form,
    element: selectedValue(
      root,
      "[data-skill-element]"
    ) || null,
    approachMode: selectedValue(
      root,
      "[data-skill-approach]"
    ),
    hitPresenceStates:
      one(
        root,
        "[data-skill-hit-presence-enabled]"
      ).checked
        ? checkedValues(
            root,
            "[data-skill-hit-presence]:checked"
          )
        : null,
    dodgeable:
      one(
        root,
        "[data-skill-dodgeable]"
      ).checked,
    targetLocations:
      checkedValues(
        root,
        "[data-skill-target-location]:checked"
      ),
    energyCost: numericValue(
      root,
      "[data-skill-energy-cost]"
    ),
    preparationMs: numericValue(
      root,
      "[data-skill-preparation]"
    ),
    travelMs: numericValue(
      root,
      "[data-skill-travel-time]"
    ),
    recoveryMs: numericValue(
      root,
      "[data-skill-recovery]"
    ),
    cooldownMs: numericValue(
      root,
      "[data-skill-cooldown]"
    ),
    maxUsesPerCombat:
      numericValue(
        root,
        "[data-skill-max-uses-per-combat]"
      ) === 0
        ? null
        : numericValue(
            root,
            "[data-skill-max-uses-per-combat]"
          ),
    activationRequirements:
      readHumanSkillActivationRequirementsV1(
        root
      ),
    effects: readHumanSkillEffectsV1(root),
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    projectileClash:
      readHumanProjectilePowerV1(
        root,
        form
      ),
    presentation: {
      ...readSkillSpriteControlsV1(root),
      iconAssetId: selectedValue(
        root,
        "[data-skill-icon]"
      ),
      castAssetId: selectedValue(
        root,
        "[data-skill-cast-fx]"
      ),
      castDisplayScale: numericValue(
        root,
        "[data-skill-cast-scale]"
      ),
      travelAssetId: selectedValue(
        root,
        "[data-skill-travel-fx]"
      ),
      travelDisplayScale: numericValue(
        root,
        "[data-skill-travel-scale]"
      ),
      travelPlaybackMode: selectedValue(
        root,
        "[data-skill-travel-playback]"
      ),
      castLayerPlayer: selectedValue(
        root,
        "[data-skill-cast-layer-player]"
      ),
      castLayerOpponent: selectedValue(
        root,
        "[data-skill-cast-layer-opponent]"
      ),
      travelLayerPlayer: selectedValue(
        root,
        "[data-skill-travel-layer-player]"
      ),
      travelLayerOpponent: selectedValue(
        root,
        "[data-skill-travel-layer-opponent]"
      ),
      impactAssetId: selectedValue(
        root,
        "[data-skill-impact-fx]"
      ),
      impactDisplayScale: numericValue(
        root,
        "[data-skill-impact-scale]"
      ),
      impactDurationMs: numericValue(root, "[data-skill-impact-duration]"),
      impactOffsetX: numericValue(root, "[data-skill-impact-offset-x]"),
      impactOffsetY: numericValue(root, "[data-skill-impact-offset-y]"),
      zoneAssetId: selectedValue(
        root,
        "[data-skill-zone-fx]"
      ),
      zoneDisplayScale: numericValue(
        root,
        "[data-skill-zone-scale]"
      ),
      zoneDisplayScaleX: numericValue(
        root,
        "[data-skill-zone-scale-x]"
      ),
      zoneDisplayScaleY: numericValue(
        root,
        "[data-skill-zone-scale-y]"
      ),
      zoneOffsetX: numericValue(
        root,
        "[data-skill-zone-offset-x]"
      ),
      zoneOffsetY: numericValue(
        root,
        "[data-skill-zone-offset-y]"
      ),
      socketId: selectedValue(
        root,
        "[data-skill-socket]"
      ) || null,
      statusVisuals:
        readHumanStatusVisualsV1(root),
      castAudioAssetId: selectedValue(
        root,
        "[data-skill-cast-audio]"
      ),
      travelAudioAssetId: selectedValue(
        root,
        "[data-skill-travel-audio]"
      ),
      impactAudioAssetId: selectedValue(
        root,
        "[data-skill-impact-audio]"
      ),
      zoneAudioAssetId: selectedValue(
        root,
        "[data-skill-zone-audio]"
      ),
      fxGlowColor: selectedValue(
        root,
        "[data-skill-fx-glow-color]"
      ),
      fxGlowStrength: numericValue(
        root,
        "[data-skill-fx-glow-strength]"
      ),
      fxGlowRadiusPx: numericValue(
        root,
        "[data-skill-fx-glow-radius]"
      ),
      impactFlashColor: selectedValue(
        root,
        "[data-skill-impact-flash-color]"
      ),
      impactFlashOpacity: numericValue(
        root,
        "[data-skill-impact-flash-opacity]"
      ),
      impactFlashDurationMs: numericValue(
        root,
        "[data-skill-impact-flash-duration]"
      ),
      impactFlashScale: numericValue(
        root,
        "[data-skill-impact-flash-scale]"
      ),
      impactShakeAmplitudePx: numericValue(
        root,
        "[data-skill-impact-shake-amplitude]"
      ),
      impactShakeDurationMs: numericValue(
        root,
        "[data-skill-impact-shake-duration]"
      ),
      castBurstColor: selectedValue(
        root,
        "[data-skill-cast-burst-color]"
      ),
      castBurstCount: numericValue(
        root,
        "[data-skill-cast-burst-count]"
      ),
      castBurstSpreadPx: numericValue(
        root,
        "[data-skill-cast-burst-spread]"
      ),
      castBurstSizePx: numericValue(
        root,
        "[data-skill-cast-burst-size]"
      ),
      castBurstRisePx: numericValue(
        root,
        "[data-skill-cast-burst-rise]"
      ),
      castBurstDurationMs: numericValue(
        root,
        "[data-skill-cast-burst-duration]"
      ),
      castBurstOpacity: numericValue(
        root,
        "[data-skill-cast-burst-opacity]"
      ),
      projectileTrailColor: selectedValue(
        root,
        "[data-skill-projectile-trail-color]"
      ),
      projectileTrailCount: numericValue(
        root,
        "[data-skill-projectile-trail-count]"
      ),
      projectileTrailLengthPx: numericValue(
        root,
        "[data-skill-projectile-trail-length]"
      ),
      projectileTrailSizePx: numericValue(
        root,
        "[data-skill-projectile-trail-size]"
      ),
      projectileTrailOpacity: numericValue(
        root,
        "[data-skill-projectile-trail-opacity]"
      ),
      projectileTrailAnchorX:
        numericValue(
          root,
          "[data-skill-projectile-trail-anchor-x]"
        ) / 100,
      projectileTrailAnchorY:
        numericValue(
          root,
          "[data-skill-projectile-trail-anchor-y]"
        ) / 100,
      impactBurstColor: selectedValue(
        root,
        "[data-skill-impact-burst-color]"
      ),
      impactBurstCount: numericValue(
        root,
        "[data-skill-impact-burst-count]"
      ),
      impactBurstSpreadPx: numericValue(
        root,
        "[data-skill-impact-burst-spread]"
      ),
      impactBurstSizePx: numericValue(
        root,
        "[data-skill-impact-burst-size]"
      ),
      impactBurstDurationMs: numericValue(
        root,
        "[data-skill-impact-burst-duration]"
      ),
      impactBurstOpacity: numericValue(
        root,
        "[data-skill-impact-burst-opacity]"
      ),
      aftermathSmokeColor: selectedValue(
        root,
        "[data-skill-aftermath-smoke-color]"
      ),
      aftermathSmokeCount: numericValue(
        root,
        "[data-skill-aftermath-smoke-count]"
      ),
      aftermathSmokeSpreadPx: numericValue(
        root,
        "[data-skill-aftermath-smoke-spread]"
      ),
      aftermathSmokeSizePx: numericValue(
        root,
        "[data-skill-aftermath-smoke-size]"
      ),
      aftermathSmokeRisePx: numericValue(
        root,
        "[data-skill-aftermath-smoke-rise]"
      ),
      aftermathSmokeDurationMs: numericValue(
        root,
        "[data-skill-aftermath-smoke-duration]"
      ),
      aftermathSmokeOpacity: numericValue(
        root,
        "[data-skill-aftermath-smoke-opacity]"
      )
    }
  };
}

function readLoadout(root, creatureId) {
  const skillIds = [
    ...root.querySelectorAll(
      '[data-loadout-slot-type="standard"]'
    )
  ].map((select) => select.value || null);
  const ultimateSkillId =
    one(
      root,
      '[data-loadout-slot-type="ultimate"]'
    ).value || null;

  return buildHumanLoadoutV1({
    creatureId,
    skillIds,
    ultimateSkillId
  });
}

export function preserveUnrepresentedCreatureFieldsV1({
  fields,
  previousDraft = null,
  visibleElementIds = [],
  visibleResistanceKinds = [],
  activeSkillIds = [],
  evolutionRepresented = false
}) {
  if (!fields || typeof fields !== "object") {
    throw new TypeError("fields must be an object");
  }

  const visibleElements = new Set(
    Array.isArray(visibleElementIds)
      ? visibleElementIds.map(String)
      : []
  );
  const visibleResistances = new Set(
    Array.isArray(visibleResistanceKinds)
      ? visibleResistanceKinds.map(String)
      : []
  );

  const hiddenElements =
    previousDraft?.elements?.filter(
      (id) => !visibleElements.has(String(id))
    ) ?? [];

  const editedResistances =
    resistanceEntries(fields.resistances);
  const hiddenResistances =
    previousDraft?.resistances?.filter(
      (entry) =>
        !visibleResistances.has(
          String(entry.kind)
        )
    ) ?? [];

  const hiddenSpawnTags =
    previousDraft?.capture?.spawnTags?.filter(
      (id) => !visibleElements.has(String(id))
    ) ?? [];

  return {
    ...fields,
    elements: [
      ...new Set([
        ...(fields.elements ?? []),
        ...hiddenElements
      ])
    ],
    resistances: [
      ...editedResistances,
      ...hiddenResistances
    ],
    capture: {
      ...fields.capture,
      spawnTags: [
        ...new Set([
          ...(fields.elements ?? []),
          ...hiddenElements,
          ...hiddenSpawnTags
        ])
      ],
      evolution:
        evolutionRepresented
          ? (
              fields.capture?.evolution ??
              null
            )
          : (
              previousDraft?.capture?.evolution ??
              fields.capture?.evolution ??
              null
            )
    },
    combat: {
      ...(fields.combat ?? {}),
      maxEnergy:
        previousDraft?.combat?.maxEnergy ?? 0,
      initialEnergy:
        previousDraft?.combat?.initialEnergy ?? 0,
      energyChargeAmount:
        previousDraft?.combat?.energyChargeAmount ?? 0,
      energyChargeIntervalMs:
        previousDraft?.combat?.energyChargeIntervalMs ?? 0,
      movementEnergyPerStep:
        previousDraft?.combat?.movementEnergyPerStep ?? 0,
      chargeTimeModifierPct:
        previousDraft?.combat?.chargeTimeModifierPct ?? 0
    },
    position:
      previousDraft?.presentation?.position ??
      fields.position ??
      { x: 0, y: 0 },
    transformOrigin:
      previousDraft?.presentation?.transformOrigin ??
      fields.transformOrigin ??
      { x: "50%", y: "50%" },
    linkedSkillIds: [
      ...new Set([
        ...(previousDraft?.skillIds ?? []),
        ...(Array.isArray(activeSkillIds)
          ? activeSkillIds
          : [])
      ])
    ]
  };
}

function skillGlowPresetPresentationFromControlsV1(
  root
) {
  const strength =
    root.querySelector(
      "[data-skill-fx-glow-strength]"
    );
  const radius =
    root.querySelector(
      "[data-skill-fx-glow-radius]"
    );
  const color =
    root.querySelector(
      "[data-skill-fx-glow-color]"
    );

  return {
    fxGlowColor:
      color?.value ?? "#ffffff",
    fxGlowStrength:
      Number(strength?.value) || 0,
    fxGlowRadiusPx:
      Number(radius?.value) || 16
  };
}

function syncSkillGlowPresetStateV1(
  root
) {
  const select =
    root.querySelector(
      "[data-skill-fx-glow-preset]"
    );
  const state =
    root.querySelector(
      "[data-skill-fx-glow-preset-state]"
    );

  if (!select) {
    return "custom";
  }

  const presetId =
    captureFxGlowPresetIdForValuesV1(
      skillGlowPresetPresentationFromControlsV1(
        root
      )
    );

  select.value = presetId;

  if (state) {
    const preset =
      captureFxGlowPresetByIdV1(
        presetId
      );

    if (preset) {
      state.textContent =
        preset.label +
        " — " +
        preset.description;
      state.dataset.tone = "info";
    } else {
      state.textContent =
        "Personnalisé — tes valeurs avancées ne correspondent plus exactement à un préréglage.";
      state.dataset.tone = "info";
    }
  }

  return presetId;
}

function skillParticlePresetPresentationFromControlsV1(
  root
) {
  const value = (selector, fallback = 0) => {
    const field = root.querySelector(selector);
    return Number(field?.value) || fallback;
  };
  const text = (selector, fallback) =>
    root.querySelector(selector)?.value ??
    fallback;

  return {
    castBurstColor: text(
      "[data-skill-cast-burst-color]",
      "#ffffff"
    ),
    castBurstCount: value(
      "[data-skill-cast-burst-count]"
    ),
    castBurstSpreadPx: value(
      "[data-skill-cast-burst-spread]"
    ),
    castBurstSizePx: value(
      "[data-skill-cast-burst-size]"
    ),
    castBurstRisePx: value(
      "[data-skill-cast-burst-rise]"
    ),
    castBurstDurationMs: value(
      "[data-skill-cast-burst-duration]"
    ),
    castBurstOpacity: value(
      "[data-skill-cast-burst-opacity]"
    ),
    projectileTrailColor: text(
      "[data-skill-projectile-trail-color]",
      "#ffffff"
    ),
    projectileTrailCount: value(
      "[data-skill-projectile-trail-count]"
    ),
    projectileTrailLengthPx: value(
      "[data-skill-projectile-trail-length]"
    ),
    projectileTrailSizePx: value(
      "[data-skill-projectile-trail-size]"
    ),
    projectileTrailOpacity: value(
      "[data-skill-projectile-trail-opacity]"
    ),
    impactBurstColor: text(
      "[data-skill-impact-burst-color]",
      "#ffffff"
    ),
    impactBurstCount: value(
      "[data-skill-impact-burst-count]"
    ),
    impactBurstSpreadPx: value(
      "[data-skill-impact-burst-spread]"
    ),
    impactBurstSizePx: value(
      "[data-skill-impact-burst-size]"
    ),
    impactBurstDurationMs: value(
      "[data-skill-impact-burst-duration]"
    ),
    impactBurstOpacity: value(
      "[data-skill-impact-burst-opacity]"
    ),
    aftermathSmokeColor: text(
      "[data-skill-aftermath-smoke-color]",
      "#594943"
    ),
    aftermathSmokeCount: value(
      "[data-skill-aftermath-smoke-count]"
    ),
    aftermathSmokeSpreadPx: value(
      "[data-skill-aftermath-smoke-spread]"
    ),
    aftermathSmokeSizePx: value(
      "[data-skill-aftermath-smoke-size]"
    ),
    aftermathSmokeRisePx: value(
      "[data-skill-aftermath-smoke-rise]"
    ),
    aftermathSmokeDurationMs: value(
      "[data-skill-aftermath-smoke-duration]"
    ),
    aftermathSmokeOpacity: value(
      "[data-skill-aftermath-smoke-opacity]"
    )
  };
}

function syncSkillParticlePresetStateV1(
  root
) {
  const select =
    root.querySelector(
      "[data-skill-fx-particle-preset]"
    );
  const state =
    root.querySelector(
      "[data-skill-fx-particle-preset-state]"
    );

  if (!select) {
    return "custom";
  }

  const presetId =
    captureFxParticlePresetIdForValuesV1(
      skillParticlePresetPresentationFromControlsV1(
        root
      )
    );

  select.value = presetId;

  if (state) {
    const preset =
      captureFxParticlePresetByIdV1(
        presetId
      );
    state.textContent = preset
      ? preset.label +
        " — " +
        preset.description
      : "Personnalisée — tes valeurs avancées ne correspondent plus exactement à un préréglage.";
    state.dataset.tone = "info";
  }

  return presetId;
}

function writeSkillFeedbackControlsV1(
  root,
  presentation = {}
) {
  const values = [
    [
      "[data-skill-fx-glow-color]",
      presentation.fxGlowColor ??
        "#ffffff"
    ],
    [
      "[data-skill-fx-glow-strength]",
      presentation.fxGlowStrength ?? 0
    ],
    [
      "[data-skill-fx-glow-radius]",
      presentation.fxGlowRadiusPx ?? 16
    ],
    [
      "[data-skill-impact-flash-color]",
      presentation.impactFlashColor ??
        "#ffffff"
    ],
    [
      "[data-skill-impact-flash-opacity]",
      presentation.impactFlashOpacity ?? 0
    ],
    [
      "[data-skill-impact-flash-duration]",
      presentation.impactFlashDurationMs ??
        120
    ],
    [
      "[data-skill-impact-flash-scale]",
      presentation.impactFlashScale ?? 1.5
    ],
    [
      "[data-skill-impact-shake-amplitude]",
      presentation.impactShakeAmplitudePx ??
        0
    ],
    [
      "[data-skill-impact-shake-duration]",
      presentation.impactShakeDurationMs ??
        140
    ],
    [
      "[data-skill-cast-burst-color]",
      presentation.castBurstColor ??
        "#ffffff"
    ],
    [
      "[data-skill-cast-burst-count]",
      presentation.castBurstCount ?? 0
    ],
    [
      "[data-skill-cast-burst-spread]",
      presentation.castBurstSpreadPx ?? 0
    ],
    [
      "[data-skill-cast-burst-size]",
      presentation.castBurstSizePx ?? 0
    ],
    [
      "[data-skill-cast-burst-rise]",
      presentation.castBurstRisePx ?? 0
    ],
    [
      "[data-skill-cast-burst-duration]",
      presentation.castBurstDurationMs ?? 0
    ],
    [
      "[data-skill-cast-burst-opacity]",
      presentation.castBurstOpacity ?? 0
    ],
    [
      "[data-skill-projectile-trail-color]",
      presentation.projectileTrailColor ??
        "#ffffff"
    ],
    [
      "[data-skill-projectile-trail-count]",
      presentation.projectileTrailCount ?? 0
    ],
    [
      "[data-skill-projectile-trail-length]",
      presentation.projectileTrailLengthPx ?? 0
    ],
    [
      "[data-skill-projectile-trail-size]",
      presentation.projectileTrailSizePx ?? 0
    ],
    [
      "[data-skill-projectile-trail-opacity]",
      presentation.projectileTrailOpacity ?? 0
    ],
    [
      "[data-skill-projectile-trail-anchor-x]",
      (presentation.projectileTrailAnchorX ?? 0.5) * 100
    ],
    [
      "[data-skill-projectile-trail-anchor-y]",
      (presentation.projectileTrailAnchorY ?? 0.5) * 100
    ],
    [
      "[data-skill-impact-burst-color]",
      presentation.impactBurstColor ??
        "#ffffff"
    ],
    [
      "[data-skill-impact-burst-count]",
      presentation.impactBurstCount ?? 0
    ],
    [
      "[data-skill-impact-burst-spread]",
      presentation.impactBurstSpreadPx ?? 0
    ],
    [
      "[data-skill-impact-burst-size]",
      presentation.impactBurstSizePx ?? 0
    ],
    [
      "[data-skill-impact-burst-duration]",
      presentation.impactBurstDurationMs ?? 0
    ],
    [
      "[data-skill-impact-burst-opacity]",
      presentation.impactBurstOpacity ?? 0
    ],
    [
      "[data-skill-aftermath-smoke-color]",
      presentation.aftermathSmokeColor ??
        "#594943"
    ],
    [
      "[data-skill-aftermath-smoke-count]",
      presentation.aftermathSmokeCount ?? 0
    ],
    [
      "[data-skill-aftermath-smoke-spread]",
      presentation.aftermathSmokeSpreadPx ?? 0
    ],
    [
      "[data-skill-aftermath-smoke-size]",
      presentation.aftermathSmokeSizePx ?? 0
    ],
    [
      "[data-skill-aftermath-smoke-rise]",
      presentation.aftermathSmokeRisePx ?? 0
    ],
    [
      "[data-skill-aftermath-smoke-duration]",
      presentation.aftermathSmokeDurationMs ?? 0
    ],
    [
      "[data-skill-aftermath-smoke-opacity]",
      presentation.aftermathSmokeOpacity ?? 0
    ]
  ];

  for (const [selector, value] of values) {
    const field = root.querySelector(selector);
    if (field) {
      field.value = String(value ?? "");
    }
  }

  syncSkillGlowPresetStateV1(root);
  syncSkillParticlePresetStateV1(root);
}

function writeCaptureFxStarterPresentationFieldsV1(
  root,
  presentation
) {
  writeSkillSpriteControlsV1(
    root,
    presentation
  );
  writeSkillFeedbackControlsV1(
    root,
    presentation
  );

  const values = [
    ["[data-skill-icon]", presentation.iconAssetId],
    ["[data-skill-cast-fx]", presentation.castAssetId],
    ["[data-skill-cast-scale]", presentation.castDisplayScale],
    ["[data-skill-travel-fx]", presentation.travelAssetId],
    ["[data-skill-travel-scale]", presentation.travelDisplayScale],
    ["[data-skill-travel-playback]", presentation.travelPlaybackMode],
    ["[data-skill-travel-layer-player]", presentation.travelLayerPlayer],
    ["[data-skill-travel-layer-opponent]", presentation.travelLayerOpponent],
    ["[data-skill-impact-fx]", presentation.impactAssetId],
    ["[data-skill-impact-scale]", presentation.impactDisplayScale],
    ["[data-skill-impact-duration]", presentation.impactDurationMs],
    ["[data-skill-zone-fx]", presentation.zoneAssetId],
    ["[data-skill-zone-scale]", presentation.zoneDisplayScale],
    ["[data-skill-zone-scale-x]", presentation.zoneDisplayScaleX],
    ["[data-skill-zone-scale-y]", presentation.zoneDisplayScaleY],
    ["[data-skill-cast-audio]", presentation.castAudioAssetId],
    ["[data-skill-travel-audio]", presentation.travelAudioAssetId],
    ["[data-skill-impact-audio]", presentation.impactAudioAssetId],
    ["[data-skill-zone-audio]", presentation.zoneAudioAssetId]
  ];

  for (const [selector, value] of values) {
    const field = root.querySelector(selector);
    if (field) {
      field.value = String(value ?? "");
    }
  }
}

export function mountEditorCardDisclosuresV1({
  root,
  listen
}) {
  if (!root || typeof root.querySelectorAll !== "function") {
    throw new TypeError(
      "root doit exposer querySelectorAll()"
    );
  }
  if (typeof listen !== "function") {
    throw new TypeError(
      "listen doit être une fonction"
    );
  }

  let count = 0;

  for (const card of root.querySelectorAll(".card")) {
    const title = [...card.children].find(
      (child) =>
        child?.classList?.contains?.(
          "card-title"
        )
    );

    if (!title) {
      continue;
    }

    card.dataset.editorCollapsible = "true";
    if (
      card.dataset.collapsed !== "true" &&
      card.dataset.collapsed !== "false"
    ) {
      card.dataset.collapsed = "true";
    }

    title.dataset.editorCardToggle = "true";
    title.setAttribute("role", "button");
    title.tabIndex = 0;

    const sync = () => {
      const collapsed =
        card.dataset.collapsed === "true";

      title.setAttribute(
        "aria-expanded",
        collapsed ? "false" : "true"
      );
      title.dataset.disclosureLabel =
        collapsed ? "Dérouler" : "Fermer";
      title.setAttribute(
        "aria-label",
        (
          collapsed
            ? "Dérouler "
            : "Fermer "
        ) +
          (
            title.querySelector("h2")
              ?.textContent ??
            "ce bloc"
          )
      );
    };

    const toggle = () => {
      card.dataset.collapsed =
        card.dataset.collapsed === "true"
          ? "false"
          : "true";
      sync();
    };

    listen(
      title,
      "click",
      () => {
        toggle();
      }
    );

    listen(
      title,
      "keydown",
      (event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          toggle();
        }
      }
    );

    sync();
    count += 1;
  }

  return count;
}

export function mountCaptureEditorHumanV2({ root, creatorVisualAssets = null }) {
  if (!root || typeof root.querySelector !== "function") {
    throw new TypeError("root doit être un élément DOM");
  }

  const listeners = [];
  const sockets = initialSocketStore();
  const configuredSkills = new Map();
  const configuredCreatures = new Map();
  let selectedCreatureId = null;
  let creatureDirty = false;
  let selectedLegacyState = null;
  let disposed = false;
  let lastExport = null;
  let statRegistry = null;
  let progressionRules = null;
  const combatTeamControls = mountCaptureEditorCombatTeamControlsV1({
    root, configuredCreatures,
    getSelectedCreatureId: () => selectedValue(root, "[data-creature-id]")
  });

  function listen(target, type, handler) {
    if (disposed) {
      return;
    }
    target.addEventListener(type, handler);
    listeners.push(() =>
      target.removeEventListener(type, handler)
    );
  }

  mountEditorCardDisclosuresV1({
    root,
    listen
  });

  for (const tab of root.querySelectorAll("[data-editor-tab]")) {
    listen(tab, "click", () =>
      setTab(root, tab.dataset.editorTab)
    );
  }

  setTab(root, "creature");

  const librarySelect = one(
    root,
    "[data-skill-library-select]"
  );
  const libraryState = one(
    root,
    "[data-skill-library-state]"
  );
  const newSkillButton = one(
    root,
    "[data-skill-new]"
  );
  const createSkillButton = one(
    root,
    "[data-skill-create]"
  );
  const updateSkillButton = one(
    root,
    "[data-skill-update]"
  );
  const skillActivationEnabled = one(
    root,
    "[data-skill-activation-enabled]"
  );
  const skillActivationConfig = one(
    root,
    "[data-skill-activation-config]"
  );
  const skillActivationConditionsHost = one(
    root,
    "[data-skill-activation-conditions-host]"
  );
  const skillActivationAddButton = one(
    root,
    "[data-skill-activation-add]"
  );
  const skillEffectsHost = one(
    root,
    "[data-skill-effects-host]"
  );
  const skillEffectAddButton = one(
    root,
    "[data-skill-effect-add]"
  );
  const creatureLibrarySelect = one(
    root,
    "[data-creature-library-select]"
  );
  const creatureLibraryState = one(
    root,
    "[data-creature-library-state]"
  );
  const newCreatureButton = one(
    root,
    "[data-creature-new]"
  );
  const createCreatureButton = one(
    root,
    "[data-creature-create]"
  );
  const updateCreatureButton = one(
    root,
    "[data-creature-update]"
  );
  const statRegistryApplyButton = one(
    root,
    "[data-stat-registry-apply]"
  );
  const statCustomAddButton = one(
    root,
    "[data-stat-custom-add]"
  );
  const progressionApplyButton = one(
    root,
    "[data-progression-apply]"
  );
  const progressionAddButton = one(
    root,
    "[data-progression-add-step]"
  );
  const progressionScheduleHost = one(
    root,
    "[data-progression-schedule-host]"
  );
  const exportCurrentCreatureButton = one(
    root,
    "[data-export-current-creature]"
  );
  const exportCurrentSkillButton = one(
    root,
    "[data-export-current-skill]"
  );
  const exportDatabaseButton = one(
    root,
    "[data-export-database]"
  );
  const importCaptureJsonInput = one(
    root,
    "[data-import-capture-json]"
  );
  const importReplaceExisting = one(
    root,
    "[data-import-replace-existing]"
  );
  const transferState = one(
    root,
    "[data-transfer-state]"
  );

  const fxGlowPresetSelect =
    root.querySelector(
      "[data-skill-fx-glow-preset]"
    );
  const fxGlowPresetState =
    root.querySelector(
      "[data-skill-fx-glow-preset-state]"
    );

  function updateGlowPresetStateV1(
    presetId
  ) {
    const preset =
      captureFxGlowPresetByIdV1(
        presetId
      );

    if (!fxGlowPresetState) {
      return;
    }

    fxGlowPresetState.textContent =
      preset
        ? preset.label +
          " — " +
          preset.description
        : "Personnalisé — ouvre les réglages experts pour affiner précisément le glow.";
    fxGlowPresetState.dataset.tone =
      "info";
  }

  if (fxGlowPresetSelect) {
    listen(
      fxGlowPresetSelect,
      "change",
      () => {
        const presetId =
          fxGlowPresetSelect.value;

        if (presetId === "custom") {
          updateGlowPresetStateV1(
            "custom"
          );
          return;
        }

        const applied =
          applyCaptureFxGlowPresetV1({
            presetId,
            presentation:
              skillGlowPresetPresentationFromControlsV1(
                root
              )
          });

        const strength =
          root.querySelector(
            "[data-skill-fx-glow-strength]"
          );
        const radius =
          root.querySelector(
            "[data-skill-fx-glow-radius]"
          );

        if (strength) {
          strength.value = String(
            applied.fxGlowStrength
          );
        }
        if (radius) {
          radius.value = String(
            applied.fxGlowRadiusPx
          );
        }

        updateGlowPresetStateV1(
          presetId
        );
        setStatus(
          "Glow « " +
            captureFxGlowPresetByIdV1(
              presetId
            ).label +
            " » appliqué. Les valeurs avancées restent modifiables.",
          "ok"
        );
      }
    );
  }

  for (const selector of [
    "[data-skill-fx-glow-strength]",
    "[data-skill-fx-glow-radius]"
  ]) {
    const field =
      root.querySelector(selector);
    if (!field) {
      continue;
    }

    listen(field, "input", () => {
      const presetId =
        syncSkillGlowPresetStateV1(
          root
        );
      updateGlowPresetStateV1(
        presetId
      );
    });
  }

  const fxParticlePresetSelect =
    root.querySelector(
      "[data-skill-fx-particle-preset]"
    );
  const fxParticlePresetState =
    root.querySelector(
      "[data-skill-fx-particle-preset-state]"
    );

  function updateParticlePresetStateV1(
    presetId
  ) {
    const preset =
      captureFxParticlePresetByIdV1(
        presetId
      );
    if (!fxParticlePresetState) {
      return;
    }
    fxParticlePresetState.textContent =
      preset
        ? preset.label +
          " — " +
          preset.description
        : "Personnalisée — ouvre les réglages experts pour affiner précisément les particules.";
    fxParticlePresetState.dataset.tone =
      "info";
  }

  if (fxParticlePresetSelect) {
    listen(
      fxParticlePresetSelect,
      "change",
      () => {
        const presetId =
          fxParticlePresetSelect.value;

        if (presetId === "custom") {
          updateParticlePresetStateV1(
            "custom"
          );
          return;
        }

        const applied =
          applyCaptureFxParticlePresetV1({
            presetId,
            presentation:
              skillParticlePresetPresentationFromControlsV1(
                root
              )
          });

        const fields = [
          [
            "[data-skill-cast-burst-count]",
            applied.castBurstCount
          ],
          [
            "[data-skill-cast-burst-spread]",
            applied.castBurstSpreadPx
          ],
          [
            "[data-skill-cast-burst-size]",
            applied.castBurstSizePx
          ],
          [
            "[data-skill-cast-burst-rise]",
            applied.castBurstRisePx
          ],
          [
            "[data-skill-cast-burst-duration]",
            applied.castBurstDurationMs
          ],
          [
            "[data-skill-cast-burst-opacity]",
            applied.castBurstOpacity
          ],
          [
            "[data-skill-projectile-trail-count]",
            applied.projectileTrailCount
          ],
          [
            "[data-skill-projectile-trail-length]",
            applied.projectileTrailLengthPx
          ],
          [
            "[data-skill-projectile-trail-size]",
            applied.projectileTrailSizePx
          ],
          [
            "[data-skill-projectile-trail-opacity]",
            applied.projectileTrailOpacity
          ],
          [
            "[data-skill-impact-burst-count]",
            applied.impactBurstCount
          ],
          [
            "[data-skill-impact-burst-spread]",
            applied.impactBurstSpreadPx
          ],
          [
            "[data-skill-impact-burst-size]",
            applied.impactBurstSizePx
          ],
          [
            "[data-skill-impact-burst-duration]",
            applied.impactBurstDurationMs
          ],
          [
            "[data-skill-impact-burst-opacity]",
            applied.impactBurstOpacity
          ],
          [
            "[data-skill-aftermath-smoke-count]",
            applied.aftermathSmokeCount
          ],
          [
            "[data-skill-aftermath-smoke-spread]",
            applied.aftermathSmokeSpreadPx
          ],
          [
            "[data-skill-aftermath-smoke-size]",
            applied.aftermathSmokeSizePx
          ],
          [
            "[data-skill-aftermath-smoke-rise]",
            applied.aftermathSmokeRisePx
          ],
          [
            "[data-skill-aftermath-smoke-duration]",
            applied.aftermathSmokeDurationMs
          ],
          [
            "[data-skill-aftermath-smoke-opacity]",
            applied.aftermathSmokeOpacity
          ]
        ];

        for (const [selector, value] of fields) {
          const field =
            root.querySelector(selector);
          if (field) {
            field.value = String(value);
          }
        }

        updateParticlePresetStateV1(
          presetId
        );
        setStatus(
          root,
          "Particules « " +
            captureFxParticlePresetByIdV1(
              presetId
            ).label +
            " » appliquées sans modifier le gameplay.",
          "ok"
        );
      }
    );
  }

  for (const selector of [
    "[data-skill-cast-burst-count]",
    "[data-skill-cast-burst-spread]",
    "[data-skill-cast-burst-size]",
    "[data-skill-cast-burst-rise]",
    "[data-skill-cast-burst-duration]",
    "[data-skill-cast-burst-opacity]",
    "[data-skill-projectile-trail-count]",
    "[data-skill-projectile-trail-length]",
    "[data-skill-projectile-trail-size]",
    "[data-skill-projectile-trail-opacity]",
    "[data-skill-impact-burst-count]",
    "[data-skill-impact-burst-spread]",
    "[data-skill-impact-burst-size]",
    "[data-skill-impact-burst-duration]",
    "[data-skill-impact-burst-opacity]",
    "[data-skill-aftermath-smoke-count]",
    "[data-skill-aftermath-smoke-spread]",
    "[data-skill-aftermath-smoke-size]",
    "[data-skill-aftermath-smoke-rise]",
    "[data-skill-aftermath-smoke-duration]",
    "[data-skill-aftermath-smoke-opacity]"
  ]) {
    const field =
      root.querySelector(selector);
    if (!field) {
      continue;
    }
    listen(field, "input", () => {
      const presetId =
        syncSkillParticlePresetStateV1(
          root
        );
      updateParticlePresetStateV1(
        presetId
      );
    });
  }

  syncSkillParticlePresetStateV1(root);

  const fxStarterProfileSelect =
    root.querySelector(
      "[data-skill-fx-starter-profile]"
    );
  const fxStarterApplyButton =
    root.querySelector(
      "[data-skill-fx-starter-apply]"
    );
  const fxStarterState =
    root.querySelector(
      "[data-skill-fx-starter-state]"
    );
  let fxStarterLibrariesReady = false;
  let fxStarterVisualAssetIds = new Set();
  let fxStarterAudioAssetIds = new Set();

  function updateFxStarterState(
    message,
    tone = "info"
  ) {
    if (!fxStarterState) {
      return;
    }
    fxStarterState.textContent = message;
    fxStarterState.dataset.tone = tone;
  }

  function syncFxStarterApplyButton() {
    if (!fxStarterApplyButton) {
      return;
    }
    fxStarterApplyButton.disabled =
      !fxStarterLibrariesReady ||
      !fxStarterProfileSelect?.value;
  }

  syncSkillGlowPresetStateV1(root);

  if (fxStarterProfileSelect) {
    fxStarterProfileSelect.textContent = "";
    createOption(
      fxStarterProfileSelect,
      "",
      "Choisir une base FX GenSrpG"
    );

    for (
      const profile of
        CAPTURE_FX_STARTER_PROFILES_V1
    ) {
      createOption(
        fxStarterProfileSelect,
        profile.id,
        profile.label
      );
    }

    fxStarterProfileSelect.disabled = true;
    listen(
      fxStarterProfileSelect,
      "change",
      syncFxStarterApplyButton
    );
  }

  if (fxStarterApplyButton) {
    fxStarterApplyButton.disabled = true;
    listen(
      fxStarterApplyButton,
      "click",
      () => {
        try {
          if (!fxStarterLibrariesReady) {
            throw new Error(
              "Les bibliothèques FX ne sont pas encore chargées."
            );
          }

          const profile =
            captureFxStarterProfileByIdV1(
              fxStarterProfileSelect?.value
            );

          if (profile === null) {
            throw new Error(
              "Choisis une base FX GenSrpG."
            );
          }

          const visualKeys = [
            "iconAssetId",
            "castAssetId",
            "travelAssetId",
            "impactAssetId",
            "zoneAssetId"
          ];
          const audioKeys = [
            "castAudioAssetId",
            "travelAudioAssetId",
            "impactAudioAssetId",
            "zoneAudioAssetId"
          ];
          const missingVisual =
            visualKeys
              .map(
                (key) =>
                  profile.presentation[key]
              )
              .filter(
                (assetId) =>
                  assetId &&
                  !fxStarterVisualAssetIds.has(
                    assetId
                  )
              );
          const missingAudio =
            audioKeys
              .map(
                (key) =>
                  profile.presentation[key]
              )
              .filter(
                (assetId) =>
                  assetId &&
                  !fxStarterAudioAssetIds.has(
                    assetId
                  )
              );

          if (
            missingVisual.length > 0 ||
            missingAudio.length > 0
          ) {
            throw new Error(
              "Profil FX incomplet dans les catalogues actifs : " +
                [
                  ...missingVisual,
                  ...missingAudio
                ].join(", ")
            );
          }

          const currentPresentation =
            readSkillFields(root)
              .presentation;

          const presentation =
            applyCaptureFxStarterProfileV1({
              profileId: profile.id,
              presentation:
                currentPresentation
            });

          writeCaptureFxStarterPresentationFieldsV1(
            root,
            presentation
          );

          updateFxStarterState(
            "Pack « " +
              profile.label +
              " » ajouté. Les sprites, sons, sockets et visuels de statut déjà configurés sont conservés ; les réglages FX restent personnalisables.",
            "ok"
          );
          setStatus(
            root,
            "Pack FX « " +
              profile.label +
              " » ajouté sans remplacer les médias configurés ni modifier le gameplay.",
            "ok"
          );
        } catch (error) {
          updateFxStarterState(
            error.message,
            "error"
          );
          setStatus(
            root,
            error.message,
            "error"
          );
        }
      }
    );
  }

  function updateCreatureLibraryState(
    message,
    tone = "info"
  ) {
    creatureLibraryState.textContent = message;
    creatureLibraryState.dataset.tone = tone;
  }

  function updateTransferState(
    message,
    tone = "info"
  ) {
    transferState.textContent = message;
    transferState.dataset.tone = tone;
  }

  function downloadCaptureJsonFileV1(
    filename,
    jsonText
  ) {
    const blob = new Blob(
      [jsonText],
      {
        type:
          "application/json;charset=utf-8"
      }
    );
    const url =
      URL.createObjectURL(blob);
    const link =
      document.createElement("a");

    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.append(link);

    try {
      link.click();
    } finally {
      link.remove();
      URL.revokeObjectURL(url);
    }
  }

  function safeTransferFilenamePartV1(
    value
  ) {
    return String(value ?? "capture")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") ||
      "capture";
  }

  function ensureTransferOwnersReadyV1() {
    if (statRegistry === null) {
      throw new Error(
        "Le registre de stats Capture n’est pas encore chargé."
      );
    }
    if (progressionRules === null) {
      throw new Error(
        "Les règles de progression Capture ne sont pas encore chargées."
      );
    }
  }

  function currentEditorDatabaseV1() {
    ensureTransferOwnersReadyV1();

    return buildCaptureEditorDatabaseV1({
      statRegistry,
      progressionRules,
      configuredCreatures,
      configuredSkills,
      metadata: {
        producer:
          "capture-human-editor-v2"
      }
    });
  }

  function refreshEditorAfterTransferV1({
    plan,
    applyResult
  }) {
    if (
      plan.action ===
      "replace-database"
    ) {
      statRegistry =
        applyResult.statRegistry;
      progressionRules =
        applyResult.progressionRules;

      renderHumanStatRegistryV1(
        root,
        statRegistry
      );
      renderHumanProgressionRulesV1(
        root,
        progressionRules
      );
    }

    refreshSkillLibraryOptions(
      plan.kind === "skill"
        ? plan.id
        : librarySelect.value
    );
    refreshLoadoutOptions();
    refreshCreatureLibraryOptions(
      selectedCreatureId
    );

    if (
      plan.kind === "creature" &&
      plan.action !== "noop"
    ) {
      selectedCreatureId =
        plan.id;
    }

    if (
      plan.action ===
      "replace-database" &&
      (
        selectedCreatureId === null ||
        !configuredCreatures.has(
          selectedCreatureId
        )
      )
    ) {
      selectedCreatureId =
        configuredCreatures.keys()
          .next().value ?? null;
    }

    const selectedRecord =
      selectedCreatureId === null
        ? null
        : configuredCreatures.get(
            selectedCreatureId
          ) ?? null;

    refreshEvolutionTargetOptions(
      selectedRecord?.draft?.capture
        ?.evolution?.targetId ??
        null
    );

    if (selectedRecord !== null) {
      loadCreatureRecord(
        selectedRecord.draft.id
      );
    } else {
      creatureLibrarySelect.value = "";
    }

    if (
      plan.kind === "skill" &&
      plan.action !== "noop"
    ) {
      const draft =
        configuredSkills.get(plan.id);
      if (draft) {
        writeSkillDraftFields(
          root,
          draft,
          statRegistry
        );
        librarySelect.value = plan.id;
        one(
          root,
          "[data-skill-id]"
        ).readOnly = true;
        selectedLegacyState = null;
      }
      refreshLoadoutOptions(
        plan.id
      );
    }

    creatureDirty = false;
  }

  function refreshEvolutionTargetOptions(
    preferredId = null
  ) {
    const select = one(
      root,
      "[data-evolution-target]"
    );
    const previous =
      preferredId ??
      select.value;

    select.textContent = "";
    createOption(
      select,
      "",
      "Choisir une créature cible"
    );

    const currentId = optionalText(
      one(
        root,
        "[data-creature-id]"
      ).value
    );

    for (
      const record of configuredCreatures.values()
    ) {
      if (
        currentId !== null &&
        record.draft.id === currentId
      ) {
        continue;
      }
      createOption(
        select,
        record.draft.id,
        record.draft.displayName +
          " · " +
          record.draft.id
      );
    }

    if (
      previous &&
      ![
        ...select.options
      ].some(
        (option) =>
          option.value === previous
      )
    ) {
      createOption(
        select,
        previous,
        previous
      );
    }

    select.value = previous ?? "";
  }

  function syncLoadoutAvailability() {
    const standardSlots = [
      ...root.querySelectorAll(
        '[data-loadout-slot-type="standard"]'
      )
    ];
    const ultimateSlot = one(
      root,
      '[data-loadout-slot-type="ultimate"]'
    );
    const summary = one(
      root,
      "[data-loadout-policy-summary]"
    );

    if (progressionRules === null) {
      [
        ...standardSlots,
        ultimateSlot
      ].forEach(
        (select) => {
          select.disabled = false;
          select.dataset.locked = "false";
        }
      );
      summary.textContent =
        "Chargement de la politique de progression…";
      return;
    }

    const level = Math.max(
      1,
      Number(
        one(
          root,
          "[data-creature-level]"
        ).value
      ) || 1
    );
    const availability =
      humanLoadoutAvailabilityV1({
        progressionRules,
        creatureLevel: level
      });
    const unlocked =
      availability.filter(Boolean).length;

    standardSlots.forEach(
      (select, index) => {
        const available =
          availability[index] === true;
        select.disabled = false;
        select.dataset.locked = "false";
        select.dataset.activeNow =
          available ? "true" : "false";
        select.title =
          available
            ? "Slot standard actif au niveau actuel"
            : "Slot standard configurable maintenant, activé automatiquement quand la progression le débloque";
        const label =
          select.closest("label");
        if (label) {
          label.dataset.locked = "false";
          label.dataset.activeNow =
            available ? "true" : "false";
        }
      }
    );

    ultimateSlot.disabled = false;
    ultimateSlot.dataset.locked = "false";
    const ultimateDraft =
      configuredSkills.get(
        ultimateSlot.value
      ) ?? null;
    const ultimateActive =
      ultimateDraft !== null &&
      ultimateDraft.requiredLevel <= level;
    ultimateSlot.dataset.activeNow =
      ultimateActive ? "true" : "false";
    ultimateSlot.title =
      ultimateSlot.value === ""
        ? "Slot réservé aux capacités ultimes"
        : ultimateActive
          ? "Capacité ultime disponible au niveau actuel"
          : "Capacité ultime configurée, disponible quand son niveau requis sera atteint";
    const ultimateLabel =
      ultimateSlot.closest("label");
    if (ultimateLabel) {
      ultimateLabel.dataset.locked = "false";
      ultimateLabel.dataset.activeNow =
        ultimateActive ? "true" : "false";
    }

    summary.textContent =
      unlocked +
      " slot" +
      (unlocked > 1 ? "s" : "") +
      " standard" +
      (unlocked > 1 ? "s" : "") +
      " actif" +
      (unlocked > 1 ? "s" : "") +
      " au niveau " +
      level +
      ". Les 4 slots standards suivent la progression ; le slot Ultime est séparé et respecte le niveau requis de sa capacité.";
  }

  function refreshCreatureLibraryOptions(
    preferredId = null
  ) {
    combatTeamControls.refresh();
    const previous =
      preferredId ??
      selectedCreatureId ??
      creatureLibrarySelect.value;

    creatureLibrarySelect.textContent = "";
    createOption(
      creatureLibrarySelect,
      "",
      configuredCreatures.size === 0
        ? "Aucune créature enregistrée"
        : "Choisir une créature"
    );

    for (
      const record of configuredCreatures.values()
    ) {
      createOption(
        creatureLibrarySelect,
        record.draft.id,
        record.draft.displayName +
          " · " +
          record.draft.id
      );
    }

    if (
      previous &&
      configuredCreatures.has(previous)
    ) {
      creatureLibrarySelect.value = previous;
    }
  }

  function currentCreatureRecord() {
    const creatureId = selectedValue(
      root,
      "[data-creature-id]"
    );
    const previousRecord =
      selectedCreatureId === creatureId
        ? configuredCreatures.get(
            selectedCreatureId
          ) ?? null
        : null;

    const rawFields = readCreatureFields(
      root,
      sockets,
      previousRecord?.draft ?? null
    );

    const statValues =
      statRegistry === null
        ? (
            previousRecord?.statValues ??
            null
          )
        : readHumanCreatureStatValuesV1(
            root,
            creatureId,
            statRegistry
          );

    const projectedStats =
      statRegistry !== null &&
      statValues !== null
        ? projectCaptureStatEffectsV1({
            registry: statRegistry,
            statValues
          })
        : null;

    const projectedMaxHp =
      projectedStats?.hasMaxHpProjection === true
        ? projectedStats.maxHp
        : (
            previousRecord?.draft?.combat
              ?.maxHp ?? 0
          );

    const rawFieldsWithHealth = {
      ...rawFields,
      combat: {
        ...(rawFields.combat ?? {}),
        maxHp: projectedMaxHp
      }
    };

    const draftPreview =
      buildHumanCreatureDraftV3(
        preserveUnrepresentedCreatureFieldsV1({
          fields: rawFieldsWithHealth,
          previousDraft:
            previousRecord?.draft ?? null,
          visibleElementIds: [
            ...root.querySelectorAll(
              "[data-element]"
            )
          ].map((input) => input.value),
          visibleResistanceKinds: [
            ...root.querySelectorAll(
              "[data-resistance]"
            )
          ].map(
            (input) =>
              "element:" +
              input.dataset.resistance
          ),
          activeSkillIds: [],
          evolutionRepresented: true
        })
      );

    const loadout = readLoadout(
      root,
      creatureId
    );
    const activeSkillIds = [
      ...new Set(
        loadout.slots
          .map((slot) => slot.skillId)
          .filter(Boolean)
      )
    ];

    if (progressionRules !== null) {
      validateHumanLoadoutProgressionV1({
        loadout,
        progressionRules,
        creatureLevel:
          draftPreview.level,
        skillDrafts: configuredSkills
      });
    }

    const fields =
      preserveUnrepresentedCreatureFieldsV1({
        fields: rawFieldsWithHealth,
        previousDraft:
          previousRecord?.draft ?? null,
        visibleElementIds: [
          ...root.querySelectorAll(
            "[data-element]"
          )
        ].map((input) => input.value),
        visibleResistanceKinds: [
          ...root.querySelectorAll(
            "[data-resistance]"
          )
        ].map(
          (input) =>
            "element:" +
            input.dataset.resistance
        ),
        activeSkillIds,
        evolutionRepresented: true
      });

    const draft =
      buildHumanCreatureDraftV3(fields);

    return Object.freeze({
      draft,
      loadout,
      statValues
    });
  }

  function persistCurrentCreature(intent) {
    const record = currentCreatureRecord();
    const saveMode =
      resolveCaptureCreatureSaveModeV1({
        intent,
        draftId: record.draft.id,
        selectedCreatureId,
        configuredCreatureIds: [
          ...configuredCreatures.keys()
        ]
      });

    configuredCreatures.set(
      record.draft.id,
      record
    );
    selectedCreatureId = record.draft.id;
    creatureDirty = false;
    one(
      root,
      "[data-creature-id]"
    ).readOnly = true;
    refreshCreatureLibraryOptions(
      record.draft.id
    );
    refreshEvolutionTargetOptions(
      record.draft.capture.evolution
        ?.targetId ?? null
    );
    syncLoadoutAvailability();
    updateCreatureLibraryState(
      saveMode.mode === "create"
        ? "Créature « " +
            record.draft.displayName +
            " » créée dans la bibliothèque active."
        : "Créature « " +
            record.draft.displayName +
            " » mise à jour.",
      "ok"
    );

    setStatus(
      root,
      saveMode.mode === "create"
        ? "Nouvelle créature « " +
            record.draft.displayName +
            " » enregistrée."
        : "Créature « " +
            record.draft.displayName +
            " » mise à jour.",
      "ok"
    );

    return record;
  }

  function loadCreatureRecord(creatureId) {
    const record =
      configuredCreatures.get(creatureId);
    if (!record) {
      throw new RangeError(
        "Créature inconnue : " + creatureId
      );
    }

    refreshLoadoutOptions();
    refreshEvolutionTargetOptions(
      record.draft.capture.evolution
        ?.targetId ?? null
    );
    writeCreatureRecordFields(
      root,
      record,
      sockets,
      statRegistry
    );
    syncLoadoutAvailability();
    selectedCreatureId = creatureId;
    creatureDirty = false;
    one(
      root,
      "[data-creature-id]"
    ).readOnly = true;
    creatureLibrarySelect.value = creatureId;
    combatTeamControls.refresh();
    updateCreatureLibraryState(
      "Modification de « " +
        record.draft.displayName +
        " ». Les changements sont enregistrés avec « Mettre à jour » ou au lancement du test.",
      "info"
    );
    setStatus(
      root,
      "Créature « " +
        record.draft.displayName +
        " » chargée pour modification.",
      "info"
    );

    return record;
  }

  function updateLibraryState(state) {
    selectedLegacyState = state;
    if (state === null) {
      libraryState.textContent =
        "Aucune capacité active chargée. Sélectionne une capacité existante ou crée-en une nouvelle.";
      libraryState.dataset.tone = "info";
      return;
    }

    libraryState.textContent = state.message;
    libraryState.dataset.tone =
      state.runtimeReady ? "ok" : "warning";
  }

  function refreshSkillLibraryOptions(
    preferredId = null
  ) {
    const previous =
      preferredId ?? librarySelect.value;

    librarySelect.textContent = "";
    createOption(
      librarySelect,
      "",
      "Sélectionner une capacité active"
    );

    const groups =
      humanSkillSelectorGroupsV1(
        humanConfiguredSkillLibraryEntriesV1(
          configuredSkills
        )
      );

    for (const group of groups) {
      const optgroup =
        document.createElement("optgroup");
      optgroup.label = group.label;

      for (const entry of group.entries) {
        const slotLabel =
          entry.loadoutSlot === "ultimate"
            ? " · Ultime"
            : "";

        createOption(
          optgroup,
          entry.id,
          entry.name +
            " · niv. " +
            entry.requiredLevel +
            slotLabel
        );
      }

      librarySelect.append(optgroup);
    }

    if (
      previous &&
      configuredSkills.has(previous)
    ) {
      librarySelect.value = previous;
    }
  }

  function refreshLoadoutOptions(preferredId = null) {
    const configured = [
      ...configuredSkills.values()
    ];
    const standardSkills =
      configured.filter(
        (draft) =>
          draft.definition.loadoutSlot !==
          "ultimate"
      );
    const ultimateSkills =
      configured.filter(
        (draft) =>
          draft.definition.loadoutSlot ===
          "ultimate"
      );
    const standardSlots = [
      ...root.querySelectorAll(
        '[data-loadout-slot-type="standard"]'
      )
    ];
    const ultimateSlot = one(
      root,
      '[data-loadout-slot-type="ultimate"]'
    );

    const populate = (
      select,
      drafts,
      emptyLabel
    ) => {
      const previous = select.value;
      select.textContent = "";
      createOption(
        select,
        "",
        emptyLabel
      );

      const groups =
        humanSkillSelectorGroupsV1(
          drafts.map((draft) => ({
            id: draft.id,
            name: draft.definition.name,
            element:
              draft.definition.element ?? null,
            requiredLevel:
              draft.requiredLevel
          }))
        );

      for (const group of groups) {
        const optgroup =
          document.createElement("optgroup");
        optgroup.label = group.label;

        for (const entry of group.entries) {
          createOption(
            optgroup,
            entry.id,
            entry.name +
              " · déblocage niv. " +
              entry.requiredLevel
          );
        }

        select.append(optgroup);
      }

      if (
        previous &&
        drafts.some(
          (draft) =>
            draft.id === previous
        )
      ) {
        select.value = previous;
      }
    };

    for (const select of standardSlots) {
      populate(
        select,
        standardSkills,
        "Vide"
      );
    }
    populate(
      ultimateSlot,
      ultimateSkills,
      "Aucune ultime"
    );

    if (
      preferredId &&
      configuredSkills.has(preferredId) &&
      ![
        ...standardSlots,
        ultimateSlot
      ].some(
        (select) =>
          select.value === preferredId
      )
    ) {
      const draft =
        configuredSkills.get(preferredId);

      if (
        draft.definition.loadoutSlot ===
        "ultimate"
      ) {
        if (
          ultimateSlot.value === "" &&
          ultimateSlot.disabled !== true
        ) {
          ultimateSlot.value =
            preferredId;
        }
      } else {
        const empty =
          standardSlots.find(
            (select) =>
              select.value === "" &&
              select.disabled !== true
          );
        if (empty) {
          empty.value = preferredId;
        }
      }
    }

    syncLoadoutAvailability();
  }

  function persistCurrentSkill(intent) {
    if (
      selectedLegacyState !== null &&
      !selectedLegacyState.runtimeReady
    ) {
      throw new Error(
        "Cette capacité historique nécessite StatusEffectV1 avant de pouvoir être enregistrée comme équivalent runtime complet."
      );
    }

    const draft = buildHumanSkillDraftV1(
      readSkillFields(root)
    );

    const saveMode = resolveCaptureSkillSaveModeV1({
      intent,
      draftId: draft.id,
      configuredSkillIds: [...configuredSkills.keys()]
    });

    const loadoutBefore = [
      ...root.querySelectorAll(
        "[data-loadout-slot]"
      )
    ].map((select) => select.value);

    configuredSkills.set(draft.id, draft);
    refreshSkillLibraryOptions(draft.id);

    if (saveMode.mode === "create") {
      refreshLoadoutOptions(draft.id);
    } else {
      refreshLoadoutOptions();
    }

    writeSkillDraftFields(
      root,
      draft,
      statRegistry
    );
    librarySelect.value = draft.id;
    one(
      root,
      "[data-skill-id]"
    ).readOnly = true;
    selectedLegacyState = null;
    updateLibraryState({
      runtimeReady: true,
      message:
        "Capacité active « " +
        draft.definition.name +
        " » sauvegardée dans la bibliothèque active."
    });

    const loadoutAfter = [
      ...root.querySelectorAll(
        "[data-loadout-slot]"
      )
    ].map((select) => select.value);

    if (
      loadoutAfter.some(
        (value, index) =>
          value !== loadoutBefore[index]
      )
    ) {
      creatureDirty = true;
    }

    setStatus(
      root,
      saveMode.mode === "create"
        ? "Nouvelle capacité « " +
            draft.definition.name +
            " » créée dans la bibliothèque active."
        : "Capacité « " +
            draft.definition.name +
            " » mise à jour dans la bibliothèque active.",
      "ok"
    );

    return draft;
  }

  refreshSkillLibraryOptions();

  listen(creatureLibrarySelect, "change", () => {
    const creatureId =
      creatureLibrarySelect.value;
    if (!creatureId) {
      return;
    }

    try {
      loadCreatureRecord(creatureId);
    } catch (error) {
      setStatus(
        root,
        error.message,
        "error"
      );
    }
  });

  listen(newCreatureButton, "click", () => {
    const nextId =
      nextCaptureCreatureDraftIdV1({
        configuredCreatureIds: [
          ...configuredCreatures.keys()
        ]
      });

    selectedCreatureId = null;
    creatureLibrarySelect.value = "";
    prepareNewCreatureDraftFields(
      root,
      nextId,
      sockets,
      statRegistry
    );
    refreshEvolutionTargetOptions();
    syncLoadoutAvailability();
    one(
      root,
      "[data-creature-id]"
    ).readOnly = false;
    creatureDirty = true;
    updateCreatureLibraryState(
      "Nouvelle créature prête. Configure-la puis utilise « Enregistrer comme nouvelle ».",
      "info"
    );
    setStatus(
      root,
      "Nouveau brouillon créature prêt.",
      "info"
    );
    one(
      root,
      "[data-creature-name]"
    ).focus?.();
  });

  listen(createCreatureButton, "click", () => {
    try {
      persistCurrentCreature("create");
    } catch (error) {
      setStatus(
        root,
        error.message,
        "error"
      );
    }
  });

  listen(updateCreatureButton, "click", () => {
    try {
      persistCurrentCreature("update");
    } catch (error) {
      setStatus(
        root,
        error.message,
        "error"
      );
    }
  });

  listen(librarySelect, "change", () => {
    const abilityId = librarySelect.value;

    if (!abilityId) {
      updateLibraryState(null);
      return;
    }

    const draft =
      configuredSkills.get(abilityId);
    if (!draft) {
      setStatus(
        root,
        "Capacité active inconnue : " +
          abilityId,
        "error"
      );
      return;
    }

    writeSkillDraftFields(
      root,
      draft,
      statRegistry
    );
    selectedLegacyState = null;
    one(
      root,
      "[data-skill-id]"
    ).readOnly = true;

    updateLibraryState({
      runtimeReady: true,
      message:
        "Capacité active « " +
        draft.definition.name +
        " » chargée depuis la bibliothèque active."
    });

    setStatus(
      root,
      "Capacité « " +
        draft.definition.name +
        " » chargée pour modification.",
      "info"
    );
  });

  listen(newSkillButton, "click", () => {
    const nextId = nextCaptureSkillDraftIdV1({
      configuredSkillIds: [...configuredSkills.keys()]
    });

    librarySelect.value = "";
    updateLibraryState(null);
    prepareNewSkillDraftFields(
      root,
      nextId,
      statRegistry
    );
    one(
      root,
      "[data-skill-id]"
    ).readOnly = false;
    selectedLegacyState = null;

    setStatus(
      root,
      "Nouvelle capacité prête : configure-la puis utilise « Enregistrer comme nouvelle ».",
      "info"
    );

    one(root, "[data-skill-name]").focus?.();
  });

  listen(createSkillButton, "click", () => {
    try {
      persistCurrentSkill("create");
    } catch (error) {
      setStatus(
        root,
        error.message,
        "error"
      );
    }
  });

  listen(updateSkillButton, "click", () => {
    try {
      persistCurrentSkill("update");
    } catch (error) {
      setStatus(
        root,
        error.message,
        "error"
      );
    }
  });

  listen(
    skillActivationEnabled,
    "change",
    () => {
      skillActivationConfig.hidden =
        !skillActivationEnabled.checked;

      if (
        skillActivationEnabled.checked &&
        skillActivationConditionsHost.children
          .length === 0
      ) {
        appendHumanSkillActivationConditionV1(
          root
        );
      }
    }
  );

  listen(
    skillActivationAddButton,
    "click",
    () => {
      if (!skillActivationEnabled.checked) {
        skillActivationEnabled.checked = true;
        skillActivationConfig.hidden = false;
      }
      appendHumanSkillActivationConditionV1(
        root
      );
    }
  );

  listen(
    skillActivationConditionsHost,
    "change",
    (event) => {
      const row =
        event.target?.closest?.(
          "[data-skill-activation-condition]"
        );
      if (!row) {
        return;
      }

      if (
        event.target.matches(
          "[data-skill-activation-condition-type]"
        )
      ) {
        syncHumanSkillActivationConditionRowV1(
          row
        );
      }
    }
  );

  listen(
    skillActivationConditionsHost,
    "click",
    (event) => {
      const remove =
        event.target?.closest?.(
          "[data-skill-activation-remove]"
        );
      if (!remove) {
        return;
      }

      const row = remove.closest(
        "[data-skill-activation-condition]"
      );
      row?.remove();

      if (
        skillActivationConditionsHost.children
          .length === 0
      ) {
        skillActivationEnabled.checked = false;
        skillActivationConfig.hidden = true;
      }
    }
  );

  listen(
    skillEffectAddButton,
    "click",
    () => {
      appendHumanSkillEffectV1(
        root,
        null,
        statRegistry
      );
    }
  );

  listen(
    skillEffectsHost,
    "change",
    (event) => {
      const row =
        event.target?.closest?.(
          "[data-skill-effect-row]"
        );
      if (!row) {
        return;
      }

      if (
        event.target.matches(
          "[data-skill-effect-kind], " +
          "[data-skill-status-kind], " +
          "[data-skill-status-stacking], " +
          "[data-skill-status-visual-mode]"
        )
      ) {
        syncHumanSkillEffectRowV1(row);
      }
    }
  );

  listen(
    skillEffectsHost,
    "click",
    (event) => {
      const remove =
        event.target?.closest?.(
          "[data-skill-effect-remove]"
        );
      if (!remove) {
        return;
      }
      remove.closest(
        "[data-skill-effect-row]"
      )?.remove();
    }
  );

  const creatureOwnedSelectors = [
    '[data-editor-panel="creature"] input',
    '[data-editor-panel="creature"] select',
    '[data-editor-panel="creature"] textarea'
  ].join(", ");

  for (
    const field of root.querySelectorAll(
      creatureOwnedSelectors
    )
  ) {
    if (
      field === creatureLibrarySelect ||
      field === newCreatureButton ||
      field === createCreatureButton ||
      field === updateCreatureButton ||
      field.closest(
        "[data-global-editor-control]"
      )
    ) {
      continue;
    }

    listen(field, "input", () => {
      creatureDirty = true;
    });
    listen(field, "change", () => {
      creatureDirty = true;
    });
  }

  listen(
    one(
      root,
      "[data-evolution-enabled]"
    ),
    "change",
    () => {
      syncEvolutionControlsV1(root);
      creatureDirty = true;
    }
  );

  listen(
    one(
      root,
      "[data-creature-level]"
    ),
    "change",
    () => {
      refreshLoadoutOptions();
      syncLoadoutAvailability();
    }
  );

  listen(
    one(
      root,
      ".loadout-grid"
    ),
    "change",
    (event) => {
      if (
        event.target?.matches?.(
          "[data-loadout-slot]"
        )
      ) {
        syncLoadoutAvailability();
      }
    }
  );

  listen(
    one(
      root,
      "[data-stat-values-host]"
    ),
    "input",
    (event) => {
      if (
        event.target?.matches?.(
          "[data-stat-value]"
        )
      ) {
        creatureDirty = true;

        const definition =
          statRegistry?.stats.find(
            (entry) =>
              entry.id ===
              event.target.dataset.statValue
          ) ?? null;
        const meta =
          event.target
            .closest(".stat-value-card")
            ?.querySelector("small");

        if (definition !== null && meta) {
          meta.textContent =
            humanStatEffectSummaryV1({
              definition,
              value: event.target.value
            });
        }
      }
    }
  );

  listen(
    statRegistryApplyButton,
    "click",
    () => {
      try {
        if (statRegistry === null) {
          throw new Error(
            "Registre de stats non chargé"
          );
        }

        const creatureId = selectedValue(
          root,
          "[data-creature-id]"
        );
        const valuesBefore =
          readHumanCreatureStatValuesV1(
            root,
            creatureId,
            statRegistry
          );
        statRegistry =
          readHumanStatRegistryV1(root);
        renderHumanStatRegistryV1(
          root,
          statRegistry
        );
        renderHumanStatValuesV1(
          root,
          statRegistry,
          valuesBefore
        );
        refreshHumanSkillEffectStatOptionsV1(
          root,
          statRegistry
        );
        setStatus(
          root,
          "Système de stats mis à jour pour cette session.",
          "ok"
        );
      } catch (error) {
        setStatus(
          root,
          error.message,
          "error"
        );
      }
    }
  );

  listen(
    statCustomAddButton,
    "click",
    () => {
      try {
        if (statRegistry === null) {
          throw new Error(
            "Registre de stats non chargé"
          );
        }

        const creatureId = selectedValue(
          root,
          "[data-creature-id]"
        );
        const valuesBefore =
          readHumanCreatureStatValuesV1(
            root,
            creatureId,
            statRegistry
          );
        const editedRegistry =
          readHumanStatRegistryV1(root);

        statRegistry =
          addHumanCustomStatDefinitionV1({
            registry: editedRegistry,
            definition: {
              id: selectedValue(
                root,
                "[data-stat-custom-id]"
              ),
              label: selectedValue(
                root,
                "[data-stat-custom-label]"
              ),
              damageChannel:
                optionalText(
                  selectedValue(
                    root,
                    "[data-stat-custom-damage-channel]"
                  )
                ),
              resistanceChannel:
                optionalText(
                  selectedValue(
                    root,
                    "[data-stat-custom-resistance-channel]"
                  )
                ),
              damagePctPerPoint:
                numericValue(
                  root,
                  "[data-stat-custom-damage-pct-per-point]"
                ),
              resistancePctPerPoint:
                numericValue(
                  root,
                  "[data-stat-custom-resistance-pct-per-point]"
                )
,
              chargeTimeReductionPctPerPoint:
                numericValue(
                  root,
                  "[data-stat-custom-charge-pct-per-point]"
                ),
              damageReductionPctPerPoint:
                numericValue(
                  root,
                  "[data-stat-custom-damage-reduction-pct-per-point]"
                ),
              maxHpPerPoint:
                numericValue(
                  root,
                  "[data-stat-custom-max-hp-per-point]"
                )
            }
          });

        renderHumanStatRegistryV1(
          root,
          statRegistry
        );
        renderHumanStatValuesV1(
          root,
          statRegistry,
          valuesBefore
        );
        refreshHumanSkillEffectStatOptionsV1(
          root,
          statRegistry
        );

        one(
          root,
          "[data-stat-custom-id]"
        ).value = "";
        one(
          root,
          "[data-stat-custom-label]"
        ).value = "";

        setStatus(
          root,
          "Stat personnalisée ajoutée au registre de la session.",
          "ok"
        );
      } catch (error) {
        setStatus(
          root,
          error.message,
          "error"
        );
      }
    }
  );

  listen(
    one(
      root,
      "[data-stat-registry-host]"
    ),
    "click",
    (event) => {
      const statId =
        event.target?.dataset
          ?.statDefinitionRemove;
      if (!statId) {
        return;
      }

      try {
        if (statRegistry === null) {
          throw new Error(
            "Registre de stats non chargé"
          );
        }

        const creatureId = selectedValue(
          root,
          "[data-creature-id]"
        );
        const valuesBefore =
          readHumanCreatureStatValuesV1(
            root,
            creatureId,
            statRegistry
          );
        const edited =
          readHumanStatRegistryV1(root);
        statRegistry =
          buildHumanStatRegistryV1({
            definitions:
              edited.stats.filter(
                (entry) =>
                  entry.id !== statId
              )
          });
        renderHumanStatRegistryV1(
          root,
          statRegistry
        );
        renderHumanStatValuesV1(
          root,
          statRegistry,
          valuesBefore
        );
        refreshHumanSkillEffectStatOptionsV1(
          root,
          statRegistry
        );
        setStatus(
          root,
          "Stat « " +
            statId +
            " » retirée du registre de la session.",
          "info"
        );
      } catch (error) {
        setStatus(
          root,
          error.message,
          "error"
        );
      }
    }
  );

  listen(
    progressionApplyButton,
    "click",
    () => {
      try {
        progressionRules =
          readHumanProgressionRulesV1(
            root
          );
        renderHumanProgressionRulesV1(
          root,
          progressionRules
        );
        refreshLoadoutOptions();
        setStatus(
          root,
          "Politique de déblocage des slots mise à jour.",
          "ok"
        );
      } catch (error) {
        setStatus(
          root,
          error.message,
          "error"
        );
      }
    }
  );

  listen(
    progressionAddButton,
    "click",
    () => {
      try {
        const base =
          progressionRules ??
          readHumanProgressionRulesV1(
            root
          );
        const last =
          base.slotUnlockSchedule[
            base.slotUnlockSchedule.length -
              1
          ];
        const candidate =
          buildHumanProgressionRulesV1({
            maxActiveSkills:
              base.maxActiveSkills,
            slotUnlockSchedule: [
              ...base.slotUnlockSchedule,
              {
                level:
                  last.level + 10,
                slots: Math.min(
                  base.maxActiveSkills,
                  last.slots + 1
                )
              }
            ]
          });
        progressionRules = candidate;
        renderHumanProgressionRulesV1(
          root,
          progressionRules
        );
        refreshLoadoutOptions();
      } catch (error) {
        setStatus(
          root,
          error.message,
          "error"
        );
      }
    }
  );

  listen(
    progressionScheduleHost,
    "click",
    (event) => {
      const rawIndex =
        event.target?.dataset
          ?.progressionRemove;
      if (rawIndex == null) {
        return;
      }

      try {
        const edited =
          readHumanProgressionRulesV1(
            root
          );
        if (
          edited.slotUnlockSchedule
            .length <= 1
        ) {
          throw new RangeError(
            "La progression doit conserver au moins un palier"
          );
        }
        const index = Number(rawIndex);
        progressionRules =
          buildHumanProgressionRulesV1({
            maxActiveSkills:
              edited.maxActiveSkills,
            slotUnlockSchedule:
              edited.slotUnlockSchedule
                .filter(
                  (_, stepIndex) =>
                    stepIndex !== index
                )
          });
        renderHumanProgressionRulesV1(
          root,
          progressionRules
        );
        refreshLoadoutOptions();
      } catch (error) {
        setStatus(
          root,
          error.message,
          "error"
        );
      }
    }
  );

  try {
    const initialSkill =
      buildHumanSkillDraftV1(
        readSkillFields(root)
      );
    configuredSkills.set(
      initialSkill.id,
      initialSkill
    );
    refreshSkillLibraryOptions(
      initialSkill.id
    );
    refreshLoadoutOptions(
      initialSkill.id
    );
  } catch {
    refreshSkillLibraryOptions();
    refreshLoadoutOptions();
  }

  try {
    const initialRecord =
      currentCreatureRecord();
    configuredCreatures.set(
      initialRecord.draft.id,
      initialRecord
    );
    selectedCreatureId =
      initialRecord.draft.id;
    creatureDirty = false;
    one(
      root,
      "[data-creature-id]"
    ).readOnly = true;
    refreshCreatureLibraryOptions(
      selectedCreatureId
    );
    updateCreatureLibraryState(
      "Créature initiale « " +
        initialRecord.draft.displayName +
        " » chargée dans la bibliothèque active.",
      "info"
    );
  } catch (error) {
    refreshCreatureLibraryOptions();
    updateCreatureLibraryState(
      "Créature initiale non enregistrée : " +
        error.message,
      "warning"
    );
  }

  updateLibraryState(null);
  syncSkillSocketSelect(root, sockets);
  syncCreatureSocketMarkers(root, sockets);

  listen(
    one(root, "[data-socket-kind]"),
    "change",
    () => {
      syncCreatureSocketMarkers(
        root,
        sockets
      );
    }
  );

  for (const surface of root.querySelectorAll("[data-socket-surface]")) {
    listen(surface, "pointerdown", (event) => {
      const socketId = selectedValue(
        root,
        "[data-socket-kind]"
      );
      const label = one(
        root,
        "[data-socket-kind]"
      ).selectedOptions[0]?.textContent || socketId;

      const point = normalizedSocketPointV2({
        clientX: event.clientX,
        clientY: event.clientY,
        rect: surface.getBoundingClientRect()
      });

      const current = sockets.get(socketId) ?? {
        id: socketId,
        label,
        front: null,
        back: null
      };

      current[surface.dataset.socketView] = point;
      sockets.set(socketId, current);
      syncCreatureSocketMarkers(
        root,
        sockets
      );
      syncSkillSocketSelect(root, sockets);
      creatureDirty = true;
      setStatus(
        root,
        "Point " + label + " placé sur la vue " +
          (surface.dataset.socketView === "front" ? "face" : "dos") +
          ".",
        "ok"
      );
    });
  }

  const validateButton = one(
    root,
    "[data-editor-validate]"
  );

  function currentSkillHasUnsavedChanges() {
    try {
      return captureSkillDraftHasUnsavedChangesV1({
        currentDraft: buildHumanSkillDraftV1(
          readSkillFields(root)
        ),
        configuredSkills
      });
    } catch {
      return true;
    }
  }

  function validate() {
    try {
      if (selectedLegacyState !== null && !selectedLegacyState.runtimeReady) {
        throw new Error("La capacité sélectionnée n’est pas encore utilisable en combat.");
      }
      const result = prepareCaptureEditorCombatEditsV1({
        configuredSkills, configuredCreatures,
        selectedSkillId: librarySelect.value || null,
        selectedCreatureId,
        readSkillDraft: () => currentSkillHasUnsavedChanges()
          ? buildHumanSkillDraftV1(readSkillFields(root)) : null,
        readCreatureRecord: () => creatureDirty || selectedCreatureId === null
          ? currentCreatureRecord() : null,
        buildExport: () => buildCaptureEditorCombatTestV1({
          configuredCreatures, configuredSkills,
          ...combatTeamControls.read(),
          arenaId: selectedValue(root, "[data-test-arena]"),
          combatRules: readHumanCombatRulesV1(root),
          skillSpeedMultiplier: captureCombatPaceToSkillSpeedV1(numericValue(root, "[data-combat-skill-speed]")),
          recallPreparationMs: numericValue(root, "[data-recall-seconds]") * 1000,
          statRegistry, progressionRules
        })
      });
      lastExport = result.exported;
      if (result.skillDraft !== null) {
        refreshSkillLibraryOptions(result.skillDraft.id);
        refreshLoadoutOptions();
        writeSkillDraftFields(root, result.skillDraft, statRegistry);
        librarySelect.value = result.skillDraft.id;
        one(root, "[data-skill-id]").readOnly = true;
        updateLibraryState({ runtimeReady: true, message: "Modifications de la capacité enregistrées pour le test." });
      }
      if (result.creatureRecord !== null) {
        selectedCreatureId = result.creatureRecord.draft.id;
        refreshCreatureLibraryOptions(selectedCreatureId);
        loadCreatureRecord(selectedCreatureId);
      }
      combatTeamControls.refresh();
      const teamSizes = Object.values(lastExport.teams).map(actorIds =>
        lastExport.rosters.filter(roster => actorIds.includes(roster.slotId))
          .reduce((size, roster) => size + roster.members.length, 0)
      );
      one(root, "[data-editor-summary]").textContent =
        teamSizes.join(" contre ") + " monstres · " + lastExport.actors.length + " actifs";
      setStatus(root, result.skillDraft !== null || result.creatureRecord !== null
        ? "Configuration valide. Modifications enregistrées pour le test."
        : "Configuration valide. Le combat de test est prêt.", "ok");
      return lastExport;
    } catch (error) {
      lastExport = null;
      one(root, "[data-editor-summary]").textContent = "Corrige les champs signalés.";
      setStatus(root, error.message, "error");
      return null;
    }
  }

  listen(validateButton, "click", validate);

  listen(
    exportCurrentCreatureButton,
    "click",
    () => {
      try {
        ensureTransferOwnersReadyV1();
        const record =
          currentCreatureRecord();
        const json =
          exportCaptureCreatureTransferJsonV1(
            record,
            {
              statRegistry
            }
          );
        const filename =
          "gensrpg-capture-creature-" +
          safeTransferFilenamePartV1(
            record.draft.id
          ) +
          ".json";

        downloadCaptureJsonFileV1(
          filename,
          json
        );
        updateTransferState(
          "Créature « " +
            record.draft.displayName +
            " » exportée.",
          "ok"
        );
        setStatus(
          root,
          "Export créature prêt : " +
            filename,
          "ok"
        );
      } catch (error) {
        updateTransferState(
          error.message,
          "error"
        );
        setStatus(
          root,
          error.message,
          "error"
        );
      }
    }
  );

  listen(
    exportCurrentSkillButton,
    "click",
    () => {
      try {
        const draft =
          buildHumanSkillDraftV1(
            readSkillFields(root)
          );
        const json =
          exportCaptureSkillTransferJsonV1(
            draft
          );
        const filename =
          "gensrpg-capture-skill-" +
          safeTransferFilenamePartV1(
            draft.id
          ) +
          ".json";

        downloadCaptureJsonFileV1(
          filename,
          json
        );
        updateTransferState(
          "Capacité « " +
            draft.definition.name +
            " » exportée.",
          "ok"
        );
        setStatus(
          root,
          "Export capacité prêt : " +
            filename,
          "ok"
        );
      } catch (error) {
        updateTransferState(
          error.message,
          "error"
        );
        setStatus(
          root,
          error.message,
          "error"
        );
      }
    }
  );

  listen(
    exportDatabaseButton,
    "click",
    () => {
      try {
        if (
          creatureDirty ||
          currentSkillHasUnsavedChanges()
        ) {
          throw new Error(
            "Enregistre les modifications de la créature et de la capacité avant d’exporter toute la base."
          );
        }

        const database =
          currentEditorDatabaseV1();
        const json =
          exportCaptureDatabaseJsonV1(
            database
          );
        const filename =
          "gensrpg-capture-database-v1.json";

        downloadCaptureJsonFileV1(
          filename,
          json
        );
        updateTransferState(
          database.creatures.length +
            " créatures et " +
            database.skills.length +
            " capacités exportées dans la base complète.",
          "ok"
        );
        setStatus(
          root,
          "Base Capture complète exportée.",
          "ok"
        );
      } catch (error) {
        updateTransferState(
          error.message,
          "error"
        );
        setStatus(
          root,
          error.message,
          "error"
        );
      }
    }
  );

  listen(
    importCaptureJsonInput,
    "change",
    async () => {
      const file =
        importCaptureJsonInput.files?.[0] ??
        null;

      if (file === null) {
        return;
      }

      try {
        if (
          creatureDirty ||
          currentSkillHasUnsavedChanges()
        ) {
          throw new Error(
            "Enregistre ou annule les modifications en cours avant d’importer un fichier."
          );
        }

        ensureTransferOwnersReadyV1();

        const jsonText =
          await file.text();
        const transfer =
          importCaptureTransferJsonV1(
            jsonText,
            {
              statRegistry
            }
          );
        const currentDatabase =
          currentEditorDatabaseV1();
        const mode =
          importReplaceExisting.checked
            ? "replace"
            : "reject";
        const plan =
          planCaptureTransferImportV1({
            currentDatabase,
            transfer,
            mode
          });
        const applyResult =
          applyCaptureTransferPlanToEditorStateV1({
            plan,
            configuredCreatures,
            configuredSkills,
            statRegistry,
            progressionRules
          });

        statRegistry =
          applyResult.statRegistry;
        progressionRules =
          applyResult.progressionRules;

        refreshEditorAfterTransferV1({
          plan,
          applyResult
        });

        const label =
          plan.action === "noop"
            ? "Le fichier est déjà identique à la bibliothèque active."
            : plan.kind === "database"
              ? "Base Capture importée et appliquée."
              : plan.kind === "creature"
                ? "Créature « " +
                  plan.id +
                  " » importée."
                : "Capacité « " +
                  plan.id +
                  " » importée.";

        updateTransferState(
          label,
          "ok"
        );
        setStatus(
          root,
          label,
          "ok"
        );
      } catch (error) {
        updateTransferState(
          error.message,
          "error"
        );
        setStatus(
          root,
          error.message,
          "error"
        );
      } finally {
        importCaptureJsonInput.value = "";
      }
    }
  );

  const ready = Promise.all([
    hydrateAssetCatalog(root, listen, creatorVisualAssets),
    hydratePrivateAudioCatalog(root),
    hydrateNativeSkillCatalog(),
    hydrateCaptureStatRegistryV1()
      .then(async (registry) => ({
        registry,
        records:
          await hydrateMonsterCaptureCreatureCatalog(
            registry
          )
      })),
    hydrateCaptureProgressionRulesV1(),
    hydrateCaptureCreatureVisualMetadataV1()
  ])
    .then(async ([
      assetCatalog,
      privateAudioCatalog,
      nativeSkills,
      captureData,
      loadedProgressionRules,
      creatureVisualMetaById
    ]) => {
      fxStarterVisualAssetIds = new Set(
        (assetCatalog.assets ?? [])
          .map((asset) => asset?.id)
          .filter(Boolean)
      );
      fxStarterAudioAssetIds = new Set(
        (privateAudioCatalog?.entries ?? [])
          .map((entry) => entry?.assetId)
          .filter(Boolean)
      );
      fxStarterLibrariesReady = true;
      if (fxStarterProfileSelect) {
        fxStarterProfileSelect.disabled = false;
      }
      syncFxStarterApplyButton();
      updateFxStarterState(
        CAPTURE_FX_STARTER_PROFILES_V1.length +
          " profils FX GenSrpG prêts. Choisis une base : elle sera copiée, jamais liée ni verrouillée.",
        "ok"
      );

      statRegistry = captureData.registry;
      progressionRules =
        loadedProgressionRules;

      renderHumanStatRegistryV1(
        root,
        statRegistry
      );
      renderHumanProgressionRulesV1(
        root,
        progressionRules
      );

      const monsterCaptureRecords =
        captureData.records;

      if (!currentSkillHasUnsavedChanges()) {
        const initialFields =
          readSkillFields(root);
        const nativeInitialDraft =
          nativeSkills.get(initialFields.id) ?? null;
        const hydratedInitialFields =
          hydrateInitialSkillEffectsFromNativeV1(
            initialFields,
            nativeInitialDraft
          );

        if (
          hydratedInitialFields !== initialFields
        ) {
          renderHumanSkillEffectsV1(
            root,
            hydratedInitialFields.effects,
            statRegistry
          );

          const hydratedInitialDraft =
            buildHumanSkillDraftV1(
              readSkillFields(root)
            );

          configuredSkills.set(
            hydratedInitialDraft.id,
            hydratedInitialDraft
          );
        }
      }

      for (
        const [skillId, draft] of nativeSkills
      ) {
        if (!configuredSkills.has(skillId)) {
          configuredSkills.set(
            skillId,
            draft
          );
        }
      }

      for (
        const draft of capturePortableNativeSkillDraftsV1()
      ) {
        if (!configuredSkills.has(draft.id)) {
          configuredSkills.set(
            draft.id,
            draft
          );
        }
      }

      for (
        const draft of captureComplexNativeSkillDraftsV1()
      ) {
        if (!configuredSkills.has(draft.id)) {
          configuredSkills.set(
            draft.id,
            draft
          );
        }
      }

      const availableAssetIds = new Set(
        (assetCatalog.assets ?? [])
          .map((asset) => asset?.id)
          .filter(
            (assetId) =>
              typeof assetId === "string" &&
              assetId !== ""
          )
      );
      const runtimeSkillIds = new Set(
        configuredSkills.keys()
      );

      for (
        const record of monsterCaptureRecords
      ) {
        const historicalLoadout =
          buildCaptureCreatureHistoricalLoadoutV1({
            creatureId: record.draft.id,
            level: record.draft.level,
            abilityIds:
              record.draft.skillIds,
            runtimeSkillIds
          });

        const recordWithLoadout =
          Object.freeze({
            draft: record.draft,
            loadout:
              historicalLoadout.loadout,
            statValues:
              record.statValues
          });

        const binding =
          captureCreatureVisualBindingForIdV1(
            record.draft.id
          );
        const visualRecord =
          binding === null
            ? recordWithLoadout
            : applyCaptureCreatureVisualBindingV1({
                record: recordWithLoadout,
                binding,
                creatureMeta:
                  creatureVisualMetaById[
                    binding.metaId
                  ],
                availableAssetIds
              });
        const hydratedRecord =
          Object.freeze({
            ...visualRecord,
            statValues:
              recordWithLoadout.statValues
          });

        if (
          !configuredCreatures.has(
            hydratedRecord.draft.id
          )
        ) {
          configuredCreatures.set(
            hydratedRecord.draft.id,
            hydratedRecord
          );
        }
      }

      for (
        const [
          creatureId,
          record
        ] of configuredCreatures
      ) {
        if (record.statValues !== null &&
            record.statValues !== undefined) {
          continue;
        }

        const legacy =
          record.draft.sourceStats ?? {};
        const statValues =
          importMonsterCaptureStatValuesV1(
            {
              id: creatureId,
              stats: {
                force:
                  Number(legacy.force) || 0,
                power:
                  Number(legacy.force) || 0,
                speed:
                  Number(
                    legacy.initiative
                  ) || 0,
                agility:
                  Number(
                    legacy.agility
                  ) || 0
              }
            },
            statRegistry
          );

        configuredCreatures.set(
          creatureId,
          Object.freeze({
            ...record,
            statValues
          })
        );
      }

      refreshSkillLibraryOptions(
        librarySelect.value
      );
      refreshLoadoutOptions();
      refreshCreatureLibraryOptions(
        selectedCreatureId
      );

      let selectedRecord =
        selectedCreatureId
          ? configuredCreatures.get(
              selectedCreatureId
            )
          : null;

      refreshEvolutionTargetOptions(
        selectedRecord?.draft?.capture
          ?.evolution?.targetId ?? null
      );

      if (
        selectedRecord &&
        creatureDirty === false
      ) {
        renderHumanStatValuesV1(
          root,
          statRegistry,
          selectedRecord.statValues
        );
      }

      syncLoadoutAvailability();

      updateCreatureLibraryState(
        "Catalogue Monster Capture historique chargé. Chargement des modèles vitrine…",
        "ok"
      );

      if (!disposed) {
        setStatus(
          root,
          "Bibliothèques principales chargées : 9 capacités laboratoire + 103 capacités Capture natives. Application des modèles vitrine en cours.",
          "info"
        );
      }

      try {
        const showcaseSkillPresets =
          await hydrateCaptureShowcaseSkillPresetsV1();
        const showcaseCreaturePresets =
          await hydrateCaptureShowcaseCreaturePresetsV1(
            statRegistry
          );
        const showcasePresets = [
          ...showcaseSkillPresets,
          ...showcaseCreaturePresets
        ];

        const reloadSelectedSkillAfterPresets = !currentSkillHasUnsavedChanges();

        const showcaseResult =
          applyCaptureTransferBatchToEditorStateV1({
            transfers: showcasePresets,
            configuredCreatures,
            configuredSkills,
            statRegistry,
            progressionRules,
            mode: "replace",
            metadata: {
              producer:
                "capture-human-editor-v2-showcase-startup"
            }
          });

        statRegistry =
          showcaseResult.statRegistry;
        progressionRules =
          showcaseResult.progressionRules;

        refreshSkillLibraryOptions(
          librarySelect.value
        );
        refreshLoadoutOptions();
        if (reloadSelectedSkillAfterPresets) {
          const selectedSkill = configuredSkills.get(librarySelect.value);
          if (selectedSkill) {
            writeSkillDraftFields(root, selectedSkill, statRegistry);
            selectedLegacyState = null;
            one(root, "[data-skill-id]").readOnly = true;
          }
        }

        refreshCreatureLibraryOptions(
          selectedCreatureId
        );

        selectedRecord =
          selectedCreatureId
            ? configuredCreatures.get(
                selectedCreatureId
              )
            : null;

        refreshEvolutionTargetOptions(
          selectedRecord?.draft?.capture
            ?.evolution?.targetId ?? null
        );

        if (
          selectedRecord &&
          creatureDirty === false
        ) {
          loadCreatureRecord(
            selectedRecord.draft.id
          );
        }

        syncLoadoutAvailability();

        updateCreatureLibraryState(
          "Catalogue Monster Capture historique + 2 modèles vitrine chargés. Sélectionne une créature pour la modifier ou crée une nouvelle entrée.",
          "ok"
        );

        if (!disposed) {
          setStatus(
            root,
            "Bibliothèques principales, 9 capacités laboratoire + 103 capacités Capture natives et 2 modèles vitrine chargés.",
            "info"
          );
        }
      } catch (presetError) {
        updateCreatureLibraryState(
          "Catalogue historique chargé. Modèles vitrine indisponibles : " +
            presetError.message,
          "error"
        );

        if (!disposed) {
          setStatus(
            root,
            "Bibliothèque historique conservée ; erreur modèles vitrine : " +
              presetError.message,
            "error"
          );
        }
      }
    })
    .catch((error) => {
      if (!disposed) {
        setStatus(
          root,
          "Bibliothèques indisponibles : " +
            error.message,
          "error"
        );
      }
      throw error;
    });

  return Object.freeze({
    validate,
    ready,
    getLastExport() {
      return lastExport;
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      combatTeamControls.dispose();
      for (const remove of listeners.splice(0)) {
        remove();
      }
    }
  });
}
