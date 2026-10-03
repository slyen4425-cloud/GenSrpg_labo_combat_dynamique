import { normalizeBattleFormatDefinition } from "../contracts/battle-format-definition.js";
import { normalizeSkillDefinition } from "../contracts/skill-definition.js";
import { normalizeCombatCommandDefinition } from "../contracts/combat-command-definition.js";
import { createCombatSession } from "../core/combat/combat-session.js";
import { createRosterSession } from "../core/combat/roster-session.js";
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

const DATA_URLS = Object.freeze({
  format: new URL(
    "../../data/combat/battle-formats/demo-coop-2v2.format.json",
    import.meta.url
  ),
  skillLoadouts: new URL(
    "../../data/combat/ai/demo-coop-2v2-skill-loadouts.json",
    import.meta.url
  ),
  commands: Object.freeze({
    recall: new URL(
      "../../data/combat/commands/recall.command.json",
      import.meta.url
    ),
    summon: new URL(
      "../../data/combat/commands/summon.command.json",
      import.meta.url
    )
  }),
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

function normalizeSkillIdsByCreature(
  input,
  format,
  skillIdsByActor,
  skillsById
) {
  const source =
    input &&
    typeof input === "object" &&
    !Array.isArray(input)
      ? input
      : Object.fromEntries(
          format.actors.map((actor) => [
            actor.creatureId,
            skillIdsByActor[actor.actorId] ?? []
          ])
        );

  const normalized = {};

  for (const [creatureIdRaw, rawIds] of Object.entries(source)) {
    const creatureId = String(creatureIdRaw).trim();
    if (!creatureId || !Array.isArray(rawIds)) {
      throw new TypeError(
        "nativeCombatSource.skillIdsByCreature must map creature ids to arrays"
      );
    }

    const ids = rawIds.map((skillId, index) => {
      if (
        typeof skillId !== "string" ||
        skillId.trim() === ""
      ) {
        throw new TypeError(
          `skillIdsByCreature.${creatureId}[${index}] must be a skill id`
        );
      }
      const id = skillId.trim();
      if (!skillsById[id]) {
        throw new RangeError(
          `skillIdsByCreature.${creatureId} references unknown skill: ${id}`
        );
      }
      return id;
    });

    if (new Set(ids).size !== ids.length) {
      throw new RangeError(
        `skillIdsByCreature.${creatureId} must not contain duplicates`
      );
    }

    normalized[creatureId] = Object.freeze(ids);
  }

  return Object.freeze(normalized);
}

function normalizeInjectedFighterConfigs(
  input,
  format,
  fighters
) {
  const source =
    input &&
    typeof input === "object" &&
    !Array.isArray(input)
      ? input
      : Object.fromEntries(
          format.actors.map((actor, index) => [
            actor.creatureId,
            fighters[index]
          ])
        );

  return Object.freeze(
    Object.fromEntries(
      Object.entries(source).map(([id, config]) => [
        id,
        Object.freeze({ ...config })
      ])
    )
  );
}

function normalizeInjectedRoster(input) {
  if (input == null) {
    return Object.freeze({
      teams: Object.freeze({})
    });
  }

  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    !input.teams ||
    typeof input.teams !== "object" ||
    Array.isArray(input.teams)
  ) {
    throw new TypeError(
      "nativeCombatSource.roster.teams must be an object"
    );
  }

  return input;
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
  const skillIdsByCreature =
    normalizeSkillIdsByCreature(
      input.skillIdsByCreature,
      format,
      skillIdsByActor,
      skillsById
    );
  const fighterConfigs =
    normalizeInjectedFighterConfigs(
      input.fighterConfigs,
      format,
      fighters
    );
  const roster =
    normalizeInjectedRoster(
      input.roster
    );

  return Object.freeze({
    format,
    fighters,
    skills,
    skillsById,
    skillIdsByActor,
    skillIdsByCreature,
    fighterConfigs,
    roster,
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

  const skillIdsByCreature =
    normalizeSkillIdsByCreature(
      null,
      format,
      skillIdsByActor,
      skillsById
    );

  return Object.freeze({
    format,
    fighters,
    skills,
    skillsById,
    skillIdsByActor,
    skillIdsByCreature,
    fighterConfigs,
    roster: Object.freeze({
      teams: Object.freeze({})
    }),
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

export function resolveBattleOutcomeV1({
  format,
  state
}) {
  if (
    !format ||
    !Array.isArray(format.actors) ||
    !state?.fighters
  ) {
    return null;
  }

  const localActor =
    format.actors.find(
      (actor) =>
        actor.actorId === format.localActorId
    ) ?? null;

  if (!localActor) {
    return null;
  }

  const localTeamId = localActor.teamId;
  const teamIds = Object.keys(format.teams ?? {});
  const enemyTeamId =
    teamIds.find(
      (teamId) => teamId !== localTeamId
    ) ?? null;

  if (!enemyTeamId) {
    return null;
  }

  const teamDefeated = (teamId) => {
    const actorIds =
      format.teams?.[teamId] ?? [];

    return (
      actorIds.length > 0 &&
      actorIds.every(
        (actorId) =>
          Number(
            state.fighters?.[actorId]?.hp
          ) <= 0
      )
    );
  };

  if (teamDefeated(enemyTeamId)) {
    return "victory";
  }

  if (teamDefeated(localTeamId)) {
    return "defeat";
  }

  return null;
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
  nativeCombatSource = null,
  onBattleEnd = null
}) {
  if (!root || typeof root.querySelector !== "function") {
    throw new TypeError("root must provide querySelector()");
  }
  if (
    onBattleEnd !== null &&
    typeof onBattleEnd !== "function"
  ) {
    throw new TypeError(
      "onBattleEnd must be a function when supplied"
    );
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
    skillIdsByCreature,
    fighterConfigs,
    roster,
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

  const localRosterDefinition =
    roster?.teams?.[format.localActorId] ??
    null;
  const hasLocalRoster =
    localRosterDefinition !== null;

  if (
    hasLocalRoster &&
    typeof visuals.setSlotVisible !== "function"
  ) {
    throw new TypeError(
      "roster-aware visuals must provide setSlotVisible()"
    );
  }

  const rosterSession =
    hasLocalRoster
      ? createRosterSession({
          combatSession: session,
          roster: {
            teams: {
              [format.localActorId]:
                localRosterDefinition
            }
          },
          fighterConfigs
        })
      : null;

  const rosterCommands =
    hasLocalRoster
      ? Object.freeze({
          recall:
            normalizeCombatCommandDefinition(
              await fetchJson(
                DATA_URLS.commands.recall,
                fetchImpl
              )
            ),
          summon:
            normalizeCombatCommandDefinition(
              await fetchJson(
                DATA_URLS.commands.summon,
                fetchImpl
              )
            )
        })
      : null;

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

  const teamActionContainer =
    hasLocalRoster
      ? requiredElement(
          root,
          "[data-combat-team-actions]"
        )
      : null;
  const playerReserve =
    hasLocalRoster
      ? requiredElement(
          root,
          `[data-roster-reserve="${format.localActorId}"]`
        )
      : null;
  const teamSelectionLabel =
    hasLocalRoster
      ? requiredElement(
          root,
          "[data-team-selection]"
        )
      : null;

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
  let skillButtonCleanups = [];
  const skillRefs = new Map();
  const commandRefs = new Map();
  const targetPulseTimers = new Map();
  let disposed = false;
  let selectedTargetId = previewFormat.initialTargetId;
  let runtime = null;
  let aiDecisionQueued = false;
  let battleEnded = false;

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
      runtime?.reportActionContact(contact);
    },
    targetCollisionModelFor(slotId) {
      return visuals.getCollisionModelFor(slotId);
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
          statusPresentationFor(statusId) {
            return (
              presentationAssets.statusPresentationFor(
                statusId
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

  function listenSkill(element, type, handler) {
    element.addEventListener(type, handler);
    skillButtonCleanups.push(() =>
      element.removeEventListener(type, handler)
    );
  }

  function localRosterState() {
    return rosterSession
      ? rosterSession.snapshot()[
          format.localActorId
        ] ?? null
      : null;
  }

  function activeLocalRosterMember() {
    const team = localRosterState();
    return team?.members.find(
      (member) =>
        member.id === team.activeMemberId
    ) ?? null;
  }

  function actorDisplayName(actorId) {
    if (
      actorId === format.localActorId &&
      rosterSession
    ) {
      return (
        activeLocalRosterMember()
          ?.displayName ??
        format.actor(actorId)?.displayName ??
        actorId
      );
    }

    return (
      format.actor(actorId)?.displayName ??
      actorId
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

      const hasActiveRosterMember =
        !rosterSession ||
        localRosterState()?.activeMemberId !== null;

      button.disabled =
        !hasActiveRosterMember ||
        runtime.hasActiveActionFor(format.localActorId) ||
        !preview.ok;
    }

    if (rosterSession && rosterCommands) {
      const team = localRosterState();
      const hasActive =
        team?.activeMemberId !== null;
      const hasSelection =
        Boolean(
          team?.selectedReserveMemberId
        );

      const recallRef =
        commandRefs.get("recall");
      if (recallRef) {
        const preview =
          hasActive
            ? session.previewCommand({
                actorId:
                  format.localActorId,
                command:
                  recallRef.command
              })
            : { ok: false };

        recallRef.button.disabled =
          runtime.hasActiveActionFor(
            format.localActorId
          ) ||
          !preview.ok;
      }

      const summonRef =
        commandRefs.get("summon");
      if (summonRef) {
        const preview =
          !hasActive && hasSelection
            ? session.previewCommand({
                actorId:
                  format.localActorId,
                command:
                  summonRef.command
              })
            : { ok: false };

        summonRef.button.disabled =
          runtime.hasActiveActionFor(
            format.localActorId
          ) ||
          !preview.ok;
      }
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

    listenSkill(button, "click", () => {
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

  function renderLocalSkillsForCreature(
    creatureId
  ) {
    for (
      const cleanup of
        skillButtonCleanups.splice(0)
    ) {
      cleanup();
    }

    skillRefs.clear();
    skillContainer.replaceChildren();

    const ids =
      skillIdsByCreature[creatureId] ??
      [];

    for (const skillId of ids) {
      const skill =
        skillsById[skillId];

      if (!skill) {
        throw new RangeError(
          `Unknown local skill: ${skillId}`
        );
      }

      const refs =
        createSkillButton(skill);
      skillContainer.append(
        refs.button
      );
      skillRefs.set(skill.id, {
        skill,
        button: refs.button,
        cooldown: refs.cooldown
      });
    }
  }

  function reserveCard(member) {
    const button =
      root.ownerDocument.createElement(
        "button"
      );
    button.type = "button";
    button.className =
      "reserve-card encounter-reserve-card";
    button.dataset.memberId =
      member.id;

    const defeated =
      Number(member.hp) <= 0;
    button.disabled =
      member.active || defeated;

    const descriptor =
      visuals.getCreatureDescriptor(
        member.creatureId
      );

    if (descriptor?.iconUrl) {
      const image =
        root.ownerDocument.createElement(
          "img"
        );
      image.className =
        "reserve-card__icon";
      image.src =
        descriptor.iconUrl;
      image.alt = "";
      button.append(image);
    }

    const text =
      root.ownerDocument.createElement(
        "span"
      );
    text.className =
      "reserve-card__text";
    text.textContent =
      defeated
        ? `${member.displayName} · KO`
        : member.active
          ? `${member.displayName} · actif`
          : `${member.displayName} · ${Math.round(member.hp)}/${Math.round(member.maxHp)} PV`;

    button.append(text);

    if (member.selected) {
      button.dataset.selected =
        "true";
    }

    return button;
  }

  function renderRoster() {
    if (
      !rosterSession ||
      !playerReserve ||
      !teamSelectionLabel
    ) {
      return;
    }

    const team =
      localRosterState();

    if (!team) {
      return;
    }

    playerReserve.replaceChildren(
      ...team.members.map(
        reserveCard
      )
    );

    const selected =
      team.members.find(
        (member) =>
          member.id ===
          team.selectedReserveMemberId
      ) ?? null;

    teamSelectionLabel.textContent =
      selected
        ? `Réserve : ${selected.displayName}`
        : "Aucune réserve sélectionnée";
  }

  function startRosterCommand(
    command
  ) {
    const result =
      runtime.startCommand({
        actorId:
          format.localActorId,
        command
      });

    if (!result.ok) {
      setStatus(
        result.outcome ===
          "insufficient_energy"
          ? "Énergie insuffisante."
          : `Action d'équipe impossible : ${result.outcome}.`,
        "warn"
      );
      renderAvailability();
      return;
    }

    setStatus(
      `${command.name} se prépare…`,
      "accent"
    );
    renderAvailability();
  }

  function createRosterControls() {
    if (
      !rosterSession ||
      !rosterCommands ||
      !teamActionContainer ||
      !playerReserve
    ) {
      return;
    }

    for (
      const command of [
        rosterCommands.recall,
        rosterCommands.summon
      ]
    ) {
      const button =
        root.ownerDocument.createElement(
          "button"
        );
      button.type = "button";
      button.className =
        "action-option action-option--team";
      button.dataset.combatCommand =
        command.kind;
      button.textContent =
        command.name;

      commandRefs.set(
        command.kind,
        {
          button,
          command
        }
      );
      teamActionContainer.append(
        button
      );
      listen(
        button,
        "click",
        () =>
          startRosterCommand(
            command
          )
      );
    }

    listen(
      playerReserve,
      "click",
      (event) => {
        const button =
          event.target.closest?.(
            "[data-member-id]"
          );

        if (
          !button ||
          button.disabled
        ) {
          return;
        }

        const team =
          localRosterState();
        const member =
          team?.members.find(
            (item) =>
              item.id ===
              button.dataset.memberId
          ) ?? null;

        if (!member) {
          return;
        }

        const result =
          rosterSession.selectReserve(
            format.localActorId,
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
      }
    );
  }

  function applyRosterResolution(
    resolution
  ) {
    if (
      !rosterSession ||
      resolution.actionType !==
        "command" ||
      !["recall", "summon"].includes(
        resolution.commandKind
      )
    ) {
      return null;
    }

    const result =
      rosterSession.applyCommandResolution(
        format.localActorId,
        resolution
      );

    if (!result.ok) {
      setStatus(
        `Action d'équipe impossible : ${result.outcome}.`,
        "warn"
      );
      return result;
    }

    if (
      result.outcome ===
        "recalled"
    ) {
      visuals.setSlotVisible(
        format.localActorId,
        false
      );
      setStatus(
        "Créature rappelée. Sélectionnez une réserve puis Invocation.",
        "accent"
      );
    }

    if (
      result.outcome ===
        "summoned"
    ) {
      visuals.setCreatureFor(
        format.localActorId,
        result.creatureId,
        {
          displayName:
            result.displayName
        }
      );
      visuals.setSlotVisible(
        format.localActorId,
        true
      );
      renderLocalSkillsForCreature(
        result.creatureId
      );
      setStatus(
        `${result.displayName} entre en combat.`,
        "ok"
      );
    }

    renderRoster();
    renderState();
    return result;
  }

  function replaceLocalAfterKo() {
    if (!rosterSession) {
      return null;
    }

    const fighter =
      session.snapshot()
        .fighters[
          format.localActorId
        ];

    if (
      !fighter ||
      Number(fighter.hp) > 0
    ) {
      return null;
    }

    const result =
      rosterSession
        .replaceKnockedOut(
          format.localActorId
        );

    if (
      result.outcome ===
        "ko_replaced"
    ) {
      visuals.setCreatureFor(
        format.localActorId,
        result.creatureId,
        {
          displayName:
            result.displayName
        }
      );
      visuals.setSlotVisible(
        format.localActorId,
        true
      );
      renderLocalSkillsForCreature(
        result.creatureId
      );
      setStatus(
        `${result.displayName} remplace automatiquement la créature KO.`,
        "warn"
      );
    }

    renderRoster();
    return result;
  }

  const initialLocalCreatureId =
    activeLocalRosterMember()
      ?.creatureId ??
    format.actor(
      format.localActorId
    ).creatureId;

  renderLocalSkillsForCreature(
    initialLocalCreatureId
  );
  createRosterControls();
  renderRoster();

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
    if (
      disposed ||
      battleEnded ||
      aiDecisionQueued ||
      !runtime
    ) {
      return;
    }

    aiDecisionQueued = true;
    queueMicrotask(() => {
      aiDecisionQueued = false;
      if (disposed) {
        return;
      }

      if (
        rosterSession &&
        localRosterState()
          ?.activeMemberId === null
      ) {
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
    onHealthDelta(feedback) {
      if (feedback.kind !== "damage") {
        return;
      }
      fx.play({
        type: "damage",
        targetSlot: feedback.actorId,
        amount: feedback.amount,
        durationMs: 700
      });
      damageFeedback?.flash(
        feedback.actorId
      );
    },
    onClock() {
      renderAvailability();
    },
    onStarted({ action }) {
      if (action.actionType === "skill") {
        presenter.presentPreparation({
          action,
          actorSlot: action.actorId
        });
        actionRefs[action.actorId].textContent =
          `${action.skill.name} · préparation`;
        return;
      }

      actionRefs[action.actorId].textContent =
        `${action.command.name} · préparation`;
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
      setCharge(action.actorId);

      if (action.actionType === "skill") {
        presenter.presentRelease({
          action,
          actorSlot: action.actorId,
          targetSlot: action.targetId
        });
        actionRefs[action.actorId].textContent =
          `${action.skill.name} · lancé`;
        return;
      }

      actionRefs[action.actorId].textContent =
        `${action.command.name} · exécution`;
    },
    onResolved(resolution) {
      setCharge(resolution.actorId);
      actionRefs[resolution.actorId].textContent =
        "Prêt";

      if (
        resolution.actionType ===
          "command"
      ) {
        const rosterResult =
          applyRosterResolution(
            resolution
          );

        if (!rosterResult) {
          setStatus(
            "Commande terminée.",
            "ok"
          );
        }

        renderRoster();
        renderState();
        queueAiDecisions();
        return;
      }

      const presentation =
        presenter.presentOutcome({
          resolution,
          actorSlot:
            resolution.actorId,
          targetSlot:
            resolution.targetId
        });

      const actorName =
        actorDisplayName(
          resolution.actorId
        );
      const targetName =
        actorDisplayName(
          resolution.targetId
        );

      if (
        resolution.outcome ===
          "hit"
      ) {
        setStatus(
          `${actorName} touche ${targetName}.`,
          "ok"
        );
      }

      void Promise.resolve(
        presentation.finished
      ).then(() => {
        replaceLocalAfterKo();

        const state =
          session.snapshot();
        renderRoster();
        renderState(state);

        if (!battleEnded) {
          const outcome =
            resolveBattleOutcomeV1({
              format,
              state
            });

          if (outcome !== null) {
            battleEnded = true;
            for (
              const { button } of
                skillRefs.values()
            ) {
              button.disabled =
                true;
            }
            for (
              const { button } of
                commandRefs.values()
            ) {
              button.disabled =
                true;
            }

            setStatus(
              outcome === "victory"
                ? "Combat remporté."
                : "Équipe vaincue.",
              outcome === "victory"
                ? "ok"
                : "warn"
            );
            onBattleEnd?.(
              Object.freeze({
                outcome,
                state,
                format
              })
            );
            return;
          }
        }

        aiReadyAt.set(
          resolution.actorId,
          Number(
            state.elapsedMs
          ) + 900
        );
        queueAiDecisions();
      });
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
    rosterSnapshot:
      rosterSession
        ? () =>
            rosterSession.snapshot()
        : () => null,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      clearTargetPulses();
      for (
        const cleanup of
          skillButtonCleanups.splice(0)
      ) {
        cleanup();
      }
      for (const cleanup of cleanups.splice(0)) {
        cleanup();
      }
      runtime.dispose();
      presenter.dispose();
      statusFx?.dispose();
      damageFeedback?.dispose();
      fx.dispose();
      combatAudio.dispose?.();
    }
  });
}
