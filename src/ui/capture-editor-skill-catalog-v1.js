import {
  CAPTURE_USED_ABILITY_CATALOG_V2,
  captureUsedAbilityTemplateV2
} from "../catalogs/capture-used-ability-catalog-v2.js";
import {
  captureComplexSkillMigrationEntriesV1
} from "../adapters/input/capture/capture-complex-skill-migration-v1.js";

const ABILITY_BY_ID = new Map(
  CAPTURE_USED_ABILITY_CATALOG_V2.abilities.map(
    (ability) => [ability.id, ability]
  )
);

const COMPLEX_MIGRATION_BY_ID = new Map(
  captureComplexSkillMigrationEntriesV1().map(
    (entry) => [entry.id, entry]
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
  const complexMigration =
    COMPLEX_MIGRATION_BY_ID.get(
      ability.id
    ) ?? null;
  const portableReady =
    template.migrationState ===
    "portable-basic-effects";
  const complexReady =
    complexMigration?.migrationState ===
    "runtime-ready";
  const runtimeReady =
    portableReady || complexReady;

  return Object.freeze({
    id: ability.id,
    migrationState:
      complexReady
        ? "runtime-ready-complex"
        : template.migrationState,
    runtimeReady,
    message:
      complexReady
        ? "Capacité complexe migrée vers les effets tactiques natifs. La bibliothèque historique reste un modèle ; la version native complète est déjà disponible dans les capacités configurées."
        : portableReady
          ? "Modèle historique compatible avec les effets de base. Configure explicitement style, coût et timings avant enregistrement."
          : "Modèle historique non migré vers une capacité native complète.",
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
