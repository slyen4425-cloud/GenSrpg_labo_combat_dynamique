import { adaptCaptureCombatExportStackV1 } from "../adapters/input/capture/capture-export-adapter-stack-v1.js";
import { normalizeBattleFormatDefinition } from "../contracts/battle-format-definition.js";
import { buildCaptureEditorCombatTestV1 } from "./capture-editor-combat-test-v1.js";

function requireParticipant(participant, side) {
  if (typeof participant?.speciesId !== "string" || !participant.speciesId.trim()) {
    throw new TypeError(side + " speciesId is required");
  }
  if (!Number.isInteger(participant.level) || participant.level < 1 || participant.level > 100) {
    throw new RangeError(side + " level must be an integer in 1..100");
  }
}

// The official Combat builder owns the sole encounter-only HP projection.
// Authored creature definitions, saved participant HP, skills, levels and
// the historical level-20 Tester remain entirely outside this projection.
const ADVENTURE_HP_PROJECTED_V1 = Symbol("capture-adventure-hp-projected");
export function applyCaptureEncounterHpMultiplierV1(source, multiplier = 1) {
  if (!Number.isFinite(multiplier) || multiplier <= 0 || multiplier > 1)
    throw new RangeError("Adventure HP multiplier must be in (0, 1]");
  if (source?.[ADVENTURE_HP_PROJECTED_V1])
    throw new RangeError("Adventure HP already scaled on this Combat source");
  if (multiplier === 1) return source;
  const scale = amount => amount === 0 ? 0 : Math.max(1, Math.ceil(amount * multiplier));
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
  const mirror = local.speciesId === opponent.speciesId;
  const build = creatureLevelsById => buildCaptureEditorCombatTestV1({
    ...options,
    localCreatureIds: [local.speciesId],
    opponentCreatureIds: [opponent.speciesId],
    activePerTeam: 1,
    creatureLevelsById
  });
  const exported = build(mirror
    ? { [local.speciesId]: local.level }
    : { [local.speciesId]: local.level, [opponent.speciesId]: opponent.level });
  const source = adaptCaptureCombatExportStackV1(exported);
  if (!mirror || local.level === opponent.level) {
    return applyCaptureEncounterHpMultiplierV1(Object.freeze({ ...source, exported }), hpMultiplier);
  }

  // The author export is keyed by species. Project the opponent separately
  // through the same exporter, then bind its config to the existing roster slot.
  const rival = adaptCaptureCombatExportStackV1(build({ [opponent.speciesId]: opponent.level }));
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
