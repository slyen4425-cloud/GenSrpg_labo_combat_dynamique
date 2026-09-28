import {
  mountCombatDemo
} from "./demo-app.js";
import {
  mountCoop2v2Test
} from "./combat-2v2-test-ui.js";

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
      nativeVisualSource
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
