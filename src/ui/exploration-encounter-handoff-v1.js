import {
  normalizeCaptureEncounterSnapshotV1
} from "../contracts/capture-encounter-snapshot-v1.js";
import {
  createCaptureCombatResultV1
} from "../contracts/capture-combat-result-v1.js";

export const EXPLORATION_COMBAT_HANDOFF_KEY =
  "gensrpg.capture.combat-handoff.v1";

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

function rawEnvelope(storage) {
  const text = storage.getItem(
    EXPLORATION_COMBAT_HANDOFF_KEY
  );

  if (!text) {
    throw new Error(
      "Exploration combat handoff is missing"
    );
  }

  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SyntaxError(
      "Exploration combat handoff is invalid JSON"
    );
  }

  if (
    !raw ||
    typeof raw !== "object" ||
    raw.version !== 1
  ) {
    throw new RangeError(
      "unsupported Exploration combat handoff version"
    );
  }

  return raw;
}

export function readExplorationCombatHandoffV1(
  storage
) {
  const raw = rawEnvelope(storage);
  const snapshot =
    normalizeCaptureEncounterSnapshotV1(
      raw.snapshot
    );
  const returnUrl = requiredText(
    raw.returnState?.returnUrl,
    "returnState.returnUrl"
  );

  return Object.freeze({
    snapshot,
    returnUrl
  });
}

export function completeExplorationCombatHandoffV1({
  storage,
  outcome
}) {
  const raw = rawEnvelope(storage);
  const snapshot =
    normalizeCaptureEncounterSnapshotV1(
      raw.snapshot
    );
  const returnUrl = requiredText(
    raw.returnState?.returnUrl,
    "returnState.returnUrl"
  );

  const result =
    createCaptureCombatResultV1({
      encounterId:
        snapshot.encounterId,
      returnToken:
        snapshot.returnToken,
      outcome
    });

  storage.setItem(
    EXPLORATION_COMBAT_HANDOFF_KEY,
    JSON.stringify({
      ...raw,
      result
    })
  );

  return Object.freeze({
    result,
    returnUrl
  });
}
