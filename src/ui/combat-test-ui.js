import { normalizeSkillDefinition } from "../contracts/skill-definition.js";
import { createCombatSession } from "../core/combat/combat-session.js";
import { createCombatResolutionPresenter } from "../adapters/renderer/combat-resolution-presenter.js";
import { createDomSkillFxRenderer } from "../adapters/renderer/dom-skill-fx.js";

const DATA_URLS = Object.freeze({
  fighters: Object.freeze({
    maraileron: new URL(
      "../../data/combat/fighters/maraileron.combat.json",
      import.meta.url
    ),
    braisombre: new URL(
      "../../data/combat/fighters/braisombre.combat.json",
      import.meta.url
    )
  }),
  skills: Object.freeze({
    fireball: new URL(
      "../../data/combat/skills/fireball.skill.json",
      import.meta.url
    ),
    claw: new URL(
      "../../data/combat/skills/claw.skill.json",
      import.meta.url
    ),
    mirrorShield: new URL(
      "../../data/combat/skills/mirror-shield.skill.json",
      import.meta.url
    ),
    fireImmunity: new URL(
      "../../data/combat/skills/fire-immunity.skill.json",
      import.meta.url
    ),
    contactCounter: new URL(
      "../../data/combat/skills/contact-counter.skill.json",
      import.meta.url
    )
  })
});

const DISTANCE_LABELS = Object.freeze({
  short: "Courte",
  medium: "Moyenne",
  long: "Longue"
});

const CATEGORY_LABELS = Object.freeze({
  offensive: "Offensive",
  defensive: "Défensive",
  heal: "Soin",
  buff_debuff: "Buff/Debuff",
  counter: "Contre"
});

const FORM_LABELS = Object.freeze({
  contact: "Contact",
  projectile: "Projectile",
  beam: "Rayon",
  area: "Zone",
  self: "Personnel",
  aura: "Aura"
});

const ELEMENT_LABELS = Object.freeze({
  fire: "Feu",
  water: "Eau",
  air: "Air",
  electric: "Électricité",
  light: "Lumière",
  shadow: "Ombre"
});

const OUTCOME_LABELS = Object.freeze({
  hit: "touche",
  blocked: "bloquée",
  reflected: "renvoyée",
  immune: "annulée par immunité",
  countered: "contrée",
  out_of_range: "hors portée",
  insufficient_energy: "énergie insuffisante"
});

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
  }
  return response.json();
}

