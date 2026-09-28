function nonEmptyId(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(field + " must be a non-empty skill id");
  }
  return value.trim();
}

export function resolveCaptureSkillSaveModeV1({
  intent,
  draftId,
  configuredSkillIds = []
}) {
  if (!["create", "update"].includes(intent)) {
    throw new RangeError("intent must be create or update");
  }

  const id = nonEmptyId(draftId, "draftId");
  const ids = new Set(
    Array.isArray(configuredSkillIds)
      ? configuredSkillIds.map((value) =>
          nonEmptyId(value, "configuredSkillIds")
        )
      : []
  );
  const exists = ids.has(id);

  if (intent === "create" && exists) {
    throw new RangeError(
      "La capacité « " + id + " » existe déjà. Utilise « Mettre à jour » ou choisis un nouvel identifiant."
    );
  }

  if (intent === "update" && !exists) {
    throw new RangeError(
      "La capacité « " + id + " » n’existe pas encore. Utilise « Créer »."
    );
  }

  return Object.freeze({
    mode: intent,
    id
  });
}
