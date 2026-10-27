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

// A slow or stalled presentation CDN must not indefinitely own creature startup.
// The limitation is explicit: rejected resources emit a visible warning.
export const CAPTURE_EDITOR_OPTIONAL_PRESENTATION_WAIT_MS_V1 = 6000;

function boundedOptionalResource(promise, label, waitMs) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(label + " : délai de chargement dépassé (" + waitMs + " ms)"));
    }, waitMs);
    Promise.resolve(promise).then(
      (value) => { clearTimeout(timeout); resolve(value); },
      (error) => { clearTimeout(timeout); reject(error); }
    );
  });
}

export async function settleCaptureEditorStartupDependenciesV1({
  assetCatalogPromise,
  privateAudioCatalogPromise,
  nativeSkillsPromise,
  captureDataPromise,
  progressionRulesPromise,
  creatureVisualMetaPromise,
  optionalPresentationWaitMs = CAPTURE_EDITOR_OPTIONAL_PRESENTATION_WAIT_MS_V1
}) {
  if (!Number.isInteger(optionalPresentationWaitMs) || optionalPresentationWaitMs < 1) {
    throw new RangeError("optionalPresentationWaitMs must be a positive integer");
  }
  // Required data errors fail explicitly. Optional visual/audio resources may
  // fail or time out, but never hold configuredCreatures indefinitely.
  const optionalResults = Promise.allSettled([
    boundedOptionalResource(assetCatalogPromise, "Catalogue visuel", optionalPresentationWaitMs),
    boundedOptionalResource(privateAudioCatalogPromise, "Catalogue audio", optionalPresentationWaitMs),
    boundedOptionalResource(creatureVisualMetaPromise, "Métadonnées visuelles", optionalPresentationWaitMs)
  ]);
  const [nativeSkillsResult, captureDataResult, progressionRulesResult] =
    await Promise.allSettled([
      nativeSkillsPromise,
      captureDataPromise,
      progressionRulesPromise
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

  const [assetCatalogResult, privateAudioCatalogResult, creatureVisualMetaResult] =
    await optionalResults;

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
