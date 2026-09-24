import { normalizeSkillDefinition } from "../contracts/skill-definition.js";
import { normalizeTimedActionDefinition } from "../contracts/timed-action-definition.js";
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
    ),
    reserve: new URL(
      "../../data/combat/fighters/braisombre-ally.combat.json",
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
    ),
    stunInterrupt: new URL(
      "../../data/combat/skills/stun-interrupt.skill.json",
      import.meta.url
    )
  }),
  actions: Object.freeze({
    potion: new URL(
      "../../data/combat/actions/potion.action.json",
      import.meta.url
    ),
    recall: new URL(
      "../../data/combat/actions/recall.action.json",
      import.meta.url
    ),
    summon: new URL(
      "../../data/combat/actions/summon.action.json",
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

const ACTION_KIND_LABELS = Object.freeze({
  item: "Objet",
  recall: "Rappel",
  summon: "Invocation"
});

const OUTCOME_LABELS = Object.freeze({
  hit: "touche",
  blocked: "bloquée",
  reflected: "renvoyée",
  immune: "annulée par immunité",
  countered: "contrée",
  interrupted: "interrompue par Stun",
  item: "objet utilisé",
  recall: "monstre rappelé",
  summon: "monstre invoqué",
  out_of_range: "hors portée",
  insufficient_energy: "énergie insuffisante",
  action_in_progress: "une action est déjà en cours",
  no_action: "aucune action à interrompre",
  reaction_already_selected: "une réaction est déjà engagée",
  no_effect: "cette réaction ne répond pas à cette action",
  too_late: "réaction trop lente",
  actor_not_active: "monstre non actif",
  target_not_active: "cible non active",
  recall_required: "rappel requis",
  reserve_unavailable: "réserve indisponible"
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

function utilityMetaText(action) {
  return [
    ACTION_KIND_LABELS[action.kind] ?? action.kind,
    `${formatEnergy(action.energyCost)}⚡`,
    `charge ${formatSeconds(action.preparationMs)}`
  ].join(" · ");
}

function fighterLabel(id) {
  if (id === "maraileron") return "Maraileron";
  if (id === "braisombre") return "Braisombre";
  if (id === "braisombre-ally") return "Braisombre allié";
  return id;
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
    typeof visuals.cancelFor !== "function" ||
    typeof visuals.setSlotEmpty !== "function" ||
    typeof visuals.loadBundledCreature !== "function"
  ) {
    throw new TypeError(
      "visuals must expose combat presentation and slot lifecycle methods"
    );
  }

  const [
    maraileronConfig,
    braisombreConfig,
    reserveConfig,
    fireballRaw,
    clawRaw,
    mirrorShieldRaw,
    fireImmunityRaw,
    contactCounterRaw,
    stunInterruptRaw,
    potionRaw,
    recallRaw,
    summonRaw
  ] = await Promise.all([
    fetchJson(DATA_URLS.fighters.maraileron, fetchImpl),
    fetchJson(DATA_URLS.fighters.braisombre, fetchImpl),
    fetchJson(DATA_URLS.fighters.reserve, fetchImpl),
    fetchJson(DATA_URLS.skills.fireball, fetchImpl),
    fetchJson(DATA_URLS.skills.claw, fetchImpl),
    fetchJson(DATA_URLS.skills.mirrorShield, fetchImpl),
    fetchJson(DATA_URLS.skills.fireImmunity, fetchImpl),
    fetchJson(DATA_URLS.skills.contactCounter, fetchImpl),
    fetchJson(DATA_URLS.skills.stunInterrupt, fetchImpl),
    fetchJson(DATA_URLS.actions.potion, fetchImpl),
    fetchJson(DATA_URLS.actions.recall, fetchImpl),
    fetchJson(DATA_URLS.actions.summon, fetchImpl)
  ]);

  const offensiveSkills = Object.freeze([
    normalizeSkillDefinition(fireballRaw),
    normalizeSkillDefinition(clawRaw)
  ]);

  const reactionSkills = Object.freeze([
    normalizeSkillDefinition(mirrorShieldRaw),
    normalizeSkillDefinition(fireImmunityRaw),
    normalizeSkillDefinition(contactCounterRaw),
    normalizeSkillDefinition(stunInterruptRaw)
  ]);

  const utilityActions = Object.freeze([
    normalizeTimedActionDefinition(potionRaw),
    normalizeTimedActionDefinition(recallRaw),
    normalizeTimedActionDefinition(summonRaw)
  ]);

  const session = createCombatSession({
    distance: "medium",
    fighters: [
      maraileronConfig,
      braisombreConfig,
      reserveConfig
    ]
  });

  const arena = requiredElement(root, "[data-combat-arena]");
  const moverSelect = requiredElement(root, "[data-combat-mover]");
  const skillContainer = requiredElement(root, "[data-combat-skills]");
  const reactionContainer = requiredElement(root, "[data-combat-reactions]");
  const utilityContainer = requiredElement(root, "[data-combat-utilities]");
  const logList = requiredElement(root, "[data-combat-log]");
  const liveStatus = requiredElement(root, "[data-combat-live-status]");
  const resetButton = requiredElement(root, "[data-combat-reset]");
  const playerEnergyName = requiredElement(
    root,
    '[data-combat-energy-name="player"]'
  );

  const fighterContainers = {
    player: requiredElement(root, '[data-demo-slot="player"]'),
    opponent: requiredElement(root, '[data-demo-slot="opponent"]')
  };

  const actorChargeRefs = {
    player: requiredElement(
      root,
      '[data-combat-actor-charge="maraileron"]'
    ),
    opponent: requiredElement(
      root,
      '[data-combat-actor-charge="braisombre"]'
    )
  };

  const hpRefs = {
    player: {
      bar: requiredElement(root, '[data-combat-hp="maraileron"]'),
      value: requiredElement(root, '[data-combat-hp-value="maraileron"]')
    },
    opponent: {
      bar: requiredElement(root, '[data-combat-hp="braisombre"]'),
      value: requiredElement(root, '[data-combat-hp-value="braisombre"]')
    }
  };

  const energyRefs = {
    player: {
      bar: requiredElement(root, '[data-combat-energy="maraileron"]'),
      value: requiredElement(root, '[data-combat-energy-value="maraileron"]'),
      rate: requiredElement(root, '[data-combat-energy-rate="maraileron"]')
    },
    opponent: {
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
  const utilityRefs = new Map();

  function listen(element, type, handler) {
    element.addEventListener(type, handler);
    cleanups.push(() => element.removeEventListener(type, handler));
  }

  function activePlayerId() {
    return session.fighterIdByPresence("player", "active");
  }

  function recalledPlayerId() {
    return session.fighterIdByPresence("player", "recalled");
  }

  function displayedPlayerId() {
    return activePlayerId() ?? recalledPlayerId() ?? "maraileron";
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

  function createActionCard({
    id,
    name,
    metaText,
    mode,
    ariaLabel
  }) {
    const button = root.ownerDocument.createElement("button");
    button.type = "button";
    button.className = `skill-card skill-card--${mode}`;
    button.dataset.combatAction = id;

    const nameNode = root.ownerDocument.createElement("strong");
    nameNode.textContent = name;

    const meta = root.ownerDocument.createElement("span");
    meta.className = "skill-card__meta";
    meta.textContent = metaText;

    const charge = root.ownerDocument.createElement("progress");
    charge.className = "skill-card__charge";
    charge.max = 1;
    charge.value = 0;
    charge.setAttribute("aria-label", ariaLabel);

    const state = root.ownerDocument.createElement("span");
    state.className = "skill-card__state";
    state.dataset.skillState = "";
    state.textContent = "En attente";

    button.append(nameNode, meta, charge, state);
    return { button, charge, state };
  }

  function setActorCharge(slot, value, active) {
    const bar = actorChargeRefs[slot];
    bar.value = Math.max(0, Math.min(1, Number(value) || 0));
    bar.dataset.active = active ? "true" : "false";
  }

  function resetChargeBars() {
    for (const refs of [
      ...skillRefs.values(),
      ...reactionRefs.values(),
      ...utilityRefs.values()
    ]) {
      refs.charge.value = 0;
      refs.button.dataset.charging = "false";
    }
    setActorCharge("player", 0, false);
    setActorCharge("opponent", 0, false);
  }

  function utilityActorId(action) {
    if (action.kind === "summon") {
      return recalledPlayerId();
    }
    return activePlayerId();
  }

  function createCards() {
    for (const skill of offensiveSkills) {
      const refs = createActionCard({
        id: skill.id,
        name: skill.name,
        metaText: skillMetaText(skill) + " · " + skillTimingText(skill),
        mode: "offense",
        ariaLabel: `Charge de ${skill.name}`
      });
      skillContainer.append(refs.button);
      skillRefs.set(skill.id, { ...refs, skill });

      listen(refs.button, "click", () => {
        const actorId = activePlayerId();
        const result = actorId
          ? runtime.startSkill({
              actorId,
              targetId: "braisombre",
              skill
            })
          : { ok: false, outcome: "actor_not_active" };

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

    for (const action of utilityActions) {
      const refs = createActionCard({
        id: action.id,
        name: action.name,
        metaText: utilityMetaText(action),
        mode: "utility",
        ariaLabel: `Charge de ${action.name}`
      });
      utilityContainer.append(refs.button);
      utilityRefs.set(action.id, { ...refs, action });

      listen(refs.button, "click", () => {
        const actorId = utilityActorId(action);
        const result = actorId
          ? runtime.startUtilityAction({
              actorId,
              definition: action
            })
          : {
              ok: false,
              outcome:
                action.kind === "summon"
                  ? "recall_required"
                  : "actor_not_active"
            };

        if (!result.ok) {
          writeLog(
            `${action.name} : ${OUTCOME_LABELS[result.outcome] ?? result.outcome}.`,
            "warn"
          );
          render(lastState);
          return;
        }

        refs.button.dataset.charging = "true";
        refs.state.textContent =
          `Charge ${formatSeconds(result.action.preparationMs)}`;
        writeLog(
          `${action.name} se prépare — cette charge peut être interrompue.`,
          "accent"
        );
        render(lastState);
      });
    }

    for (const skill of reactionSkills) {
      const refs = createActionCard({
        id: skill.id,
        name: skill.name,
        metaText: skillMetaText(skill) + " · " + skillTimingText(skill),
        mode: "reaction",
        ariaLabel: `Charge de ${skill.name}`
      });
      reactionContainer.append(refs.button);
      reactionRefs.set(skill.id, { ...refs, skill });

      listen(refs.button, "click", () => {
        const result = runtime.react(skill, "braisombre");

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
    const playerId = displayedPlayerId();
    const player = state.fighters[playerId];
    const opponent = state.fighters.braisombre;

    hpRefs.player.bar.max = player.maxHp;
    hpRefs.player.bar.value = player.hp;
    hpRefs.player.value.textContent =
      `${Math.round(player.hp)} / ${Math.round(player.maxHp)} PV`;

    hpRefs.opponent.bar.max = opponent.maxHp;
    hpRefs.opponent.bar.value = opponent.hp;
    hpRefs.opponent.value.textContent =
      `${Math.round(opponent.hp)} / ${Math.round(opponent.maxHp)} PV`;
  }

  function renderEnergy(state) {
    const playerId = displayedPlayerId();
    const player = state.fighters[playerId];
    const opponent = state.fighters.braisombre;

    playerEnergyName.textContent = fighterLabel(playerId);

    for (const [slot, fighter] of [
      ["player", player],
      ["opponent", opponent]
    ]) {
      const refs = energyRefs[slot];
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

      button.disabled = isCurrent || !preview.ok;
      button.dataset.affordable = preview.ok ? "true" : "false";
      button.textContent = isCurrent
        ? `${DISTANCE_LABELS[toDistance]} · ici`
        : preview.ok
          ? `${DISTANCE_LABELS[toDistance]} · ${formatEnergy(preview.cost)}⚡`
          : `${DISTANCE_LABELS[toDistance]}`;
    }
  }

  function renderOffensiveAvailability() {
    const actorId = activePlayerId();

    for (const { skill, button, state } of skillRefs.values()) {
      const preview = actorId
        ? session.previewSkill({
            actorId,
            targetId: "braisombre",
            skill
          })
        : { ok: false, outcome: "actor_not_active" };

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

  function renderUtilityAvailability() {
    for (const { action, button, state } of utilityRefs.values()) {
      const actorId = utilityActorId(action);
      const preview = actorId
        ? session.previewUtilityAction({
            actorId,
            definition: action
          })
        : {
            ok: false,
            outcome:
              action.kind === "summon"
                ? "recall_required"
                : "actor_not_active"
          };

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
      const preview = runtime.previewReaction(skill, "braisombre");
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
    renderUtilityAvailability();
    renderReactionAvailability();
  }

  const runtime = createCombatRuntime({
    session,
    onState(state) {
      render(state);
    },

    onProgress(progress) {
      if (!progress.actionId) {
        resetChargeBars();
        renderReactionAvailability();
        return;
      }

      if (progress.actionKind === "skill") {
        const refs = skillRefs.get(progress.skillId);
        if (refs) {
          refs.charge.value = progress.chargeProgress;
          refs.button.dataset.charging = "true";
          refs.state.textContent =
            progress.phase === "preparation"
              ? `Charge ${Math.round(progress.chargeProgress * 100)} %`
              : progress.phase === "travel"
                ? "En trajet"
                : "Impact";
        }
      } else {
        const refs = utilityRefs.get(progress.actionId);
        if (refs) {
          refs.charge.value = progress.chargeProgress;
          refs.button.dataset.charging = "true";
          refs.state.textContent =
            `Charge ${Math.round(progress.chargeProgress * 100)} %`;
        }
      }

      setActorCharge(
        "player",
        progress.phase === "preparation"
          ? progress.chargeProgress
          : 0,
        progress.phase === "preparation"
      );

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
            "opponent",
            progress.reaction.progress,
            progress.reaction.progress < 1
          );
        }
      }

      renderReactionAvailability();
    },

    onRelease({ action }) {
      setActorCharge("player", 0, false);

      if (action.kind === "skill") {
        presenter.presentRelease({
          action,
          actorSlot: "player",
          targetSlot: "opponent"
        });
        writeLog(
          `${action.skill.name} est lancée.`,
          "accent"
        );
        return;
      }

      writeLog(
        `${action.name} termine sa charge.`,
        "accent"
      );
    },

    onResolved(resolution) {
      if (
        ["hit", "reflected", "blocked", "immune", "countered", "interrupted"]
          .includes(resolution.outcome)
      ) {
        presenter.presentOutcome({
          resolution,
          actorSlot: "player",
          targetSlot: "opponent"
        });
      }

      if (resolution.outcome === "recall") {
        visuals.setSlotEmpty("player");
      }

      if (resolution.outcome === "summon") {
        visuals.loadBundledCreature(
          "player",
          "braisombre",
          "player"
        );
      }

      const actionEvent = resolution.events.find(
        (event) => event.actionId
      );
      const skillEvent = resolution.events.find(
        (event) => event.skillId
      );
      const name =
        utilityActions.find((action) => action.id === actionEvent?.actionId)?.name ??
        offensiveSkills.find((skill) => skill.id === skillEvent?.skillId)?.name ??
        "Action";

      writeLog(
        `${name} → ${OUTCOME_LABELS[resolution.outcome] ?? resolution.outcome}.`,
        resolution.outcome === "hit" || resolution.outcome === "item"
          ? "ok"
          : "accent"
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
          `${fighterLabel(actorId)} : ${OUTCOME_LABELS[result.outcome] ?? result.outcome}.`,
          "warn"
        );
        render(session.snapshot());
        return;
      }

      distancePresenter.presentMovement({
        result,
        actorSlot:
          stateSideSlot(result.state.fighters[actorId].side)
      });

      writeLog(
        `${fighterLabel(actorId)} se déplace vers ${DISTANCE_LABELS[result.state.distance]} · -${formatEnergy(result.cost)}⚡.`,
        "info"
      );
      render(result.state);
    });
  }

  function stateSideSlot(side) {
    return side === "opponent" ? "opponent" : "player";
  }

  listen(moverSelect, "change", () => render(session.snapshot()));

  listen(resetButton, "click", () => {
    runtime.cancelActive();
    presenter.cancelPending();
    fx.cancelAll();
    session.reset();
    distancePresenter.reset();
    visuals.loadBundledCreature("player", "maraileron", "player");
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
    "Énergie à 0 : les actions, objets, rappel et invocation partagent maintenant la même charge interruptible.",
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
