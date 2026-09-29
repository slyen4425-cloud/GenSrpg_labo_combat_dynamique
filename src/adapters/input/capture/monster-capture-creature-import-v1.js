import {
  normalizeCaptureCreatureEditorDraftV3
} from "../../../contracts/capture-creature-editor-draft-v3.js";
import {
  normalizeCaptureActiveSkillLoadoutV1
} from "../../../contracts/capture-active-skill-loadout-v1.js";

export const MONSTER_CAPTURE_IMPORT_DEFAULTS_V1 =
  Object.freeze({
    maxEnergy: 0,
    initialEnergy: 0,
    energyChargeAmount: 0,
    energyChargeIntervalMs: 0,
    movementEnergyPerStep: 0,
    chargeTimeModifierPct: 0
  });

function objectValue(value, field) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(field + " must be an object");
  }
  return value;
}

function textValue(value, field) {
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

function numberValue(
  value,
  field,
  fallback = null
) {
  if (value == null && fallback !== null) {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(
      field + " must be a finite number"
    );
  }
  return number;
}

function firstNumber(
  object,
  keys,
  fallback = 0
) {
  for (const key of keys) {
    if (
      object?.[key] != null &&
      Number.isFinite(Number(object[key]))
    ) {
      return Number(object[key]);
    }
  }
  return fallback;
}

function stringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [
    ...new Set(
      value
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
    )
  ];
}

function normalizeLegacyResistances(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        typeof entry.kind === "string" &&
        entry.kind.trim() !== "" &&
        Number.isFinite(Number(entry.value))
    )
    .map((entry) => ({
      kind: entry.kind.trim(),
      value: Number(entry.value)
    }));
}

function importEvolution(source) {
  const raw = source.evolution;
  const targetId =
    typeof raw?.targetId === "string" &&
    raw.targetId.trim() !== ""
      ? raw.targetId.trim()
      : (
          typeof source.evolutionTo === "string" &&
          source.evolutionTo.trim() !== ""
            ? source.evolutionTo.trim()
            : null
        );

  if (!targetId) {
    return null;
  }

  const condition =
    raw?.condition === "manual"
      ? "manual"
      : "level";

  return {
    condition,
    level:
      condition === "level"
        ? Math.max(
            1,
            Math.trunc(
              numberValue(
                raw?.level ??
                  source.evolutionLevel ??
                  1,
                "evolution.level"
              )
            )
          )
        : null,
    targetId
  };
}

export function importMonsterCaptureCreatureRecordV1(
  input
) {
  const source = objectValue(
    input,
    "MonsterCaptureCreatureSource"
  );
  const stats = objectValue(
    source.stats ?? {},
    "MonsterCaptureCreatureSource.stats"
  );

  const id = textValue(source.id, "id");
  const displayName =
    textValue(source.name, "name");

  const draft =
    normalizeCaptureCreatureEditorDraftV3({
      schema: "capture-creature-editor-draft-v3",
      id,
      displayName,
      description:
        typeof source.desc === "string"
          ? source.desc
          : "",
      level: Math.max(
        1,
        Math.trunc(
          numberValue(source.level, "level", 1)
        )
      ),
      sourceStats: {
        force: firstNumber(
          stats,
          ["force", "power"],
          0
        ),
        agility: firstNumber(
          stats,
          ["agility", "agilite"],
          0
        ),
        intelligence: firstNumber(
          stats,
          ["intelligence"],
          0
        ),
        spirit: firstNumber(
          stats,
          ["spirit", "esprit"],
          0
        ),
        endurance: firstNumber(
          stats,
          ["endurance", "defense"],
          0
        ),
        initiative: firstNumber(
          stats,
          ["initiative", "speed"],
          0
        )
      },
      elements: stringArray(source.elementTypes),
      resistances:
        normalizeLegacyResistances(
          source.resistances
        ),
      capture: {
        capturable: source.capturable !== false,
        captureRate: Math.min(
          100,
          Math.max(
            0,
            numberValue(
              source.captureRate,
              "captureRate",
              0
            )
          )
        ),
        spawnChance: Math.min(
          100,
          Math.max(
            0,
            numberValue(
              source.spawnChance,
              "spawnChance",
              0
            )
          )
        ),
        spawnTags: stringArray(
          source.spawnTags ??
            source.elementTypes
        ),
        evolution: importEvolution(source)
      },
      combat: {
        maxHp: Math.max(
          0,
          numberValue(source.hp, "hp", 0)
        ),
        initialHp: Math.max(
          0,
          numberValue(source.hp, "hp", 0)
        ),
        ...MONSTER_CAPTURE_IMPORT_DEFAULTS_V1
      },
      skillIds: stringArray(source.abilityIds),
      presentation: null
    });

  const loadout =
    normalizeCaptureActiveSkillLoadoutV1({
      schema:
        "capture-active-skill-loadout-v1",
      creatureId: draft.id,
      slots: [1, 2, 3, 4].map(
        (number) => ({
          id: "slot-" + number,
          skillId: null
        })
      )
    });

  return Object.freeze({
    draft,
    loadout
  });
}
