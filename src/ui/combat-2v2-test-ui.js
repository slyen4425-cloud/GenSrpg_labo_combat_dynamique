import { normalizeBattleFormatDefinition } from "../contracts/battle-format-definition.js";
import { normalizeSkillDefinition } from "../contracts/skill-definition.js";
import {
  normalizeCaptureGameOptionsV1,
  buildCaptureDodgeReactionSkillV1,
  captureDodgeActiveWindowMsV1
} from "../contracts/capture-game-options-v1.js";
import { configureCombatRecallCommandsV1 } from "../contracts/combat-command-definition.js";
import { createCaptureCombatRosterControllerV1, mountCaptureCombatRosterPanelV1 } from "./capture-combat-roster-controller-v1.js";
import { createCombatSession } from "../core/combat/combat-session.js";
import { createCombatRuntime } from "../core/combat/combat-runtime.js";
import { createBattleActorAiController } from "../core/combat/battle-actor-ai-controller.js";
import {
  isSkillTargetAllowed,
  targetRelation
} from "../core/combat/targeting.js";
import { createCombatResolutionPresenter } from "../adapters/renderer/combat-resolution-presenter.js";
import { createDomSkillFxRenderer } from "../adapters/renderer/dom-skill-fx.js";
import { createDomStatusFxRenderer } from "../adapters/renderer/dom-status-fx.js";
import { createDomDamageFeedbackRenderer } from "../adapters/renderer/dom-damage-feedback.js";
import { createDomCombatAudio } from "../adapters/audio/dom-combat-audio.js";
import { createPersistentZoneAudioSyncV1 } from "../adapters/audio/persistent-zone-audio-sync-v1.js";

