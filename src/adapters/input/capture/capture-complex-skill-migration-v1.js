import {
  CAPTURE_USED_ABILITY_CATALOG_V2
} from "../../../catalogs/capture-used-ability-catalog-v2.js";
import {
  CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1
} from "../../../catalogs/capture-portable-native-skill-catalog-v1.js";
import {
  normalizeSkillEffectV1
} from "../../../contracts/skill-effect-v1.js";
import {
  monsterCaptureStandardStatIdForLegacyAliasV1
} from "./monster-capture-stat-values-v1.js";

export const CAPTURE_COMPLEX_SKILL_MIGRATION_V1_SCHEMA =
  "capture-complex-skill-migration-v1";

const STATUS_KINDS = new Set([
  "buff",
  "debuff",
  "dot",
  "hot"
]);

const IMMEDIATE_KINDS = new Set([
  "damage",
  "heal"
]);

function deepFreeze(value) {
  if (
    value &&
    typeof value === "object" &&
    !Object.isFrozen(value)
  ) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

function blocker(kind, fields = {}) {
  return Object.freeze({
    kind,
    ...fields
  });
}

function historicalDefaultTargetScope(effect) {
  if (effect.target === "self") {
    return "self";
  }
  if (effect.target === "enemy") {
    return "target";
  }
  if (effect.target === "ally") {
    return "target";
  }
  if (effect.target === "all_allies") {
    return "all_allies";
  }
  if (effect.target === "all_enemies") {
    return "all_enemies";
  }
  if (effect.target === "zone") {
    return "all_enemies";
  }

  if (effect.target != null && effect.target !== "") {
    return null;
  }

  if (
    effect.kind === "heal" ||
    effect.kind === "hot"
  ) {
    return "self";
  }

  if (effect.kind === "buff") {
    return "self";
  }

  return "target";
}

function effectBlockers(effect, effectIndex) {
  const blockers = [];
  const targetScope =
    historicalDefaultTargetScope(effect);

  if (targetScope === null) {
    blockers.push(
      blocker("requires-target-mapping", {
        effectIndex,
        legacyTarget: effect.target
      })
    );
  }

  if (!IMMEDIATE_KINDS.has(effect.kind) &&
      !STATUS_KINDS.has(effect.kind)) {
    blockers.push(
      blocker("requires-effect-mapping", {
        effectIndex,
        legacyKind: effect.kind
      })
    );
    return blockers;
  }

  if (STATUS_KINDS.has(effect.kind)) {
    blockers.push(
      blocker("requires-duration-policy", {
        effectIndex,
        legacyDuration:
          Object.prototype.hasOwnProperty.call(
            effect,
            "duration"
          )
            ? effect.duration
            : null,
        legacyUnit: "turn_end_turns",
        requiresTickIntervalMs:
          effect.kind === "dot" ||
          effect.kind === "hot"
      })
    );
  }

  if (
    effect.kind === "buff" ||
    effect.kind === "debuff"
  ) {
    const legacyStatId =
      typeof effect.stat === "string"
        ? effect.stat
        : "";
    const modernStatId =
      legacyStatId === ""
        ? null
        : monsterCaptureStandardStatIdForLegacyAliasV1(
            legacyStatId
          );

    if (modernStatId === null) {
      blockers.push(
        blocker("requires-stat-mapping", {
          effectIndex,
          legacyStatId
        })
      );
    }

    blockers.push(
      blocker("requires-stat-effect-policy", {
        effectIndex,
        legacyStatId,
        modernStatId,
        legacyValue:
          Object.prototype.hasOwnProperty.call(
            effect,
            "value"
          )
            ? effect.value
            : null,
        legacyValueUnit:
          "historical-percent-rule"
      })
    );
  }

  return blockers;
}

function immediateTacticalEffect(effect) {
  const targetScope =
    historicalDefaultTargetScope(effect);

  if (effect.kind === "damage") {
    return normalizeSkillEffectV1({
      kind: "damage",
      targetScope,
      amount: Number(effect.base),
      channel:
        typeof effect.element === "string" &&
        effect.element !== ""
          ? effect.element
          : null
    });
  }

  if (effect.kind === "heal") {
    return normalizeSkillEffectV1({
      kind: "heal",
      targetScope,
      amount: Number(effect.base)
    });
  }

  throw new RangeError(
    "effect is not immediately migratable: " +
      effect.kind
  );
}

function migrationStateForBlockers(blockers) {
  if (blockers.length === 0) {
    return "runtime-ready";
  }

  const kinds = [
    ...new Set(
      blockers.map((entry) => entry.kind)
    )
  ];

  return kinds.length === 1
    ? kinds[0]
    : "blocked";
}

const PORTABLE_IDS = new Set(
  CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1.entries.map(
    (entry) => entry.id
  )
);

const COMPLEX_ABILITIES =
  CAPTURE_USED_ABILITY_CATALOG_V2.abilities.filter(
    (ability) => !PORTABLE_IDS.has(ability.id)
  );

function migrateAbility(ability, sourceIndex) {
  const blockers = Object.freeze(
    ability.effects.flatMap(
      (effect, effectIndex) =>
        effectBlockers(effect, effectIndex)
    )
  );
  const migrationState =
    migrationStateForBlockers(blockers);

  return deepFreeze({
    id: ability.id,
    sourceId: ability.id,
    sourceIndex,
    name: ability.name,
    migrationState,
    blockers,
    legacyEffects: ability.effects,
    tacticalEffects:
      migrationState === "runtime-ready"
        ? Object.freeze(
            ability.effects.map(
              immediateTacticalEffect
            )
          )
        : null
  });
}

const ENTRIES = Object.freeze(
  COMPLEX_ABILITIES.map(migrateAbility)
);

export const CAPTURE_COMPLEX_SKILL_MIGRATION_V1 =
  deepFreeze({
    schema:
      CAPTURE_COMPLEX_SKILL_MIGRATION_V1_SCHEMA,
    source: {
      catalogSchema:
        CAPTURE_USED_ABILITY_CATALOG_V2.schema,
      sourceId:
        CAPTURE_USED_ABILITY_CATALOG_V2.source
          .sourceId,
      commit:
        CAPTURE_USED_ABILITY_CATALOG_V2.source
          .commit,
      indexBlob:
        CAPTURE_USED_ABILITY_CATALOG_V2.source
          .indexBlob,
      portableCatalogSchema:
        CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1
          .schema
    },
    entries: ENTRIES
  });

export function captureComplexSkillMigrationEntriesV1() {
  return CAPTURE_COMPLEX_SKILL_MIGRATION_V1.entries;
}
