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
  skillLoadouts: new URL(
    "../../data/combat/ai/demo-coop-2v2-skill-loadouts.json",
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

function normalizeSkillIdsByActor(
  input,
  format,
  skillsById,
  field = "skillIdsByActor"
) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError(`${field} must be an object`);
  }

  const normalized = {};

  for (const actor of format.actors) {
    const rawIds = input[actor.actorId];
    if (!Array.isArray(rawIds)) {
      throw new RangeError(
        `${field} is missing actor: ${actor.actorId}`
      );
    }

    const ids = rawIds.map((skillId, index) => {
      if (typeof skillId !== "string" || skillId.trim() === "") {
        throw new TypeError(
          `${field}.${actor.actorId}[${index}] must be a skill id`
        );
      }
      const id = skillId.trim();
      if (!skillsById[id]) {
        throw new RangeError(
          `${field}.${actor.actorId} references unknown skill: ${id}`
        );
      }
      return id;
    });

    if (new Set(ids).size !== ids.length) {
      throw new RangeError(
        `${field}.${actor.actorId} must not contain duplicates`
      );
    }

    normalized[actor.actorId] = Object.freeze(ids);
  }

  return Object.freeze(normalized);
}

export function resolveCombatPresentationViewV1({
  format,
  actorId
}) {
  if (
    !format ||
    !Array.isArray(format.actors)
  ) {
    throw new TypeError(
      "format must expose actors"
    );
  }

  const localActor = format.actors.find(
    (actor) =>
      actor.actorId === format.localActorId
  );
  const actor = format.actors.find(
    (item) => item.actorId === actorId
  );

  if (!localActor) {
    throw new RangeError(
      "localActorId must reference a declared actor"
    );
  }
  if (!actor) {
    throw new RangeError(
      `Unknown presentation actor: ${actorId}`
    );
  }

  return actor.teamId === localActor.teamId
    ? "player"
    : "opponent";
}

export function resolveCombatPreviewFormatV1(format) {
  if (!format || typeof format !== "object" || Array.isArray(format)) {
    throw new TypeError(
      "format must be a BattleFormatDefinition"
    );
  }

  const teamEntries = Object.entries(format.teams ?? {});
  if (teamEntries.length !== 2) {
    throw new RangeError(
      "combat preview supports exactly two teams"
    );
  }

  const localTeamEntry = teamEntries.find(([, actorIds]) =>
    Array.isArray(actorIds) &&
    actorIds.includes(format.localActorId)
  );

  if (!localTeamEntry) {
    throw new RangeError(
      "localActorId must belong to a declared team"
    );
  }

  const enemyTeamEntry = teamEntries.find(
    ([teamId]) => teamId !== localTeamEntry[0]
  );

  const localActorIds = localTeamEntry[1];
  const enemyActorIds = enemyTeamEntry?.[1] ?? [];

  if (
    ![1, 2].includes(localActorIds.length) ||
    localActorIds.length !== enemyActorIds.length
  ) {
    throw new RangeError(
      "combat preview supports only symmetric 1v1 or 2v2"
    );
  }

  return Object.freeze({
    localTeamId: localTeamEntry[0],
    enemyTeamId: enemyTeamEntry[0],
    localActorIds: Object.freeze([...localActorIds]),
    enemyActorIds: Object.freeze([...enemyActorIds]),
    allyActorId:
      localActorIds.find(
        (actorId) => actorId !== format.localActorId
      ) ?? null,
    initialTargetId: enemyActorIds[0]
  });
}

export function buildCoop2v2AiControllerSpecs({
  format,
  skillIdsByActor
}) {
  if (!format || !Array.isArray(format.actors)) {
    throw new TypeError("format must be a BattleFormatDefinition");
  }
  if (
    !skillIdsByActor ||
    typeof skillIdsByActor !== "object" ||
    Array.isArray(skillIdsByActor)
  ) {
    throw new TypeError("skillIdsByActor must be an object");
  }

  return Object.freeze(
    format.actors
      .filter(
        (actor) =>
          actor.actorId !== format.localActorId &&
          actor.controllerId.startsWith("ai")
      )
      .map((actor) => {
        const skillIds = skillIdsByActor[actor.actorId];
        if (!Array.isArray(skillIds)) {
          throw new RangeError(
            `skillIdsByActor is missing actor: ${actor.actorId}`
          );
        }

        return Object.freeze({
          actorId: actor.actorId,
          targetIds: Object.freeze(
            format.actors
              .filter(
                (target) => target.teamId !== actor.teamId
              )
              .map((target) => target.actorId)
          ),
          skillIds: Object.freeze([...skillIds])
        });
      })
  );
}

