import { normalizeSkillDefinition } from "../contracts/skill-definition.js";
import { normalizeCombatCommandDefinition } from "../contracts/combat-command-definition.js";
import { normalizeOpponentAiPolicy } from "../contracts/opponent-ai-policy.js";
import { createCombatSession } from "../core/combat/combat-session.js";
import { createCombatRuntime } from "../core/combat/combat-runtime.js";
import { createRosterSession } from "../core/combat/roster-session.js";
import { createOpponentDecisionController } from "../core/combat/opponent-decision-controller.js";
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
  roster: new URL(
    "../../data/combat/rosters/demo-2v2.roster.json",
    import.meta.url
  ),
  skills: Object.freeze({
    fireball: new URL(
      "../../data/combat/skills/fireball.skill.json",
      import.meta.url
    ),
    claw: new URL(
      "../../data/combat/skills/claw.skill.json",
      import.meta.url
    ),
    aerialDive: new URL(
      "../../data/combat/skills/aerial-dive.skill.json",
      import.meta.url
    ),
    teleportStrike: new URL(
      "../../data/combat/skills/teleport-strike.skill.json",
      import.meta.url
    )
  }),
  aiPolicy: new URL(
    "../../data/combat/ai/linear-opponent.policy.json",
    import.meta.url
  ),
  commands: Object.freeze({
    item: new URL(
      "../../data/combat/commands/item.command.json",
      import.meta.url
    ),
    recall: new URL(
      "../../data/combat/commands/recall.command.json",
      import.meta.url
    ),
    summon: new URL(
      "../../data/combat/commands/summon.command.json",
      import.meta.url
    )
  })
});

const DISTANCE_LABELS = Object.freeze({
  short: "Courte",
  medium: "Moyenne",
  long: "Longue"
});

const FORM_LABELS = Object.freeze({
  contact: "Contact",
  projectile: "Projectile",
  beam: "Rayon",
  area: "Zone",
  self: "Personnel",
  aura: "Aura"
});

