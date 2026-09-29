import {
  normalizeCaptureCreatureEditorDraftV3
} from "../contracts/capture-creature-editor-draft-v3.js";
import {
  normalizeCaptureActiveSkillLoadoutV1
} from "../contracts/capture-active-skill-loadout-v1.js";

export const CAPTURE_LEGACY_MONSTER_CATALOG_URL_V1 =
  new URL(
    "../../data/capture/legacy-monster-capture-creatures.v1.json",
    import.meta.url
  );

function requiredObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(field + " doit être un objet");
  }
  return value;
}

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(field + " est obligatoire");
  }
  return value.trim();
}

function finiteNumber(value, fallback, field) {
  const candidate = value == null ? fallback : Number(value);
  if (!Number.isFinite(candidate)) {
    throw new TypeError(field + " doit être un nombre fini");
  }
  return candidate;
}

function positiveInteger(value, fallback, field) {
  const candidate = finiteNumber(value, fallback, field);
  if (!Number.isInteger(candidate) || candidate < 1) {
    throw new RangeError(field + " doit être un entier positif");
  }
  return candidate;
}

function uniqueTexts(values) {
  const out = [];
  const seen = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    if (typeof value !== "string" || value.trim() === "") {
      continue;
    }
    const id = value.trim();
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

function legacyStatsV1(entity) {
  const stats = requiredObject(
    entity.stats ?? {},
    "entity.stats"
  );

  // Règle de compatibilité issue de l'ancien
  // openSharedEntityEditor :
  // Force/Agilité/Intelligence/Esprit/Endurance => 10,
  // Initiative => 0 lorsque le champ historique est absent.
  return {
    force: finiteNumber(
      stats.force ?? stats.power,
      10,
      "Force"
    ),
    agility: finiteNumber(
      stats.agility ?? stats.agilite,
      10,
      "Agilité"
    ),
    intelligence: finiteNumber(
      stats.intelligence,
      10,
      "Intelligence"
    ),
    spirit: finiteNumber(
      stats.spirit ?? stats.esprit,
      10,
      "Esprit"
    ),
    endurance: finiteNumber(
      stats.endurance,
      10,
      "Endurance"
    ),
    initiative: finiteNumber(
      stats.initiative,
      0,
      "Initiative"
    )
  };
}

function legacyEvolutionV1(entity) {
  if (entity.canEvolve !== true) {
    return null;
  }

  const source =
    entity.evolution &&
    typeof entity.evolution === "object"
      ? entity.evolution
      : {};

  const targetId =
    source.targetId ??
    entity.evolutionTo ??
    null;

  if (
    typeof targetId !== "string" ||
    targetId.trim() === ""
  ) {
    return null;
  }

  const condition =
    source.condition === "manual"
      ? "manual"
      : "level";

  return {
    condition,
    level:
      condition === "level"
        ? positiveInteger(
            source.level ??
              entity.evolutionLevel,
            16,
            "Niveau évolution"
          )
        : null,
    targetId: targetId.trim()
  };
}

function legacyResistancesV1(entity) {
  if (Array.isArray(entity.resistances)) {
    return entity.resistances.map((entry) => ({
      kind: requiredText(
        entry?.kind,
        "Type résistance"
      ),
      value: finiteNumber(
        entry?.value,
        0,
        "Valeur résistance"
      )
    }));
  }

  const out = [];
  for (
    const id of uniqueTexts(
      entity.elementResistances
    )
  ) {
    out.push({
      kind: "element:" + id,
      value: 35
    });
  }
  for (
    const id of uniqueTexts(
      entity.elementWeaknesses
    )
  ) {
    out.push({
      kind: "element:" + id,
      value: -50
    });
  }
  return out;
}

function legacyLoadoutV1(entityId, skillIds) {
  const active = skillIds.slice(0, 4);

  while (active.length < 4) {
    active.push(null);
  }

  return normalizeCaptureActiveSkillLoadoutV1({
    schema: "capture-active-skill-loadout-v1",
    creatureId: entityId,
    slots: active.map((skillId, index) => ({
      id: "slot-" + (index + 1),
      skillId
    }))
  });
}

export function adaptLegacyMonsterCreatureRecordV1(
  input
) {
  const entity = requiredObject(
    input,
    "Legacy Monster Capture creature"
  );

  const id = requiredText(
    entity.id,
    "ID créature"
  );
  const skillIds = uniqueTexts(
    entity.abilityIds
  );
  const hp = Math.max(
    1,
    finiteNumber(
      entity.hp,
      10,
      "PV"
    )
  );

  const draft =
    normalizeCaptureCreatureEditorDraftV3({
      schema:
        "capture-creature-editor-draft-v3",
      id,
      displayName: requiredText(
        entity.name,
        "Nom créature"
      ),
      description:
        typeof entity.desc === "string"
          ? entity.desc
          : "",
      level: positiveInteger(
        entity.level,
        1,
        "Niveau"
      ),
      sourceStats: legacyStatsV1(entity),
      elements: uniqueTexts(
        entity.elementTypes
      ),
      resistances:
        legacyResistancesV1(entity),
      capture: {
        capturable:
          entity.capturable !== false,
        captureRate: finiteNumber(
          entity.captureRate,
          50,
          "Taux de capture"
        ),
        spawnChance: finiteNumber(
          entity.spawnChance,
          25,
          "Chance d'apparition"
        ),
        spawnTags: uniqueTexts(
          entity.spawnTags?.length
            ? entity.spawnTags
            : entity.elementTypes
        ),
        evolution:
          legacyEvolutionV1(entity)
      },
      combat: {
        maxHp: hp,
        initialHp: hp,

        // Le profil Monster Capture historique
        // désactive mana et définit baseMana à 0.
        // Aucune énergie dynamique historique
        // n'est inventée pendant l'import.
        maxEnergy: 0,
        initialEnergy: 0,
        energyChargeAmount: 0,
        energyChargeIntervalMs: 0,
        movementEnergyPerStep: 0,
        chargeTimeModifierPct: 0
      },
      skillIds,
      presentation: null
    });

  return Object.freeze({
    draft,
    loadout:
      legacyLoadoutV1(id, skillIds),
    source: Object.freeze({
      universeId:
        entity.universeId ?? null,
      contentFamily:
        entity.contentFamily ?? null,
      icon:
        entity.icon ?? null,
      legacyDefense:
        entity.stats?.defense ?? null,
      legacySpeed:
        entity.stats?.speed ?? null
    })
  });
}

export function adaptLegacyMonsterCreatureCatalogV1(
  catalog
) {
  const value = requiredObject(
    catalog,
    "Monster Capture catalog"
  );

  if (
    value.schema !==
    "capture-legacy-monster-creature-catalog-v1"
  ) {
    throw new RangeError(
      "Schéma catalogue Monster Capture invalide"
    );
  }

  const entries = Array.isArray(value.entries)
    ? value.entries
    : [];

  const records = entries.map(
    adaptLegacyMonsterCreatureRecordV1
  );

  const ids = records.map(
    (record) => record.draft.id
  );

  if (new Set(ids).size !== ids.length) {
    throw new RangeError(
      "Le catalogue Monster Capture contient des IDs dupliqués"
    );
  }

  return Object.freeze(records);
}

export async function loadLegacyMonsterCreatureCatalogV1({
  fetchFn = globalThis.fetch
} = {}) {
  if (typeof fetchFn !== "function") {
    throw new TypeError(
      "fetchFn doit être une fonction"
    );
  }

  const response = await fetchFn(
    CAPTURE_LEGACY_MONSTER_CATALOG_URL_V1,
    { cache: "no-store" }
  );

  if (!response?.ok) {
    throw new Error(
      "Catalogue Monster Capture indisponible (" +
        (response?.status ?? "inconnu") +
        ")"
    );
  }

  return adaptLegacyMonsterCreatureCatalogV1(
    await response.json()
  );
}
