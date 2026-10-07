function requiredFunction(value, field) {
  if (typeof value !== "function") {
    throw new TypeError(field + " must be a function");
  }
  return value;
}

async function defaultImportVisualAdapter() {
  return import(
    "../adapters/input/capture/capture-export-to-native-visual-source-v1.js"
  );
}

async function defaultImportCombatPreview() {
  return import(
    "./capture-combat-preview-v1.js"
  );
}

export async function loadCaptureEditorPreviewRuntimeV1({
  importVisualAdapter = defaultImportVisualAdapter,
  importCombatPreview = defaultImportCombatPreview
} = {}) {
  const loadVisualAdapter = requiredFunction(
    importVisualAdapter,
    "importVisualAdapter"
  );
  const loadCombatPreview = requiredFunction(
    importCombatPreview,
    "importCombatPreview"
  );

  const [
    visualAdapterModule,
    combatPreviewModule
  ] = await Promise.all([
    loadVisualAdapter(),
    loadCombatPreview()
  ]);

  const adaptCaptureExportToNativeVisualSourceV1 =
    requiredFunction(
      visualAdapterModule
        ?.adaptCaptureExportToNativeVisualSourceV1,
      "adaptCaptureExportToNativeVisualSourceV1"
    );

  const mountCaptureCombatPreviewV1 =
    requiredFunction(
      combatPreviewModule
        ?.mountCaptureCombatPreviewV1,
      "mountCaptureCombatPreviewV1"
    );

  return Object.freeze({
    adaptCaptureExportToNativeVisualSourceV1,
    mountCaptureCombatPreviewV1
  });
}