const DATA_URLS = Object.freeze({
  commands: Object.freeze({
    recall: new URL("../../data/combat/commands/recall.command.json", import.meta.url),
    summon: new URL("../../data/combat/commands/summon.command.json", import.meta.url),
    switch: new URL("../../data/combat/commands/switch.command.json", import.meta.url)
  }),
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
    roster: input.roster ?? null,
    fighterConfigs: input.fighterConfigs ?? null,
    skillIdsByCreature: input.skillIdsByCreature ?? null,
    ...(input.recallPreparationMs === undefined ? {} : { recallPreparationMs: input.recallPreparationMs }),
    gameOptions:
      normalizeCaptureGameOptionsV1(
        input.gameOptions
      ),
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
    gameOptions:
      normalizeCaptureGameOptionsV1(),
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

// The combat UI derives candidate targets from the existing Rules preview;
 // it never owns targeting permissions or an independent availability clock.
export function combatSkillTargetOptionsV1({
  format, actorId, skill, state, previewSkill,
  isPresent = () => true
}) {
  if (typeof previewSkill !== "function") {
    throw new TypeError("previewSkill must be a function");
  }
  const allowedIds = [];
  const availableIds = [];
  const previewsById = {};
  for (const actor of format.actors) {
    const targetId = actor.actorId;
    if (!(Number(state?.fighters?.[targetId]?.hp) > 0) || !isPresent(targetId)) {
      continue;
    }
    if (!isSkillTargetAllowed({ format, actorId, targetId, skill }).ok) {
      continue;
    }
    allowedIds.push(targetId);
    const preview = previewSkill({ actorId, targetId, skill });
    previewsById[targetId] = preview;
    if (preview?.ok) availableIds.push(targetId);
  }
  return Object.freeze({
    allowedIds: Object.freeze(allowedIds),
    availableIds: Object.freeze(availableIds),
    previewsById: Object.freeze(previewsById)
  });
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
    typeof visuals.getCollisionModelFor !== "function" ||
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
    roster: rosterDefinition, fighterConfigs, skillIdsByCreature,
    skillSpeedMultiplier, recallPreparationMs, gameOptions
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
  const dodgeButton =
    root.querySelector("[data-combat-dodge]");
  const dodgeCharges =
    root.querySelector(
      "[data-combat-dodge-charges]"
    );
  const dodgeRecharge =
    root.querySelector(
      "[data-combat-dodge-recharge]"
    );
  const dodgeSkill =
    buildCaptureDodgeReactionSkillV1(
      gameOptions
    );
  const dodgeRechargeConfig =
    dodgeSkill === null
      ? null
      : Object.freeze({
          actionId: dodgeSkill.id,
          maxCharges:
            gameOptions.dodge.maxCharges,
          rechargeMs:
            gameOptions.dodge.rechargeMs
        });
  const dodgeActiveWindowMs =
    dodgeSkill === null
      ? 0
      : captureDodgeActiveWindowMsV1(
          gameOptions
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
        ),
        statusHost: requiredElement(
          root,
          `[data-combat-status-icons="${actor.actorId}"]`
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
  let pendingSkillId = null;
  let runtime = null;
  let rosterController = null;
  let rosterPanel = null;
  const koTransitions = new Set();
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
      (["impact", "clash-impact"].includes(context.fxType) ? context.targetView : null) ??
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

  const zoneAudio = createPersistentZoneAudioSyncV1({
    audio: combatAudio
  });

  const fx = createDomSkillFxRenderer({
    arena,
    onProjectileContact(contact) {
      runtime?.reportActionContact(contact);
    },
    targetCollisionModelFor(slotId) {
      return visuals.getCollisionModelFor(slotId);
    },
    anchors: motionAnchors,
    targetAnchors: fighterContainers,
    targetAnchorFor(slotId) {
      return visuals.getVisibleTargetRectFor(
        slotId
      );
    },
    sourceAnchorFor(actorId, anchorName) {
      return visuals.getFxAnchorFor(actorId, anchorName);
    },
    playCameraFx(plan) {
      return visuals.playCameraFx?.(plan) ?? {
        status: "ignored",
        finished: Promise.resolve({
          status: "ignored"
        })
      };
    },
    presentationForSkill(skillId, context = {}) {
      return presentationForActorSkill(
        skillId,
        context
      );
    }
  });

  const statusFx =
    typeof visuals.getStatusPresentationTargetFor ===
      "function" &&
    typeof presentationAssets?.statusPresentationFor ===
      "function"
      ? createDomStatusFxRenderer({
          targetFor(actorId) {
            return {
              ...visuals.getStatusPresentationTargetFor(
                actorId
              ),
              statusHost:
                hpRefs[actorId]?.statusHost ??
                null
            };
          },
          statusPresentationFor(statusId, context = {}) {
            return (
              presentationAssets.statusPresentationFor(
                statusId,
                {
                  ...context,
                  view: resolveCombatPresentationViewV1({ format, actorId: context.actorId
                }
              ) }
              )
            );
          },
          skillPresentationFor(skillId, context = {}) {
            return presentationForActorSkill(
              skillId,
              context
            );
          },
          skillDefinitionFor(skillId) {
            return skillsById[skillId] ?? null;
          }
        })
      : null;

  const damageFeedback =
    typeof visuals.getStatusPresentationTargetFor ===
      "function"
      ? createDomDamageFeedbackRenderer({
          targetFor(actorId) {
            return visuals.getStatusPresentationTargetFor(
              actorId
            );
          }
        })
      : null;

  const presenter = createCombatResolutionPresenter({
    visuals,
    fx,
    audio: combatAudio,
    onActionContact(contact) {
      return runtime?.reportActionContact(contact) ?? null;
    }
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
    const actor = format.actor(actorId);
    const member = rosterController?.activeMember(actorId);
    return member ? { ...actor, displayName: member.displayName, creatureId: member.creatureId } : actor;
  }

  function isAlive(actorId, state = session.snapshot()) {
    return Number(actorState(actorId, state)?.hp) > 0 && (rosterController === null || rosterController.isPresent(actorId));
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

  function skillTargetOptions(skill, state = session.snapshot()) {
    return combatSkillTargetOptionsV1({
      format,
      actorId: format.localActorId,
      skill,
      state,
      previewSkill: ({ actorId, targetId, skill }) =>
        session.previewSkill({ actorId, targetId, skill }),
      isPresent: actorId =>
        rosterController === null || rosterController.isPresent(actorId)
    });
  }

  function renderTargetSelection() {
    const armedSkill = pendingSkillId === null
      ? null : skillRefs.get(pendingSkillId)?.skill ?? null;
    const candidates = armedSkill
      ? new Set(skillTargetOptions(armedSkill).availableIds)
      : new Set();
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
        node.dataset.skillTargetCandidate =
          candidates.has(actor.actorId) ? "true" : "false";
      }
    }
  }

  function renderState(state = session.snapshot()) {
    statusFx?.sync(state);
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
    zoneAudio.sync(
      state.persistentZones ?? []
    );
    renderAvailability();
    renderTargetSelection();
    rosterPanel?.render();
  }

  function renderAvailability() {
    if (!runtime) {
      return;
    }

    const state = session.snapshot();
    const localAlive = isAlive(format.localActorId, state);
    const lockedByAction =
      runtime.hasActiveActionFor(format.localActorId) ||
      runtime.activeActions.some(action =>
        action.actionType === "command" && action.command.kind !== "switch"
      );

    if (pendingSkillId !== null) {
      const pending = skillRefs.get(pendingSkillId)?.skill;
      if (!pending || lockedByAction || skillTargetOptions(pending, state).availableIds.length === 0) {
        pendingSkillId = null;
      }
    }

    for (const { button, cooldown, skill } of skillRefs.values()) {
      const options = skillTargetOptions(skill, state);
      const preview = options.previewsById[selectedTargetId] ??
        options.previewsById[options.allowedIds[0]] ?? { ok: false };
      button.dataset.targetRequired =
        options.availableIds.length > 0 &&
        !options.availableIds.includes(selectedTargetId)
          ? "true" : "false";
      button.dataset.targeting =
        pendingSkillId === skill.id ? "true" : "false";
      button.title =
        button.dataset.targetRequired === "true"
          ? skill.name + " — choisir une cible autorisée"
          : skill.name;

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
        !localAlive || lockedByAction || options.availableIds.length === 0;
    }

    if (dodgeButton) {
      const enabled =
        dodgeSkill !== null &&
        dodgeRechargeConfig !== null;
      dodgeButton.hidden = !enabled;

      if (enabled) {
        const availability =
          runtime.rechargeableActionAvailability({
            actorId:
              format.localActorId,
            ...dodgeRechargeConfig
          });

        const windowStatus =
          runtime.rechargeableReactionWindowStatus({
            actorId:
              format.localActorId,
            recharge:
              dodgeRechargeConfig,
            activeWindowMs:
              dodgeActiveWindowMs
          });

        dodgeButton.disabled =
          !localAlive ||
          windowStatus.active ||
          availability.charges <= 0;
        dodgeButton.dataset.active =
          windowStatus.active
            ? "true"
            : "false";

        if (dodgeCharges) {
          dodgeCharges.textContent =
            availability.charges +
            " / " +
            availability.maxCharges;
        }

        if (dodgeRecharge) {
          const recharging =
            availability.nextRechargeMs > 0;
          const showingStatus =
            windowStatus.active ||
            recharging;
          dodgeRecharge.hidden =
            !showingStatus;
          dodgeRecharge.textContent =
            windowStatus.active
              ? "Active " +
                (
                  windowStatus.remainingMs /
                  1000
                ).toFixed(1) +
                " s"
              : recharging
                ? "Recharge " +
                  (
                    availability.nextRechargeMs /
                    1000
                  ).toFixed(1) +
                  " s"
                : "";
        }
      }
    }

    rosterPanel?.render();
    renderTargetSelection();
  }

  function selectTarget(actorId) {
    if (!actorMeta(actorId) || !isAlive(actorId)) {
      return;
    }

    const armedSkill = pendingSkillId === null
      ? null : skillRefs.get(pendingSkillId)?.skill ?? null;
    if (armedSkill && !skillTargetOptions(armedSkill).availableIds.includes(actorId)) {
      setStatus("Cette créature ne peut pas recevoir " + armedSkill.name + ". Choisis une cible mise en évidence.", "warn");
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
    if (armedSkill) {
      pendingSkillId = null;
      activateLocalSkill(armedSkill, actorId);
    }
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

  if (dodgeButton) {
    listen(
      dodgeButton,
      "click",
      () => {
        if (
          dodgeSkill === null ||
          dodgeRechargeConfig === null
        ) {
          return;
        }

        const result =
          runtime.activateRechargeableReaction(
            dodgeSkill,
            {
              actorId:
                format.localActorId,
              recharge:
                dodgeRechargeConfig,
              activeWindowMs:
                dodgeActiveWindowMs
            }
          );

        if (!result.ok) {
          setStatus(
            result.outcome ===
              "no_charges"
              ? "Aucune charge d’esquive disponible."
              : result.outcome ===
                  "already_active"
                ? "Esquive déjà active."
                : "Esquive impossible : " +
                  result.outcome +
                  ".",
            "warn"
          );
          renderAvailability();
          return;
        }

        const visualDurationMs =
          Number(
            result.window?.remainingMs ?? 0
          );
        if (visualDurationMs > 0) {
          visuals
            .playEventFor(
              format.localActorId,
              "dodge",
              {
                metadata: {
                  durationMs:
                    visualDurationMs
                }
              }
            )
            .catch(() => {});
        }

        setStatus(
          "Esquive active pendant " +
            (
              dodgeActiveWindowMs /
              1000
            ).toFixed(1) +
            " s.",
          "accent"
        );
        renderAvailability();
      }
    );
  }

  function activateLocalSkill(skill, targetId) {
    const allowed = isSkillTargetAllowed({
      format, actorId: format.localActorId, targetId, skill
    });
    if (!allowed.ok || !skillTargetOptions(skill).availableIds.includes(targetId)) {
      setStatus(skill.name + " : cible indisponible.", "warn");
      renderAvailability();
      return;
    }
    const result = runtime.startSkill({
      actorId: format.localActorId, targetId, skill
    });
    if (!result.ok) {
      setStatus(result.outcome === "insufficient_energy"
        ? "Énergie insuffisante."
        : "Action impossible : " + result.outcome + ".", "warn");
      renderAvailability();
      return;
    }
    pendingSkillId = null;
    const target = actorMeta(targetId);
    setStatus(skill.name + " se prépare sur " + target.displayName + ".", "accent");
    renderAvailability();
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

    const onClick = () => {
      const options = skillTargetOptions(skill);
      if (!options.availableIds.includes(selectedTargetId)) {
        pendingSkillId = skill.id;
        setStatus(skill.name + " : touche une cible mise en évidence pour lancer la capacité.", "accent");
        renderAvailability();
        renderTargetSelection();
        return;
      }
      pendingSkillId = null;
      activateLocalSkill(skill, selectedTargetId);
    };
    button.addEventListener("click", onClick);

    return Object.freeze({ button, cooldown, dispose() { button.removeEventListener("click", onClick); } });
  }

  function renderLocalSkills() {
    pendingSkillId = null;
    for (const refs of skillRefs.values()) refs.dispose();
    skillRefs.clear();
    skillContainer.replaceChildren();
    const ids = rosterController?.skillIdsFor(format.localActorId) ?? skillIdsByActor[format.localActorId];
    for (const skillId of ids) {
      const skill = skillsById[skillId];
      if (!skill) throw new RangeError(`Unknown local skill: ${skillId}`);
      skillRefs.set(skill.id, { skill, ...createSkillButton(skill) });
      skillContainer.append(skillRefs.get(skill.id).button);
    }
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
      if (runtime.activeActions.some(action => action.actionType === "command" && action.command.kind !== "switch")) return;
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
    readZoneSpatialContext: state => fx.sampleZoneSpatialContext(state.persistentZones ?? []),
    onState(state) {
      if (rosterController) for (const actor of format.actors) {
        if (Number(state.fighters[actor.actorId]?.hp) <= 0 && rosterController.isPresent(actor.actorId)) {
          queueKoReplacement(actor.actorId);
        }
      }
      renderState(state);
      queueAiDecisions();
    },
    onHealthDelta(feedback) {
      if (!["damage", "heal"].includes(feedback.kind)) return;
      fx.play({
        type: feedback.kind,
        targetSlot: feedback.actorId,
        amount: feedback.amount,
        durationMs: 700
      });
      if (feedback.kind === "damage") {
        damageFeedback?.flash(feedback.actorId);
      }
    },
    onClock() {
      renderAvailability();
    },
    onStarted({ action }) {
      if (action.actionType !== "skill") {
        presenter.presentPreparation({ action, actorSlot: action.actorId });
        actionRefs[action.actorId].textContent = `${action.command.name} · préparation`;
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
      if (resolution.actionType === "command") {
        const result = rosterController?.applyCommandResolution(resolution);
        if (result?.slotId) {
          setCharge(result.slotId);
          actionRefs[result.slotId].textContent = "Prêt";
        }
        renderState();
        queueAiDecisions();
        return;
      }
      const presentation = presenter.presentOutcome({
        resolution,
        actorSlot: resolution.actorId,
        targetSlot: resolution.targetId
      });

      setCharge(resolution.actorId);
      actionRefs[resolution.actorId].textContent = "Prêt";

      const actor = actorMeta(resolution.actorId);
      const target = actorMeta(resolution.targetId);
      const healEvents = resolution.events?.filter(event => event.type === "heal") ?? [];
      if (resolution.outcome === "hit" && healEvents.length > 0) {
        const totalHealed = healEvents.reduce(
          (sum, event) => sum + Math.max(0, Number(event.applied) || 0), 0
        );
        setStatus(
          totalHealed > 0
            ? `${actor?.displayName ?? resolution.actorId} soigne +${totalHealed} PV.`
            : "Soin appliqué : PV déjà au maximum.",
          "ok"
        );
      } else if (resolution.outcome === "hit") {
        setStatus(
          `${actor?.displayName ?? resolution.actorId} touche ${target?.displayName ?? resolution.targetId}.`,
          "ok"
        );
      }

      if (presentation.ko) queueKoReplacement(presentation.koActorId, presentation.finished);
      void Promise.resolve(presentation.finished).then(() => {
        if (!disposed) renderState();
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

  function refreshAiControllers() {
    aiControllers.splice(0);
    for (const spec of aiControllerSpecs) {
      const ids = rosterController?.skillIdsFor(spec.actorId) ?? spec.skillIds;
      const targets = spec.targetIds.filter(id => isAlive(id));
      if (!isAlive(spec.actorId) || ids.length === 0 || targets.length === 0) continue;
      aiControllers.push(createBattleActorAiController({ session, runtime, actorId: spec.actorId, targetIds: targets, skillIds: ids, skillsById }));
    }
  }

  function queueKoReplacement(actorId, finished = null) {
    if (!rosterController || !actorId || koTransitions.has(actorId) || disposed) return;
    koTransitions.add(actorId);
    renderAvailability();
    const completion = finished ?? Promise.resolve(visuals.playEventFor(actorId, "ko"));
    void Promise.resolve(completion).then(() => {
      if (disposed) return;
      runtime.cancelActionsForActor(actorId, { includeTargeted: true, reason: "ko" });
      const result = rosterController.replaceKnockedOut(actorId);
      koTransitions.delete(actorId);
      if (result.outcome === "team_defeated") setStatus("Plus de réserve pour cette créature.", "info");
      renderState();
      queueAiDecisions();
    });
  }

  if (rosterDefinition && Object.keys(rosterDefinition.teams ?? {}).length > 0) {
    const commands = configureCombatRecallCommandsV1(
      Object.fromEntries(await Promise.all(Object.entries(DATA_URLS.commands).map(async ([kind, url]) => [kind, await fetchJson(url, fetchImpl)]))),
      recallPreparationMs
    );
    rosterController = createCaptureCombatRosterControllerV1({
      session, rosterDefinition, fighterConfigs, skillIdsByCreature, visuals,
      beforeActorChanged: actorId => presenter.cancelActionPresentation(actorId),
      onActorChanged(actorId, result) {
        presenter.presentRosterArrival({ actorSlot: actorId, result });
        const actor = actorMeta(actorId);
        if (result.outcome !== "recalled") for (const element of root.querySelectorAll(`[data-preview-actor-ui="${actorId}"]`)) {
          for (const label of element.querySelectorAll("[data-demo-label], strong")) label.textContent = actor.displayName;
        }
        if (!isAlive(selectedTargetId)) selectedTargetId = previewFormat.enemyActorIds.find(id => isAlive(id)) ?? selectedTargetId;
        renderLocalSkills();
        refreshAiControllers();
        setStatus(result.outcome === "recalled" ? "Créature rappelée. Choisis une réserve puis Invocation." : `${result.displayName ?? actor.displayName} entre en combat.`, "accent");
        renderState();
      }
    });
    rosterPanel = mountCaptureCombatRosterPanelV1({ root, controller: rosterController, format, commands, session, getRuntime: () => runtime, isTransitionPending: () => koTransitions.size > 0, setStatus });
  }
  renderLocalSkills();
  refreshAiControllers();

  renderTargetSelection();
  renderState();
  runtime.start();
  queueAiDecisions();

  return Object.freeze({
    format,
    session,
    runtime,
    rosterSnapshot: () => rosterController?.snapshot() ?? null,
    get selectedTargetId() {
      return selectedTargetId;
    },
    selectTarget,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      rosterPanel?.dispose();
      rosterController?.dispose();
      koTransitions.clear();
      for (const refs of skillRefs.values()) refs.dispose();
      skillRefs.clear();
      clearTargetPulses();
      for (const cleanup of cleanups.splice(0)) {
        cleanup();
      }
      runtime.dispose();
      presenter.dispose();
      statusFx?.dispose();
      damageFeedback?.dispose();
      fx.dispose();
      zoneAudio.dispose();
      combatAudio.dispose?.();
    }
  });
}
