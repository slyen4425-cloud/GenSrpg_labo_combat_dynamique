function messageOf(reason) {
  if (reason instanceof Error) {
    return reason.message;
  }
  return String(reason ?? "Erreur inconnue");
}

function optionalResult(settled, fallback, label) {
  if (settled.status === "fulfilled") {
    return Object.freeze({
      value: settled.value,
      available: true,
      warning: null
    });
  }

  return Object.freeze({
    value: fallback,
    available: false,
    warning:
      label + " : " +
      messageOf(settled.reason)
  });
}

export async function settleCaptureEditorStartupDependenciesV1({
  assetCatalogPromise,
  privateAudioCatalogPromise,
  nativeSkillsPromise,
  captureDataPromise,
  progressionRulesPromise,
  creatureVisualMetaPromise
}) {
  const [
    assetCatalogResult,
    privateAudioCatalogResult,
    nativeSkillsResult,
    captureDataResult,
    progressionRulesResult,
    creatureVisualMetaResult
  ] = await Promise.allSettled([
    assetCatalogPromise,
    privateAudioCatalogPromise,
    nativeSkillsPromise,
    captureDataPromise,
    progressionRulesPromise,
    creatureVisualMetaPromise
  ]);

  for (const [label, result] of [
    ["Bibliothèque de capacités", nativeSkillsResult],
    ["Catalogue de créatures", captureDataResult],
    ["Règles de progression", progressionRulesResult]
  ]) {
    if (result.status === "rejected") {
      const reason = result.reason;
      if (reason instanceof Error) {
        throw reason;
      }
      throw new Error(
        label + " indisponible : " +
          messageOf(reason)
      );
    }
  }

  const assetCatalog =
    optionalResult(
      assetCatalogResult,
      Object.freeze({ assets: Object.freeze([]) }),
      "Catalogue visuel"
    );
  const privateAudioCatalog =
    optionalResult(
      privateAudioCatalogResult,
      Object.freeze({ entries: Object.freeze([]) }),
      "Catalogue audio"
    );
  const creatureVisualMeta =
    optionalResult(
      creatureVisualMetaResult,
      Object.freeze({}),
      "Métadonnées visuelles des créatures"
    );

  const warnings = [
    assetCatalog.warning,
    privateAudioCatalog.warning,
    creatureVisualMeta.warning
  ].filter(Boolean);

  return Object.freeze({
    assetCatalog: assetCatalog.value,
    privateAudioCatalog:
      privateAudioCatalog.value,
    nativeSkills:
      nativeSkillsResult.value,
    captureData:
      captureDataResult.value,
    loadedProgressionRules:
      progressionRulesResult.value,
    creatureVisualMetaById:
      creatureVisualMeta.value,
    availability: Object.freeze({
      assetCatalog:
        assetCatalog.available,
      privateAudioCatalog:
        privateAudioCatalog.available,
      creatureVisualMeta:
        creatureVisualMeta.available
    }),
    warnings: Object.freeze(warnings)
  });
}
