import {
  CAPTURE_LEGACY_ABILITY_CATALOG_V1,
  captureLegacyAbilityTemplateV1
} from "../catalogs/capture-legacy-ability-catalog-v1.js";

const ABILITY_BY_ID = new Map(
  CAPTURE_LEGACY_ABILITY_CATALOG_V1.abilities.map(
    (ability) => [ability.id, ability]
  )
);

function abilityById(id) {
  const ability = ABILITY_BY_ID.get(id);
  if (!ability) {
    throw new RangeError(
      "unknown historical ability: " + id
    );
  }
  return ability;
}

export function captureLegacySkillLibraryEntriesV1() {
  return Object.freeze(
    CAPTURE_LEGACY_ABILITY_CATALOG_V1.abilities.map(
      (ability) => {
        const template =
          captureLegacyAbilityTemplateV1(ability);

        return Object.freeze({
          id: ability.id,
          name: ability.name,
          element:
            ability.element === ""
              ? null
              : ability.element,
          requiredLevel: ability.requiredLevel,
          migrationState:
            template.migrationState
        });
      }
    )
  );
}

export function captureLegacyAbilityEditorStateV1(id) {
  const ability = abilityById(id);
  const template =
    captureLegacyAbilityTemplateV1(ability);
  const runtimeReady =
    template.migrationState ===
    "portable-basic-effects";

  return Object.freeze({
    id: ability.id,
    migrationState:
      template.migrationState,
    runtimeReady,
    message: runtimeReady
      ? "Modèle historique compatible avec les effets de base. Configure explicitement style, coût et timings avant enregistrement."
      : "Cette capacité contient un buff, debuff ou DoT historique. StatusEffectV1 est requis avant équivalence runtime complète.",
    template,
    legacyStatusEffects:
      template.legacyStatusEffects
  });
}

export function mergeCaptureLegacyAbilityTemplateIntoEditorFieldsV1(
  currentFields,
  abilityId
) {
  if (
    !currentFields ||
    typeof currentFields !== "object" ||
    Array.isArray(currentFields)
  ) {
    throw new TypeError(
      "currentFields must be an object"
    );
  }

  const state =
    captureLegacyAbilityEditorStateV1(
      abilityId
    );
  const template = state.template;

  return {
    ...currentFields,
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    element: template.element,
    requiredLevel:
      template.requiredLevel,
    damage: template.effect.damage,
    heal: template.effect.heal
  };
}
