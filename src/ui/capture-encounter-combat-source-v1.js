import { adaptCaptureCombatExportStackV1 } from "../adapters/input/capture/capture-export-adapter-stack-v1.js";
import { normalizeBattleFormatDefinition } from "../contracts/battle-format-definition.js";
import { buildCaptureEditorCombatTestV1 } from "./capture-editor-combat-test-v1.js";
import {projectCaptureEncounterOwnedStatsV1} from "../adapters/input/capture/capture-encounter-owned-stats-v1.js";

function requireParticipant(participant, side) {
  if (typeof participant?.speciesId !== "string" || !participant.speciesId.trim()) {
    throw new TypeError(side + " speciesId is required");
  }
  if (!Number.isSafeInteger(participant.level) || participant.level < 1) {
    throw new RangeError(side + " level must be a positive safe integer");
  }
}

// The official Combat builder owns the sole encounter-only HP projection.
// Authored creature definitions, saved participant HP, skills, levels and
// the historical level-20 Tester remain entirely outside this projection.
const ADVENTURE_HP_PROJECTED_V1 = Symbol("capture-adventure-hp-projected");
// The SAME pure, Combat-owned integer rule powers fighter configs, Combat HUD
// (via session.maxHp) and the read-only GenSRPG Adventure health sheet.
// Never scale a persisted current-HP snapshot or an authored creature.
export function projectCaptureEncounterMaxHpV1(amount, multiplier = 1) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0)
    throw new RangeError("Capture maximum HP must be a finite non-negative number");
  if (typeof multiplier !== "number" || !Number.isFinite(multiplier) ||
      multiplier <= 0 || multiplier > 1)
    throw new RangeError("Adventure HP multiplier must be in (0, 1]");
  return amount === 0 ? 0 : Math.max(1, Math.ceil(amount * multiplier));
}
export function applyCaptureEncounterHpMultiplierV1(source, multiplier = 1) {
  // Validate even at 100%, before returning the unmodified Tester source.
  projectCaptureEncounterMaxHpV1(0, multiplier);
  if (source?.[ADVENTURE_HP_PROJECTED_V1])
    throw new RangeError("Adventure HP already scaled on this Combat source");
  if (multiplier === 1) return source;
  const scale = amount => projectCaptureEncounterMaxHpV1(amount, multiplier);
  const change = fighter => Object.freeze({
    ...fighter,
    maxHp: scale(fighter.maxHp),
    ...(Object.hasOwn(fighter, "initialHp") ? {initialHp: scale(fighter.initialHp)} : {})
  });
  const fighterConfigs = Object.freeze(Object.fromEntries(
    Object.entries(source.fighterConfigs).map(([id, config]) => [id, change(config)])
  ));
  const fighters = Object.freeze(source.fighters.map(change));
  return Object.freeze({
    ...source, fighterConfigs, fighters,
    [ADVENTURE_HP_PROJECTED_V1]: true
  });
}

export function buildCaptureEncounterCombatSourceV1({ local, opponent, hpMultiplier = 1, ...options } = {}) {
  requireParticipant(local, "Local");
  requireParticipant(opponent, "Opponent");
  // Only Combat projects stat allocations. GenSRPG owns the saved wallet,
  // and Exploration transports the optional, scoped instance-only values.
  // Explicit enemy allocations need a separate certified NPC contract.
  if (opponent.statAllocations !== undefined)
    throw new RangeError('Opponent statAllocations require an official NPC instance contract');
  const authoredCreatures=options.configuredCreatures;
  const ownedCreatures=projectCaptureEncounterOwnedStatsV1({
    configuredCreatures:authoredCreatures,statRegistry:options.statRegistry,
    speciesId:local.speciesId,statAllocations:local.statAllocations
  });
  const hasOwnedStatOverride=ownedCreatures!==authoredCreatures;
  const mirror = local.speciesId === opponent.speciesId;
  const build = (creatureLevelsById, configuredCreatures=ownedCreatures) => buildCaptureEditorCombatTestV1({
    ...options,configuredCreatures,
    localCreatureIds: [local.speciesId],
    opponentCreatureIds: [opponent.speciesId],
    activePerTeam: 1,
    creatureLevelsById
  });
  const exported = build(mirror
    ? { [local.speciesId]: local.level }
    : { [local.speciesId]: local.level, [opponent.speciesId]: opponent.level });
  const source = adaptCaptureCombatExportStackV1(exported);
  if (!mirror || (local.level === opponent.level && !hasOwnedStatOverride)) {
    return applyCaptureEncounterHpMultiplierV1(Object.freeze({ ...source, exported }), hpMultiplier);
  }

  // The author export is keyed by species. Project the opponent separately
  // through the same exporter, then bind its config to the existing roster slot.
  const rival = adaptCaptureCombatExportStackV1(build({ [opponent.speciesId]: opponent.level }, authoredCreatures));
  const actorId = source.battleFormat.teams["enemy-team"][0];
  const team = source.roster.teams[actorId];
  const memberId = team.activeMemberId;
  const configId = "roster/" + actorId + "/" + memberId;
  const rivalFighter = rival.fighters.find(fighter => fighter.id === actorId);
  const rivalSkills = rival.skillIdsByActor[actorId];
  return applyCaptureEncounterHpMultiplierV1(Object.freeze({
    ...source,
    exported,
    battleFormat: normalizeBattleFormatDefinition({
      ...source.battleFormat,
      actors: source.battleFormat.actors.map(actor =>
        actor.actorId === actorId ? { ...actor, fighterConfigId: configId } : actor)
    }),
    fighters: Object.freeze(source.fighters.map(fighter =>
      fighter.id === actorId ? rivalFighter : fighter)),
    fighterConfigs: Object.freeze({
      ...source.fighterConfigs, [configId]: rival.fighterConfigs[opponent.speciesId]
    }),
    roster: Object.freeze({
      teams: Object.freeze({
        ...source.roster.teams,
        [actorId]: Object.freeze({
          ...team,
          members: Object.freeze(team.members.map(member => Object.freeze({
            ...member, fighterConfigId: configId
          })))
        })
      })
    }),
    skillIdsByActor: Object.freeze({ ...source.skillIdsByActor, [actorId]: rivalSkills }),
    skillIdsByRosterMember: Object.freeze({
      [actorId]: Object.freeze({ [memberId]: rivalSkills })
    }),
    skills: Object.freeze({ ...source.skills, ...rival.skills }),
    skillPresentations: Object.freeze({ ...source.skillPresentations, ...rival.skillPresentations })
  }), hpMultiplier);
}
