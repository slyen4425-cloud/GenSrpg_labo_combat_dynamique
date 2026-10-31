import {createCombatEntityOverlayV1} from "../adapters/renderer/combat-entity-overlay-v1.js?v=wall-spatial-20261031-wall-state-20261031";
import { captureReactionRechargeClockV1 } from "./capture-reaction-recharge-clock-v1.js";
import { normalizeBattleFormatDefinition } from "../contracts/battle-format-definition.js";
import { normalizeSkillDefinition } from "../contracts/skill-definition.js";
import {
  normalizeCaptureGameOptionsV1,
  buildCaptureDodgeReactionSkillV1,
  captureDodgeActiveWindowMsV1
} from "../contracts/capture-game-options-v1.js";
import { captureCreatureReactionActionIdV1 } from "../contracts/capture-creature-defensive-reaction-v1.js";
import { captureReactionIconAssetIdV1 } from "../assets/capture-reaction-icon-presets-v1.js";
import { configureCombatRecallCommandsV1 } from "../contracts/combat-command-definition.js";
import { createCaptureCombatRosterControllerV1, mountCaptureCombatRosterPanelV1 } from "./capture-combat-roster-controller-v1.js?v=liane-audio-r2-20261030-snowball-v46-20261031-stage-energy-boule-20261031-ice-author-r2-20261031-charged-effects-20261031-ice-ground-spike-fog-20261031-barrier-20261031-hud-20261031-wall-spatial-20261031-wall-state-20261031";
import { createCombatSession } from "../core/combat/combat-session.js";
import { createEmbeddedCombatLifecycleV1 } from "./embedded-combat-lifecycle-v1.js";
import { createCombatRuntime } from "../core/combat/combat-runtime.js?v=wall-state-20261031";
import { createBattleActorAiController, CAPTURE_AI_TACTICS_V1_DEFAULT } from "../core/combat/battle-actor-ai-controller.js";
import {
  isSkillTargetAllowed,
  targetRelation
} from "../core/combat/targeting.js";
import { createCombatResolutionPresenter } from "../adapters/renderer/combat-resolution-presenter.js?v=liane-audio-r2-20261030-snowball-v46-20261031-stage-energy-boule-20261031-ice-author-r2-20261031-charged-effects-20261031-ice-ground-spike-fog-20261031-barrier-20261031-hud-20261031-wall-spatial-20261031-wall-state-20261031";
import { createDomSkillFxRenderer } from "../adapters/renderer/dom-skill-fx.js?v=projectile-native-bidirectional-20261028-wall-spatial-20261031-wall-state-20261031";
import { createCombatImpactHealthCueSyncV1 } from "../adapters/renderer/combat-impact-health-cue-v1.js";
import { createDomStatusFxRenderer } from "../adapters/renderer/dom-status-fx.js";
import { createDomDamageFeedbackRenderer } from "../adapters/renderer/dom-damage-feedback.js";
import { createCombatEnergyOrbsRendererV1 } from "../adapters/renderer/combat-energy-orbs-v1.js";
import { createCombatCastChargePresenterV1 } from "../adapters/renderer/combat-cast-charge-presentation-v1.js";
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

