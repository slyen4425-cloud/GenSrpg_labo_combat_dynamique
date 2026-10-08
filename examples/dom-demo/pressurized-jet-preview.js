import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { demoPresentationAssets } from "./demo-assets.js";

const arena = document.querySelector("[data-beam-arena]");
const source = document.querySelector("[data-beam-source]");
const target = document.querySelector("[data-beam-target]");
const playButton = document.querySelector("[data-beam-play]");
const loopButton = document.querySelector("[data-beam-loop]");
const status = document.querySelector("[data-beam-status]");

const assets = Object.freeze({
  cast: demoPresentationAssets.asset("pack:capture:sprite-pressurized-jet-cast-01"),
  start: demoPresentationAssets.asset("pack:capture:sprite-pressurized-jet-beam-start-01"),
  travel: demoPresentationAssets.asset("pack:capture:sprite-pressurized-jet-beam-body-01"),
  impact: demoPresentationAssets.asset("pack:capture:sprite-pressurized-jet-impact-01")
});

for (const [name, asset] of Object.entries(assets)) {
  if (!asset) {
    throw new Error("Asset Jet pressurisé introuvable: " + name);
  }
}

const renderer = createDomSkillFxRenderer({
  arena,
  anchors: Object.freeze({
    player: source,
    opponent: target
  }),
  presentationForSkill() {
    return Object.freeze({
      cast: assets.cast,
      castLayer: "front",
      castAnchor: null,
      travel: assets.travel,
      travelLayer: "front",
      travelSourceAnchor: null,
      impact: assets.impact,
      impactLayer: "front",
      feedback: null
    });
  }
});

let playing = false;
let auto = false;
let autoTimer = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce() {
  if (playing) return;
  playing = true;
  playButton.disabled = true;
  status.textContent = "Charge…";

  try {
    await renderer.play({
      type: "cast",
      skillId: "pressurized-jet-preview",
      actorSlot: "player",
      durationMs: 1200
    }).finished;

    // Le beam_start est bien résolu et vérifié dans le registre; le contrat
    // runtime actuel ne possède pas encore de slot séparé pour ce visuel.
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

playButton.addEventListener("click", () => {
  void runOnce();
});

loopButton.addEventListener("click", () => {
  auto = !auto;
  syncAuto();
});

window.addEventListener("pagehide", () => {
  if (autoTimer !== null) clearInterval(autoTimer);
  renderer.dispose();
}, { once: true });
