import {
  CAPTURE_CREATURE_TRANSFER_V1_SCHEMA,
  normalizeCaptureCreatureTransferV1
} from "../../../contracts/capture-creature-transfer-v1.js";
import {
  CAPTURE_SKILL_TRANSFER_V1_SCHEMA,
  normalizeCaptureSkillTransferV1
} from "../../../contracts/capture-skill-transfer-v1.js";
import {
  CAPTURE_DATABASE_V1_SCHEMA,
  normalizeCaptureDatabaseV1
} from "../../../contracts/capture-database-v1.js";
import {
  canonicalCaptureCreatureIdV1
} from "../../../catalogs/capture-canonical-creature-catalog-v1.js";

function parseJson(jsonText) {
  if (typeof jsonText !== "string") {
    throw new TypeError(
      "Capture transfer JSON input must be a string"
    );
  }

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new SyntaxError(
      "Invalid Capture transfer JSON: " +
        error.message
    );
  }
}

function stableJson(value) {
  return JSON.stringify(value);
}

function canonicalizedEvolution(
  capture
) {
  const evolution =
    capture?.evolution ?? null;

  if (evolution === null) {
    return capture;
  }

  return {
    ...capture,
    evolution: {
      ...evolution,
      targetId:
        canonicalCaptureCreatureIdV1(
          evolution.targetId
        )
    }
  };
}

function canonicalizeCreatureRecordInput(
  rawRecord
) {
  if (
    !rawRecord ||
    typeof rawRecord !== "object" ||
    Array.isArray(rawRecord)
  ) {
    return rawRecord;
  }

  const rawDraft =
    rawRecord.draft;

  if (
    !rawDraft ||
    typeof rawDraft !== "object" ||
    Array.isArray(rawDraft)
  ) {
    return rawRecord;
  }

  const rawId =
    rawDraft.id;

  if (
    typeof rawId !== "string" ||
    rawId.trim() === ""
  ) {
    return rawRecord;
  }

  const canonicalId =
    canonicalCaptureCreatureIdV1(
      rawId
    );

  const presentation =
    rawDraft.presentation == null
      ? rawDraft.presentation
      : {
          ...rawDraft.presentation,
          subjectId: canonicalId
        };

  return {
    ...rawRecord,
    draft: {
      ...rawDraft,
      id: canonicalId,
      capture:
        canonicalizedEvolution(
          rawDraft.capture
        ),
      presentation
    },
    statValues:
      rawRecord.statValues == null
        ? rawRecord.statValues
        : {
            ...rawRecord.statValues,
            creatureId: canonicalId
          },
    loadout:
      rawRecord.loadout == null
        ? rawRecord.loadout
        : {
            ...rawRecord.loadout,
            creatureId: canonicalId
          }
  };
}

function canonicalizeDatabaseInput(
  raw
) {
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw) ||
    !Array.isArray(raw.creatures)
  ) {
    return raw;
  }

  return {
    ...raw,
    creatures:
      raw.creatures.map(
        canonicalizeCreatureRecordInput
      )
  };
}

function requireStatRegistry(
  statRegistry
) {
  if (statRegistry == null) {
    throw new TypeError(
      "statRegistry is required for creature transfer import"
    );
  }
  return statRegistry;
}

export function exportCaptureCreatureTransferJsonV1(
  record,
  {
    statRegistry
  } = {}
) {
  const value =
    normalizeCaptureCreatureTransferV1(
      {
        schema:
          CAPTURE_CREATURE_TRANSFER_V1_SCHEMA,
        version: 1,
        draft: record?.draft,
        statValues:
          record?.statValues,
        loadout:
          record?.loadout
      },
      requireStatRegistry(
        statRegistry
      )
    );

  return JSON.stringify(
    value,
    null,
    2
  );
}

export function exportCaptureSkillTransferJsonV1(
  draft
) {
  const value =
    normalizeCaptureSkillTransferV1({
      schema:
        CAPTURE_SKILL_TRANSFER_V1_SCHEMA,
      version: 1,
      draft
    });

  return JSON.stringify(
    value,
    null,
    2
  );
}

export function importCaptureTransferJsonV1(
  jsonText,
  {
    statRegistry = null
  } = {}
) {
  const raw = parseJson(
    jsonText
  );
  const schema =
    raw?.schema;

  if (
    schema ===
    CAPTURE_CREATURE_TRANSFER_V1_SCHEMA
  ) {
    const canonical =
      canonicalizeCreatureRecordInput(
        raw
      );

    return Object.freeze({
      kind: "creature",
      value:
        normalizeCaptureCreatureTransferV1(
          canonical,
          requireStatRegistry(
            statRegistry
          )
        )
    });
  }

  if (
    schema ===
    CAPTURE_SKILL_TRANSFER_V1_SCHEMA
  ) {
    return Object.freeze({
      kind: "skill",
      value:
        normalizeCaptureSkillTransferV1(
          raw
        )
    });
  }

  if (
    schema ===
    CAPTURE_DATABASE_V1_SCHEMA
  ) {
    return Object.freeze({
      kind: "database",
      value:
        normalizeCaptureDatabaseV1(
          canonicalizeDatabaseInput(
            raw
          )
        )
    });
  }

  throw new RangeError(
    "Unsupported Capture transfer schema: " +
      String(schema ?? "")
  );
}

