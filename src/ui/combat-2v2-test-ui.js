import { normalizeBattleFormatDefinition } from "../contracts/battle-format-definition.js";
import { normalizeSkillDefinition } from "../contracts/skill-definition.js";
import { createCombatSession } from "../core/combat/combat-session.js";
import { createCombatRuntime } from "../core/combat/combat-runtime.js";
import { createBattleActorAiController } from "../core/combat/battle-actor-ai-controller.js";
import {
  isSkillTargetAllowed,
  targetRelation
} from "../core/combat/targeting.js";
import { createCombatResolutionPresenter } from "../adapters/renderer/combat-resolution-presenter.js";
import { createDomSkillFxRenderer } from "../adapters/renderer/dom-skill-fx.js";
import { createDomCombatAudio } from "../adapters/audio/dom-combat-audio.js";

const DATA_URLS = Object.freeze({
  format: new URL(
    "../../data/combat/battle-formats/demo-coop-2v2.format.json",
    import.meta.url
  ),
  fighters: Object.freeze({
    maraileron: new URL(
      "../../data/combat/fighters/maraileron.combat.json",
      import.meta.url
    ),
    braisombre: new URL(
      "../../data/combat/fighters/braisombre.combat.json",
      import.meta.url
    ),
    loup_volcanique: new URL(
      "../../data/combat/fighters/loup_volcanique.combat.json",
      import.meta.url
    ),
    golem_moussu: new URL(
      "../../data/combat/fighters/golem_moussu.combat.json",
      import.meta.url
    )
  }),
  skills: Object.freeze([
    new URL("../../data/combat/skills/fireball.skill.json", import.meta.url),
    new URL("../../data/combat/skills/claw.skill.json", import.meta.url),
    new URL("../../data/combat/skills/aerial-dive.skill.json", import.meta.url),
    new URL("../../data/combat/skills/teleport-strike.skill.json", import.meta.url)
  ])
});

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
  }
  return response.json();
}

async function loadDefaultCombatModel({ fetchImpl, formatUrl }) {
  const [
    rawFormat,
    maraileron,
    braisombre,
    loupVolcanique,
    golemMoussu,
    ...rawSkills
  ] = await Promise.all([
    fetchJson(formatUrl, fetchImpl),
    fetchJson(DATA_URLS.fighters.maraileron, fetchImpl),
    fetchJson(DATA_URLS.fighters.braisombre, fetchImpl),
    fetchJson(DATA_URLS.fighters.loup_volcanique, fetchImpl),
    fetchJson(DATA_URLS.fighters.golem_moussu, fetchImpl),
    ...DATA_URLS.skills.map((url) => fetchJson(url, fetchImpl))
  ]);

  const battleFormat = normalizeBattleFormatDefinition(rawFormat);
  const normalizedSkills = Object.freeze(
    rawSkills.map((skill) => normalizeSkillDefinition(skill))
  );
  const skills = Object.freeze(
    Object.fromEntries(
      normalizedSkills.map((skill) => [skill.id, skill])
    )
  );
  const fighterConfigs = Object.freeze({
    maraileron,
    braisombre,
    loup_volcanique: loupVolcanique,
    golem_moussu: golemMoussu
  });
  const fighters = Object.freeze(
    battleFormat.actors.map((actor) => {
      const config = fighterConfigs[actor.fighterConfigId];
      if (!config) {
        throw new RangeError(
          `Unknown fighter config: ${actor.fighterConfigId}`
        );
      }
      return Object.freeze({
        ...config,
        id: actor.actorId
      });
    })
  );

  const skillList = (...ids) =>
    Object.freeze(ids.map((id) => skills[id]));

  const skillsByActor = Object.freeze({
    player: skillList(
      "fireball",
      "claw",
      "aerial-dive",
      "teleport-strike"
    ),
    ally: skillList(
      "claw",
      "fireball",
      "aerial-dive",
      "teleport-strike"
    ),
    opponent: skillList(
      "fireball",
      "claw",
      "aerial-dive",
      "teleport-strike"
    ),
    "opponent-b": skillList(
      "aerial-dive",
      "fireball",
      "claw",
      "teleport-strike"
    )
  });

  return Object.freeze({
    battleFormat,
    fighters,
    skills,
    skillsByActor
  });
}

