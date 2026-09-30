export const CAPTURE_CREATURE_CANONICAL_ALIASES_V1 =
  Object.freeze({
    crea_embercub: "crea_braiseau",
    crea_galewing: "crea_ailevent",
    crea_lumipup: "crea_lumilo",
    crea_nightfang: "crea_noctecroc",
    crea_rockhorn: "crea_rocorne",
    crea_sparkmoth: "crea_lucieclair",
    crea_miragecat: "crea_mirachat",
    crea_ashdrake: "crea_dracendre"
  });

const LEGACY_ALIAS_IDS = new Set(
  Object.keys(
    CAPTURE_CREATURE_CANONICAL_ALIASES_V1
  )
);

function requiredId(value, field) {
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

function normalizedDisplayName(record) {
  return requiredId(
    record?.name,
    "creature.name"
  )
    .toLocaleLowerCase("fr");
}

export function canonicalCaptureCreatureIdV1(
  creatureId
) {
  const id = requiredId(
    creatureId,
    "creatureId"
  );
  return (
    CAPTURE_CREATURE_CANONICAL_ALIASES_V1[
      id
    ] ?? id
  );
}

export function canonicalCaptureCreatureRecordsV1(
  records
) {
  if (!Array.isArray(records)) {
    throw new TypeError(
      "Capture creature source must be an array"
    );
  }

  const sourceById = new Map();
  for (
    let index = 0;
    index < records.length;
    index += 1
  ) {
    const record = records[index];
    if (
      !record ||
      typeof record !== "object" ||
      Array.isArray(record)
    ) {
      throw new TypeError(
        "Capture creature source[" +
          index +
          "] must be an object"
      );
    }

    const id = requiredId(
      record.id,
      "creature.id"
    );
    if (sourceById.has(id)) {
      throw new RangeError(
        "duplicate creature id: " + id
      );
    }
    sourceById.set(id, record);
  }

  for (
    const [
      legacyId,
      canonicalId
    ] of Object.entries(
      CAPTURE_CREATURE_CANONICAL_ALIASES_V1
    )
  ) {
    if (
      sourceById.has(legacyId) &&
      !sourceById.has(canonicalId)
    ) {
      throw new RangeError(
        "missing canonical creature alias target: " +
          canonicalId
      );
    }
  }

  const canonicalRecords =
    records.filter(
      (record) =>
        !LEGACY_ALIAS_IDS.has(
          record.id
        )
    );

  const nameOwner = new Map();
  for (
    const record of canonicalRecords
  ) {
    const normalizedName =
      normalizedDisplayName(record);
    const previousId =
      nameOwner.get(normalizedName);

    if (
      previousId !== undefined &&
      previousId !== record.id
    ) {
      throw new RangeError(
        "duplicate creature name in canonical catalog: " +
          record.name +
          " (" +
          previousId +
          ", " +
          record.id +
          ")"
      );
    }

    nameOwner.set(
      normalizedName,
      record.id
    );
  }

  return Object.freeze([
    ...canonicalRecords
  ]);
}
