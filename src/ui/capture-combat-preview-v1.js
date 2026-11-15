import {
  mountCombatDemo
} from "./demo-app.js?v=liane-audio-r2-20261030-snowball-v46-20261031-stage-energy-boule-20261031-ice-author-r2-20261031-charged-effects-20261031-ice-ground-spike-fog-20261031-barrier-20261031-hud-20261031-wall-spatial-20261031-wall-state-20261031-wall-geometry-20261031-persistent-ice-walls-20261101-wall-live-r2-20261101-wall-placement-ux-20261101-wall-layer-scale-xy-20261101-wall-impact-20261101-wall-bestiary-hp-20261102-channel-ground-mine-filter-20261102-ice-channel-spikes-20261102-unified-effects-20261102-pique-glace-editor-20261102-ground-filter-20261102-attack-pose-hold-20261102-gorice-pique-furie-20261102-self-periodic-prose-20261102-author-three-wall-side-hp-20261103-wall-channel-loop-audio-20261103-phone-pc-author-offset-20261103-global-fx-phone-pc-20261103-wall-trajectory-phone-pc-20261103-wall-opponent-channel-safe-20261103-lumilo-attack-role-20261104-reference-elements-skill-id-20261104-dual-status-sprite-20261104-armure-pointe-import-20261105-visual-elements-20261105-ground-approach-steps-20261105-ai-charge-hold-20261105-barrier-dual-view-20261105-barrier-side-layout-20261105-burrow-visual-fields-20261107-sylvorne-showcase-media-20261111-sylvorne-editor-media-20261111-sylvorne-combat-visuals-20261111-sylvorne-fx-size-20261111-recolor-20261113-recolor-sliders-20261113";
import {
  mountCoop2v2Test
} from "./combat-2v2-test-ui.js?v=liane-audio-r2-20261030-snowball-v46-20261031-stage-energy-boule-20261031-ice-author-r2-20261031-charged-effects-20261031-ice-ground-spike-fog-20261031-barrier-20261031-hud-20261031-wall-spatial-20261031-wall-state-20261031-wall-geometry-20261031-persistent-ice-walls-20261101-wall-live-r2-20261101-wall-placement-ux-20261101-wall-layer-scale-xy-20261101-wall-impact-20261101-wall-bestiary-hp-20261102-channel-ground-mine-filter-20261102-ice-channel-spikes-20261102-unified-effects-20261102-pique-glace-editor-20261102-ground-filter-20261102-attack-pose-hold-20261102-gorice-pique-furie-20261102-self-periodic-prose-20261102-author-three-wall-side-hp-20261103-wall-channel-loop-audio-20261103-phone-pc-author-offset-20261103-global-fx-phone-pc-20261103-wall-trajectory-phone-pc-20261103-wall-opponent-channel-safe-20261103-lumilo-attack-role-20261104-reference-elements-skill-id-20261104-dual-status-sprite-20261104-armure-pointe-import-20261105-visual-elements-20261105-ground-approach-steps-20261105-ai-charge-hold-20261105-barrier-dual-view-20261105-barrier-side-layout-20261105-burrow-visual-fields-20261107-sylvorne-showcase-media-20261111-sylvorne-editor-media-20261111-sylvorne-combat-visuals-20261111-sylvorne-fx-size-20261111-recolor-20261113-recolor-sliders-20261113";

import {createCombatSoundtrackPreviewBridgeV1} from "../adapters/audio/combat-soundtrack-preview-bridge-v1.js";
import {
  SOUNDTRACK_STARTER_CATALOG_V1,SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1
} from "../assets/soundtrack-starter-catalog-v1.js";
import {soundtrackRuntimeAssetV1} from "../assets/soundtrack-runtime-library-v1.js";

function requiredFunction(value, field) {
  if (typeof value !== "function") {
    throw new TypeError(`${field} must be a function`);
  }
  return value;
}

function disposableOwner(value, field) {
  if (
    !value ||
    typeof value !== "object" ||
    typeof value.dispose !== "function"
  ) {
    throw new TypeError(
      `${field} must return an object with dispose()`
    );
  }
  return value;
}

export async function mountCaptureCombatPreviewV1({
  root,
  nativeCombatSource,
  nativeVisualSource,
  presentationAssets = null,
  arenaLight = null,
  embeddedBattle = null,
  onBattleOutcome = null,
  soundtrackProject = SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1,
  soundtrackCatalog = SOUNDTRACK_STARTER_CATALOG_V1,
  resolveSoundtrackAsset = soundtrackRuntimeAssetV1,
  mountVisuals = mountCombatDemo,
  mountCombat = mountCoop2v2Test
}) {
  const mountVisualOwner = requiredFunction(
    mountVisuals,
    "mountVisuals"
  );
  const mountCombatOwner = requiredFunction(
    mountCombat,
    "mountCombat"
  );

  const visuals = disposableOwner(
    await mountVisualOwner({
      root,
      nativeVisualSource,
      ...(arenaLight === null ? {} : { initialArenaLight: arenaLight })
    }),
    "mountVisuals"
  );

  let combat;
  let outcomeSoundtrack = null;
  let disposed = false;
  function presentBattleOutcome(outcome) {
    if (disposed || !["victory","defeat","draw"].includes(outcome)) return;
    if (typeof onBattleOutcome === "function") {
      onBattleOutcome(outcome);
      return;
    }
    // For embedded GenSRPG/Combat without an editor callback, playback is
    // still driven by the ONE official SoundtrackSession. No extra Audio loop.
    try {
      if (!outcomeSoundtrack) outcomeSoundtrack=createCombatSoundtrackPreviewBridgeV1({
        project:soundtrackProject,catalog:soundtrackCatalog,
        resolveAudioAsset:resolveSoundtrackAsset,
        onAudioError:error=>console.warn("Musique de résultat indisponible",error)
      });
      // Draw is silent unless an explicit future scene is configured.
      outcomeSoundtrack.transitionTo("capture:combat:"+outcome);
    } catch (error) {
      console.warn("Scène de résultat non jouée",error);
    }
  }
  try {
    combat = disposableOwner(
      await mountCombatOwner({
        root,
        visuals,
        nativeCombatSource,
        embeddedBattle,
        presentationAssets,
        onBattleOutcome:presentBattleOutcome
      }),
      "mountCombat"
    );
  } catch (error) {
    outcomeSoundtrack?.dispose();
    visuals.dispose();
    throw error;
  }

  return Object.freeze({
    visuals,
    combat,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      outcomeSoundtrack?.dispose();
      combat.dispose();
      visuals.dispose();
    }
  });
}
