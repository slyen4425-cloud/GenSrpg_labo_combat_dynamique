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
    "./capture-combat-preview-v1.js?v=liane-audio-r2-20261030-snowball-v46-20261031-stage-energy-boule-20261031-ice-author-r2-20261031-charged-effects-20261031-ice-ground-spike-fog-20261031-barrier-20261031-hud-20261031-wall-spatial-20261031-wall-state-20261031-wall-geometry-20261031-persistent-ice-walls-20261101-wall-live-r2-20261101-wall-placement-ux-20261101-wall-layer-scale-xy-20261101-wall-impact-20261101-wall-bestiary-hp-20261102-channel-ground-mine-filter-20261102-ice-channel-spikes-20261102-unified-effects-20261102-pique-glace-editor-20261102-ground-filter-20261102-attack-pose-hold-20261102-gorice-pique-furie-20261102-self-periodic-prose-20261102-author-three-wall-side-hp-20261103-wall-channel-loop-audio-20261103-phone-pc-author-offset-20261103-global-fx-phone-pc-20261103-wall-trajectory-phone-pc-20261103-wall-opponent-channel-safe-20261103-lumilo-attack-role-20261104-reference-elements-skill-id-20261104-dual-status-sprite-20261104-armure-pointe-import-20261105-visual-elements-20261105-ground-approach-steps-20261105-ai-charge-hold-20261105-barrier-dual-view-20261105-barrier-side-layout-20261105-burrow-visual-fields-20261107"
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