function requiredElement(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Combat test element not found: ${selector}`);
  }
  return element;
}

function formatEnergy(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatSeconds(ms) {
  return `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 2)} s`;
}

function skillMetaText(skill) {
  const parts = [
    CATEGORY_LABELS[skill.category] ?? skill.category,
    FORM_LABELS[skill.form] ?? skill.form
  ];
  if (skill.element) {
    parts.push(ELEMENT_LABELS[skill.element] ?? skill.element);
  }
  return parts.join(" · ");
}

function skillTimingText(skill) {
  const parts = [`${formatEnergy(skill.energyCost)}⚡`];
  if (skill.preparationMs > 0) {
    parts.push(`prépa ${formatSeconds(skill.preparationMs)}`);
  }
  if (skill.travelMs > 0) {
    parts.push(`trajet ${formatSeconds(skill.travelMs)}`);
  }
  return parts.join(" · ");
}

export async function mountCombatTest({
  root,
  visuals,
  fetchImpl = fetch
}) {
  if (!root || typeof root.querySelector !== "function") {
    throw new TypeError("root must provide querySelector()");
  }
  if (
    !visuals ||
    typeof visuals.playEventFor !== "function" ||
    typeof visuals.cancelFor !== "function"
  ) {
    throw new TypeError("visuals must expose playEventFor() and cancelFor()");
  }

  const [
    maraileronConfig,
    braisombreConfig,
    fireballRaw,
    clawRaw,
    mirrorShieldRaw,
    fireImmunityRaw,
    contactCounterRaw
  ] = await Promise.all([
    fetchJson(DATA_URLS.fighters.maraileron, fetchImpl),
    fetchJson(DATA_URLS.fighters.braisombre, fetchImpl),
    fetchJson(DATA_URLS.skills.fireball, fetchImpl),
    fetchJson(DATA_URLS.skills.claw, fetchImpl),
    fetchJson(DATA_URLS.skills.mirrorShield, fetchImpl),
    fetchJson(DATA_URLS.skills.fireImmunity, fetchImpl),
    fetchJson(DATA_URLS.skills.contactCounter, fetchImpl)
  ]);

  const offensiveSkills = Object.freeze([
    normalizeSkillDefinition(fireballRaw),
    normalizeSkillDefinition(clawRaw)
  ]);

  const reactionSkills = Object.freeze([
    normalizeSkillDefinition(mirrorShieldRaw),
    normalizeSkillDefinition(fireImmunityRaw),
    normalizeSkillDefinition(contactCounterRaw)
  ]);

  const reactionById = new Map(
    reactionSkills.map((skill) => [skill.id, skill])
  );

  const session = createCombatSession({
    distance: "medium",
    fighters: [maraileronConfig, braisombreConfig]
  });

  const arena = requiredElement(root, "[data-combat-arena]");
  const distanceValue = requiredElement(root, "[data-combat-distance-value]");
  const moverSelect = requiredElement(root, "[data-combat-mover]");
  const reactionSelect = requiredElement(root, "[data-combat-reaction]");
  const skillContainer = requiredElement(root, "[data-combat-skills]");
  const logList = requiredElement(root, "[data-combat-log]");
  const advanceButton = requiredElement(root, "[data-combat-advance]");
  const resetButton = requiredElement(root, "[data-combat-reset]");

  const energyRefs = {
    maraileron: {
      bar: requiredElement(root, '[data-combat-energy="maraileron"]'),
      value: requiredElement(root, '[data-combat-energy-value="maraileron"]')
    },
    braisombre: {
      bar: requiredElement(root, '[data-combat-energy="braisombre"]'),
      value: requiredElement(root, '[data-combat-energy-value="braisombre"]')
    }
  };

  const movementButtons = [...root.querySelectorAll("[data-combat-move]")];
  const bandIndicators = [...root.querySelectorAll("[data-combat-band]")];
  const cleanups = [];
  let disposed = false;

  const fx = createDomSkillFxRenderer({
    arena,
    anchors: {
      player: requiredElement(
        root,
        '[data-demo-slot="player"] [data-demo-motion]'
      ),
      opponent: requiredElement(
        root,
        '[data-demo-slot="opponent"] [data-demo-motion]'
      )
    }
  });

  const presenter = createCombatResolutionPresenter({
    visuals,
    fx
  });

  function listen(element, type, handler) {
    element.addEventListener(type, handler);
    cleanups.push(() => element.removeEventListener(type, handler));
  }

  function writeLog(message, tone = "info") {
    const item = root.ownerDocument.createElement("li");
    item.textContent = message;
    item.dataset.tone = tone;
    logList.prepend(item);
    while (logList.children.length > 8) {
      logList.lastElementChild?.remove();
    }
  }

  function selectedReaction() {
    const id = reactionSelect.value;
    return id === "none" ? null : reactionById.get(id) ?? null;
  }

  function createReactionOptions() {
    const none = root.ownerDocument.createElement("option");
    none.value = "none";
    none.textContent = "Aucune réaction";
    reactionSelect.append(none);

    for (const skill of reactionSkills) {
      const option = root.ownerDocument.createElement("option");
      option.value = skill.id;
      option.textContent =
        `${skill.name} · ${formatEnergy(skill.energyCost)}⚡ · ${skillMetaText(skill)}`;
      reactionSelect.append(option);
    }
  }

  const skillButtons = new Map();

  function createSkillButtons() {
    for (const skill of offensiveSkills) {
      const button = root.ownerDocument.createElement("button");
      button.type = "button";
      button.className = "skill-card";
      button.dataset.combatSkill = skill.id;

      const name = root.ownerDocument.createElement("strong");
      name.textContent = skill.name;

      const meta = root.ownerDocument.createElement("span");
      meta.className = "skill-card__meta";
      meta.textContent = skillMetaText(skill);

      const timing = root.ownerDocument.createElement("span");
      timing.className = "skill-card__timing";
      timing.textContent = skillTimingText(skill);

      const state = root.ownerDocument.createElement("span");
      state.className = "skill-card__state";
      state.dataset.skillState = "";

      button.append(name, meta, timing, state);
      skillContainer.append(button);
      skillButtons.set(skill.id, { button, state });

      listen(button, "click", () => {
        const reactionSkill = selectedReaction();
        const result = session.useSkill({
          actorId: "maraileron",
          targetId: "braisombre",
          skill,
          reactionSkill
        });

        if (!result.ok) {
          writeLog(
            `${skill.name} : ${OUTCOME_LABELS[result.outcome] ?? result.outcome}.`,
            "warn"
          );
          render();
          return;
        }

        presenter.present({
          resolution: result,
          actorSlot: "player",
          targetSlot: "opponent"
        });

        const reactionText = result.reactionApplied
          ? ` avec ${reactionById.get(result.reactionApplied)?.name ?? result.reactionApplied}`
          : "";

        const timing =
          result.outcome === "countered"
            ? result.events.find((item) => item.type === "skill-countered")?.atMs
            : result.events.find((item) => item.type === "skill-arrive")?.atMs;

        writeLog(
          `${skill.name}${reactionText} → ${OUTCOME_LABELS[result.outcome] ?? result.outcome}` +
          (Number.isFinite(timing) ? ` à ${formatSeconds(timing)}.` : "."),
          result.outcome === "hit" ? "ok" : "accent"
        );

        render();
      });
    }
  }

  function renderEnergy(state) {
    for (const [fighterId, refs] of Object.entries(energyRefs)) {
      const fighter = state.fighters[fighterId];
      refs.bar.max = fighter.maxEnergy;
      refs.bar.value = fighter.energy;
      refs.value.textContent =
        `${formatEnergy(fighter.energy)} / ${formatEnergy(fighter.maxEnergy)}⚡`;
    }
  }

  function renderDistance(state) {
    distanceValue.textContent = DISTANCE_LABELS[state.distance];
    arena.dataset.combatDistance = state.distance;

    for (const indicator of bandIndicators) {
      indicator.dataset.active =
        indicator.dataset.combatBand === state.distance ? "true" : "false";
    }

    const actorId = moverSelect.value;
    for (const button of movementButtons) {
      const toDistance = button.dataset.combatMove;
      const preview = session.previewMovement(actorId, toDistance);
      const isCurrent = toDistance === state.distance;

      button.disabled = isCurrent;
      button.dataset.affordable = preview.ok ? "true" : "false";
      button.textContent = isCurrent
        ? `${DISTANCE_LABELS[toDistance]} · ici`
        : `${DISTANCE_LABELS[toDistance]} · ${formatEnergy(preview.cost)}⚡`;
    }
  }

  function renderSkills() {
    const reactionSkill = selectedReaction();

    for (const skill of offensiveSkills) {
      const refs = skillButtons.get(skill.id);
      const preview = session.previewSkill({
        actorId: "maraileron",
        targetId: "braisombre",
        skill,
        reactionSkill
      });

      refs.button.disabled = !preview.ok;
      refs.button.dataset.available = preview.ok ? "true" : "false";
      refs.state.textContent = preview.ok
        ? `→ ${OUTCOME_LABELS[preview.outcome] ?? preview.outcome}`
        : OUTCOME_LABELS[preview.outcome] ?? preview.outcome;
    }
  }

  function render() {
    if (disposed) {
      return;
    }
    const state = session.snapshot();
    renderEnergy(state);
    renderDistance(state);
    renderSkills();
  }

  for (const button of movementButtons) {
    listen(button, "click", () => {
      const actorId = moverSelect.value;
      const from = session.snapshot().distance;
      const result = session.move(actorId, button.dataset.combatMove);

      if (!result.ok) {
        writeLog(
          `${actorId === "maraileron" ? "Maraileron" : "Braisombre"} : énergie insuffisante pour ce déplacement (${formatEnergy(result.cost)}⚡).`,
          "warn"
        );
      } else {
        writeLog(
          `${actorId === "maraileron" ? "Maraileron" : "Braisombre"} : ${DISTANCE_LABELS[from]} → ${DISTANCE_LABELS[result.state.distance]} · -${formatEnergy(result.cost)}⚡.`,
          "info"
        );
      }
      render();
    });
  }

  listen(moverSelect, "change", render);
  listen(reactionSelect, "change", render);

  listen(advanceButton, "click", () => {
    session.advance(1);
    writeLog(
      `+1 s : énergie régénérée selon chaque créature (+${formatEnergy(maraileronConfig.energyRegenPerSecond)} / +${formatEnergy(braisombreConfig.energyRegenPerSecond)}).`,
      "info"
    );
    render();
  });

  listen(resetButton, "click", () => {
    presenter.cancelPending();
    fx.cancelAll();
    visuals.cancelFor("player");
    visuals.cancelFor("opponent");
    session.reset();
    reactionSelect.value = "none";
    writeLog("Combat de test réinitialisé.", "info");
    render();
  });

  createReactionOptions();
  createSkillButtons();
  render();

  writeLog(
    "Test prêt : déplacez-vous entre Courte / Moyenne / Longue, choisissez une réaction puis lancez une capacité.",
    "info"
  );

  return Object.freeze({
    snapshot: () => session.snapshot(),
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      for (const cleanup of cleanups.splice(0)) {
        cleanup();
      }
      presenter.dispose();
      fx.dispose();
    }
  });
}
