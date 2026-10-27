import {
  CAPTURE_USED_ABILITY_CATALOG_V2
} from "./capture-used-ability-catalog-v2.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../contracts/capture-skill-editor-draft-v1.js";

export const CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1_SCHEMA =
  "capture-portable-native-skill-catalog-v1";

const FORM_BY_CATEGORY = Object.freeze({
  melee: Object.freeze({
    form: "contact",
    approachMode: "ground"
  }),
  ranged: Object.freeze({
    form: "projectile",
    approachMode: "none"
  }),
  spell: Object.freeze({
    form: "projectile",
    approachMode: "none"
  })
});

function isRuntimeEquivalentDamageAbility(ability) {
  if (!Array.isArray(ability?.effects) || ability.effects.length === 0) {
    return false;
  }

  return ability.effects.every((effect) =>
    effect?.kind === "damage" &&
    (effect.target == null || effect.target === "enemy")
  );
}

function damageTotal(ability) {
  return ability.effects.reduce(
    (sum, effect) => sum + Number(effect.base ?? 0),
    0
  );
}

function draftFromAbility(ability) {
  const movement = FORM_BY_CATEGORY[ability.category];
  if (!movement) {
    throw new RangeError(
      "unsupported runtime-equivalent legacy category: " +
        ability.category
    );
  }

  return normalizeCaptureSkillEditorDraftV1({
    schema: "capture-skill-editor-draft-v1",
    id: ability.id,
    description: ability.desc,
    requiredLevel: ability.requiredLevel,
    usageScopes: ["capture", "combat"],
    definition: {
      id: ability.id,
      name: ability.name,
      category: "offensive",
      form: movement.form,
      element:
        ability.element === ""
          ? null
          : ability.element,
      approachMode: movement.approachMode,
      energyCost: Number(ability.activeMeta?.manaCost ?? 0),
      preparationMs: 0,
      travelMs: 0,
      recoveryMs: 0,
      cooldownMs: 0,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      effect: {
        damage: damageTotal(ability)
      }
    },
    presentation: null
  });
}

const SOURCE_ABILITIES =
  CAPTURE_USED_ABILITY_CATALOG_V2.abilities.filter(
    isRuntimeEquivalentDamageAbility
  );

export const CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1 =
  Object.freeze({
    schema:
      CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1_SCHEMA,
    source: Object.freeze({
      catalogSchema:
        CAPTURE_USED_ABILITY_CATALOG_V2.schema,
      sourceId:
        CAPTURE_USED_ABILITY_CATALOG_V2.source.sourceId,
      commit:
        CAPTURE_USED_ABILITY_CATALOG_V2.source.commit,
      indexBlob:
        CAPTURE_USED_ABILITY_CATALOG_V2.source.indexBlob,
      migrationPolicy:
        "damage-only-enemy-target-neutral-dynamic-timing-v1"
    }),
    entries: Object.freeze(
      SOURCE_ABILITIES.map((ability) =>
        Object.freeze({
          id: ability.id,
          sourceId: ability.id,
          migrationState: "portable-basic-effects",
          legacyEffects: ability.effects,
          draft: draftFromAbility(ability)
        })
      )
    )
  });

export function capturePortableNativeSkillDraftsV1() {
  return Object.freeze(
    CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1.entries.map(
      (entry) => entry.draft
    )
  );
}
