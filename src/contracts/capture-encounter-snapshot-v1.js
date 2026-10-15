export const CAPTURE_ENCOUNTER_SNAPSHOT_SCHEMA =
  "capture-encounter-snapshot-v1";

function requiredText(value, field) {
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

export function normalizeCaptureEncounterSnapshotV1(
  input
) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new TypeError(
      "CaptureEncounterSnapshotV1 must be an object"
    );
  }

  if (
    input.schema !==
      CAPTURE_ENCOUNTER_SNAPSHOT_SCHEMA ||
    input.version !== 1
  ) {
    throw new RangeError(
      "unsupported CaptureEncounterSnapshot version"
    );
  }

  if (
    !Array.isArray(input.opponents) ||
    input.opponents.length !== 1
  ) {
    throw new RangeError(
      "CaptureEncounterSnapshot v1 requires exactly one opponent"
    );
  }

  return Object.freeze({
    schema:
      CAPTURE_ENCOUNTER_SNAPSHOT_SCHEMA,
    version: 1,
    encounterId: requiredText(
      input.encounterId,
      "encounterId"
    ),
    source: requiredText(
      input.source,
      "source"
    ),
    player: Object.freeze({
      partyRef: requiredText(
        input.player?.partyRef,
        "player.partyRef"
      )
    }),
    opponents: Object.freeze([
      Object.freeze({
        creatureId: requiredText(
          input.opponents[0]?.creatureId,
          "opponents[0].creatureId"
        )
      })
    ]),
    rules: Object.freeze({
      rulesetId: requiredText(
        input.rules?.rulesetId,
        "rules.rulesetId"
      )
    }),
    context: Object.freeze({
      areaId: requiredText(
        input.context?.areaId,
        "context.areaId"
      ),
      terrainFamilyId: requiredText(
        input.context?.terrainFamilyId,
        "context.terrainFamilyId"
      ),
      elementId: requiredText(
        input.context?.elementId,
        "context.elementId"
      )
    }),
    returnToken: requiredText(
      input.returnToken,
      "returnToken"
    )
  });
}
