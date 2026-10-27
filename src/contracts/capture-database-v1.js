import {
  normalizeCaptureCreatureEditorDraftV3
} from "./capture-creature-editor-draft-v3.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "./capture-skill-editor-draft-v1.js";
import {
  normalizeCaptureActiveSkillLoadoutV1,
  captureActiveSkillIdsV1
} from "./capture-active-skill-loadout-v1.js";
import {
  normalizeCaptureStatRegistryV1
} from "./capture-stat-registry-v1.js";
import {
  normalizeCaptureCreatureStatValuesV1
} from "./capture-creature-stat-values-v1.js";
import {
  normalizeCaptureProgressionRulesV1
} from "./capture-progression-rules-v1.js";

export const CAPTURE_DATABASE_V1_SCHEMA =
  "capture-database-v1";

export const CAPTURE_DATABASE_V1_VERSION = 1;

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "version",
  "statRegistry",
  "progressionRules",
  "creatures",
  "skills",
  "metadata"
]);

const CREATURE_RECORD_FIELDS = new Set([
  "draft",
  "statValues",
  "loadout"
]);

function objectValue(
  value,
  field
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(
      field + " must be an object"
    );
  }
  return value;
}

function assertKnownFields(
  value,
  allowed,
  field
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        field +
          " contains unknown field: " +
          key
      );
    }
  }
}

function arrayValue(
  value,
  field
) {
  if (!Array.isArray(value)) {
    throw new TypeError(
      field + " must be an array"
    );
  }
  return value;
}

function assertUnique(
  items,
  field,
  idOf
) {
  const seen = new Set();
  for (const item of items) {
    const id = idOf(item);
    if (seen.has(id)) {
      throw new RangeError(
        "duplicate " +
          field +
          ": " +
          id
      );
    }
    seen.add(id);
  }
}

function normalizeJsonValue(
  value,
  field
) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    if (!Number.isFinite(value)) {
      throw new RangeError(
        field +
          " must contain only finite JSON numbers"
      );
    }
    return value;
  }

  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((entry,index)=>
        normalizeJsonValue(
          entry,
          field+"["+index+"]"
        )
      )
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const output={};
    for(const [key,entry] of Object.entries(value)){
      output[key]=normalizeJsonValue(
        entry,
        field+"."+key
      );
    }
    return Object.freeze(output);
  }

  throw new TypeError(
    field +
      " must be JSON-compatible"
  );
}

function normalizeCreatureRecord(
  raw,
  registry,
  index
) {
  const field=
    "creatures["+index+"]";
  const value=objectValue(
    raw,
    field
  );

  assertKnownFields(
    value,
    CREATURE_RECORD_FIELDS,
    field
  );

  const draft=
    normalizeCaptureCreatureEditorDraftV3(
      value.draft
    );
  const statValues=
    normalizeCaptureCreatureStatValuesV1(
      value.statValues,
      registry
    );
  const loadout=
    normalizeCaptureActiveSkillLoadoutV1(
      value.loadout
    );

  if (
    statValues.creatureId !== draft.id
  ) {
    throw new RangeError(
      field+
        ".statValues.creatureId must match draft.id"
    );
  }

  if (
    loadout.creatureId !== draft.id
  ) {
    throw new RangeError(
      field+
        ".loadout.creatureId must match draft.id"
    );
  }

  return Object.freeze({
    draft,
    statValues,
    loadout
  });
}

export function normalizeCaptureDatabaseV1(
  input
) {
  const value=objectValue(
    input,
    "CaptureDatabaseV1"
  );

  assertKnownFields(
    value,
    TOP_LEVEL_FIELDS,
    "CaptureDatabaseV1"
  );

  if (
    value.schema !==
    CAPTURE_DATABASE_V1_SCHEMA
  ) {
    throw new RangeError(
      "schema must be "+
        CAPTURE_DATABASE_V1_SCHEMA
    );
  }

  if (
    value.version !==
    CAPTURE_DATABASE_V1_VERSION
  ) {
    throw new RangeError(
      "version must be "+
        CAPTURE_DATABASE_V1_VERSION
    );
  }

  const statRegistry=
    normalizeCaptureStatRegistryV1(
      value.statRegistry
    );
  const progressionRules=
    normalizeCaptureProgressionRulesV1(
      value.progressionRules
    );

  const skills=Object.freeze(
    arrayValue(
      value.skills,
      "skills"
    ).map((entry)=>
      normalizeCaptureSkillEditorDraftV1(
        entry
      )
    )
  );

  assertUnique(
    skills,
    "skill id",
    (draft)=>draft.id
  );

  const creatures=Object.freeze(
    arrayValue(
      value.creatures,
      "creatures"
    ).map((entry,index)=>
      normalizeCreatureRecord(
        entry,
        statRegistry,
        index
      )
    )
  );

  assertUnique(
    creatures,
    "creature id",
    (record)=>record.draft.id
  );

  const skillIds=new Set(
    skills.map((draft)=>draft.id)
  );
  const creatureIds=new Set(
    creatures.map(
      (record)=>record.draft.id
    )
  );

  for(const record of creatures){
    const creatureId=
      record.draft.id;
    const linkedSkillIds=
      new Set(
        record.draft.skillIds
      );

    for(
      const skillId of
      record.draft.skillIds
    ){
      if(!skillIds.has(skillId)){
        throw new RangeError(
          "creature "+
            creatureId+
            " references unknown skill: "+
            skillId
        );
      }
    }

    for(
      const skillId of
      captureActiveSkillIdsV1(
        record.loadout
      )
    ){
      if(!skillIds.has(skillId)){
        throw new RangeError(
          "loadout for "+
            creatureId+
            " references unknown skill: "+
            skillId
        );
      }
      if(!linkedSkillIds.has(skillId)){
        throw new RangeError(
          "loadout skill "+
            skillId+
            " is not linked to creature "+
            creatureId
        );
      }
    }

    const evolutionTarget=
      record.draft.capture
        ?.evolution?.targetId ??
      null;

    if(
      evolutionTarget !== null &&
      !creatureIds.has(
        evolutionTarget
      )
    ){
      throw new RangeError(
        "creature "+
          creatureId+
          " evolution references unknown creature: "+
          evolutionTarget
      );
    }
  }

  const metadata=
    normalizeJsonValue(
      value.metadata ?? {},
      "metadata"
    );

  return Object.freeze({
    schema:
      CAPTURE_DATABASE_V1_SCHEMA,
    version:
      CAPTURE_DATABASE_V1_VERSION,
    statRegistry,
    progressionRules,
    creatures,
    skills,
    metadata
  });
}
