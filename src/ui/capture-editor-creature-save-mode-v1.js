function nonEmptyId(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(
      field + " must be a non-empty creature id"
    );
  }
  return value.trim();
}

export function resolveCaptureCreatureSaveModeV1({
  intent,
  draftId,
  selectedCreatureId = null,
  configuredCreatureIds = []
}) {
  if (!["create", "update"].includes(intent)) {
    throw new RangeError(
      "intent must be create or update"
    );
  }

  const id = nonEmptyId(draftId, "draftId");
  const ids = new Set(
    Array.isArray(configuredCreatureIds)
      ? configuredCreatureIds.map((value) =>
          nonEmptyId(
            value,
            "configuredCreatureIds"
          )
        )
      : []
  );
  const exists = ids.has(id);

  if (intent === "create" && exists) {
    throw new RangeError(
      "La créature « " +
        id +
        " » existe déjà. Utilise « Mettre à jour » ou choisis un nouvel identifiant."
    );
  }

  if (intent === "update") {
    if (!exists) {
      throw new RangeError(
        "La créature « " +
          id +
          " » n’existe pas encore. Utilise « Créer »."
      );
    }

    const selected = nonEmptyId(
      selectedCreatureId,
      "selectedCreatureId"
    );
    if (selected !== id) {
      throw new RangeError(
        "L’identité saisie ne correspond pas à la créature sélectionnée. Charge la bonne créature ou utilise « Enregistrer comme nouvelle »."
      );
    }
  }

  return Object.freeze({
    mode: intent,
    id
  });
}

export function nextCaptureCreatureDraftIdV1({
  configuredCreatureIds = [],
  baseId = "nouvelle-creature"
} = {}) {
  const base = nonEmptyId(baseId, "baseId");
  const ids = new Set(
    Array.isArray(configuredCreatureIds)
      ? configuredCreatureIds.map((value) =>
          nonEmptyId(
            value,
            "configuredCreatureIds"
          )
        )
      : []
  );

  if (!ids.has(base)) {
    return base;
  }

  let suffix = 2;
  while (ids.has(base + "-" + suffix)) {
    suffix += 1;
  }

  return base + "-" + suffix;
}