function assertMode(mode) {
  if (
    mode !== "reject" &&
    mode !== "replace"
  ) {
    throw new RangeError(
      "Capture import mode must be reject or replace"
    );
  }
}

function conflictOrReplace({
  mode,
  kind,
  id,
  current,
  incoming
}) {
  if (
    stableJson(current) ===
    stableJson(incoming)
  ) {
    return Object.freeze({
      action: "noop",
      kind,
      id,
      value: incoming
    });
  }

  if (mode === "reject") {
    throw new RangeError(
      "Capture import conflict for existing " +
        kind +
        ": " +
        id
    );
  }

  return Object.freeze({
    action:
      "replace-" + kind,
    kind,
    id,
    value: incoming
  });
}

function validateCreatureReferences(
  currentDatabase,
  record
) {
  const skillIds =
    new Set(
      currentDatabase.skills.map(
        (draft) => draft.id
      )
    );

  for (
    const skillId of
    record.draft.skillIds
  ) {
    if (!skillIds.has(skillId)) {
      throw new RangeError(
        "Imported creature references unknown skill: " +
          skillId
      );
    }
  }

  for (
    const slot of
    record.loadout.slots
  ) {
    if (
      slot.skillId !== null &&
      !skillIds.has(
        slot.skillId
      )
    ) {
      throw new RangeError(
        "Imported creature loadout references unknown skill: " +
          slot.skillId
      );
    }
  }

  const evolutionTarget =
    record.draft.capture
      ?.evolution?.targetId ??
    null;

  if (
    evolutionTarget !== null &&
    evolutionTarget !==
      record.draft.id &&
    !currentDatabase.creatures.some(
      (entry) =>
        entry.draft.id ===
        evolutionTarget
    )
  ) {
    throw new RangeError(
      "Imported creature evolution references unknown creature: " +
        evolutionTarget
    );
  }
}

export function planCaptureTransferImportV1({
  currentDatabase,
  transfer,
  mode = "reject"
}) {
  assertMode(mode);

  const current =
    normalizeCaptureDatabaseV1(
      currentDatabase
    );

  if (
    !transfer ||
    typeof transfer !== "object" ||
    Array.isArray(transfer)
  ) {
    throw new TypeError(
      "transfer must be an imported Capture transfer"
    );
  }

  if (
    transfer.kind === "skill"
  ) {
    const incoming =
      transfer.value.draft;
    const existing =
      current.skills.find(
        (draft) =>
          draft.id === incoming.id
      ) ?? null;

    if (existing === null) {
      return Object.freeze({
        action: "insert-skill",
        kind: "skill",
        id: incoming.id,
        value: incoming
      });
    }

    return conflictOrReplace({
      mode,
      kind: "skill",
      id: incoming.id,
      current: existing,
      incoming
    });
  }

  if (
    transfer.kind === "creature"
  ) {
    const incoming =
      Object.freeze({
        draft:
          transfer.value.draft,
        statValues:
          transfer.value.statValues,
        loadout:
          transfer.value.loadout
      });

    validateCreatureReferences(
      current,
      incoming
    );

    const existing =
      current.creatures.find(
        (record) =>
          record.draft.id ===
          incoming.draft.id
      ) ?? null;

    if (existing === null) {
      return Object.freeze({
        action: "insert-creature",
        kind: "creature",
        id: incoming.draft.id,
        value: incoming
      });
    }

    return conflictOrReplace({
      mode,
      kind: "creature",
      id: incoming.draft.id,
      current: existing,
      incoming
    });
  }

  if (
    transfer.kind === "database"
  ) {
    if (
      stableJson(current) ===
      stableJson(transfer.value)
    ) {
      return Object.freeze({
        action: "noop",
        kind: "database",
        id: null,
        value: transfer.value
      });
    }

    if (mode === "reject") {
      throw new RangeError(
        "Capture import conflict for existing database"
      );
    }

    return Object.freeze({
      action: "replace-database",
      kind: "database",
      id: null,
      value: transfer.value
    });
  }

  throw new RangeError(
    "Unsupported Capture transfer kind: " +
      String(transfer.kind ?? "")
  );
}