const APPROACH_LABELS = Object.freeze({
  none: null,
  ground: "Sol",
  aerial: "Aérien",
  teleport: "Téléportation"
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
  reflected: "renvoyée",
  immune: "immunisée",
  countered: "contrée",
  evaded: "esquivée",
  completed: "terminée",
  interrupted: "interrompue",
  out_of_range: "hors portée",
  insufficient_energy: "énergie insuffisante",
  action_in_progress: "action déjà en cours",
  no_active_member: "aucun monstre actif",
  active_member_present: "rappelle d'abord ton monstre",
  no_reserve_selected: "aucun monstre de réserve sélectionné"
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
    throw new Error(`Combat game element not found: ${selector}`);
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
  const parts = [FORM_LABELS[skill.form] ?? skill.form];
  if (skill.element) {
    parts.push(ELEMENT_LABELS[skill.element] ?? skill.element);
  }
  const approach = APPROACH_LABELS[skill.approachMode];
  if (approach) {
    parts.push(approach);
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

function commandTimingText(command) {
  return [
    `${formatEnergy(command.energyCost)}⚡`,
    `charge ${formatSeconds(command.preparationMs)}`
  ].join(" · ");
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
    typeof visuals.setCreatureFor !== "function" ||
    typeof visuals.setSlotVisible !== "function" ||
    typeof visuals.getCreatureDescriptor !== "function"
  ) {
    throw new TypeError("visuals must provide roster-aware visual controls");
  }

  const [
    maraileronConfig,
    braisombreConfig,
    rosterData,
    fireballRaw,
    clawRaw,
    aerialDiveRaw,
    teleportStrikeRaw,
    aiPolicyRaw,
    itemRaw,
    recallRaw,
    summonRaw
  ] = await Promise.all([
    fetchJson(DATA_URLS.fighters.maraileron, fetchImpl),
    fetchJson(DATA_URLS.fighters.braisombre, fetchImpl),
    fetchJson(DATA_URLS.roster, fetchImpl),
    fetchJson(DATA_URLS.skills.fireball, fetchImpl),
    fetchJson(DATA_URLS.skills.claw, fetchImpl),
    fetchJson(DATA_URLS.skills.aerialDive, fetchImpl),
    fetchJson(DATA_URLS.skills.teleportStrike, fetchImpl),
    fetchJson(DATA_URLS.aiPolicy, fetchImpl),
    fetchJson(DATA_URLS.commands.item, fetchImpl),
    fetchJson(DATA_URLS.commands.recall, fetchImpl),
    fetchJson(DATA_URLS.commands.summon, fetchImpl)
  ]);

  const skills = Object.freeze([
    normalizeSkillDefinition(fireballRaw),
    normalizeSkillDefinition(clawRaw),
    normalizeSkillDefinition(aerialDiveRaw),
    normalizeSkillDefinition(teleportStrikeRaw)
  ]);

  const offensiveSkillsById = Object.freeze(
    Object.fromEntries(
      skills.map((skill) => [skill.id, skill])
    )
  );

  const reactionSkillsById = Object.freeze({});

  const opponentAiPolicy =
    normalizeOpponentAiPolicy(aiPolicyRaw);

  const commands = Object.freeze({
    item: normalizeCombatCommandDefinition(itemRaw),
    recall: normalizeCombatCommandDefinition(recallRaw),
    summon: normalizeCombatCommandDefinition(summonRaw)
  });

  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileronConfig, id: "player" },
      { ...braisombreConfig, id: "opponent" }
    ]
  });

  const roster = createRosterSession({
    combatSession: session,
    roster: rosterData,
    fighterConfigs: {
      maraileron: maraileronConfig,
      braisombre: braisombreConfig
    }
  });

  const arena = requiredElement(root, "[data-combat-arena]");
  const status = requiredElement(root, "[data-combat-live-status]");
  const skillContainer = requiredElement(root, "[data-combat-skills]");
  const itemContainer = requiredElement(root, "[data-combat-items]");
  const teamActionContainer = requiredElement(
    root,
    "[data-combat-team-actions]"
  );
  const playerReserve = requiredElement(
    root,
    '[data-roster-reserve="player"]'
  );
  const opponentReserve = requiredElement(
    root,
    '[data-roster-reserve="opponent"]'
  );
  const teamSelectionLabel = requiredElement(
    root,
    "[data-team-selection]"
  );

  const fighterContainers = {
    player: requiredElement(root, '[data-demo-slot="player"]'),
    opponent: requiredElement(root, '[data-demo-slot="opponent"]')
  };

  const hpRefs = {
    player: {
      bar: requiredElement(root, '[data-combat-hp="player"]'),
      value: requiredElement(root, '[data-combat-hp-value="player"]')
    },
    opponent: {
      bar: requiredElement(root, '[data-combat-hp="opponent"]'),
      value: requiredElement(root, '[data-combat-hp-value="opponent"]')
    }
  };

  const fighterNameRefs = {
    player: requiredElement(root, '[data-combat-name="player"]'),
    opponent: requiredElement(root, '[data-combat-name="opponent"]')
  };

  const chargeRefs = {
    player: {
      bar: requiredElement(
        root,
        '[data-combat-actor-charge="player"]'
      ),
      name: requiredElement(
        root,
        '[data-combat-charge-name="player"]'
      ),
      time: requiredElement(
        root,
        '[data-combat-charge-time="player"]'
      )
    },
    opponent: {
      bar: requiredElement(
        root,
        '[data-combat-actor-charge="opponent"]'
      ),
      name: requiredElement(
        root,
        '[data-combat-charge-name="opponent"]'
      ),
      time: requiredElement(
        root,
        '[data-combat-charge-time="opponent"]'
      )
    }
  };

  const playerEnergy = {
    bar: requiredElement(root, '[data-combat-energy="player"]'),
    value: requiredElement(root, '[data-combat-energy-value="player"]')
  };

  const movementButtons = [
    ...root.querySelectorAll("[data-combat-move]")
  ];

  const menus = [...root.querySelectorAll("[data-action-menu]")];
  const cleanups = [];
  let disposed = false;
  let koTransitionPending = false;
  let lastState = session.snapshot();
  let opponentAi = null;
  let aiWaitingForEnergy = false;
  let aiDecisionInProgress = false;

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
  const commandRefs = new Map();

  function listen(element, type, handler) {
    element.addEventListener(type, handler);
    cleanups.push(() =>
      element.removeEventListener(type, handler)
    );
  }

  function closeMenus(except = null) {
    for (const menu of menus) {
      if (menu !== except) {
        menu.open = false;
      }
    }
  }

  function setStatus(message, tone = "info") {
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function setCharge({
    slotId = "player",
    value = 0,
    active = false,
    actionName = null,
    remainingMs = 0
  } = {}) {
    const refs = chargeRefs[slotId];
    refs.bar.value = Math.max(
      0,
      Math.min(1, Number(value) || 0)
    );
    refs.bar.dataset.active = active ? "true" : "false";
    refs.name.parentElement.dataset.active =
      active ? "true" : "false";
    refs.name.textContent = active && actionName
      ? actionName
      : "Prêt";
    refs.time.textContent =
      active && Number(remainingMs) > 0
        ? `${(remainingMs / 1000).toFixed(1)} s`
        : "";
  }

  function createActionButton({
    title,
    meta,
    timing,
    className = ""
  }) {
    const button = root.ownerDocument.createElement("button");
    button.type = "button";
    button.className =
      `action-option ${className}`.trim();

    const titleNode =
      root.ownerDocument.createElement("strong");
    titleNode.textContent = title;

    const metaNode =
      root.ownerDocument.createElement("span");
    metaNode.textContent = meta;

    const timingNode =
      root.ownerDocument.createElement("small");
    timingNode.textContent = timing;

    button.append(titleNode, metaNode, timingNode);
    return button;
  }

  function createSkillButtons() {
    for (const skill of skills) {
      const button = createActionButton({
        title: skill.name,
        meta: skillMetaText(skill),
        timing: skillTimingText(skill),
        className: "action-option--skill"
      });
      button.dataset.combatSkill = skill.id;
      skillContainer.append(button);
      skillRefs.set(skill.id, { button, skill });

      listen(button, "click", () => {
        const rosterState = roster.snapshot();
        if (!rosterState.player.activeMemberId) {
          setStatus("Invoque d'abord un monstre.", "warn");
          return;
        }

        const result = runtime.startSkill({
          actorId: "player",
          targetId: "opponent",
          skill
        });

        if (!result.ok) {
          setStatus(
            OUTCOME_LABELS[result.outcome] ??
              result.outcome,
            "warn"
          );
          render();
          return;
        }

        closeMenus();

        const reactionDecision =
          opponentAi?.maybeReactToActiveAction();

        if (reactionDecision?.status === "reacted") {
          setStatus(
            `${skill.name} se prépare — ${reactionDecision.skillName} adverse en réaction.`,
            "accent"
          );
        } else {
          setStatus(
            `${skill.name} se prépare…`,
            "accent"
          );
        }
        render();
      });
    }
  }

  function startCommand(command) {
    const result = runtime.startCommand({
      actorId: "player",
      command
    });

    if (!result.ok) {
      setStatus(
        OUTCOME_LABELS[result.outcome] ??
          result.outcome,
        "warn"
      );
      render();
      return;
    }

    closeMenus();
    setStatus(
      `${command.name} se prépare…`,
      "accent"
    );
    render();
  }

  function createCommandButtons() {
    const itemButton = createActionButton({
      title: commands.item.name,
      meta: "Soin +20 PV",
      timing: commandTimingText(commands.item),
      className: "action-option--item"
    });
    itemButton.dataset.combatCommand = "item";
    itemContainer.append(itemButton);
    commandRefs.set("item", {
      button: itemButton,
      command: commands.item
    });
    listen(itemButton, "click", () =>
      startCommand(commands.item)
    );

    for (const command of [
      commands.recall,
      commands.summon
    ]) {
      const button = createActionButton({
        title: command.name,
        meta:
          command.kind === "recall"
            ? "Ranger le monstre actif"
            : "Envoyer le monstre sélectionné",
        timing: commandTimingText(command),
        className: "action-option--team"
      });
      button.dataset.combatCommand = command.kind;
      teamActionContainer.append(button);
      commandRefs.set(command.kind, {
        button,
        command
      });
      listen(button, "click", () => startCommand(command));
    }
  }

  function reserveCard(member, teamId) {
    const node =
      root.ownerDocument.createElement(
        teamId === "player" ? "button" : "div"
      );
    if (teamId === "player") {
      node.type = "button";
    }
    node.className = "reserve-card";
    node.title = member.displayName;
    node.setAttribute("aria-label", member.displayName);
    node.dataset.memberId = member.id;
    node.dataset.active = member.active ? "true" : "false";
    node.dataset.selected =
      member.selected ? "true" : "false";

    const descriptor =
      visuals.getCreatureDescriptor(member.creatureId);

    const image =
      root.ownerDocument.createElement("img");
    image.src = descriptor.iconUrl;
    image.alt = "";
    image.className = "reserve-card__icon";

    const text =
      root.ownerDocument.createElement("span");
    text.className = "reserve-card__text";

    const name =
      root.ownerDocument.createElement("strong");
    name.textContent = member.displayName;

    const state =
      root.ownerDocument.createElement("small");
    state.textContent = member.active
      ? "Combat"
      : `${Math.round(member.hp)}/${Math.round(
          member.maxHp
        )} PV`;

    text.append(name, state);
    node.append(image, text);

    if (teamId === "player") {
      node.disabled = member.active;
    }

    return node;
  }

  function renderRoster() {
    const state = roster.snapshot();

    for (const slotId of ["player", "opponent"]) {
      const team = state[slotId];
      const activeMember = team.members.find(
        (member) => member.id === team.activeMemberId
      );
      fighterNameRefs[slotId].textContent =
        activeMember?.displayName ?? "—";
    }

    playerReserve.replaceChildren(
      ...state.player.members.map((member) =>
        reserveCard(member, "player")
      )
    );
    opponentReserve.replaceChildren(
      ...state.opponent.members.map((member) =>
        reserveCard(member, "opponent")
      )
    );

    const selected = state.player.members.find(
      (member) =>
        member.id ===
        state.player.selectedReserveMemberId
    );

    teamSelectionLabel.textContent = selected
      ? `Réserve sélectionnée : ${selected.displayName}`
      : "Aucune réserve sélectionnée";
  }

  function renderHp(state) {
    for (const slotId of ["player", "opponent"]) {
      const fighter = state.fighters[slotId];
      hpRefs[slotId].bar.max = fighter.maxHp;
      hpRefs[slotId].bar.value = fighter.hp;
      hpRefs[slotId].value.textContent =
        `${Math.round(fighter.hp)} / ${Math.round(
          fighter.maxHp
        )} PV`;
    }
  }

  function renderEnergy(state) {
    const fighter = state.fighters.player;
    playerEnergy.bar.max = fighter.maxEnergy;
    playerEnergy.bar.value = fighter.energy;
    playerEnergy.value.textContent =
      `${formatEnergy(fighter.energy)} / ${formatEnergy(
        fighter.maxEnergy
      )}⚡`;
  }

  function renderMovement(state) {
    const active =
      roster.snapshot().player.activeMemberId !== null;

    for (const button of movementButtons) {
      const target = button.dataset.combatMove;
      const preview = session.previewMovement(
        "player",
        target
      );
      const current = target === state.distance;

      button.disabled =
        koTransitionPending ||
        runtime.hasActiveActionFor("player") ||
        !active ||
        current ||
        !preview.ok;
      button.textContent = current
        ? `${DISTANCE_LABELS[target]} · ici`
        : `${DISTANCE_LABELS[target]} · ${formatEnergy(
            preview.cost
          )}⚡`;
    }
  }

  function renderAvailability() {
    const rosterState = roster.snapshot();
    const hasActive =
      rosterState.player.activeMemberId !== null;
    const hasOpponent =
      rosterState.opponent.activeMemberId !== null;

    for (const { skill, button } of skillRefs.values()) {
      const preview = hasActive && hasOpponent
        ? session.previewSkill({
            actorId: "player",
            targetId: "opponent",
            skill
          })
        : { ok: false };

      button.disabled =
        koTransitionPending ||
        runtime.hasActiveActionFor("player") ||
        !preview.ok;
    }

    const itemRef = commandRefs.get("item");
    if (itemRef) {
      const preview = hasActive
        ? session.previewCommand({
            actorId: "player",
            command: itemRef.command
          })
        : { ok: false };
      itemRef.button.disabled =
        runtime.hasActiveActionFor("player") || !preview.ok;
    }

    const recallRef = commandRefs.get("recall");
    if (recallRef) {
      const preview = hasActive
        ? session.previewCommand({
            actorId: "player",
            command: recallRef.command
          })
        : { ok: false };
      recallRef.button.disabled =
        runtime.hasActiveActionFor("player") || !preview.ok;
    }

    const summonRef = commandRefs.get("summon");
    if (summonRef) {
      const hasSelection = Boolean(
        rosterState.player.selectedReserveMemberId
      );
      const preview =
        !hasActive && hasSelection
          ? session.previewCommand({
              actorId: "player",
              command: summonRef.command
            })
          : { ok: false };

      summonRef.button.disabled =
        runtime.hasActiveActionFor("player") || !preview.ok;
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
    renderAvailability();
  }

  function projectSlotToCurrentDistance(slotId) {
    const distance = session.snapshot().distance;
    distancePresenter.presentMovement({
      result: {
        ok: true,
        outcome: "moved",
        events: [
          {
            type: "distance-changed",
            from: distance,
            to: distance
          }
        ]
      },
      actorSlot: slotId
    });
  }

  function projectPlayerToCurrentDistance() {
    projectSlotToCurrentDistance("player");
  }

  function projectOpponentToCurrentDistance() {
    projectSlotToCurrentDistance("opponent");
  }

  async function replaceAfterKo(slotId, presentation) {
    if (
      !presentation?.ko ||
      presentation.koActorId !== slotId
    ) {
      return null;
    }

    koTransitionPending = true;
    renderAvailability();

    await presentation.finished;

    if (disposed) {
      return null;
    }

    const result = roster.replaceKnockedOut(slotId);

    if (!result.ok) {
      koTransitionPending = false;
      setStatus(
        OUTCOME_LABELS[result.outcome] ?? result.outcome,
        "warn"
      );
      renderAvailability();
      return result;
    }

    if (result.outcome === "team_defeated") {
      visuals.setSlotVisible(slotId, false);
      setStatus(
        slotId === "opponent"
          ? "Équipe adverse vaincue."
          : "Votre équipe est vaincue.",
        slotId === "opponent" ? "ok" : "warn"
      );
    } else if (result.outcome === "ko_replaced") {
      visuals.setCreatureFor(
        slotId,
        result.creatureId,
        { displayName: result.displayName }
      );
      visuals.setSlotVisible(slotId, true);
      projectSlotToCurrentDistance(slotId);
      setStatus(
        slotId === "opponent"
          ? `${result.displayName} adverse entre en combat.`
          : `${result.displayName} entre en combat.`,
        "accent"
      );
    }

    koTransitionPending = false;
    renderRoster();
    render(session.snapshot());
    return result;
  }

  function runOpponentTurn() {
    if (
      !opponentAi ||
      disposed ||
      koTransitionPending ||
      aiDecisionInProgress
    ) {
      return Object.freeze({
        status: "waiting",
        reason: "transition_pending"
      });
    }

    aiDecisionInProgress = true;

    try {
      const decision = opponentAi.takeTurn();
      aiWaitingForEnergy =
        decision.status === "saving";

      if (decision.status === "moved") {
        distancePresenter.presentMovement({
          result: decision.result,
          actorSlot: decision.actorId
        });
        setStatus(
          `Adversaire : distance ${DISTANCE_LABELS[decision.result.state.distance]}.`,
          "info"
        );
        render(decision.result.state);
      } else if (decision.status === "skill_started") {
        setStatus(
          `${decision.skillName} adverse se prépare…`,
          "accent"
        );
        render();
      } else if (decision.status === "saving") {
        setStatus(
          `Adversaire économise pour ${decision.skillName} · ${formatEnergy(decision.currentEnergy)}/${formatEnergy(decision.requiredEnergy)}⚡.`,
          "info"
        );
        render();
      }

      return decision;
    } finally {
      aiDecisionInProgress = false;
    }
  }

  async function finishSkillPresentation(
    resolution,
    presentation
  ) {
    if (presentation.ko && presentation.koActorId) {
      setStatus(
        presentation.koActorId === "opponent"
          ? "Adversaire KO… remplacement en cours."
          : "Votre monstre est KO… remplacement en cours.",
        "accent"
      );
      await replaceAfterKo(
        presentation.koActorId,
        presentation
      );
    } else {
      await presentation.finished;
    }

    if (
      !disposed &&
      resolution.actorId === "player"
    ) {
      runOpponentTurn();
    }
  }

  function applyRosterResolution(resolution) {
    if (
      resolution.actionType !== "command" ||
      !["recall", "summon"].includes(
        resolution.commandKind
      )
    ) {
      return null;
    }

    const result = roster.applyCommandResolution(
      "player",
      resolution
    );

    if (!result.ok) {
      setStatus(
        OUTCOME_LABELS[result.outcome] ??
          result.outcome,
        "warn"
      );
      return result;
    }

    if (result.outcome === "recalled") {
      visuals.setSlotVisible("player", false);
      setStatus(
        "Monstre rappelé. Choisis une réserve puis Invocation.",
        "accent"
      );
    }

    if (result.outcome === "summoned") {
      visuals.setCreatureFor(
        "player",
        result.creatureId,
        { displayName: result.displayName }
      );
      visuals.setSlotVisible("player", true);
      projectPlayerToCurrentDistance();
      setStatus(
        `${result.displayName} entre en combat.`,
        "ok"
      );
    }

    renderRoster();
    render(session.snapshot());
    return result;
  }

  const runtime = createCombatRuntime({
    session,
    onState(state) {
      render(state);

      if (
        aiWaitingForEnergy &&
        !runtime.hasActiveActionFor("opponent") &&
        !koTransitionPending &&
        !aiDecisionInProgress
      ) {
        runOpponentTurn();
      }
    },
    onProgress(progress) {
      if (!progress.actionId) {
        if (progress.actorId) {
          setCharge({ slotId: progress.actorId });
        } else {
          setCharge({ slotId: "player" });
          setCharge({ slotId: "opponent" });
        }
        renderAvailability();
        return;
      }

      setCharge({
        slotId: progress.actorId,
        value:
          progress.phase === "preparation"
            ? progress.chargeProgress
            : 0,
        active: progress.phase === "preparation",
        actionName: progress.actionName,
        remainingMs: progress.remainingPreparationMs
      });

      if (progress.reaction) {
        setCharge({
          slotId: progress.reaction.actorId,
          value: progress.reaction.progress,
          active:
            progress.reaction.remainingPreparationMs > 0,
          actionName: progress.reaction.actionName,
          remainingMs:
            progress.reaction.remainingPreparationMs
        });
      }

      renderAvailability();
    },
    onRelease({ action }) {
      setCharge({ slotId: action.actorId });

      if (action.actionType === "skill") {
        presenter.presentRelease({
          action,
          actorSlot: action.actorId,
          targetSlot: action.targetId
        });
        setStatus(
          action.actorId === "opponent"
            ? `${action.skill.name} adverse est lancé.`
            : `${action.skill.name} est lancé.`,
          "accent"
        );
      } else {
        setStatus(
          `${action.command.name} s'exécute.`,
          "accent"
        );
      }
    },
    onResolved(resolution) {
      setCharge({ slotId: resolution.actorId });

      if (resolution.actionType === "skill") {
        const presentation = presenter.presentOutcome({
          resolution,
          actorSlot: resolution.actorId,
          targetSlot: resolution.targetId
        });

        if (!presentation.ko) {
          const label =
            resolution.actorId === "opponent" &&
            resolution.outcome === "hit"
              ? "Votre monstre est touché"
              : resolution.outcome === "hit"
                ? "Impact réussi"
                : OUTCOME_LABELS[resolution.outcome] ??
                  resolution.outcome;

          setStatus(
            `${label}.`,
            resolution.outcome === "hit" ? "ok" : "info"
          );
        }

        void finishSkillPresentation(
          resolution,
          presentation
        );
      } else {
        const rosterResult =
          applyRosterResolution(resolution);

        if (!rosterResult) {
          setStatus(
            `${commands.item.name} terminé.`,
            "ok"
          );
        }

        runOpponentTurn();
      }

      renderRoster();
      render(session.snapshot());
    },
    onInterrupted(result) {
      setCharge({
        slotId: result.action?.actorId ?? "player"
      });
      setStatus(
        `Action ${OUTCOME_LABELS[result.outcome] ?? result.outcome}.`,
        "warn"
      );
      render();
    }
  });

  opponentAi = createOpponentDecisionController({
    session,
    runtime,
    roster,
    policy: opponentAiPolicy,
    skillsById: offensiveSkillsById,
    reactionsById: reactionSkillsById
  });

  listen(playerReserve, "click", (event) => {
    const button = event.target.closest?.("[data-member-id]");
    if (!button || button.disabled) {
      return;
    }

    const rosterState = roster.snapshot();
    const member = rosterState.player.members.find(
      (item) => item.id === button.dataset.memberId
    );
    if (!member) {
      return;
    }

    const result = roster.selectReserve(
      "player",
      member.id
    );

    if (result.ok) {
      setStatus(
        `${member.displayName} sélectionné en réserve.`,
        "info"
      );
      renderRoster();
      renderAvailability();
    }
  });

  for (const button of movementButtons) {
    listen(button, "click", () => {
      const rosterState = roster.snapshot();
      if (!rosterState.player.activeMemberId) {
        setStatus("Aucun monstre actif.", "warn");
        return;
      }

      const result = session.move(
        "player",
        button.dataset.combatMove
      );

      if (!result.ok) {
        setStatus(
          OUTCOME_LABELS[result.outcome] ??
            result.outcome,
          "warn"
        );
        return;
      }

      distancePresenter.presentMovement({
        result,
        actorSlot: "player"
      });

      setStatus(
        `Distance ${DISTANCE_LABELS[result.state.distance]}.`,
        "info"
      );
      render(result.state);
      runOpponentTurn();
    });
  }

  for (const menu of menus) {
    listen(menu, "toggle", () => {
      if (menu.open) {
        closeMenus(menu);
      }
    });
  }

  createSkillButtons();
  createCommandButtons();

  visuals.setCreatureFor(
    "player",
    "maraileron",
    { displayName: "Marai" }
  );
  visuals.setCreatureFor(
    "opponent",
    "braisombre",
    { displayName: "Drakon" }
  );

  renderRoster();
  runtime.start();
  render(lastState);

  setStatus(
    "Marai contre Drakon — choisis une action.",
    "info"
  );

  return Object.freeze({
    snapshot: () => session.snapshot(),
    rosterSnapshot: () => roster.snapshot(),
    aiSnapshot: () => opponentAi.snapshot(),
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
