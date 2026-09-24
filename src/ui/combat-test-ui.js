import { normalizeSkillDefinition } from "../contracts/skill-definition.js";
import { createCombatSession } from "../core/combat/combat-session.js";
import { createCombatRuntime } from "../core/combat/combat-runtime.js";
import { createCombatResolutionPresenter } from "../adapters/renderer/combat-resolution-presenter.js";
import { createDomSkillFxRenderer } from "../adapters/renderer/dom-skill-fx.js";
import { createDomDistancePresenter } from "../adapters/renderer/dom-distance-presenter.js";

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
  insufficient_energy: "énergie insuffisante",
  action_in_progress: "une action est déjà en cours",
  no_action: "aucune capacité à contrer",
  reaction_already_selected: "une réaction est déjà engagée",
  no_effect: "cette réaction ne répond pas à cette attaque",
  too_late: "réaction trop lente"
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
  const seconds = ms / 1000;
  return `${seconds.toFixed(Number.isInteger(seconds) ? 0 : 1)} s`;
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
    parts.push(`charge ${formatSeconds(skill.preparationMs)}`);
  }
  if (skill.travelMs > 0) {
    parts.push(`trajet ${formatSeconds(skill.travelMs)}`);
  }
  return parts.join(" · ");
}

function fighterLabel(id) {
  return id === "maraileron" ? "Maraileron" : "Braisombre";
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

  const session = createCombatSession({
    distance: "medium",
    fighters: [maraileronConfig, braisombreConfig]
  });

  const arena = requiredElement(root, "[data-combat-arena]");
  const moverSelect = requiredElement(root, "[data-combat-mover]");
  const skillContainer = requiredElement(root, "[data-combat-skills]");
  const reactionContainer = requiredElement(root, "[data-combat-reactions]");
  const logList = requiredElement(root, "[data-combat-log]");
  const liveStatus = requiredElement(root, "[data-combat-live-status]");
  const resetButton = requiredElement(root, "[data-combat-reset]");

  const fighterContainers = {
    player: requiredElement(root, '[data-demo-slot="player"]'),
    opponent: requiredElement(root, '[data-demo-slot="opponent"]')
  };

  const actorChargeRefs = {
    maraileron: requiredElement(
      root,
      '[data-combat-actor-charge="maraileron"]'
    ),
    braisombre: requiredElement(
      root,
      '[data-combat-actor-charge="braisombre"]'
    )
  };

  const hpRefs = {
    maraileron: {
      bar: requiredElement(root, '[data-combat-hp="maraileron"]'),
      value: requiredElement(root, '[data-combat-hp-value="maraileron"]')
    },
    braisombre: {
      bar: requiredElement(root, '[data-combat-hp="braisombre"]'),
      value: requiredElement(root, '[data-combat-hp-value="braisombre"]')
    }
  };

  const energyRefs = {
    maraileron: {
      bar: requiredElement(root, '[data-combat-energy="maraileron"]'),
      value: requiredElement(root, '[data-combat-energy-value="maraileron"]'),
      rate: requiredElement(root, '[data-combat-energy-rate="maraileron"]')
    },
    braisombre: {
      bar: requiredElement(root, '[data-combat-energy="braisombre"]'),
      value: requiredElement(root, '[data-combat-energy-value="braisombre"]'),
      rate: requiredElement(root, '[data-combat-energy-rate="braisombre"]')
    }
  };

  const movementButtons = [...root.querySelectorAll("[data-combat-move]")];
  const cleanups = [];
  let disposed = false;
  let lastState = session.snapshot();

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

  const distancePresenter = createDomDistancePresenter({
    fighters: fighterContainers
  });

  const skillRefs = new Map();
  const reactionRefs = new Map();

  function listen(element, type, handler) {
    element.addEventListener(type, handler);
    cleanups.push(() => element.removeEventListener(type, handler));
  }

  function setLiveStatus(message, tone = "info") {
    liveStatus.textContent = message;
    liveStatus.dataset.tone = tone;
  }

  function writeLog(message, tone = "info") {
    setLiveStatus(message, tone);
    const item = root.ownerDocument.createElement("li");
    item.textContent = message;
    item.dataset.tone = tone;
    logList.prepend(item);
    while (logList.children.length > 10) {
      logList.lastElementChild?.remove();
    }
  }

  function createSkillCard(skill, mode) {
    const button = root.ownerDocument.createElement("button");
    button.type = "button";
    button.className = `skill-card skill-card--${mode}`;
    button.dataset.combatSkill = skill.id;

    const name = root.ownerDocument.createElement("strong");
    name.textContent = skill.name;

    const meta = root.ownerDocument.createElement("span");
    meta.className = "skill-card__meta";
    meta.textContent = skillMetaText(skill);

    const timing = root.ownerDocument.createElement("span");
    timing.className = "skill-card__timing";
    timing.textContent = skillTimingText(skill);

    const charge = root.ownerDocument.createElement("progress");
    charge.className = "skill-card__charge";
    charge.max = 1;
    charge.value = 0;
    charge.setAttribute("aria-label", `Charge de ${skill.name}`);

    const state = root.ownerDocument.createElement("span");
    state.className = "skill-card__state";
    state.dataset.skillState = "";
    state.textContent = "En attente";

    button.append(name, meta, timing, charge, state);
    return { button, charge, state };
  }

  function setActorCharge(fighterId, value, active) {
    const bar = actorChargeRefs[fighterId];
    bar.value = Math.max(0, Math.min(1, Number(value) || 0));
    bar.dataset.active = active ? "true" : "false";
  }

  function resetChargeBars() {
    for (const refs of [...skillRefs.values(), ...reactionRefs.values()]) {
      refs.charge.value = 0;
      refs.button.dataset.charging = "false";
    }
    setActorCharge("maraileron", 0, false);
    setActorCharge("braisombre", 0, false);
  }

  function createCards() {
    for (const skill of offensiveSkills) {
      const refs = createSkillCard(skill, "offense");
      skillContainer.append(refs.button);
      skillRefs.set(skill.id, { ...refs, skill });

      listen(refs.button, "click", () => {
        const result = runtime.startSkill({
          actorId: "maraileron",
          targetId: "braisombre",
          skill
        });

        if (!result.ok) {
          writeLog(
            `${skill.name} : ${OUTCOME_LABELS[result.outcome] ?? result.outcome}.`,
            "warn"
          );
          render(lastState);
          return;
        }

        refs.button.dataset.charging = "true";
        refs.state.textContent =
          `Charge ${formatSeconds(result.action.preparationMs)}`;
        writeLog(
          `${skill.name} se prépare — Braisombre peut réagir.`,
          "accent"
        );
        render(lastState);
      });
    }

    for (const skill of reactionSkills) {
      const refs = createSkillCard(skill, "reaction");
      reactionContainer.append(refs.button);
      reactionRefs.set(skill.id, { ...refs, skill });

      listen(refs.button, "click", () => {
        const result = runtime.react(skill);

        if (!result.ok) {
          writeLog(
            `${skill.name} : ${OUTCOME_LABELS[result.outcome] ?? result.outcome}.`,
            "warn"
          );
          render(lastState);
          return;
        }

        refs.button.dataset.charging = "true";
        refs.state.textContent =
          `Réaction ${formatSeconds(result.reaction.preparationMs)}`;
        writeLog(
          `${skill.name} lancé — résolution dans ${formatSeconds(result.reaction.preparationMs)}.`,
          "accent"
        );
        render(lastState);
      });
    }
  }

  function renderHp(state) {
    for (const [fighterId, refs] of Object.entries(hpRefs)) {
      const fighter = state.fighters[fighterId];
      refs.bar.max = fighter.maxHp;
      refs.bar.value = fighter.hp;
      refs.value.textContent =
        `${Math.round(fighter.hp)} / ${Math.round(fighter.maxHp)} PV`;
    }
  }

  function renderEnergy(state) {
    for (const [fighterId, refs] of Object.entries(energyRefs)) {
      const fighter = state.fighters[fighterId];
      refs.bar.max = fighter.maxEnergy;
      refs.bar.value = fighter.energy;
      refs.value.textContent =
        `${formatEnergy(fighter.energy)} / ${formatEnergy(fighter.maxEnergy)}⚡`;
      refs.rate.textContent =
        `+${formatEnergy(fighter.energyChargeAmount)} toutes les ${formatSeconds(fighter.energyChargeIntervalMs)}`;
    }
  }

  function renderMovement(state) {
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

  function renderOffensiveAvailability() {
    for (const { skill, button, state } of skillRefs.values()) {
      const preview = session.previewSkill({
        actorId: "maraileron",
        targetId: "braisombre",
        skill
      });

      const available = preview.ok && !runtime.hasActiveAction;
      button.disabled = !available;
      button.dataset.available = available ? "true" : "false";

      if (button.dataset.charging !== "true") {
        state.textContent = runtime.hasActiveAction
          ? "Action en cours"
          : preview.ok
            ? "Disponible"
            : OUTCOME_LABELS[preview.outcome] ?? preview.outcome;
      }
    }
  }

  function renderReactionAvailability() {
    for (const { skill, button, state } of reactionRefs.values()) {
      const preview = runtime.previewReaction(skill);
      button.disabled = !preview.ok;
      button.dataset.available = preview.ok ? "true" : "false";

      if (button.dataset.charging !== "true") {
        state.textContent = preview.ok
          ? "Réagir maintenant"
          : OUTCOME_LABELS[preview.outcome] ?? preview.outcome;
      }
    }
  }

  function render(state = session.snapshot()) {
    if (disposed) {
      return;
    }
    lastState = state;
    renderHp(state);
    renderEnergy(state);
    renderMovement(state);
    renderOffensiveAvailability();
    renderReactionAvailability();
  }

  const runtime = createCombatRuntime({
    session,
    onState(state) {
      render(state);
    },
    onProgress(progress) {
      if (!progress.skillId) {
        resetChargeBars();
        renderReactionAvailability();
        return;
      }

      for (const [skillId, refs] of skillRefs) {
        if (skillId === progress.skillId) {
          refs.charge.value = progress.chargeProgress;
          refs.button.dataset.charging = "true";
          refs.state.textContent =
            progress.phase === "preparation"
              ? `Charge ${Math.round(progress.chargeProgress * 100)} %`
              : progress.phase === "travel"
                ? "En trajet"
                : "Impact";

          setActorCharge(
            "maraileron",
            progress.phase === "preparation" ? progress.chargeProgress : 0,
            progress.phase === "preparation"
          );
        }
      }

      if (progress.reaction) {
        const refs = reactionRefs.get(progress.reaction.skillId);
        if (refs) {
          refs.charge.value = progress.reaction.progress;
          refs.button.dataset.charging = "true";
          refs.state.textContent =
            progress.reaction.progress < 1
              ? `Réaction ${Math.round(progress.reaction.progress * 100)} %`
              : "Prête";

          setActorCharge(
            "braisombre",
            progress.reaction.progress,
            progress.reaction.progress < 1
          );
        }
      }

      renderReactionAvailability();
    },
    onRelease({ action }) {
      setActorCharge("maraileron", 0, false);
      presenter.presentRelease({
        action,
        actorSlot: "player",
        targetSlot: "opponent"
      });
      writeLog(
        `${action.skill.name} est lancée.`,
        "accent"
      );
    },
    onResolved(resolution) {
      presenter.presentOutcome({
        resolution,
        actorSlot: "player",
        targetSlot: "opponent"
      });

      const name = offensiveSkills.find(
        (skill) =>
          resolution.events.some(
            (event) => event.skillId === skill.id
          )
      )?.name ?? "Capacité";

      writeLog(
        `${name} → ${OUTCOME_LABELS[resolution.outcome] ?? resolution.outcome}.`,
        resolution.outcome === "hit" ? "ok" : "accent"
      );

      resetChargeBars();
      render(session.snapshot());
    }
  });

  for (const button of movementButtons) {
    listen(button, "click", () => {
      const actorId = moverSelect.value;
      const result = session.move(actorId, button.dataset.combatMove);

      if (!result.ok) {
        writeLog(
          `${fighterLabel(actorId)} : énergie insuffisante pour ce déplacement (${formatEnergy(result.cost)}⚡).`,
          "warn"
        );
        render(session.snapshot());
        return;
      }

      distancePresenter.presentMovement({
        result,
        actorSlot: actorId === "maraileron" ? "player" : "opponent"
      });

      writeLog(
        `${fighterLabel(actorId)} se déplace vers ${DISTANCE_LABELS[result.state.distance]} · -${formatEnergy(result.cost)}⚡.`,
        "info"
      );
      render(result.state);
    });
  }

  listen(moverSelect, "change", () => render(session.snapshot()));

  listen(resetButton, "click", () => {
    runtime.cancelActive();
    presenter.cancelPending();
    fx.cancelAll();
    session.reset();
    distancePresenter.reset();
    visuals.cancelFor("player");
    visuals.cancelFor("opponent");
    resetChargeBars();
    logList.replaceChildren();
    writeLog("Combat de test réinitialisé.", "info");
    render(session.snapshot());
  });

  createCards();
  runtime.start();
  render(session.snapshot());

  writeLog(
    "Énergie à 0 : attendez les premiers ticks puis testez déplacement, charge et réaction.",
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
      runtime.dispose();
      presenter.dispose();
      fx.dispose();
    }
  });
}
