import {
  normalizeCaptureDatabaseV1
} from "../../../contracts/capture-database-v1.js";

function valuesOf(
  collection,
  field
) {
  if (
    collection instanceof Map
  ) {
    return [
      ...collection.values()
    ];
  }

  if (
    Array.isArray(collection)
  ) {
    return [
      ...collection
    ];
  }

  if (
    collection &&
    typeof collection[Symbol.iterator] ===
      "function"
  ) {
    return [
      ...collection
    ];
  }

  throw new TypeError(
    field +
      " must be a Map or iterable"
  );
}

export function captureDatabaseFromEditorStateV1({
  configuredCreatures,
  configuredSkills,
  statRegistry,
  progressionRules,
  metadata = {}
}) {
  return normalizeCaptureDatabaseV1({
    schema: "capture-database-v1",
    version: 1,
    statRegistry,
    progressionRules,
    creatures:
      valuesOf(
        configuredCreatures,
        "configuredCreatures"
      ),
    skills:
      valuesOf(
        configuredSkills,
        "configuredSkills"
      ),
    metadata
  });
}

function copyState(state) {
  if (
    !state ||
    typeof state !== "object" ||
    Array.isArray(state)
  ) {
    throw new TypeError(
      "editor database state must be an object"
    );
  }

  if (
    !(state.configuredCreatures instanceof Map) ||
    !(state.configuredSkills instanceof Map)
  ) {
    throw new TypeError(
      "editor database state requires configured creature and skill Maps"
    );
  }

  return {
    configuredCreatures:
      new Map(
        state.configuredCreatures
      ),
    configuredSkills:
      new Map(
        state.configuredSkills
      ),
    statRegistry:
      state.statRegistry,
    progressionRules:
      state.progressionRules
  };
}

export function applyCaptureImportPlanToEditorStateV1({
  state,
  plan
}) {
  const next = copyState(
    state
  );

  if (
    !plan ||
    typeof plan !== "object" ||
    Array.isArray(plan)
  ) {
    throw new TypeError(
      "Capture import plan must be an object"
    );
  }

  switch (plan.action) {
    case "noop":
      return Object.freeze(next);

    case "insert-skill":
    case "replace-skill":
      next.configuredSkills.set(
        plan.id,
        plan.value
      );
      return Object.freeze(next);

    case "insert-creature":
    case "replace-creature":
      next.configuredCreatures.set(
        plan.id,
        plan.value
      );
      return Object.freeze(next);

    case "replace-database": {
      const database =
        normalizeCaptureDatabaseV1(
          plan.value
        );

      return Object.freeze({
        configuredCreatures:
          new Map(
            database.creatures.map(
              (record) => [
                record.draft.id,
                record
              ]
            )
          ),
        configuredSkills:
          new Map(
            database.skills.map(
              (draft) => [
                draft.id,
                draft
              ]
            )
          ),
        statRegistry:
          database.statRegistry,
        progressionRules:
          database.progressionRules
      });
    }

    default:
      throw new RangeError(
        "Unsupported Capture import plan action: " +
          String(plan.action ?? "")
      );
  }
}