function normalizedInjectedCombatSource(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("nativeCombatSource must be an object");
  }

  const format = normalizeBattleFormatDefinition(
    input.battleFormat
  );

  if (!Array.isArray(input.fighters)) {
    throw new TypeError(
      "nativeCombatSource.fighters must be an array"
    );
  }

  const fighterById = new Map(
    input.fighters.map((fighter) => [
      String(fighter?.id ?? ""),
      fighter
    ])
  );

  const fighters = Object.freeze(
    format.actors.map((actor) => {
      const fighter = fighterById.get(actor.actorId);
      if (!fighter) {
        throw new RangeError(
          `nativeCombatSource is missing fighter: ${actor.actorId}`
        );
      }
      return Object.freeze({ ...fighter });
    })
  );

  if (
    !input.skills ||
    typeof input.skills !== "object" ||
    Array.isArray(input.skills)
  ) {
    throw new TypeError(
      "nativeCombatSource.skills must be an object"
    );
  }

  const skills = Object.freeze(
    Object.values(input.skills).map((skill) =>
      normalizeSkillDefinition(skill)
    )
  );
  const skillsById = Object.freeze(
    Object.fromEntries(
      skills.map((skill) => [skill.id, skill])
    )
  );

  const skillIdsByActor = normalizeSkillIdsByActor(
    input.skillIdsByActor,
    format,
    skillsById,
    "nativeCombatSource.skillIdsByActor"
  );

  return Object.freeze({
    format,
    fighters,
    skills,
    skillsById,
    skillIdsByActor,
    skillSpeedMultiplier:
      input.skillSpeedMultiplier ?? 1
  });
}

