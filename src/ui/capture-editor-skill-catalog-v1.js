import {
  CAPTURE_USED_ABILITY_CATALOG_V2,
  captureUsedAbilityTemplateV2
} from "../catalogs/capture-used-ability-catalog-v2.js";

const ABILITY_BY_ID = new Map(
  CAPTURE_USED_ABILITY_CATALOG_V2.abilities.map(
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
    CAPTURE_USED_ABILITY_CATALOG_V2.abilities.map(
      (ability) => {
        const template =
          captureUsedAbilityTemplateV2(ability);

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
    captureUsedAbilityTemplateV2(ability);
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
      : "Cette capacité contient un buff, debuff, DoT ou HoT historique. StatusEffectV1 est requis avant équivalence runtime complète.",
    template,
    legacyStatusEffects:
      template.legacyStatusEffects
  });
}

function portableTargetScopeV1(effect) {
  if (effect.target === "zone") {
    return "all_enemies";
  }
  if (effect.target === "self") {
    return "self";
  }
  if (
    effect.target == null ||
    effect.target === "enemy"
  ) {
    return effect.kind === "heal"
      ? "self"
      : "target";
  }
  return "target";
}

export function capturePortableLegacyTacticalEffectsV1(
  abilityId
) {
  const ability = abilityById(abilityId);
  const state =
    captureLegacyAbilityEditorStateV1(
      abilityId
    );

  if (!state.runtimeReady) {
    return null;
  }

  return Object.freeze(
    ability.effects.map((effect) => {
      if (effect.kind === "damage") {
        return Object.freeze({
          kind: "damage",
          targetScope:
            portableTargetScopeV1(effect),
          amount: Number(effect.base ?? 0),
          channel:
            effect.element ||
            ability.element ||
            null
        });
      }

      if (effect.kind === "heal") {
        return Object.freeze({
          kind: "heal",
          targetScope:
            portableTargetScopeV1(effect),
          amount: Number(effect.base ?? 0)
        });
      }

      throw new RangeError(
        "portable historical ability contains unsupported effect: " +
          effect.kind
      );
    })
  );
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

  const {
    damage: _legacyDamage,
    heal: _legacyHeal,
    stunMs: _legacyStunMs,
    targetRelations: _legacyTargetRelations,
    allowedDistances: _legacyAllowedDistances,
    ...retainedFields
  } = currentFields;

  return {
    ...retainedFields,
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    element: template.element,
    requiredLevel:
      template.requiredLevel,
    effects:
      state.runtimeReady
        ? capturePortableLegacyTacticalEffectsV1(
            abilityId
          )
        : currentFields.effects
  };
}
