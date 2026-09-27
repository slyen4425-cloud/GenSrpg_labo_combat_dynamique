import { mountCombatDemo } from "../../src/ui/demo-app.js";
import { mountCoop2v2Test } from "../../src/ui/combat-2v2-test-ui.js";
import {
  buildCaptureCombatPackageV1
} from "../../src/adapters/input/capture/combat-package-v1.js";
import { demoPresentationAssets } from "./demo-assets.js";

const root = document.querySelector("[data-combat-demo]");
const arena = root?.querySelector("[data-combat-arena]") ?? null;
const CAPTURE_EXPORT_URL = new URL(
  "../../data/capture/demo-editor-export-2v2.capture.json",
  import.meta.url
);

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
  }
  return response.json();
}

async function combatSetupFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("source") !== "capture-export") {
    return null;
  }

  const captureExport = await fetchJson(CAPTURE_EXPORT_URL);
  const pkg = buildCaptureCombatPackageV1(captureExport);
  const localActor = pkg.battleFormat.actor(
    pkg.battleFormat.localActorId
  );

  if (!localActor) {
    throw new Error("Capture package has no local actor");
  }

  const localSkills =
    pkg.skillsByCreature[localActor.creatureId] ?? null;
  if (!localSkills) {
    throw new Error(
      `Capture package has no skills for ${localActor.creatureId}`
    );
  }

  if (root) {
    root.dataset.combatSource = "capture-export";
  }

  return Object.freeze({
    format: pkg.battleFormat,
    fighterConfigs: pkg.fighterConfigs,
    fighters: pkg.initialFighters,
    skillsById: pkg.skills,
    localSkills
  });
}

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

applyArenaPresentation("city");

Promise.resolve()
  .then(async () => {
    const visuals = await mountCombatDemo({ root });
    const combatSetup = await combatSetupFromQuery();
    const combat = await mountCoop2v2Test({
      root,
      visuals,
      presentationAssets: demoPresentationAssets,
      combatSetup
    });

    window.addEventListener(
      "pagehide",
      () => {
        combat.dispose();
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