export async function loadCoop2v2CombatSource({
  nativeCombatSource = null,
  fetchImpl = fetch,
  formatUrl = DATA_URLS.format
} = {}) {
  if (nativeCombatSource !== null) {
    return normalizedInjectedCombatSource(
      nativeCombatSource
    );
  }

  const [
    rawFormat,
    rawSkillIdsByActor,
    maraileron,
    braisombre,
    loupVolcanique,
    golemMoussu,
    ...rawSkills
  ] = await Promise.all([
    fetchJson(formatUrl, fetchImpl),
    fetchJson(DATA_URLS.skillLoadouts, fetchImpl),
    fetchJson(DATA_URLS.fighters.maraileron, fetchImpl),
    fetchJson(DATA_URLS.fighters.braisombre, fetchImpl),
    fetchJson(DATA_URLS.fighters.loup_volcanique, fetchImpl),
    fetchJson(DATA_URLS.fighters.golem_moussu, fetchImpl),
    ...DATA_URLS.skills.map((url) =>
      fetchJson(url, fetchImpl)
    )
  ]);

  const format = normalizeBattleFormatDefinition(rawFormat);
  const skills = Object.freeze(
    rawSkills.map((skill) =>
      normalizeSkillDefinition(skill)
    )
  );
  const skillsById = Object.freeze(
    Object.fromEntries(
      skills.map((skill) => [skill.id, skill])
    )
  );
  const fighterConfigs = Object.freeze({
    maraileron,
    braisombre,
    loup_volcanique: loupVolcanique,
    golem_moussu: golemMoussu
  });

  const fighters = Object.freeze(
    format.actors.map((actor) => {
      const config =
        fighterConfigs[actor.fighterConfigId];
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

  const skillIdsByActor = normalizeSkillIdsByActor(
    rawSkillIdsByActor,
    format,
    skillsById,
    "demo skill loadouts"
  );

  return Object.freeze({
    format,
    fighters,
    skills,
    skillsById,
    skillIdsByActor,
    skillSpeedMultiplier: 1
  });
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
  nativeCombatSource = null
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

  const {
    format,
    fighters,
    skills,
    skillsById,
    skillIdsByActor,
    skillSpeedMultiplier
  } = await loadCoop2v2CombatSource({
    nativeCombatSource,
    fetchImpl,
    formatUrl
  });

  const session = createCombatSession({
    distance: "medium",
    battleFormat: format,
    fighters,
    skillSpeedMultiplier
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

  const previewFormat =
    resolveCombatPreviewFormatV1(format);
  const allyActorId = previewFormat.allyActorId;
  const allyIcon =
    allyActorId === null
      ? null
      : requiredElement(
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
  let selectedTargetId = previewFormat.initialTargetId;
  let runtime = null;
  let aiDecisionQueued = false;

  for (const actor of format.actors) {
    visuals.setCreatureFor(
      actor.actorId,
      actor.creatureId,
      { displayName: actor.displayName }
    );
  }

  if (allyActorId !== null) {
    const allyDescriptor = visuals.getCreatureDescriptor(
      format.actor(allyActorId).creatureId
    );
    allyIcon.src = allyDescriptor.iconUrl;
    allyIcon.dataset.assetId = allyDescriptor.id;
  }

  function presentationForActorSkill(
    skillId,
    context = {}
  ) {
    const sourceActorId =
      context.sourceActorId ??
      context.sourceView ??
      null;

    const view =
      sourceActorId === null
        ? (context.view ?? "player")
        : resolveCombatPresentationViewV1({
            format,
            actorId: sourceActorId
          });

    return (
      presentationAssets?.presentationForSkill?.(
        skillId,
        {
          ...context,
          sourceActorId,
          view
        }
      ) ?? null
    );
  }

  const combatAudio = createDomCombatAudio({
    resolveAudioAsset(assetId) {
      return presentationAssets?.audioAsset?.(assetId) ?? null;
    },
    presentationForSkill(skillId, context = {}) {
      return presentationForActorSkill(
        skillId,
        context
      );
    },
  });

  const fx = createDomSkillFxRenderer({
    arena,
    onProjectileContact(contact) {
      runtime?.reportProjectileContact(contact);
    },
    anchors: motionAnchors,
    targetAnchors: fighterContainers,
    sourceAnchorFor(actorId, anchorName) {
      return visuals.getFxAnchorFor(actorId, anchorName);
    },
    presentationForSkill(skillId, context = {}) {
      return presentationForActorSkill(
        skillId,
        context
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

    fx.syncPersistentZones(
      state.persistentZones ?? []
    );
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

    for (const { button, cooldown, skill } of skillRefs.values()) {
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

      const remainingCooldownMs =
        preview?.outcome === "cooldown"
          ? Number(preview.remainingCooldownMs) || 0
          : 0;
      const totalCooldownMs =
        Math.max(0, Number(skill.cooldownMs) || 0);
      const cooldownProgress =
        remainingCooldownMs > 0 && totalCooldownMs > 0
          ? Math.max(
              0,
              Math.min(
                1,
                1 - remainingCooldownMs / totalCooldownMs
              )
            )
          : 1;

      cooldown.textContent =
        remainingCooldownMs > 0
          ? `Recharge ${(remainingCooldownMs / 1000).toFixed(1)} s`
          : "";
      cooldown.hidden = remainingCooldownMs <= 0;
      button.dataset.combatCooldown =
        remainingCooldownMs > 0
          ? String(Math.ceil(remainingCooldownMs))
          : "";
      button.dataset.cooldownActive =
        remainingCooldownMs > 0 ? "true" : "false";
      button.style.setProperty(
        "--cooldown-progress",
        String(cooldownProgress)
      );

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
    button.dataset.cooldownActive = "false";
    button.style.setProperty("--cooldown-progress", "1");

    const presentation =
      presentationForActorSkill(
        skill.id,
        {
          sourceActorId:
            format.localActorId
        }
      );
    if (presentation?.icon?.url) {
      const iconShell =
        root.ownerDocument.createElement("span");
      iconShell.className = "action-option__icon-shell";
      iconShell.setAttribute("aria-hidden", "true");

      const baseImage =
        root.ownerDocument.createElement("img");
      baseImage.className =
        "action-option__icon action-option__icon--base";
      baseImage.src = presentation.icon.url;
      baseImage.alt = "";

      const colorImage =
        root.ownerDocument.createElement("img");
      colorImage.className =
        "action-option__icon action-option__icon--color";
      colorImage.src = presentation.icon.url;
      colorImage.alt = "";

      const dial =
        root.ownerDocument.createElement("span");
      dial.className = "action-option__cooldown-dial";

      const needle =
        root.ownerDocument.createElement("span");
      needle.className =
        "action-option__cooldown-needle";

      iconShell.append(
        baseImage,
        colorImage,
        dial,
        needle
      );
      button.classList.add("action-option--with-icon");
      button.append(iconShell);
    }

    const label = root.ownerDocument.createElement("strong");
    label.textContent = skill.name;

    const cooldown =
      root.ownerDocument.createElement("small");
    cooldown.className = "action-option__cooldown";
    cooldown.dataset.combatCooldown = "";
    cooldown.hidden = true;

    button.append(label, cooldown);

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

    return Object.freeze({ button, cooldown });
  }

  const localSkillIds =
    skillIdsByActor[format.localActorId];
  const localSkills = localSkillIds.map((skillId) => {
    const skill = skillsById[skillId];
    if (!skill) {
      throw new RangeError(
        `Unknown local skill: ${skillId}`
      );
    }
    return skill;
  });

  for (const skill of localSkills) {
    const refs = createSkillButton(skill);
    skillContainer.append(refs.button);
    skillRefs.set(skill.id, {
      skill,
      button: refs.button,
      cooldown: refs.cooldown
    });
  }

  const aiControllers = [];


  const aiControllerSpecs =
    buildCoop2v2AiControllerSpecs({
      format,
      skillIdsByActor
    });

  const aiReadyAt = new Map(
    aiControllerSpecs.map((spec, index) => [
      spec.actorId,
      700 + index * 450
    ])
  );

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
    onClock() {
      renderAvailability();
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
      presenter.cancelActionPresentation(actorId);
      renderState();
    }
  });

  for (const spec of aiControllerSpecs) {
    aiControllers.push(
      createBattleActorAiController({
        session,
        runtime,
        actorId: spec.actorId,
        targetIds: spec.targetIds,
        skillIds: spec.skillIds,
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
