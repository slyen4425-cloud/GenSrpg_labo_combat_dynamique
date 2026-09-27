import {
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  normalizeBattleFormatDefinition
} from "../../../contracts/battle-format-definition.js";

function freezeMember(member) {
  return Object.freeze({
    id: member.id,
    creatureId: member.creatureId,
    displayName: member.displayName,
    fighterConfigId: member.creatureId
  });
}

export function adaptCaptureCombatBattleFormat(input) {
  const captureExport = normalizeCaptureCombatExportV1(input);

  return normalizeBattleFormatDefinition({
    id: captureExport.battle.id,
    localActorId: captureExport.battle.localActorId,
    teams: captureExport.teams,
    actors: captureExport.actors.map((actor) => ({
      actorId: actor.actorId,
      teamId: actor.teamId,
      creatureId: actor.creatureId,
      displayName: actor.displayName,
      fighterConfigId: actor.creatureId,
      controllerId: actor.controllerId
    }))
  });
}

export function adaptCaptureCombatRoster(input) {
  const captureExport = normalizeCaptureCombatExportV1(input);

  const teams = Object.fromEntries(
    captureExport.rosters.map((roster) => [
      roster.slotId,
      Object.freeze({
        slotId: roster.slotId,
        activeMemberId: roster.activeMemberId,
        members: Object.freeze(
          roster.members.map(freezeMember)
        )
      })
    ])
  );

  return Object.freeze({
    teams: Object.freeze(teams)
  });
}
