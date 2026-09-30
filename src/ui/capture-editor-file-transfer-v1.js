import {
  CAPTURE_DATABASE_V1_SCHEMA,
  CAPTURE_DATABASE_V1_VERSION,
  normalizeCaptureDatabaseV1
} from "../contracts/capture-database-v1.js";

function requireMap(value, field) {
  if (!(value instanceof Map)) {
    throw new TypeError(
      field + " must be a Map"
    );
  }
  return value;
}

function requirePlan(plan) {
  if (
    !plan ||
    typeof plan !== "object" ||
    Array.isArray(plan)
  ) {
    throw new TypeError(
      "plan must be an import plan"
    );
  }
  if (
    typeof plan.action !== "string" ||
    plan.action === ""
  ) {
    throw new TypeError(
      "plan.action must be a non-empty string"
    );
  }
  return plan;
}

export function buildCaptureEditorDatabaseV1({
  statRegistry,
  progressionRules,
  configuredCreatures,
  configuredSkills,
  metadata = {}
}) {
  const creatures =
    requireMap(
      configuredCreatures,
      "configuredCreatures"
    );
  const skills =
    requireMap(
      configuredSkills,
      "configuredSkills"
    );

  return normalizeCaptureDatabaseV1({
    schema:
      CAPTURE_DATABASE_V1_SCHEMA,
    version:
      CAPTURE_DATABASE_V1_VERSION,
    statRegistry,
    progressionRules,
    creatures: [
      ...creatures.values()
    ],
    skills: [
      ...skills.values()
    ],
    metadata
  });
}

export function applyCaptureTransferPlanToEditorStateV1({
  plan,
  configuredCreatures,
  configuredSkills,
  statRegistry,
  progressionRules
}) {
  const normalizedPlan =
    requirePlan(plan);
  const creatures =
    requireMap(
      configuredCreatures,
      "configuredCreatures"
    );
  const skills =
    requireMap(
      configuredSkills,
      "configuredSkills"
    );

  switch (normalizedPlan.action) {
    case "noop":
      return Object.freeze({
        action: "noop",
        statRegistry,
        progressionRules
      });

    case "insert-skill":
    case "replace-skill":
      skills.set(
        normalizedPlan.id,
        normalizedPlan.value
      );
      return Object.freeze({
        action: normalizedPlan.action,
        statRegistry,
        progressionRules
      });

    case "insert-creature":
    case "replace-creature":
      creatures.set(
        normalizedPlan.id,
        normalizedPlan.value
      );
      return Object.freeze({
        action: normalizedPlan.action,
        statRegistry,
        progressionRules
      });

    case "replace-database": {
      const database =
        normalizeCaptureDatabaseV1(
          normalizedPlan.value
        );

      const nextSkills =
        database.skills.map(
          (draft) => [
            draft.id,
            draft
          ]
        );
      const nextCreatures =
        database.creatures.map(
          (record) => [
            record.draft.id,
            record
          ]
        );

      skills.clear();
      for (
        const [id, draft] of
        nextSkills
      ) {
        skills.set(id, draft);
      }

      creatures.clear();
      for (
        const [id, record] of
        nextCreatures
      ) {
        creatures.set(id, record);
      }

      return Object.freeze({
        action: "replace-database",
        statRegistry:
          database.statRegistry,
        progressionRules:
          database.progressionRules
      });
    }

    default:
      throw new RangeError(
        "Unsupported editor import plan action: " +
          normalizedPlan.action
      );
  }
}
