import {
  CAPTURE_USED_ABILITY_CATALOG_V2
} from "./capture-used-ability-catalog-v2.js";
import {
  CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1
} from "./capture-portable-native-skill-catalog-v1.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../contracts/capture-skill-editor-draft-v1.js";
import {
  captureComplexSkillMigrationEntriesV1
} from "../adapters/input/capture/capture-complex-skill-migration-v1.js";

export const CAPTURE_COMPLEX_NATIVE_SKILL_CATALOG_V1_SCHEMA =
  "capture-complex-native-skill-catalog-v1";

const MODERN_CATEGORY_BY_LEGACY =
  Object.freeze({
    heal: "heal",
    defense: "defensive",
    control: "buff_debuff",
    utility: "buff_debuff",
    melee: "offensive",
    spell: "offensive",
    ranged: "offensive"
  });

const ABILITY_BY_ID = new Map(
  CAPTURE_USED_ABILITY_CATALOG_V2.abilities.map(
    (ability) => [ability.id, ability]
  )
);

function movementPolicy(
  ability,
  tacticalEffects
) {
  const scopes = tacticalEffects.map(
    (effect) => effect.targetScope
  );

  if (
    scopes.some(
      (scope) =>
        scope === "all_enemies" ||
        scope === "all_allies" ||
        scope === "all_except_self"
    )
  ) {
    return Object.freeze({
      form: "area",
      approachMode: "none"
    });
  }

  if (
    scopes.length > 0 &&
    scopes.every((scope) => scope === "self")
  ) {
    return Object.freeze({
      form: "self",
      approachMode: "none"
    });
  }

  if (ability.category === "melee") {
    return Object.freeze({
      form: "contact",
      approachMode: "ground"
    });
  }

  return Object.freeze({
    form: "projectile",
    approachMode: "none"
  });
}

function targetRelationsFor(
  ability,
  tacticalEffects
) {
  const scopes = tacticalEffects.map(
    (effect) => effect.targetScope
  );

  if (
    scopes.length > 0 &&
    scopes.every((scope) => scope === "self")
  ) {
    return ["self"];
  }

  const explicitTargets = ability.effects
    .map((effect) => effect.target)
    .filter(
      (target) =>
        typeof target === "string" &&
        target !== ""
    );

  if (
    explicitTargets.some(
      (target) =>
        target === "ally" ||
        target === "all_allies"
    )
  ) {
    return ["ally"];
  }

  return ["enemy"];
}

function draftFromMigration(entry) {
  const ability = ABILITY_BY_ID.get(
    entry.sourceId
  );
  if (!ability) {
    throw new RangeError(
      "unknown complex source ability: " +
        entry.sourceId
    );
  }
  if (
    entry.migrationState !== "runtime-ready" ||
    !Array.isArray(entry.tacticalEffects)
  ) {
    throw new RangeError(
      "complex ability is not runtime-ready: " +
        entry.id
    );
  }

  const category =
    MODERN_CATEGORY_BY_LEGACY[
      ability.category
    ];
  if (!category) {
    throw new RangeError(
      "unsupported complex legacy category: " +
        ability.category
    );
  }

  const movement = movementPolicy(
    ability,
    entry.tacticalEffects
  );

  return normalizeCaptureSkillEditorDraftV1({
    schema: "capture-skill-editor-draft-v1",
    id: ability.id,
    description: ability.desc,
    requiredLevel: ability.requiredLevel,
    usageScopes: ["capture", "combat"],
    definition: {
      id: ability.id,
      name: ability.name,
      category,
      form: movement.form,
      element:
        ability.element === ""
          ? null
          : ability.element,
      approachMode: movement.approachMode,
      energyCost: Number(
        ability.activeMeta?.manaCost ?? 0
      ),
      preparationMs: 0,
      travelMs: 0,
      recoveryMs: 0,
      cooldownMs: 0,
      allowedDistances: [
        "short",
        "medium",
        "long"
      ],
      targetRelations:
        targetRelationsFor(
          ability,
          entry.tacticalEffects
        ),
      effect: {
        damage: 0,
        heal: 0,
        tags: []
      },
      effects: entry.tacticalEffects
    },
    presentation: null
  });
}

const ENTRIES = Object.freeze(
  captureComplexSkillMigrationEntriesV1().map(
    (migration) =>
      Object.freeze({
        id: migration.id,
        sourceId: migration.sourceId,
        migrationState:
          "native-complex-effects",
        legacyEffects:
          migration.legacyEffects,
        tacticalEffects:
          migration.tacticalEffects,
        draft:
          draftFromMigration(migration)
      })
  )
);

export const CAPTURE_COMPLEX_NATIVE_SKILL_CATALOG_V1 =
  Object.freeze({
    schema:
      CAPTURE_COMPLEX_NATIVE_SKILL_CATALOG_V1_SCHEMA,
    source: Object.freeze({
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
      migrationSchema:
        "capture-complex-skill-migration-v1",
      portableCatalogSchema:
        CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1
          .schema,
      formPolicy:
        "explicit-scope-category-neutral-form-v1",
      timingPolicy:
        "neutral-dynamic-timing-v1"
    }),
    entries: ENTRIES
  });

export function captureComplexNativeSkillDraftsV1() {
  return Object.freeze(
    CAPTURE_COMPLEX_NATIVE_SKILL_CATALOG_V1.entries.map(
      (entry) => entry.draft
    )
  );
}
