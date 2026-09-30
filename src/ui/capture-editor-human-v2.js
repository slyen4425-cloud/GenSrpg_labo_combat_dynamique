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
  normalizeCaptureActiveSkillLoadoutV1
} from "../contracts/capture-active-skill-loadout-v1.js";
import {
  normalizeCaptureBattleSetupEditorDraftV1
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
  captureLegacySkillLibraryEntriesV1,
  captureLegacyAbilityEditorStateV1,
  mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1
} from "./capture-editor-skill-catalog-v1.js";
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
  applyCaptureCombatRulesToCreatureDraftV1
} from "../adapters/input/capture/capture-combat-rules-overlay-v1.js";
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
  CAPTURE_SHOWCASE_CREATURE_PRESETS_V1
} from "../catalogs/capture-showcase-creature-presets-v1.js";
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
  applyCaptureTransferPlanToEditorStateV1
} from "./capture-editor-file-transfer-v1.js";

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
  status
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
    output.channel = requiredText(
      status.channel,
      "Canal des dégâts périodiques"
    );
  }

  if (output.kind === "shield") {
    output.amount = finiteNumber(
      status.amount,
      "Valeur du bouclier"
    );
  }

  return output;
}

export function buildHumanTacticalSkillEffectsV1(
  effects
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

    if (kind === "apply_status") {
      return normalizeSkillEffectV1({
        kind,
        targetScope,
        status:
          humanTacticalStatusToContractV1(
            effect.status
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
  creatureLevel
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
  displayScale = 1
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
    normalizedScale > 4
  ) {
    throw new RangeError(
      "Scale FX doit être compris entre 0.25 et 4"
    );
  }

  return {
    assetId: id,
    attachment,
    trigger,
    anchor,
    displayScale: normalizedScale,
    layerByView: {
      player:
        layerByView?.player ?? "front",
      opponent:
        layerByView?.opponent ?? "front"
    },
    playbackMode: "once",
    offsetX: 0,
    offsetY: 0,
    rotationDeg: 0,
    opacity: 1
  };
}

function audioSkillSlot(assetId) {
  const id = optionalText(assetId);
  return id === null
    ? null
    : {
        assetId: id,
        volume: 1,
        loop: false
      };
}

function presentationForSkill(fields) {
  const presentation = fields.presentation ?? {};
  const iconAssetId = optionalText(
    presentation.iconAssetId
  );
  const socketId = optionalText(
    presentation.socketId
  );

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
      }
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
        presentation.impactDisplayScale ?? 1
    }
  );

  const castAudio = audioSkillSlot(
    presentation.castAudioAssetId
  );
  const impactAudio = audioSkillSlot(
    presentation.impactAudioAssetId
  );

  const hasVisual =
    iconAssetId !== null ||
    cast !== null ||
    travel !== null ||
    impact !== null;
  const hasAudio =
    castAudio !== null ||
    impactAudio !== null;

  if (!hasVisual && !hasAudio) {
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

  const audio = {};
  if (castAudio !== null) {
    audio.cast = castAudio;
  }
  if (impactAudio !== null) {
    audio.impact = impactAudio;
  }

  return {
    id: "skill:" + requiredText(fields.id, "ID capacité"),
    version: 2,
    subjectType: "skill",
    subjectId: requiredText(fields.id, "ID capacité"),
    visual,
    audio
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
          fields.effects ?? []
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
      element: optionalText(fields.element),
      approachMode: requiredText(
        fields.approachMode ?? "none",
        "Déplacement"
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

export function buildHumanLoadoutV1({
  creatureId,
  skillIds
}) {
  const ids = Array.isArray(skillIds)
    ? [...skillIds]
    : [];

  if (ids.length > 4) {
    throw new RangeError(
      "Le loadout actif ne peut pas dépasser 4 capacités"
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
    slots: ids.map((skillId, index) => ({
      id: "slot-" + (index + 1),
      skillId: optionalText(skillId)
    }))
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
  skillSpeedMultiplier = 1
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
    creatureDrafts: [
      creatureDraft,
      opponentCreatureDraft
    ],
    skillDrafts: [
      ...skillDrafts,
      ...opponentSkillDrafts
    ],
    loadouts: [
      loadout,
      opponentLoadout
    ],
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
          statValues
        };
  const progressionInput =
    progressionRules === null
      ? {}
      : {
          progressionRules
        };

  return exportCaptureEditorDraftsToCombatExportV3({
    battleSetup,
    creatureDrafts: [
      creatureDraft,
      opponentCreatureDraft
    ],
    skillDrafts: [
      ...skillDrafts,
      ...opponentSkillDrafts
    ],
    loadouts: [
      loadout,
      opponentLoadout
    ],
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
    ["[data-skill-required-level]", fields.requiredLevel]
  ];

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

function prepareNewSkillDraftFields(
  root,
  id,
  statRegistry = null
) {
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
    ["[data-skill-projectile-power]", 0],
    ["[data-skill-icon]", ""],
    ["[data-skill-socket]", ""],
    ["[data-skill-cast-fx]", ""],
    ["[data-skill-cast-scale]", 1],
    ["[data-skill-travel-fx]", ""],
    ["[data-skill-travel-scale]", 1],
    ["[data-skill-cast-layer-player]", "front"],
    ["[data-skill-cast-layer-opponent]", "front"],
    ["[data-skill-travel-layer-player]", "front"],
    ["[data-skill-travel-layer-opponent]", "front"],
    ["[data-skill-impact-fx]", ""],
    ["[data-skill-impact-scale]", 1],
    ["[data-skill-cast-audio]", ""],
    ["[data-skill-impact-audio]", ""]
  ];

  for (const [selector, value] of values) {
    one(root, selector).value = String(value);
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

    for (const view of ["front", "back"]) {
      const point = socket[view];
      if (!point) {
        continue;
      }

      const surface = root.querySelector(
        '[data-socket-surface][data-socket-view="' +
          view +
          '"]'
      );
      if (surface) {
        updateSocketMarker(surface, point);
      }
    }
  }

  syncSkillSocketSelect(root, sockets);
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

  const slots = [
    ...root.querySelectorAll("[data-loadout-slot]")
  ];
  for (let index = 0; index < slots.length; index += 1) {
    slots[index].value =
      loadout.slots[index]?.skillId ?? "";
  }

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
  const defaults = [
    ["[data-creature-id]", id],
    ["[data-creature-name]", "Nouvelle créature"],
    ["[data-creature-description]", ""],
    ["[data-creature-level]", 1],
    ["[data-creature-profile]", "biped"],
    ["[data-creature-display-scale]", 1],
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
    dispel: "Dissipation"
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
    damage_over_time: "Dégâts périodiques",
    heal_over_time: "Soin périodique",
    shield: "Bouclier",
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

function syncHumanSkillEffectRowV1(
  row
) {
  const kind = row.querySelector(
    "[data-skill-effect-kind]"
  ).value;

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
}

function appendHumanSkillEffectV1(
  root,
  effect = null,
  statRegistry = null
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

  const statusTags = tacticalTextInputV1(
    "skillStatusTags",
    (status.tags ?? []).join(", ")
  );

  const common = document.createElement("div");
  common.className = "skill-status-config__grid";
  common.append(
    tacticalFieldV1("ID statut", statusId),
    tacticalFieldV1("Type de statut", statusKind),
    tacticalFieldV1("Polarité", polarity),
    tacticalFieldV1("Durée (secondes)", duration),
    tacticalFieldV1("Stacking", stacking),
    maxStacksField,
    tacticalFieldV1(
      "Tags (séparés par des virgules)",
      statusTags
    )
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
  const statusChannel = tacticalTextInputV1(
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
      "Dégâts par tick",
      statusAmount
    ),
    tacticalFieldV1(
      "Intervalle (secondes)",
      tickSeconds
    ),
    tacticalFieldV1(
      "Canal / élément",
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

  statusBox.append(
    common,
    statConfig,
    dotConfig,
    hotConfig,
    shieldConfig
  );

  config.append(
    amountField,
    channelField,
    filterTagsField,
    statusBox
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

  syncHumanSkillEffectRowV1(row);
  return row;
}

function renderHumanSkillEffectsV1(
  root,
  effects,
  statRegistry = null
) {
  const host = one(
    root,
    "[data-skill-effects-host]"
  );
  host.textContent = "";

  for (const effect of effects ?? []) {
    appendHumanSkillEffectV1(
      root,
      effect,
      statRegistry
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
        tags: commaValuesV1(
          row.querySelector(
            "[data-skill-status-tags]"
          ).value
        )
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

function catalogMatches(asset, role) {
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

  if (role === "cast") {
    return (
      asset.category === "release" ||
      asset.tags?.includes("cast")
    );
  }

  if (role === "travel") {
    return asset.category === "travel";
  }

  if (role === "impact") {
    return asset.category === "impact";
  }

  if (role === "audio") {
    return asset.mediaType === "audio";
  }

  return false;
}

function populateSelect(select, assets, role) {
  const previous = select.value;
  const allowEmpty =
    select.dataset.requiredAsset !== "true";

  select.textContent = "";

  if (allowEmpty) {
    createOption(select, "", "Aucun");
  }

  for (const asset of assets) {
    if (catalogMatches(asset, role)) {
      createOption(
        select,
        asset.id,
        asset.label || asset.id
      );
    }
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

async function hydrateCaptureShowcaseCreaturePresetsV1(
  statRegistry
) {
  const transfers = await Promise.all(
    CAPTURE_SHOWCASE_CREATURE_PRESETS_V1.map(
      async (preset) => {
        const response = await fetch(
          new URL(
            "../../" + preset.file,
            import.meta.url
          ),
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(
            "Preset vitrine Capture indisponible : " +
              preset.id +
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

        if (
          transfer.kind !== "creature" ||
          transfer.value.draft.id !==
            preset.id
        ) {
          throw new RangeError(
            "Preset vitrine Capture invalide : " +
              preset.id
          );
        }

        return transfer;
      }
    )
  );

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

async function hydrateAssetCatalog(root, listen) {
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
    ? catalog.assets
    : [];

  const byId = new Map(
    assets.map((asset) => [asset.id, asset])
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
    const file = asset?.resource?.file;

    if (!file) {
      image.removeAttribute("src");
      image.dataset.empty = "true";
      return;
    }

    image.src = globalVisualAssetUrl(file);
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

    for (const image of [
      frontImage,
      backImage,
      socketFrontImage,
      socketBackImage
    ]) {
      image.style.transform =
        `scale(${scale})`;
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

function updateSocketMarker(surface, point) {
  let marker = surface.querySelector("[data-socket-marker]");
  if (!marker) {
    marker = document.createElement("span");
    marker.dataset.socketMarker = "true";
    marker.className = "socket-marker";
    surface.append(marker);
  }

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
    combat: {},
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
      socketId: selectedValue(
        root,
        "[data-skill-socket]"
      ) || null,
      castAudioAssetId: selectedValue(
        root,
        "[data-skill-cast-audio]"
      ),
      impactAudioAssetId: selectedValue(
        root,
        "[data-skill-impact-audio]"
      )
    }
  };
}

function readLoadout(root, creatureId) {
  const skillIds = [
    ...root.querySelectorAll("[data-loadout-slot]")
  ].map((select) => select.value || null);

  return buildHumanLoadoutV1({
    creatureId,
    skillIds
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

export function mountCaptureEditorHumanV2({
  root,
  opponentCreatureDraft,
  getOpponentCreatureDraft = null,
  opponentSkillDrafts,
  opponentLoadout
}) {
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
  let skillDirty = false;
  let disposed = false;
  let lastExport = null;
  let statRegistry = null;
  let progressionRules = null;

  function listen(target, type, handler) {
    if (disposed) {
      return;
    }
    target.addEventListener(type, handler);
    listeners.push(() =>
      target.removeEventListener(type, handler)
    );
  }

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
      refreshLoadoutOptions(
        plan.id
      );
    }

    creatureDirty = false;
    skillDirty = false;
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
    const slots = [
      ...root.querySelectorAll(
        "[data-loadout-slot]"
      )
    ];
    const summary = one(
      root,
      "[data-loadout-policy-summary]"
    );

    if (progressionRules === null) {
      slots.forEach(
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

    slots.forEach(
      (select, index) => {
        const available =
          availability[index] === true;
        select.disabled = false;
        select.dataset.locked = "false";
        select.dataset.activeNow =
          available ? "true" : "false";
        select.title =
          available
            ? "Slot actif au niveau actuel"
            : "Slot configurable maintenant, activé automatiquement quand la progression le débloque";
        const label =
          select.closest("label");
        if (label) {
          label.dataset.locked = "false";
          label.dataset.activeNow =
            available ? "true" : "false";
        }
      }
    );

    summary.textContent =
      unlocked +
      " slot" +
      (unlocked > 1 ? "s" : "") +
      " actif" +
      (unlocked > 1 ? "s" : "") +
      " au niveau " +
      level +
      ". Les 4 slots restent configurables ; les capacités futures deviennent actives quand leur slot et leur niveau requis sont débloqués.";
  }

  function refreshCreatureLibraryOptions(
    preferredId = null
  ) {
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
    updateCreatureLibraryState(
      "Modification de « " +
        record.draft.displayName +
        " ». Les changements ne sont appliqués qu’après « Mettre à jour ».",
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
        "Aucun modèle chargé. Pour créer : choisis un nouvel identifiant puis utilise « Créer ». Pour modifier un ID déjà présent : utilise « Mettre à jour ».";
      libraryState.dataset.tone = "info";
      return;
    }

    libraryState.textContent = state.message;
    libraryState.dataset.tone =
      state.runtimeReady ? "ok" : "warning";
  }

  function refreshLoadoutOptions(preferredId = null) {
    const configured = [...configuredSkills.values()];
    const slots = [
      ...root.querySelectorAll("[data-loadout-slot]")
    ];

    for (const select of slots) {
      const previous = select.value;
      select.textContent = "";
      createOption(select, "", "Vide");

      for (const draft of configured) {
        createOption(
          select,
          draft.id,
          draft.definition.name +
            " · déblocage niv. " +
            draft.requiredLevel
        );
      }

      if (
        previous &&
        configuredSkills.has(previous)
      ) {
        select.value = previous;
      }
    }

    if (
      preferredId &&
      configuredSkills.has(preferredId) &&
      !slots.some(
        (select) => select.value === preferredId
      )
    ) {
      const empty = slots.find(
        (select) =>
          select.value === "" &&
          select.disabled !== true
      );
      if (empty) {
        empty.value = preferredId;
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
    skillDirty = false;
    refreshLoadoutOptions(draft.id);

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

  librarySelect.textContent = "";
  createOption(
    librarySelect,
    "",
    "Aucun modèle — partir de zéro"
  );

  for (const entry of captureLegacySkillLibraryEntriesV1()) {
    const elementLabel =
      entry.element === null
        ? "Neutre"
        : entry.element;
    const stateLabel =
      entry.migrationState ===
      "requires-status-effect-v1"
        ? " · statut requis"
        : "";

    createOption(
      librarySelect,
      entry.id,
      "[" +
        elementLabel +
        "] " +
        entry.name +
        " · niv. " +
        entry.requiredLevel +
        stateLabel
    );
  }

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

    const state =
      captureLegacyAbilityEditorStateV1(
        abilityId
      );
    const merged =
      mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1(
        readSkillFields(root),
        abilityId
      );

    writeSkillTemplateFields(
      root,
      merged,
      statRegistry
    );
    updateLibraryState(state);
    skillDirty = true;

    setStatus(
      root,
      "Modèle « " +
        state.template.name +
        " » chargé comme modèle. Aucun changement n’est enregistré tant que tu n’utilises pas « Créer » ou « Mettre à jour ».",
      state.runtimeReady ? "info" : "warning"
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
    selectedLegacyState = null;
    skillDirty = true;

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
      skillDirty = true;
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
      skillDirty = true;
    }
  );

  listen(
    skillActivationConditionsHost,
    "input",
    () => {
      skillDirty = true;
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
      skillDirty = true;

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
      skillDirty = true;
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
          "[data-skill-status-stacking]"
        )
      ) {
        syncHumanSkillEffectRowV1(row);
      }
      skillDirty = true;
    }
  );

  listen(
    skillEffectsHost,
    "input",
    () => {
      skillDirty = true;
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
      skillDirty = true;
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

  for (
    const field of root.querySelectorAll(
      '[data-editor-panel="skills"] input, ' +
      '[data-editor-panel="skills"] select, ' +
      '[data-editor-panel="skills"] textarea'
    )
  ) {
    if (
      field === librarySelect ||
      field === newSkillButton ||
      field === createSkillButton ||
      field === updateSkillButton
    ) {
      continue;
    }

    listen(field, "input", () => {
      skillDirty = true;
    });
    listen(field, "change", () => {
      skillDirty = true;
    });
  }

  try {
    const initialSkill =
      buildHumanSkillDraftV1(
        readSkillFields(root)
      );
    configuredSkills.set(
      initialSkill.id,
      initialSkill
    );
    refreshLoadoutOptions(
      initialSkill.id
    );
  } catch {
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
      updateSocketMarker(surface, point);
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

  function validate() {
    try {
      if (
        selectedLegacyState !== null &&
        !selectedLegacyState.runtimeReady
      ) {
        throw new Error(
          "La capacité historique sélectionnée contient un buff, debuff ou DoT. StatusEffectV1 est requis avant validation complète."
        );
      }

      if (skillDirty) {
        throw new Error(
          "La capacité en cours a été modifiée. Enregistre-la avant de valider le combat."
        );
      }

      if (creatureDirty) {
        throw new Error(
          "La créature en cours a été modifiée. Enregistre-la avant de valider le combat."
        );
      }

      if (
        !selectedCreatureId ||
        !configuredCreatures.has(
          selectedCreatureId
        )
      ) {
        throw new Error(
          "Enregistre ou sélectionne une créature avant de valider le combat."
        );
      }

      const creatureRecord =
        configuredCreatures.get(
          selectedCreatureId
        );
      const loadout =
        creatureRecord.loadout;

      if (progressionRules !== null) {
        validateHumanLoadoutProgressionV1({
          loadout,
          progressionRules,
          creatureLevel:
            creatureRecord.draft.level,
          skillDrafts:
            configuredSkills
        });
      }

      const combatRules =
        readHumanCombatRulesV1(root);
      const creatureDraft =
        applyCaptureCombatRulesToCreatureDraftV1({
          creatureDraft:
            creatureRecord.draft,
          combatRules
        });

      const opponentSourceDraft =
        typeof getOpponentCreatureDraft === "function"
          ? getOpponentCreatureDraft()
          : opponentCreatureDraft;

      if (
        !opponentSourceDraft ||
        typeof opponentSourceDraft !== "object"
      ) {
        throw new TypeError(
          "Créature adverse de test indisponible"
        );
      }

      const resolvedOpponentCreatureDraft =
        applyCaptureCombatRulesToCreatureDraftV1({
          creatureDraft:
            opponentSourceDraft,
          combatRules
        });

      const battleSetup = buildHumanBattleSetupV1({
        battleId: "capture-human-preview",
        localCreatureId: creatureDraft.id,
        localDisplayName: creatureDraft.displayName,
        opponentCreatureId:
          resolvedOpponentCreatureDraft.id,
        opponentDisplayName:
          resolvedOpponentCreatureDraft.displayName,
        arenaId: selectedValue(
          root,
          "[data-test-arena]"
        ),
        activePerTeam: numericValue(
          root,
          "[data-active-per-team]"
        ),
        skillSpeedMultiplier: numericValue(
          root,
          "[data-combat-skill-speed]"
        )
      });

      lastExport = buildHumanEditorExportV3({
        creatureDraft,
        skillDrafts: [
          ...configuredSkills.values()
        ],
        loadout,
        battleSetup,
        opponentCreatureDraft:
          resolvedOpponentCreatureDraft,
        opponentSkillDrafts,
        opponentLoadout,
        statRegistry,
        statValues:
          creatureRecord.statValues == null
            ? []
            : [creatureRecord.statValues],
        progressionRules
      });

      one(root, "[data-editor-summary]").textContent =
        lastExport.actors.length +
        " combattants · " +
        lastExport.creatures.length +
        " créatures · " +
        lastExport.skills.length +
        " capacités";

      setStatus(
        root,
        "Configuration valide. L’export Capture est prêt.",
        "ok"
      );

      return lastExport;
    } catch (error) {
      lastExport = null;
      one(root, "[data-editor-summary]").textContent =
        "Corrige les champs signalés.";
      setStatus(
        root,
        error.message,
        "error"
      );
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
          skillDirty
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
          skillDirty
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

  Promise.all([
    hydrateAssetCatalog(root, listen),
    hydratePrivateAudioCatalog(root),
    hydrateNativeSkillCatalog(),
    hydrateCaptureStatRegistryV1()
      .then(async (registry) => {
        const [
          records,
          showcasePresets
        ] = await Promise.all([
          hydrateMonsterCaptureCreatureCatalog(
            registry
          ),
          hydrateCaptureShowcaseCreaturePresetsV1(
            registry
          )
        ]);

        return {
          registry,
          records,
          showcasePresets
        };
      }),
    hydrateCaptureProgressionRulesV1(),
    hydrateCaptureCreatureVisualMetadataV1()
  ])
    .then(([
      assetCatalog,
      ,
      nativeSkills,
      captureData,
      loadedProgressionRules,
      creatureVisualMetaById
    ]) => {
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

      if (!skillDirty) {
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
        const transfer of
        captureData.showcasePresets
      ) {
        const plan =
          planCaptureTransferImportV1({
            currentDatabase:
              currentEditorDatabaseV1(),
            transfer,
            mode: "replace"
          });

        if (plan.kind !== "creature") {
          throw new RangeError(
            "Un preset vitrine doit être une créature."
          );
        }

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

      refreshLoadoutOptions();
      refreshCreatureLibraryOptions(
        selectedCreatureId
      );

      const selectedRecord =
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
        "Catalogue Monster Capture historique + 2 modèles vitrine chargés. Sélectionne une créature pour la modifier ou crée une nouvelle entrée.",
        "ok"
      );

      if (!disposed) {
        setStatus(
          root,
          "Bibliothèques visuelle, audio, stats/progression, catalogue Monster Capture historique + 2 modèles vitrine, 9 capacités laboratoire + 103 capacités Capture natives et 103 modèles historiques chargés.",
          "info"
        );
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
    });

  return Object.freeze({
    validate,
    getLastExport() {
      return lastExport;
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      for (const remove of listeners.splice(0)) {
        remove();
      }
    }
  });
}