// Client-side selection of which LOCAL human actor owns the single visible HUD.
// It never mutates BattleFormat, Combat Session, AI controllers or the fighter roster.
export function createLocalControlSelectionV1({ format, onChange = () => {} }) {
  const localId = format?.localActorId;
  const localActor = format?.actor?.(localId) ?? format?.actors?.find(actor => actor.actorId === localId);
  if (!localActor || localActor.controllerId !== "human-local") {
    throw new RangeError("A local human actor is required");
  }
  const localHumans = format.actors.filter(actor =>
    actor.teamId === localActor.teamId && actor.controllerId === "human-local"
  ).map(actor => actor.actorId);
  // A future remote human is deliberately not treated as local or as an AI.
  const mode = localHumans.length === 2 ? "solo-dual" : "human-ai";
  let currentActorId = localId;
  return Object.freeze({
    mode,
    get actorId() { return currentActorId; },
    select(actorId) {
      if (!localHumans.includes(actorId)) {
        return Object.freeze({ ok: false, outcome: "not_local_human", changed: false });
      }
      if (currentActorId === actorId) {
        return Object.freeze({ ok: true, outcome: "already_controlled", changed: false });
      }
      const oldActorId = currentActorId;
      currentActorId = actorId;
      onChange(actorId, oldActorId);
      return Object.freeze({ ok: true, outcome: "control_switched", changed: true });
    }
  });
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
  if (!(skill?.targetLocations ?? ["active"]).includes("active")) {
    return Object.freeze({allowedIds:Object.freeze([]),availableIds:Object.freeze([]),previewsById:Object.freeze({})});
  }
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

// The UI projects canonical Roster candidate previews; no team/HP/damage rules
// are duplicated here. A reserve ref always identifies its exact member.
export function combatSkillReserveTargetOptionsV2({
  format, actorId, skill, rosterSnapshot, previewTarget
}) {
  if (!(skill?.targetLocations ?? ["active"]).includes("reserve") || !rosterSnapshot) return Object.freeze([]);
  if (typeof previewTarget !== "function") throw new TypeError("previewTarget is required");
  const available = [];
  for (const actor of format.actors) {
    const team = rosterSnapshot[actor.actorId];
    if (!team) continue;
    for (const member of team.members) {
      if (member.active || !(Number(member.hp) > 0)) continue;
      const targetRef = Object.freeze({scope:"reserve",teamId:actor.actorId,memberId:member.id});
      const preview = previewTarget({actorId,targetRef,skill});
      if (preview?.ok) available.push(Object.freeze({targetRef,preview,displayName:member.displayName}));
    }
  }
  return Object.freeze(available);
}

// Only the UI chooses an unambiguous target; Combat Rules still validates
// eligibility and Combat Runtime still owns the action commitment.
export function resolveCombatSkillClickTargetV1({
  actorId, skill, selectedTargetId, availableIds
}) {
  const available = Array.isArray(availableIds) ? availableIds : [];
  const relations = skill?.targetRelations ?? ["enemy"];

  // A self-only skill never needs a prior click on the caster.
  if (relations.length === 1 && relations[0] === "self") {
    return available.includes(actorId) ? actorId : null;
  }

  // Self-capable support needs no extra click when only one valid ally exists.
  // Preserve explicit ally-only targeting and any multi-candidate choice.
  if (available.length === 1 &&
      (relations.includes("self") ||
       (relations.length === 1 && relations[0] === "enemy"))) {
    return available[0];
  }

  // Preserve explicit selection for ally-only and multiple-candidate skills.
  return available.includes(selectedTargetId) ? selectedTargetId : null;
}

export async function mountCoop2v2Test({
  root,
  visuals,
  presentationAssets = null,
  fetchImpl = fetch,
  formatUrl = DATA_URLS.format,
  nativeCombatSource = null,
  embeddedBattle = null
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

  // An embedded host supplies only an already validated, Capture-owned HP
  // snapshot. The Lab still constructs the ONLY CombatSession and controls
  // all rules, state, effects and the single native combat clock.
  const initialHpByActor = embeddedBattle?.initialHpByActor ?? null;
  if(embeddedBattle!==null&&(!initialHpByActor||
     typeof initialHpByActor!=="object"||Array.isArray(initialHpByActor)||
     Object.keys(initialHpByActor).length!==fighters.length||
     fighters.some(fighter=>!Object.prototype.hasOwnProperty.call(initialHpByActor,fighter.id)||
       !Number.isFinite(initialHpByActor[fighter.id])||
       initialHpByActor[fighter.id]<=0||
       initialHpByActor[fighter.id]>fighter.maxHp))) {
    throw new TypeError("Embedded native Combat HP snapshot must match every active Lab fighter");
  }
  const nativeFighters = initialHpByActor===null ? fighters :
    fighters.map(fighter=>({...fighter,initialHp:initialHpByActor[fighter.id]}));
  const session = createCombatSession({
    distance: "medium",
    battleFormat: format,
    fighters: nativeFighters,
    skillSpeedMultiplier
  });
  const embeddedLifecycle=embeddedBattle===null?null:
    createEmbeddedCombatLifecycleV1({format});

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
  const energyOrbs = createCombatEnergyOrbsRendererV1({
    host: requiredElement(root, `[data-combat-energy-orbs="${format.localActorId}"]`)
  });
  const dodgeButton =
    root.querySelector("[data-combat-dodge]");
  const reactionIcon = dodgeButton?.querySelector("[data-combat-reaction-icon]") ?? null;
  const reactionColorIcon = dodgeButton?.querySelector("[data-combat-reaction-icon-color]") ?? null;
  const reactionIconShell = dodgeButton?.querySelector("[data-combat-reaction-icon-shell]") ?? null;
  const dodgeCharges =
    root.querySelector(
      "[data-combat-dodge-charges]"
    );
  const dodgeRecharge =
    root.querySelector(
      "[data-combat-dodge-recharge]"
    );
  // Resolve at the moment of use: roster recall and solo-dual control both
  // change which creature owns the action. No global dodge singleton.
  function defensiveActionFor(actorId) {
    const creatureId = actorMeta(actorId)?.creatureId;
    const personal = creatureId == null ? null :
      fighterConfigs?.[creatureId]?.defensiveReaction ?? null;
    if (personal !== null) {
      if (personal.type === "none") return null;
      const actionId = captureCreatureReactionActionIdV1(
        creatureId, personal.type
      );
      return Object.freeze({
        type: personal.type,
        iconAssetId: personal.iconAssetId ?? null,
        label: personal.type === "defense" ? "Défense" : "Esquive",
        skill: personal.type === "dodge" ?
          buildCaptureDodgeReactionSkillV1({
            ...gameOptions,
            dodge: {
              enabled: true,
              maxCharges: personal.maxCharges,
              rechargeMs: personal.rechargeMs,
              activeWindowMs: personal.activeWindowMs
            }
          }) : null,
        recharge: Object.freeze({
          actionId,
          maxCharges: personal.maxCharges,
          rechargeMs: personal.rechargeMs
        }),
        activeWindowMs: personal.activeWindowMs
      });
    }
    // Unedited legacy creature exports retain the old global rules.
    const legacySkill = buildCaptureDodgeReactionSkillV1(gameOptions);
    return legacySkill === null ? null : Object.freeze({
      type: "dodge",
      iconAssetId: null,
      label: "Esquive",
      skill: legacySkill,
      recharge: Object.freeze({
        actionId: legacySkill.id,
        maxCharges: gameOptions.dodge.maxCharges,
        rechargeMs: gameOptions.dodge.rechargeMs
      }),
      activeWindowMs: captureDodgeActiveWindowMsV1(gameOptions)
    });
  }

  const previewFormat =
    resolveCombatPreviewFormatV1(format);
  // The HTML preview class is shared by 1v1 and 2v2. Only the actual
  // BattleFormat may opt into 2v2-only landscape presentation.
  arena.dataset.combatActiveCount = String(previewFormat.localActorIds.length);
  // UI ownership only: the same two actor slots keep separate state/actions.
  const controlledLabel = root.querySelector("[data-combat-controlled-name]");
  const localControl = createLocalControlSelectionV1({
    format,
    onChange(nextActorId) {
      pendingSkillId = null;
      renderLocalSkills();
      renderState();
      setStatus("Tu contrôles maintenant " + (actorMeta(nextActorId)?.displayName ?? nextActorId) + ".", "accent");
    }
  });
  const controlledActorId = () => localControl.actorId;
  root.dataset.localControlMode = localControl.mode;
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

  const combatEntityOverlay=createCombatEntityOverlayV1({fighterContainers,
    teamOf:actorId=>format.teamOf(actorId),
    assetForId:assetId=>presentationAssets?.visualAsset?.(assetId)??null
  });

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

  const chargePresenters = Object.fromEntries(
    Object.entries(chargeRefs).map(([actorId, bar]) => [
      actorId,
      createCombatCastChargePresenterV1({ bar })
    ])
  );

  const cleanups = [];
  const skillRefs = new Map();
  const targetPulseTimers = new Map();
  let disposed = false;
  let selectedTargetId = previewFormat.initialTargetId;
  let pendingSkillId = null;
  // Only the selected reserve reference lives in UI; CombatRuntime owns the
  // entire clock/reactions, and RosterSession owns all applied bench effects.
  const pendingTimedReserveByActor = new Map();
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
    presentationForCreature(actorSlot) {
      return visuals.getCreatureAudioFor?.(actorSlot) ?? null;
    },
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
      if (!contact.waveMultiTarget) return runtime?.reportActionContact(contact) ?? null;
      return runtime?.reportExpandingWaveTargetContact(contact) ?? null;
    },
    onProjectileClashContact(contact) {
      return runtime?.reportProjectileClashContact(contact) ?? null;
    },
    targetCollisionModelFor(slotId) {
      return visuals.getCollisionModelFor(slotId);
    },
    barrierCollisionRectsFor({sourceActorId,targetActorId}) {
      return combatEntityOverlay.collisionRectsFor({sourceActorId,targetActorId});
    },
    waveTargetsFor(fromSlot) {
      // This is only a list of visible opponent models. The Runtime
      // independently enforces valid active enemy targets.
      if (previewFormat.enemyActorIds.length !== 2) return [];
      return format.actors
        .filter(actor => format.teamOf(actor.actorId) !== format.teamOf(fromSlot))
        .map(actor => actor.actorId);
    },
    anchors: motionAnchors,
    targetAnchors: fighterContainers,
    targetAnchorFor(slotId) {
      return visuals.getVisibleTargetRectFor(
        slotId
      );
    },
    restingOffsetFor(slotId) {
      return visuals.getRestingOffsetFor?.(slotId) ?? null;
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
    },
    onActionTravelEnd(approach) {
      return runtime?.reportGroundApproachEnd(approach) ?? null;
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

  function setCharge(actorId, snapshot = {}) {
    chargePresenters[actorId]?.render(snapshot);
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

  function reserveSkillTargetOptions(skill) {
    return combatSkillReserveTargetOptionsV2({
      format, actorId:controlledActorId(), skill,
      rosterSnapshot:rosterController?.snapshot() ?? null,
      previewTarget:args=>rosterController.previewSkillOnTarget(args)
    });
  }

  function skillTargetOptions(skill, state = session.snapshot()) {
    return combatSkillTargetOptionsV1({
      format,
      actorId: controlledActorId(),
      skill,
      state,
      previewSkill: ({ actorId, targetId, skill }) =>
        session.previewSkill({ actorId, targetId, skill }),
      isPresent: actorId =>
        rosterController === null || rosterController.isPresent(actorId)
    });
  }

  function renderControlledSelection() {
    const isDual = localControl.mode === "solo-dual";
    if (controlledLabel) {
      controlledLabel.hidden = !isDual;
      if (isDual) controlledLabel.textContent = "Commandes : " +
        (actorMeta(controlledActorId())?.displayName ?? controlledActorId());
    }
    for (const actor of format.actors) {
      for (const node of targetNodes(actor.actorId)) {
        node.dataset.controlledActor = isDual && actor.actorId === controlledActorId() ? "true" : "false";
      }
    }
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
        actorId: controlledActorId(),
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
    combatEntityOverlay.render(state);
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

    const local = state.fighters[controlledActorId()];
    energyBar.max = local.maxEnergy;
    energyBar.value = local.energy;
    energyValue.textContent =
      `${formatEnergy(local.energy)} / ${formatEnergy(local.maxEnergy)}⚡`;
    energyOrbs.render({
      energy: local.energy,
      maxEnergy: local.maxEnergy
    });

    fx.syncPersistentZones(
      state.persistentZones ?? []
    );
    zoneAudio.sync(
      state.persistentZones ?? []
    );
    renderAvailability();
    renderTargetSelection();
    renderControlledSelection();
    rosterPanel?.render();
  }

  function renderAvailability() {
    if (!runtime) {
      return;
    }

    const state = session.snapshot();
    const localAlive = isAlive(controlledActorId(), state);
    const lockedByAction =
      runtime.hasActiveActionFor(controlledActorId()) ||
      (localControl.mode !== "solo-dual" && runtime.activeActions.some(action =>
        action.actionType === "command" && action.command.kind !== "switch"
      ));

    if (pendingSkillId !== null) {
      const pending = skillRefs.get(pendingSkillId)?.skill;
      if (!pending || lockedByAction ||
        (skillTargetOptions(pending, state).availableIds.length === 0 && reserveSkillTargetOptions(pending).length === 0)) {
        pendingSkillId = null;
      }
    }

    for (const { button, cooldown, skill } of skillRefs.values()) {
      const options = skillTargetOptions(skill, state);
      const reserveOptions = reserveSkillTargetOptions(skill);
      const preview = options.previewsById[selectedTargetId] ??
        options.previewsById[options.allowedIds[0]] ?? reserveOptions[0]?.preview ?? { ok: false };
      const resolvedTargetId = resolveCombatSkillClickTargetV1({
        actorId: controlledActorId(), skill,
        selectedTargetId, availableIds: options.availableIds
      });
      button.dataset.targetRequired =
        reserveOptions.length > 0 || (options.availableIds.length > 0 && resolvedTargetId === null)
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

      const chargePreview = runtime.previewChargedSkillRetrigger({
        actorId:controlledActorId(),skillId:skill.id
      });
      const canCharge = chargePreview.ok;
      const owned = runtime.activeActionFor(controlledActorId());
      const charge = owned?.actionId === skill.id ? owned.chargeState : null;
      if (charge && !owned.released) {
        cooldown.textContent = chargePreview.outcome === "charge_preparing"
          ? `Charge ${charge.chargeCount}/${charge.maxCharges} · ${(chargePreview.remainingCastMs/1000).toFixed(1)} s`
          : canCharge ? `Renforcer ${charge.chargeCount}/${charge.maxCharges}`
          : chargePreview.outcome === "insufficient_energy" ? "Énergie insuffisante"
          : `Charge ${charge.chargeCount}/${charge.maxCharges}`;
        cooldown.hidden = false;
        button.dataset.cooldownActive = "false";
      }
      button.disabled =
        !localAlive || (!canCharge && (lockedByAction ||
          (options.availableIds.length === 0 && reserveOptions.length === 0)));
    }

    if (dodgeButton) {
      const reaction = defensiveActionFor(controlledActorId());
      const enabled = reaction !== null;
      dodgeButton.hidden = !enabled;
      if (!enabled) {
        dodgeButton.dataset.cooldownActive = "false";
        dodgeButton.dataset.cooldownExhausted = "false";
        dodgeButton.style.setProperty("--cooldown-progress", "1");
      }
      if (enabled) {
        const label = dodgeButton.querySelector("strong");
        if (label) label.textContent = reaction.label;
        if (reactionIcon) {
          const iconId = captureReactionIconAssetIdV1(reaction);
          const asset = iconId && typeof presentationAssets?.asset === "function"
            ? presentationAssets.asset(iconId) : null;
          const url = asset?.url;
          const hasIcon = typeof url === "string" && url !== "";
          reactionIcon.hidden = !hasIcon;
          if (reactionColorIcon) reactionColorIcon.hidden = !hasIcon;
          if (reactionIconShell) reactionIconShell.hidden = !hasIcon;
          for (const icon of [reactionIcon, reactionColorIcon]) {
            if (!icon) continue;
            if (!hasIcon) icon.removeAttribute("src");
            else if (icon.getAttribute("src") !== url) icon.src = url;
          }
        }
        const availability =
          runtime.rechargeableActionAvailability({
            actorId:
              controlledActorId(),
            ...reaction.recharge
          });

        const windowStatus =
          runtime.rechargeableReactionWindowStatus({
            actorId:
              controlledActorId(),
            recharge:
              reaction.recharge,
            activeWindowMs:
              reaction.activeWindowMs
          });

        dodgeButton.disabled =
          !localAlive ||
          lockedByAction ||
          windowStatus.active ||
          availability.charges <= 0;
        dodgeButton.dataset.active =
          windowStatus.active
            ? "true"
            : "false";
        // Same clockwise color-return fraction as ordinary skill buttons.
        // A charge still recharges while remaining charges are usable.
        const clock = captureReactionRechargeClockV1(availability);
        dodgeButton.dataset.cooldownActive = clock.active ? "true" : "false";
        dodgeButton.dataset.cooldownExhausted = clock.exhausted ? "true" : "false";
        dodgeButton.style.setProperty("--cooldown-progress", String(clock.progress));

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
    // In optional solo 2v2 an unarmed tap on either allied model/card
    // switches the HUD owner, not the target nor the roster.
    if (localControl.mode === "solo-dual" &&
        previewFormat.localActorIds.includes(actorId) &&
        pendingSkillId === null) {
      localControl.select(actorId);
      renderControlledSelection();
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
      actorId: controlledActorId(),
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
        const reaction = defensiveActionFor(controlledActorId());
        if (reaction === null) return;

        const result = runtime.activateRechargeableReaction(
          reaction.skill,
          {
            actorId: controlledActorId(),
            recharge: reaction.recharge,
            activeWindowMs: reaction.activeWindowMs
          }
        );

        if (!result.ok) {
          setStatus(
            result.outcome ===
              "no_charges"
              ? "Aucune charge de réaction disponible."
              : result.outcome ===
                  "already_active"
                ? "Réaction déjà active."
                : "Réaction impossible : " +
                  result.outcome +
                  ".",
            "warn"
          );
          renderAvailability();
          return;
        }

        // Successful activation only; never play for rejected actions.


        combatAudio.play({type:reaction.type,actorSlot:controlledActorId(),loop:false});

        const visualDurationMs =
          Number(
            result.window?.remainingMs ?? 0
          );
        if (visualDurationMs > 0) {
          visuals
            .playEventFor(
              controlledActorId(),
              reaction.type === "defense" ? "defense" : "dodge",
              {
                metadata: {
                  durationMs: visualDurationMs,
                  defensiveReaction: reaction.type
                }
              }
            )
            .catch(() => {});
        }

        setStatus(
          reaction.label + " active pendant " +
            (reaction.activeWindowMs / 1000).toFixed(1) + " s.",
          "accent"
        );
        renderAvailability();
      }
    );
  }

  function activateLocalReserveSkill(skill, targetRef) {
    const eligible = reserveSkillTargetOptions(skill).some(option =>
      option.targetRef.teamId === targetRef.teamId && option.targetRef.memberId === targetRef.memberId
    );
    if (!eligible || runtime.hasActiveActionFor(controlledActorId())) {
      setStatus(skill.name + " : créature de réserve indisponible.", "warn");
      renderAvailability();
      return false;
    }
    const actorId=controlledActorId();
    const staged=rosterController.prepareSkillOnTarget({actorId,targetRef,skill});
    if (!staged.ok) {
      setStatus(skill.name + " : " + staged.outcome + ".", "warn");
      renderAvailability();
      return false;
    }
    // Register the selected bench member before starting: a zero-duration
    // skill can be resolved synchronously by the canonical Runtime.
    const intent={skill,targetRef,expectedActiveMemberId:staged.expectedActiveMemberId,
      targetId:staged.targetId};
    pendingTimedReserveByActor.set(actorId,intent);
    const result=runtime.startSkill({actorId,targetId:staged.targetId,skill:staged.skill});
    if (!result.ok) {
      if (pendingTimedReserveByActor.get(actorId)===intent)pendingTimedReserveByActor.delete(actorId);
      setStatus(skill.name + " : " + result.outcome + ".", "warn");
      renderAvailability();
      return false;
    }
    pendingSkillId=null;
    const member=rosterController.snapshot()[targetRef.teamId]?.members.find(x=>x.id===targetRef.memberId);
    setStatus(skill.name + " se prépare : liane vers " +
      (member?.displayName ?? targetRef.memberId) + ". L'adversaire peut esquiver ou contrer.", "accent");
    renderAvailability();
    return true;
  }

  function activateLocalSkill(skill, targetId) {
    const allowed = isSkillTargetAllowed({
      format, actorId: controlledActorId(), targetId, skill
    });
    if (!allowed.ok || !skillTargetOptions(skill).availableIds.includes(targetId)) {
      setStatus(skill.name + " : cible indisponible.", "warn");
      renderAvailability();
      return;
    }
    const result = runtime.startSkill({
      actorId: controlledActorId(), targetId, skill
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
            controlledActorId()
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
      const active = runtime.activeActionFor(controlledActorId());
      if (active?.actionId === skill.id && active.chargeState) {
        const next = runtime.startSkill({
          actorId:controlledActorId(),targetId:active.targetId,skill
        });
        setStatus(next.ok
          ? `${skill.name} renforcée : ${next.chargeCount}/${next.maxCharges} activations.`
          : `${skill.name} : ${next.outcome}.`,next.ok?"accent":"warn");
        renderAvailability();
        return;
      }
      const options = skillTargetOptions(skill);
      const reserveOptions = reserveSkillTargetOptions(skill);
      if (reserveOptions.length > 0) {
        pendingSkillId = skill.id;
        const enemyBench = reserveOptions.some(x =>
          format.teamOf(x.targetRef.teamId)!==format.teamOf(controlledActorId()));
        setStatus(skill.name+(enemyBench
          ? " : touche une cible active ou choisis une créature dans Réserves adverses."
          : " : touche une cible active ou choisis une réserve alliée dans Rappel."),"accent");
        if(enemyBench)rosterPanel?.openEnemyForSkill();
        else rosterPanel?.openForSkill();
        renderAvailability();
        renderTargetSelection();
        return;
      }
      const resolvedTargetId = resolveCombatSkillClickTargetV1({
        actorId: controlledActorId(), skill,
        selectedTargetId, availableIds: options.availableIds
      });
      if (resolvedTargetId === null) {
        pendingSkillId = skill.id;
        setStatus(skill.name + " : touche une cible mise en évidence pour lancer la capacité.", "accent");
        renderAvailability();
        renderTargetSelection();
        return;
      }
      pendingSkillId = null;
      activateLocalSkill(skill, resolvedTargetId);
    };
    button.addEventListener("click", onClick);

    return Object.freeze({ button, cooldown, dispose() { button.removeEventListener("click", onClick); } });
  }

  function renderLocalSkills() {
    pendingSkillId = null;
    for (const refs of skillRefs.values()) refs.dispose();
    skillRefs.clear();
    skillContainer.replaceChildren();
    const ids = rosterController?.skillIdsFor(controlledActorId()) ?? skillIdsByActor[controlledActorId()];
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

  const impactHealthCue = createCombatImpactHealthCueSyncV1({
    presentationForSkill(skillId, context = {}) {
      return presentationForActorSkill(skillId, context);
    }
  });

  runtime = createCombatRuntime({
    session,
    groundContactResolution: "visible",
    enableExpandingWaveMultiTarget: previewFormat.enemyActorIds.length === 2,
    readBarrierContact({sourceActorId,targetActorId,kind,skillId}) {
      return fx.barrierContactFor({sourceActorId,targetActorId,kind,skillId});
    },
    readZoneSpatialContext: state => fx.sampleZoneSpatialContext(state.persistentZones ?? []),
    onState(state) {
      impactHealthCue.clear();
      if (rosterController) for (const actor of format.actors) {
        if (Number(state.fighters[actor.actorId]?.hp) <= 0 && rosterController.isPresent(actor.actorId)) {
          queueKoReplacement(actor.actorId);
        }
      }
      renderState(state);
      embeddedLifecycle?.observe(state);
      queueAiDecisions();
    },
    onHealthDelta(feedback) {
      if (!["damage", "heal"].includes(feedback.kind)) return;
      const delayMs = impactHealthCue.delayFor(feedback);
      fx.play({
        type: feedback.kind,
        targetSlot: feedback.actorId,
        amount: feedback.amount,
        durationMs: 700,
        delayMs
      });
      if (feedback.kind === "damage") {
        damageFeedback?.flash(feedback.actorId, { delayMs });
      }
    },
    onContactHoldStart({actorId}) {
      if (actionRefs[actorId]) actionRefs[actorId].textContent = "Au contact";
    },
    onContactHoldEnd({actorId,reason}) {
      if (reason === "ko_or_absent") visuals.cancelFor(actorId);
      else visuals.releaseHeldApproachFor?.(actorId);
      if (actionRefs[actorId]) actionRefs[actorId].textContent = "Prêt";
      renderState();
      queueAiDecisions();
    },
    onClock(state) {
      statusFx?.syncCountdowns(state);
      renderAvailability();
      for (const controller of aiControllers) {
        const decision = controller.maybeDodge({ elapsedMs: state.elapsedMs });
        if (decision.status === "dodged" || decision.status === "defended") {
          combatAudio.play({type:decision.status === "defended"?"defense":"dodge",actorSlot:decision.actorId,loop:false});
          void Promise.resolve(visuals.playEventFor(decision.actorId, decision.status === "defended" ? "defense" : "dodge", {
            metadata: { durationMs: decision.durationMs }
          })).catch(() => {});
        }
      }
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
      if (preparing && progress.chargeCount) {
        presenter.presentChargeAmplification({actorSlot:progress.actorId,sizeMultiplier:progress.sizeMultiplier,durationMs:progress.preparationMs});
      }

      setCharge(progress.actorId, {
        value: preparing ? progress.chargeProgress : 0,
        active: preparing,
        actionName: progress.actionName,
        remainingMs: preparing ? progress.remainingPreparationMs : 0
      });

      if (!progress.actionId) {
        ref.textContent = "Prêt";
      } else if (preparing) {
        ref.textContent =
          `${progress.actionName} · ${(progress.remainingPreparationMs / 1000).toFixed(1)} s${progress.chargeCount ? ` · ${progress.chargeCount}/${progress.chargeMax} charges` : ""}`;
      } else {
        ref.textContent =
          `${progress.actionName} · ${progress.phase}`;
      }

      if (progress.actorId === controlledActorId()) {
        renderAvailability();
      }
    },
    onRelease({ action }) {
      for (const controller of aiControllers) {
        controller.observeRelease({ action, elapsedMs: session.snapshot().elapsedMs });
      }
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
      impactHealthCue.register(resolution);
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
      const reserveIntent=pendingTimedReserveByActor.get(resolution.actorId);
      if (reserveIntent && reserveIntent.skill.id===resolution.skillId &&
          reserveIntent.targetId===resolution.targetId) {
        pendingTimedReserveByActor.delete(resolution.actorId);
        if (resolution.ok && resolution.outcome==="hit") {
          const result=rosterController.completeTimedSkillOnTarget({
            actorId:resolution.actorId,targetRef:reserveIntent.targetRef,
            skill:reserveIntent.skill,expectedActiveMemberId:reserveIntent.expectedActiveMemberId,
            completedResolution:resolution
          });
          if (result.ok) {
            const member=rosterController.snapshot()[reserveIntent.targetRef.teamId]?.members.find(
              x=>x.id===reserveIntent.targetRef.memberId);
            setStatus(reserveIntent.skill.name + " : " +
              (member?.displayName ?? reserveIntent.targetRef.memberId) +
              (result.outcome==="forced_switched" ? " capturée par la liane et forcée d'entrer en combat." : " touchée en réserve."), "ok");
          } else {
            setStatus(reserveIntent.skill.name + " : " + result.outcome + ".", "warn");
          }
        } else {
          setStatus(reserveIntent.skill.name + " : " + resolution.outcome +
            " — aucun remplacement ni marqueur appliqué.", "warn");
        }
      }
      const presentation = presenter.presentOutcome({
        resolution,
        actorSlot: resolution.actorId,
        targetSlot: resolution.targetId
      });

      // Each wave hit resolves immediately, but the one action and its
      // visible growth keep running until the native travel deadline.
      if (resolution.waveContact !== true) {
        setCharge(resolution.actorId);
        actionRefs[resolution.actorId].textContent = "Prêt";
      }

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

      if (resolution.waveContact !== true) {
        aiReadyAt.set(
          resolution.actorId,
          Number(session.snapshot().elapsedMs) + 900
        );
        queueAiDecisions();
      }
    },
    onInterrupted(result) {
      const actorId = result.action?.actorId;
      if (actorId) pendingTimedReserveByActor.delete(actorId);
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
      const allyIds = format.actors
        .filter(actor => actor.actorId !== spec.actorId && format.teamOf(actor.actorId) === format.teamOf(spec.actorId))
        .map(actor => actor.actorId);
      aiControllers.push(createBattleActorAiController({
        session, runtime, actorId: spec.actorId, targetIds: targets, allyIds, skillIds: ids, skillsById,
        tactics: CAPTURE_AI_TACTICS_V1_DEFAULT,
        dodge: (() => {
          const reaction = defensiveActionFor(spec.actorId);
          return reaction === null ? null : {
            type: reaction.type,
            skill: reaction.skill,
            recharge: reaction.recharge,
            activeWindowMs: reaction.activeWindowMs
          };
        })()
      }));
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
      battleFormat:format,
      recallCooldownMs: gameOptions.recallCooldownMs,
      beforeActorChanged: actorId => presenter.cancelActionPresentation(actorId),
      cancelActiveActionForForcedSwitch: actorId => runtime?.cancelActionsForActor(actorId,{reason:"forced_switch"}),
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
    rosterPanel = mountCaptureCombatRosterPanelV1({ root, controller: rosterController, format, commands, session,
      getControlledActorId: controlledActorId,
      getCreatureDescriptor: creatureId => visuals.getCreatureDescriptor(creatureId),
      getRuntime: () => runtime, isTransitionPending: () => koTransitions.size > 0, setStatus,
      reserveTargetCandidates: () => pendingSkillId === null ? [] : reserveSkillTargetOptions(skillRefs.get(pendingSkillId)?.skill),
      onTargetReserve(targetRef) {
        const skill = pendingSkillId === null ? null : skillRefs.get(pendingSkillId)?.skill;
        return skill ? activateLocalReserveSkill(skill,targetRef) : false;
      }
    });
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
    // An embedded host receives a native Lab outcome and actual native
    // snapshots, never a fabricated GenSrpg UI result or a second runtime.
    completion: embeddedLifecycle?.completion ?? null,
    flee(){
      if(!embeddedLifecycle||disposed)return false;
      return embeddedLifecycle.flee(session.snapshot());
    },
    get selectedTargetId() {
      return selectedTargetId;
    },
    get controlledActorId() { return controlledActorId(); },
    get controlMode() { return localControl.mode; },
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
      combatEntityOverlay.dispose();
      statusFx?.dispose();
      damageFeedback?.dispose();
      fx.dispose();
      zoneAudio.dispose();
      combatAudio.dispose?.();
    }
  });
}
