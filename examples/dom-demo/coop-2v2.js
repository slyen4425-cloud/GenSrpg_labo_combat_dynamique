import { mountCombatDemo } from "../../src/ui/demo-app.js";
import { mountCoop2v2Test } from "../../src/ui/combat-2v2-test-ui.js";
import {
  mountCapturePackagePreviewEditor
} from "../../src/ui/capture-package-preview-ui.js";
import { demoPresentationAssets } from "./demo-assets.js";

const root = document.querySelector("[data-combat-demo]");
const arena = root?.querySelector("[data-combat-arena]") ?? null;
const packageMode =
  new URLSearchParams(window.location.search).get("capturePackage") === "1";
const PACKAGE_PREVIEW_URL = new URL(
  "../../data/capture/capture-combat-package-preview-v1.json",
  import.meta.url
);

function applyArenaPresentation(arenaId) {
  if (!arena) {
    return;
  }

  const presentation =
    demoPresentationAssets.presentationForArena?.(arenaId) ?? null;

  if (!presentation?.background?.url) {
    return;
  }

  arena.dataset.arenaBackground = "image";
  arena.dataset.arenaTheme = arenaId;
  arena.style.setProperty(
    "--arena-background-image",
    `url("${presentation.background.url}")`
  );
  arena.style.setProperty(
    "--arena-background-position",
    presentation.backgroundPosition ?? "center"
  );
  arena.style.setProperty(
    "--arena-background-size",
    presentation.backgroundSize ?? "cover"
  );
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Impossible de charger le package Capture : HTTP ${response.status}`
    );
  }
  return response.json();
}

function ensurePreviewVisuals(model, visuals) {
  for (const actor of model.battleFormat.actors) {
    visuals.getCreatureDescriptor(actor.creatureId);
  }
}

applyArenaPresentation("city");

Promise.resolve()
  .then(async () => {
    const visuals = await mountCombatDemo({ root });
    let combat = null;
    let packageEditor = null;

    async function mountCombat(combatModel = null) {
      if (combatModel) {
        ensurePreviewVisuals(combatModel, visuals);
      }

      combat?.dispose();
      combat = await mountCoop2v2Test({
        root,
        visuals,
        presentationAssets: demoPresentationAssets,
        combatModel
      });
      return combat;
    }

    if (packageMode) {
      const initialPackage = await fetchJson(PACKAGE_PREVIEW_URL);
      packageEditor = mountCapturePackagePreviewEditor({
        root,
        initialPackage,
        onApply: mountCombat
      });
      packageEditor.open();
      await mountCombat(packageEditor.validate());
    } else {
      await mountCombat();
    }

    window.addEventListener(
      "pagehide",
      () => {
        packageEditor?.dispose();
        combat?.dispose();
        visuals.dispose();
      },
      { once: true }
    );
  })
  .catch((error) => {
    const status = document.querySelector("[data-combat-live-status]");
    if (status) {
      status.textContent = error.message;
      status.dataset.tone = "warn";
    }
    console.error(error);
  });