function requireCombatModel(model) {
  if (!model || typeof model !== "object") {
    throw new TypeError("combatModel must be an object");
  }
  if (
    !model.battleFormat ||
    typeof model.battleFormat.actor !== "function" ||
    typeof model.battleFormat.teamOf !== "function"
  ) {
    throw new TypeError(
      "combatModel.battleFormat must be a normalized BattleFormatDefinition"
    );
  }
  if (!Array.isArray(model.fighters)) {
    throw new TypeError("combatModel.fighters must be an array");
  }
  if (!model.skills || typeof model.skills !== "object") {
    throw new TypeError("combatModel.skills must be an object");
  }
  if (!model.skillsByActor || typeof model.skillsByActor !== "object") {
    throw new TypeError("combatModel.skillsByActor must be an object");
  }
  return model;
}

function requiredElement(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`2v2 element not found: ${selector}`);
  }
  return element;
}

function formatEnergy(value) {
  const rounded = Math.round(Number(value) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function relationLabel(relation) {
  if (relation === "ally") {
    return "allié";
  }
  if (relation === "self") {
    return "vous";
  }
  return "ennemi";
}

export async function mountCoop2v2Test({
  root,
  visuals,
  presentationAssets = null,
  fetchImpl = fetch,
  formatUrl = DATA_URLS.format,
  combatModel = null
}) {
  if (!root || typeof root.querySelector !== "function") {
    throw new TypeError("root must provide querySelector()");
  }
  if (
    !visuals ||
    typeof visuals.setCreatureFor !== "function" ||
    typeof visuals.playEventFor !== "function" ||
    typeof visuals.playApproachFor !== "function" ||
    typeof visuals.getFxAnchorFor !== "function" ||
    typeof visuals.getCreatureDescriptor !== "function"
  ) {
    throw new TypeError(
      "visuals must provide generic actor slot controls and creature descriptors"
    );
  }

  const model = requireCombatModel(
    combatModel ??
      await loadDefaultCombatModel({ fetchImpl, formatUrl })
  );
  const format = model.battleFormat;
  const fighters = model.fighters;
  const skillsById = model.skills;
  const skillsByActor = model.skillsByActor;
  const localSkills =
    skillsByActor[format.localActorId] ?? Object.freeze([]);

  if (localSkills.length === 0) {
    throw new RangeError(
      `No skills configured for local actor: ${format.localActorId}`
    );
  }

  const session = createCombatSession({
    distance: "medium",
    fighters
  });

  const arena = requiredElement(root, "[data-combat-arena]");
  const status = requiredElement(root, "[data-combat-live-status]");
  const skillContainer = requiredElement(root, "[data-combat-skills]");
  const energyBar = requiredElement(
    root,
    `[data-combat-energy="${format.localActorId}"]`
  );
  const energyValue = requiredElement(
    root,
    `[data-combat-energy-value="${format.localActorId}"]`
  );

  const allyActorId =
    format.teams.players.find(
      (actorId) => actorId !== format.localActorId
    ) ?? null;
  if (!allyActorId) {
    throw new Error("2v2 format requires one ally actor");
  }
  const allyIcon = requiredElement(
    root,
    "[data-ally-creature-icon]"
  );

  const fighterContainers = Object.fromEntries(
    format.actors.map((actor) => [
      actor.actorId,
      requiredElement(
        root,
        `[data-demo-slot="${actor.actorId}"]`
      )
    ])
  );

  const motionAnchors = Object.fromEntries(
    format.actors.map((actor) => [
      actor.actorId,
      requiredElement(
        fighterContainers[actor.actorId],
        "[data-demo-motion]"
      )
    ])
  );

  const hpRefs = Object.fromEntries(
    format.actors.map((actor) => [
      actor.actorId,
      {
        bar: requiredElement(
          root,
          `[data-combat-hp="${actor.actorId}"]`
        ),
        value: requiredElement(
          root,
          `[data-combat-hp-value="${actor.actorId}"]`
        )
      }
    ])
  );

  const actionRefs = Object.fromEntries(
    format.actors.map((actor) => [
      actor.actorId,
      requiredElement(
        root,
        `[data-combat-action="${actor.actorId}"]`
      )
    ])
  );

  const chargeRefs = Object.fromEntries(
    format.actors.map((actor) => [
      actor.actorId,
      requiredElement(
        root,
        `[data-combat-actor-charge="${actor.actorId}"]`
      )
    ])
  );

  const cleanups = [];
  const skillRefs = new Map();
  const targetPulseTimers = new Map();
  let disposed = false;
  let selectedTargetId = format.teams.enemies[0];
  let runtime = null;
  let aiDecisionQueued = false;

  for (const actor of format.actors) {
    visuals.setCreatureFor(
      actor.actorId,
      actor.creatureId,
      { displayName: actor.displayName }
    );

    for (const node of root.querySelectorAll(
      `[data-combat-actor-name="${actor.actorId}"]`
    )) {
      node.textContent = actor.displayName;
    }
  }

  const allyDescriptor = visuals.getCreatureDescriptor(
    format.actor(allyActorId).creatureId
  );
  allyIcon.src = allyDescriptor.iconUrl;
  allyIcon.dataset.assetId = allyDescriptor.id;

  const combatAudio = createDomCombatAudio({
    resolveAudioAsset(assetId) {
      return presentationAssets?.audioAsset?.(assetId) ?? null;
    },
    presentationForSkill(skillId, context = {}) {
      return (
        presentationAssets?.presentationForSkill?.(
          skillId,
          context
        ) ?? null
      );
    }
  });

  const fx = createDomSkillFxRenderer({
    arena,
    anchors: motionAnchors,
    targetAnchors: fighterContainers,
    sourceAnchorFor(actorId, anchorName) {
      return visuals.getFxAnchorFor(actorId, anchorName);
    },
    presentationForSkill(skillId, context = {}) {
      return (
        presentationAssets?.presentationForSkill?.(
          skillId,
          context
        ) ?? null
      );
    }
  });

  const presenter = createCombatResolutionPresenter({
    visuals,
    fx,
    audio: combatAudio
  });

  function listen(element, type, handler) {
    element.addEventListener(type, handler);
    cleanups.push(() =>
      element.removeEventListener(type, handler)
    );
  }

  function setStatus(message, tone = "info") {
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function setCharge(actorId, {
    value = 0,
    active = false
  } = {}) {
    const bar = chargeRefs[actorId];
    if (!bar) {
      return;
    }

    bar.value = Math.max(
      0,
      Math.min(1, Number(value) || 0)
    );
    bar.dataset.active = active ? "true" : "false";
  }

  function actorState(actorId, state = session.snapshot()) {
    return state.fighters[actorId] ?? null;
  }

  function actorMeta(actorId) {
    return format.actor(actorId);
  }

  function isAlive(actorId, state = session.snapshot()) {
    return Number(actorState(actorId, state)?.hp) > 0;
  }

  function targetNodes(actorId) {
    return [
      ...root.querySelectorAll(
        `[data-target-actor="${actorId}"]`
      )
    ];
  }

  function clearTargetPulses() {
    for (const [actorId, timerId] of targetPulseTimers) {
      globalThis.clearTimeout(timerId);
      fighterContainers[actorId]?.removeAttribute(
        "data-target-pulse"
      );
    }
    targetPulseTimers.clear();
  }

  function pulseTarget(actorId) {
    const fighter = fighterContainers[actorId];
    if (!fighter) {
      return;
    }

    clearTargetPulses();
    fighter.dataset.targetPulse = "true";

    const timerId = globalThis.setTimeout(() => {
      targetPulseTimers.delete(actorId);
      if (!disposed) {
        fighter.removeAttribute("data-target-pulse");
      }
    }, 680);

    targetPulseTimers.set(actorId, timerId);
  }

  function renderTargetSelection() {
    for (const actor of format.actors) {
      const relation = targetRelation({
        format,
        actorId: format.localActorId,
        targetId: actor.actorId
      });

      for (const node of targetNodes(actor.actorId)) {
        node.dataset.targetSelected =
          actor.actorId === selectedTargetId
            ? "true"
            : "false";
        node.dataset.targetRelation = relation;
      }
    }
  }

  function renderState(state = session.snapshot()) {
    for (const actor of format.actors) {
      const fighter = state.fighters[actor.actorId];
      const refs = hpRefs[actor.actorId];
      refs.bar.max = fighter.maxHp;
      refs.bar.value = fighter.hp;
      refs.value.textContent =
        `${Math.round(fighter.hp)} / ${Math.round(fighter.maxHp)} PV`;

      const defeated = Number(fighter.hp) <= 0;
      for (const node of targetNodes(actor.actorId)) {
        node.dataset.defeated = defeated ? "true" : "false";
      }
    }

    const local = state.fighters[format.localActorId];
    energyBar.max = local.maxEnergy;
    energyBar.value = local.energy;
    energyValue.textContent =
      `${formatEnergy(local.energy)} / ${formatEnergy(local.maxEnergy)}⚡`;

    renderAvailability();
    renderTargetSelection();
  }

  function renderAvailability() {
    if (!runtime) {
      return;
    }

    const state = session.snapshot();
    const localAlive = isAlive(format.localActorId, state);
    const targetAlive = isAlive(selectedTargetId, state);

    for (const { button, skill } of skillRefs.values()) {
      const allowed = isSkillTargetAllowed({
        format,
        actorId: format.localActorId,
        targetId: selectedTargetId,
        skill
      });

      const preview =
        localAlive && targetAlive && allowed.ok
          ? session.previewSkill({
              actorId: format.localActorId,
              targetId: selectedTargetId,
              skill
            })
          : { ok: false };

      button.disabled =
        runtime.hasActiveActionFor(format.localActorId) ||
        !preview.ok;
    }
  }

  function selectTarget(actorId) {
    if (!actorMeta(actorId) || !isAlive(actorId)) {
      return;
    }

    selectedTargetId = actorId;
    const relation = targetRelation({
      format,
      actorId: format.localActorId,
      targetId: actorId
    });
    const actor = actorMeta(actorId);

    setStatus(
      `Cible : ${actor.displayName} · ${relationLabel(relation)}.`,
      relation === "enemy" ? "accent" : "info"
    );
    renderTargetSelection();
    pulseTarget(actorId);
    renderAvailability();
  }

  for (const actor of format.actors) {
    for (const node of targetNodes(actor.actorId)) {
      listen(node, "click", () => selectTarget(actor.actorId));
      listen(node, "keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectTarget(actor.actorId);
        }
      });
    }
  }

  function createSkillButton(skill) {
    const button = root.ownerDocument.createElement("button");
    button.type = "button";
    button.className = "action-option action-option--skill";
    button.dataset.combatSkill = skill.id;

    const presentation =
      presentationAssets?.presentationForSkill?.(skill.id) ?? null;
    if (presentation?.icon?.url) {
      const image = root.ownerDocument.createElement("img");
      image.className = "action-option__icon";
      image.src = presentation.icon.url;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      button.classList.add("action-option--with-icon");
      button.append(image);
    }

    const label = root.ownerDocument.createElement("strong");
    label.textContent = skill.name;
    button.append(label);

    listen(button, "click", () => {
      const allowed = isSkillTargetAllowed({
        format,
        actorId: format.localActorId,
        targetId: selectedTargetId,
        skill
      });

      if (!allowed.ok) {
        setStatus(
          `${skill.name} ne peut pas cibler ${relationLabel(allowed.relation)} pour le moment.`,
          "warn"
        );
        return;
      }

      const result = runtime.startSkill({
        actorId: format.localActorId,
        targetId: selectedTargetId,
        skill
      });

      if (!result.ok) {
        setStatus(
          result.outcome === "insufficient_energy"
            ? "Énergie insuffisante."
            : `Action impossible : ${result.outcome}.`,
          "warn"
        );
        renderAvailability();
        return;
      }

      const target = actorMeta(selectedTargetId);
      setStatus(
        `${skill.name} se prépare sur ${target.displayName}.`,
        "accent"
      );
      renderAvailability();
    });

    return button;
  }

  skillContainer.replaceChildren();
  for (const skill of localSkills) {
    const button = createSkillButton(skill);
    skillContainer.append(button);
    skillRefs.set(skill.id, { skill, button });
  }

  const aiControllers = [];


  const aiReadyAt = new Map([
    ["ally", 700],
    ["opponent", 1100],
    ["opponent-b", 1650]
  ]);

  function queueAiDecisions() {
    if (disposed || aiDecisionQueued || !runtime) {
      return;
    }

    aiDecisionQueued = true;
    queueMicrotask(() => {
      aiDecisionQueued = false;
      if (disposed) {
        return;
      }

      const state = session.snapshot();
      for (const controller of aiControllers) {
        const actorId = controller.snapshot().actorId;
        if (
          Number(state.elapsedMs) <
          Number(aiReadyAt.get(actorId) ?? 0)
        ) {
          continue;
        }

        const decision = controller.takeTurn();
        if (decision.status === "skill_started") {
          aiReadyAt.set(
            actorId,
            Number(state.elapsedMs) + 2200
          );
        } else if (decision.status === "saving") {
          aiReadyAt.set(
            actorId,
            Number(state.elapsedMs) + 500
          );
        }
      }
    });
  }

  runtime = createCombatRuntime({
    session,
    onState(state) {
      renderState(state);
      queueAiDecisions();
    },
    onStarted({ action }) {
      if (action.actionType !== "skill") {
        return;
      }
      presenter.presentPreparation({
        action,
        actorSlot: action.actorId
      });
      actionRefs[action.actorId].textContent =
        `${action.skill.name} · préparation`;
    },
    onProgress(progress) {
      if (!progress.actorId) {
        return;
      }

      const ref = actionRefs[progress.actorId];
      if (!ref) {
        return;
      }

      const preparing =
        Boolean(progress.actionId) &&
        progress.phase === "preparation";

      setCharge(progress.actorId, {
        value: preparing ? progress.chargeProgress : 0,
        active: preparing
      });

      if (!progress.actionId) {
        ref.textContent = "Prêt";
      } else if (preparing) {
        ref.textContent =
          `${progress.actionName} · ${(progress.remainingPreparationMs / 1000).toFixed(1)} s`;
      } else {
        ref.textContent =
          `${progress.actionName} · ${progress.phase}`;
      }

      if (progress.actorId === format.localActorId) {
        renderAvailability();
      }
    },
    onRelease({ action }) {
      if (action.actionType !== "skill") {
        return;
      }
      presenter.presentRelease({
        action,
        actorSlot: action.actorId,
        targetSlot: action.targetId
      });
      setCharge(action.actorId);
      actionRefs[action.actorId].textContent =
        `${action.skill.name} · lancé`;
    },
    onResolved(resolution) {
      const presentation = presenter.presentOutcome({
        resolution,
        actorSlot: resolution.actorId,
        targetSlot: resolution.targetId
      });

      setCharge(resolution.actorId);
      actionRefs[resolution.actorId].textContent = "Prêt";

      const actor = actorMeta(resolution.actorId);
      const target = actorMeta(resolution.targetId);
      if (resolution.outcome === "hit") {
        setStatus(
          `${actor?.displayName ?? resolution.actorId} touche ${target?.displayName ?? resolution.targetId}.`,
          "ok"
        );
      }

      void Promise.resolve(presentation.finished).then(() => {
        renderState();
      });

      aiReadyAt.set(
        resolution.actorId,
        Number(session.snapshot().elapsedMs) + 900
      );
      queueAiDecisions();
    },
    onInterrupted(result) {
      const actorId = result.action?.actorId;
      if (actorId && actionRefs[actorId]) {
        actionRefs[actorId].textContent = "Interrompu";
        setCharge(actorId);
      }
      presenter.cancelPreparation(actorId);
      renderState();
    }
  });

  for (const actor of format.actors) {
    if (
      actor.actorId === format.localActorId ||
      !actor.controllerId.startsWith("ai-")
    ) {
      continue;
    }

    const actorSkills = skillsByActor[actor.actorId] ?? [];
    if (actorSkills.length === 0) {
      continue;
    }

    const targetIds = format.actors
      .filter(
        (candidate) =>
          targetRelation({
            format,
            actorId: actor.actorId,
            targetId: candidate.actorId
          }) === "enemy"
      )
      .map((candidate) => candidate.actorId);

    aiControllers.push(
      createBattleActorAiController({
        session,
        runtime,
        actorId: actor.actorId,
        targetIds,
        skillIds: actorSkills.map((skill) => skill.id),
        skillsById
      })
    );
  }

  renderTargetSelection();
  renderState();
  runtime.start();
  queueAiDecisions();

  return Object.freeze({
    format,
    session,
    runtime,
    get selectedTargetId() {
      return selectedTargetId;
    },
    selectTarget,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      clearTargetPulses();
      for (const cleanup of cleanups.splice(0)) {
        cleanup();
      }
      runtime.dispose();
      presenter.dispose();
      fx.dispose();
      combatAudio.dispose?.();
    }
  });
}
