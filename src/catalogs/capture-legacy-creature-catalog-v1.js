import {
  normalizeCaptureCreatureEditorDraftV3
} from "../contracts/capture-creature-editor-draft-v3.js";
import {
  normalizeCaptureActiveSkillLoadoutV1
} from "../contracts/capture-active-skill-loadout-v1.js";

export const CAPTURE_LEGACY_CREATURE_CATALOG_URL =
  new URL(
    "../../data/capture/legacy-monster-capture-creatures.v1.json",
    import.meta.url
  );

const LEGACY_EDITOR_DEFAULTS = Object.freeze({
  intelligence: 10,
  endurance: 10,
  initiative: 0,
  maxEnergy: 10,
  initialEnergy: 0,
  energyChargeAmount: 1,
  energyChargeIntervalMs: 2000,
  movementEnergyPerStep: 2,
  chargeTimeModifierPct: 0
});

function objectValue(value, field) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(
      field + " must be an object"
    );
  }
  return value;
}

function requiredString(value, field) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new TypeError(
      field + " must be a non-empty string"
    );
  }
  return value.trim();
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : fallback;
}

function stableStrings(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .filter(
          (value) =>
            typeof value === "string" &&
            value.trim() !== ""
        )
        .map((value) => value.trim())
    )
  ];
}

function genericResistances(raw) {
  if (
    Array.isArray(raw.resistances) &&
    raw.resistances.length > 0
  ) {
    return raw.resistances.map((entry) => ({
      kind: requiredString(
        entry.kind,
        "resistance.kind"
      ),
      value: finiteNumber(
        entry.value,
        0
      )
    }));
  }

  const values = new Map();

  for (
    const element of stableStrings(
      raw.elementResistances
    )
  ) {
    values.set("element:" + element, 35);
  }

  for (
    const element of stableStrings(
      raw.elementWeaknesses
    )
  ) {
    values.set("element:" + element, -50);
  }

  return [...values].map(
    ([kind, value]) => ({
      kind,
      value
    })
  );
}

function legacyEvolution(raw) {
  const targetId =
    typeof raw.evolution?.targetId === "string" &&
    raw.evolution.targetId.trim() !== ""
      ? raw.evolution.targetId.trim()
      : typeof raw.evolutionTo === "string" &&
          raw.evolutionTo.trim() !== ""
        ? raw.evolutionTo.trim()
        : null;

  if (!targetId || raw.canEvolve === false) {
    return null;
  }

  const condition =
    raw.evolution?.condition === "manual"
      ? "manual"
      : "level";

  return {
    condition,
    level:
      condition === "level"
        ? Math.max(
            1,
            finiteNumber(
              raw.evolution?.level ??
                raw.evolutionLevel,
              16
            )
          )
        : null,
    targetId
  };
}

function enabledSkillIds(rawIds, enabledSkillIds) {
  const ids = stableStrings(rawIds);

  if (enabledSkillIds == null) {
    return ids;
  }

  const enabled =
    enabledSkillIds instanceof Set
      ? enabledSkillIds
      : new Set(
          Array.isArray(enabledSkillIds)
            ? enabledSkillIds
            : []
        );

  return ids.filter(
    (id) => enabled.has(id)
  );
}

function legacySourceStats(raw) {
  const stats = objectValue(
    raw.stats ?? {},
    "legacy.stats"
  );

  return {
    force: finiteNumber(
      stats.force,
      10
    ),
    agility: finiteNumber(
      stats.agilite,
      10
    ),
    intelligence: finiteNumber(
      stats.intelligence,
      LEGACY_EDITOR_DEFAULTS.intelligence
    ),
    spirit: finiteNumber(
      stats.esprit,
      10
    ),
    endurance: finiteNumber(
      stats.endurance,
      LEGACY_EDITOR_DEFAULTS.endurance
    ),
    initiative: finiteNumber(
      stats.initiative,
      LEGACY_EDITOR_DEFAULTS.initiative
    )
  };
}

