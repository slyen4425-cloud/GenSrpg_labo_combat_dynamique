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
  if (!["create", "update", "rename"].includes(intent)) {
    throw new RangeError(
      "intent must be create, update or rename"
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


  if (intent === "rename") {
    const selected = nonEmptyId(
      selectedCreatureId,
      "selectedCreatureId"
    );
    if (!ids.has(selected)) {
      throw new RangeError(
        "La créature d'origine « " + selected + " » n'existe plus."
      );
    }
    if (id === selected) {
      throw new RangeError("Le nouvel identifiant est identique à l'ancien.");
    }
    if (exists) {
      throw new RangeError(
        "Identifiant déjà utilisé : « " + id + " ». Aucune créature n'a été écrasée."
      );
    }
    return Object.freeze({
      mode: "rename",
      id,
      previousId: selected
    });
  }

  return Object.freeze({
    mode: intent,
    id
  });
}

// Move the actual owned record; never create a second active authority.
// Also repair existing evolution links before changing the library Map.
export function renameCaptureCreatureInLibraryV1({
  configuredCreatures,
  previousId,
  record
}) {
  if (!(configuredCreatures instanceof Map)) {
    throw new TypeError("configuredCreatures must be a Map");
  }
  const oldId = nonEmptyId(previousId, "previousId");
  const newId = nonEmptyId(record?.draft?.id, "record.draft.id");
  resolveCaptureCreatureSaveModeV1({
    intent: "rename",
    draftId: newId,
    selectedCreatureId: oldId,
    configuredCreatureIds: [...configuredCreatures.keys()]
  });

  const updateEvolution = (draft) => {
    const evolution = draft.capture?.evolution;
    if (evolution?.targetId !== oldId) return draft;
    return {
      ...draft,
      capture: {
        ...draft.capture,
        evolution: { ...evolution, targetId: newId }
      }
    };
  };
  const replacement = {
    ...record,
    draft: updateEvolution({
      ...record.draft,
      presentation: record.draft.presentation == null
        ? null
        : {
            ...record.draft.presentation,
            id: "creature:" + newId,
            subjectId: newId
          }
    }),
    statValues: record.statValues == null
      ? null
      : { ...record.statValues, creatureId: newId },
    loadout: record.loadout == null
      ? null
      : { ...record.loadout, creatureId: newId }
  };
  const migrated = new Map();
  for (const [key, value] of configuredCreatures) {
    migrated.set(
      key === oldId ? newId : key,
      key === oldId
        ? replacement
        : {
            ...value,
            draft: updateEvolution(value.draft)
          }
    );
  }
  // Commit only after every identity and collision check has passed.
  configuredCreatures.clear();
  for (const [key, value] of migrated) {
    configuredCreatures.set(key, value);
  }
  return replacement;
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
