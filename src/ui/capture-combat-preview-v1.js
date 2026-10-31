import {
  mountCombatDemo
} from "./demo-app.js";
import {
  mountCoop2v2Test
} from "./combat-2v2-test-ui.js?v=liane-audio-r2-20261030-snowball-v46-20261031-stage-energy-boule-20261031-ice-author-r2-20261031-charged-effects-20261031-ice-ground-spike-fog-20261031-barrier-20261031-hud-20261031-wall-spatial-20261031-wall-state-20261031";

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
  try {
    combat = disposableOwner(
      await mountCombatOwner({
        root,
        visuals,
        nativeCombatSource,
        embeddedBattle,
        presentationAssets
      }),
      "mountCombat"
    );
  } catch (error) {
    visuals.dispose();
    throw error;
  }

  let disposed = false;

  return Object.freeze({
    visuals,
    combat,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      combat.dispose();
      visuals.dispose();
    }
  });
}
