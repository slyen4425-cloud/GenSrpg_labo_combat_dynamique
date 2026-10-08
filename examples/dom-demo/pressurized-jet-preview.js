import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { createCaptureSkillPresentationAssetsV2 } from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import { createGlobalPresentationAssetResolverV1 } from "../../src/assets/global-presentation-asset-resolver-v1.js";
import {
  GLOBAL_VISUAL_LIBRARY,
  globalVisualAssetUrl
} from "../../src/assets/global-visual-library.js";

const IDS = Object.freeze({
  cast: "pack:capture:sprite-pressurized-jet-cast-01",
  start: "pack:capture:sprite-pressurized-jet-beam-start-01",
  body: "pack:capture:sprite-pressurized-jet-beam-body-01",
  impact: "pack:capture:sprite-pressurized-jet-impact-01"
});

const arena = document.querySelector("[data-beam-arena]");
const source = document.querySelector("[data-beam-source]");
const target = document.querySelector("[data-beam-target]");
const playButton = document.querySelector("[data-beam-play]");
const loopButton = document.querySelector("[data-beam-loop]");
const status = document.querySelector("[data-beam-status]");

function slot(assetId, {
  attachment,
  trigger,
  playbackMode = "once",
  anchor = null,
  displayScale = 1,
  displayScaleY = 1,
  durationMs = undefined
}) {
  return {
    assetId,
    displayScale,
    displayScaleX: 1,
    displayScaleY,
    attachment,
    anchor,
    offsetX: 0,
    offsetY: 0,
    trigger,
    playbackMode,
    rotationDeg: 0,
    opacity: 1,
    layerByView: {
      player: "front",
      opponent: "front"
    },
    offsetMode: "same",
    ...(durationMs === undefined ? {} : { durationMs })
  };
}

function binding() {
  return {
    id: "skill:pressurized-jet-preview",
    version: 9,
    subjectType: "skill",
    subjectId: "pressurized-jet-preview",
    visual: {
      cast: slot(IDS.start, {
        attachment: "source",
        trigger: "preparation-start",
        playbackMode: "loop",
        displayScale: 1
      }),
      beamStart: slot(IDS.start, {
        attachment: "source",
        trigger: "travel-start",
        playbackMode: "loop",
        anchor: null,
        displayScale: 1
      }),
      travel: slot(IDS.body, {
        attachment: "trajectory",
        trigger: "travel-start",
        playbackMode: "loop",
        displayScaleY: 0.72
      }),
      impact: slot(IDS.impact, {
        attachment: "fixed-target",
        trigger: "impact",
        displayScale: 2,
        durationMs: 540
      })
    },
    audio: {},
    statusVisuals: {},
    feedback: {
      glow: null,
      impactFlash: null,
      cameraShake: null,
      projectileTrail: null,
      impactBurst: null,
      aftermathSmoke: null,
      castBurst: null
    }
  };
}

async function loadPresentationAssets() {
  const response = await fetch(
    GLOBAL_VISUAL_LIBRARY.catalogUrl,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(
      "Catalogue global indisponible: HTTP " + response.status
    );
  }

  const catalog = await response.json();
  const resolveAsset =
    createGlobalPresentationAssetResolverV1({
      assetCatalog: catalog,
      assetUrlForFile: globalVisualAssetUrl
    });

  for (const [name, id] of Object.entries(IDS)) {
    if (!resolveAsset(id)) {
      throw new Error(
        "Asset Jet pressurisé introuvable: " + name
      );
    }
  }

  return createCaptureSkillPresentationAssetsV2({
    skillPresentations: {
      "pressurized-jet-preview": binding()
    },
    assetForId: resolveAsset
  });
}

let renderer = null;
let playing = false;
let auto = false;
let autoTimer = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce() {
  if (playing || renderer === null) return;
  playing = true;
  playButton.disabled = true;

  try {
    status.textContent = "Le départ du rayon se concentre à la source…";
    await renderer.play({
      type: "cast",
      skillId: "pressurized-jet-preview",
      actorSlot: "player",
      durationMs: 1200
    }).finished;

    status.textContent = "Jet continu…";
    await renderer.play({
      type: "beam",
      skillId: "pressurized-jet-preview",
      element: "water",
      fromSlot: "player",
      targetSlot: "opponent",
      durationMs: 1100
    }).finished;

    status.textContent = "Impact…";
    await renderer.play({
      type: "impact",
      skillId: "pressurized-jet-preview",
      targetSlot: "opponent",
      durationMs: 540
    }).finished;

    status.textContent = "Terminé.";
    await sleep(250);
  } catch (error) {
    status.textContent = "Erreur preview : " + error.message;
    throw error;
  } finally {
    playing = false;
    playButton.disabled = false;
  }
}

function syncAuto() {
  loopButton.textContent = "Auto : " + (auto ? "ON" : "OFF");
  if (autoTimer !== null) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
  if (auto) {
    void runOnce();
    autoTimer = setInterval(() => {
      void runOnce();
    }, 3600);
  }
}

async function boot() {
  status.textContent = "Chargement du catalogue global…";
  const presentationAssets = await loadPresentationAssets();

  renderer = createDomSkillFxRenderer({
    arena,
    anchors: Object.freeze({
      player: source,
      opponent: target
    }),
    presentationForSkill(skillId, context) {
      return presentationAssets.presentationForSkill(
        skillId,
        context
      );
    }
  });

  status.textContent = "Prêt.";
  playButton.disabled = false;
}

playButton.disabled = true;
playButton.addEventListener("click", () => {
  void runOnce();
});

loopButton.addEventListener("click", () => {
  auto = !auto;
  syncAuto();
});

window.addEventListener("pagehide", () => {
  if (autoTimer !== null) clearInterval(autoTimer);
  renderer?.dispose();
}, { once: true });

boot().catch((error) => {
  status.textContent = "Erreur chargement : " + error.message;
});
