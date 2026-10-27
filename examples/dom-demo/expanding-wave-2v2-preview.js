import { normalizeBattleFormatDefinition } from "../../src/contracts/battle-format-definition.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { planSkillReleaseFx } from "../../src/core/fx/skill-fx-plan.js";

// Standalone *UI adapter* only: geometry, damage, energy and cooldowns are
// exclusively decided by the normal renderer / CombatRuntime / CombatSession.
const actorIds = Object.freeze(["player", "ally", "opponent", "opponent-b"]);
const names = Object.freeze({
  player: "Dragon", ally: "Allié", opponent: "Ennemi A", "opponent-b": "Ennemi B"
});
const format = normalizeBattleFormatDefinition({
  id: "expanding-wave-2v2-mobile-preview",
  localActorId: "player",
  teams: { heroes: ["player", "ally"], enemies: ["opponent", "opponent-b"] },
  actors: actorIds.map(actorId => ({
    actorId,
    teamId: ["player", "ally"].includes(actorId) ? "heroes" : "enemies",
    creatureId: actorId,
    displayName: names[actorId],
    fighterConfigId: actorId,
    controllerId: "human-local"
  }))
});
const testSkill = normalizeSkillDefinition({
  id: "mini-wave-2v2", name: "Onde de feu (mini-test)",
  category: "offensive", form: "projectile", element: "fire",
  projectileTargeting: "expanding_wave",
  expandingWave: { startRadiusPct: 3, endRadiusPct: 65, thicknessPct: 6 },
  hitPresenceStates: ["surface", "airborne"],
  targetRelations: ["enemy"], allowedDistances: ["short", "medium", "long"],
  approachMode: "none",
  energyCost: 3, preparationMs: 0, travelMs: 1900,
  recoveryMs: 0, cooldownMs: 0,
  effect: { damage: 20, heal: 0, tags: [] }
});
const arena = document.querySelector("[data-mini-arena]");
const status = document.querySelector("[data-mini-status]");
const resetButton = document.querySelector("[data-mini-reset]");
const castButtons = [...document.querySelectorAll("[data-mini-cast]")];
const anchors = Object.fromEntries(actorIds.map(id => [
  id, document.querySelector('[data-mini-model="' + id + '"]')
]));
const hpLabels = Object.fromEntries(actorIds.map(id => [
  id, document.querySelector('[data-mini-hp="' + id + '"]')
]));
const actorNodes = Object.fromEntries(actorIds.map(id => [
  id, document.querySelector('[data-mini-actor="' + id + '"]')
]));

const MASK_SIZE = 20;
const opaque = new Uint8Array(MASK_SIZE * MASK_SIZE);
for (let y = 0; y < MASK_SIZE; y += 1) {
  for (let x = 0; x < MASK_SIZE; x += 1) {
    const dx = x + 0.5 - MASK_SIZE / 2;
    const dy = y + 0.5 - MASK_SIZE / 2;
    if (dx * dx + dy * dy <= (MASK_SIZE / 2 - 1) ** 2) {
      opaque[y * MASK_SIZE + x] = 1;
    }
  }
}
const modelMask = Object.freeze({ width: MASK_SIZE, height: MASK_SIZE, opaque });
const models = Object.fromEntries(actorIds.map(id => [
  id, Object.freeze({
    snapshot() {
      const rect = anchors[id].getBoundingClientRect();
      return {
        mask: modelMask,
        origin: { x: rect.left, y: rect.top },
        axisX: { x: rect.right, y: rect.top },
        axisY: { x: rect.left, y: rect.bottom }
      };
    }
  })
]));

const fighter = id => ({
  id, maxHp: 100, initialHp: 100, maxEnergy: 20, initialEnergy: 20,
  energyChargeAmount: 0, energyChargeIntervalMs: 2000,
  movementEnergyPerStep: 0, chargeTimeModifierPct: 0
});
let session = null;
let runtime = null;
let renderer = null;
let sourceActor = null;
let hitActors = [];
let finished = true;

function renderHealth() {
  if (!session) return;
  const state = session.snapshot();
  for (const id of actorIds) {
    const hp = Math.max(0, Number(state.fighters[id]?.hp) || 0);
    hpLabels[id].textContent = hp + " PV";
    hpLabels[id].style.color = hp <= 0 ? "#ffa0a0" : hp < 100 ? "#ffe18b" : "";
  }
}

function disposeBattle() {
  runtime?.dispose();
  renderer?.dispose();
  runtime = null;
  renderer = null;
  session = null;
  sourceActor = null;
  finished = true;
  hitActors = [];
  for (const node of Object.values(anchors)) node.removeAttribute("data-mini-hit");
}

function createBattle() {
  session = createCombatSession({
    distance: "short", battleFormat: format, fighters: actorIds.map(fighter)
  });
  renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    targetAnchors: anchors,
    presentationForSkill: () => null,
    targetCollisionModelFor: slot => models[slot],
    waveTargetsFor(fromSlot) {
      return actorIds.filter(id => format.teamOf(id) !== format.teamOf(fromSlot));
    },
    onProjectileContact(contact) {
      return contact.waveMultiTarget === true
        ? runtime?.reportExpandingWaveTargetContact(contact) ?? null
        : runtime?.reportActionContact(contact) ?? null;
    }
  });
  runtime = createCombatRuntime({
    session, tickMs: 40,
    enableExpandingWaveMultiTarget: true,
    onState() { renderHealth(); },
    onRelease({ action }) {
      for (const plan of planSkillReleaseFx({
        action, actorSlot: action.actorId, targetSlot: action.targetId
      })) renderer.play(plan);
    },
    onResolved(resolution) {
      if (resolution.waveContact !== true) return;
      const target = resolution.targetId;
      if (resolution.outcome === "hit") {
        hitActors.push(target);
        anchors[target].dataset.miniHit = "true";
        status.textContent = "Impact : " + names[target] +
          " · " + hitActors.length + " cible(s) touchée(s)";
      } else {
        status.textContent = names[target] + " : " + resolution.outcome;
      }
      renderHealth();
    },
    onProgress(progress) {
      if (progress.actorId === sourceActor && progress.phase === "idle" &&
          !finished) {
        finished = true;
        if (hitActors.length === 0) {
          status.textContent = "Onde terminée : aucune cible touchée.";
        } else {
          status.textContent = "Onde terminée : " + hitActors.length +
            " cible(s) touchée(s), une seule attaque.";
        }
      }
    }
  });
  runtime.start();
  renderHealth();
}

function begin(source) {
  disposeBattle();
  createBattle();
  sourceActor = source;
  finished = false;
  const target = actorIds.find(id => format.teamOf(id) !== format.teamOf(source));
  const started = runtime.startSkill({
    actorId: source, targetId: target, skill: testSkill
  });
  if (!started.ok) {
    finished = true;
    status.textContent = "Action refusée : " + started.outcome;
    return;
  }
  status.textContent = names[source] + " lance l'onde : observe les deux adversaires…";
  renderHealth();
}

for (const button of castButtons) {
  button.addEventListener("click", () => begin(button.dataset.miniCast));
}
resetButton.addEventListener("click", () => {
  disposeBattle();
  createBattle();
  status.textContent = "Prêt : lance une onde pour vérifier les deux impacts.";
});
window.addEventListener("pagehide", disposeBattle, { once: true });
createBattle();