export function adaptLegacyCaptureCreatureToEditorRecordV1(
  input,
  {
    enabledSkillIds: enabled = null
  } = {}
) {
  const raw = objectValue(
    input,
    "LegacyCaptureCreature"
  );
  const id = requiredString(
    raw.id,
    "legacy.id"
  );
  const skillIds = stableStrings(
    raw.abilityIds
  );
  const activeSkillIds =
    enabledSkillIds(
      skillIds,
      enabled
    ).slice(0, 4);
  const maxHp = Math.max(
    1,
    finiteNumber(raw.hp, 10)
  );

  const draft =
    normalizeCaptureCreatureEditorDraftV3({
      schema:
        "capture-creature-editor-draft-v3",
      id,
      displayName: requiredString(
        raw.name,
        "legacy.name"
      ),
      description:
        typeof raw.desc === "string"
          ? raw.desc
          : "",
      level: Math.max(
        1,
        Math.trunc(
          finiteNumber(raw.level, 1)
        )
      ),
      sourceStats:
        legacySourceStats(raw),
      elements: stableStrings(
        raw.elementTypes
      ),
      resistances:
        genericResistances(raw),
      capture: {
        capturable:
          raw.capturable !== false,
        captureRate: Math.max(
          0,
          Math.min(
            100,
            finiteNumber(
              raw.captureRate,
              50
            )
          )
        ),
        spawnChance: Math.max(
          0,
          Math.min(
            100,
            finiteNumber(
              raw.spawnChance,
              25
            )
          )
        ),
        spawnTags:
          stableStrings(
            raw.spawnTags?.length
              ? raw.spawnTags
              : raw.elementTypes
          ),
        evolution:
          legacyEvolution(raw)
      },
      combat: {
        maxHp,
        initialHp: maxHp,
        maxEnergy:
          LEGACY_EDITOR_DEFAULTS.maxEnergy,
        initialEnergy:
          LEGACY_EDITOR_DEFAULTS.initialEnergy,
        energyChargeAmount:
          LEGACY_EDITOR_DEFAULTS.energyChargeAmount,
        energyChargeIntervalMs:
          LEGACY_EDITOR_DEFAULTS.energyChargeIntervalMs,
        movementEnergyPerStep:
          LEGACY_EDITOR_DEFAULTS.movementEnergyPerStep,
        chargeTimeModifierPct:
          LEGACY_EDITOR_DEFAULTS.chargeTimeModifierPct
      },
      skillIds,
      presentation: null
    });

  const loadout =
    normalizeCaptureActiveSkillLoadoutV1({
      schema:
        "capture-active-skill-loadout-v1",
      creatureId: id,
      slots: Array.from(
        { length: 4 },
        (_, index) => ({
          id: "slot-" + (index + 1),
          skillId:
            activeSkillIds[index] ?? null
        })
      )
    });

  return Object.freeze({
    draft,
    loadout
  });
}

export function normalizeLegacyCaptureCreatureCatalogV1(
  input
) {
  const value = objectValue(
    input,
    "LegacyCaptureCreatureCatalog"
  );

  if (
    value.schema !==
    "capture-legacy-creature-catalog-v1"
  ) {
    throw new RangeError(
      "unsupported legacy creature catalog schema"
    );
  }

  if (!Array.isArray(value.creatures)) {
    throw new TypeError(
      "catalog.creatures must be an array"
    );
  }

  const ids = value.creatures.map(
    (entry) =>
      requiredString(
        entry?.id,
        "catalog.creature.id"
      )
  );

  if (
    new Set(ids).size !== ids.length
  ) {
    throw new RangeError(
      "catalog creature ids must be unique"
    );
  }

  return Object.freeze({
    schema: value.schema,
    source: Object.freeze({
      sourceId: requiredString(
        value.source?.sourceId,
        "source.sourceId"
      ),
      repository: requiredString(
        value.source?.repository,
        "source.repository"
      ),
      commit: requiredString(
        value.source?.commit,
        "source.commit"
      ),
      indexBlob: requiredString(
        value.source?.indexBlob,
        "source.indexBlob"
      ),
      entityTable: requiredString(
        value.source?.entityTable,
        "source.entityTable"
      )
    }),
    creatures: Object.freeze(
      value.creatures.map(
        (entry) =>
          Object.freeze({ ...entry })
      )
    )
  });
}
