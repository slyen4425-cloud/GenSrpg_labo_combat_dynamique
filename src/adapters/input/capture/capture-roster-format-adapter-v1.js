import {
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  normalizeBattleFormatDefinition
} from "../../../contracts/battle-format-definition.js";

function normalizedExport(input) {
  return normalizeCaptureCombatExportV1(input);
}

export function adaptCaptureExportToBattleFormat(input) {
  const exported = normalizedExport(input);

  return normalizeBattleFormatDefinition({
    id: exported.battle.id,
    localActorId: exported.battle.localActorId,
    teams: exported.teams,
    actors: exported.actors.map((actor) => ({
      actorId: actor.actorId,
      teamId: actor.teamId,
      creatureId: actor.creatureId,
      displayName: actor.displayName,
      fighterConfigId: actor.creatureId,
      controllerId: actor.controllerId
    }))
  });
}

export function adaptCaptureExportToRosterDefinition(input) {
  const exported = normalizedExport(input);
  const actorById = new Map(
    exported.actors.map((actor) => [actor.actorId, actor])
  );
  const teams = {};

  for (const roster of exported.rosters) {
    const actor = actorById.get(roster.slotId);
    const activeMember =
      roster.activeMemberId == null
        ? null
        : roster.members.find(
            (member) => member.id === roster.activeMemberId
          ) ?? null;

    if (
      activeMember &&
      activeMember.creatureId !== actor.creatureId
    ) {
      throw new RangeError(
        `active roster creature for slot ${roster.slotId} must match actor creature`
      );
    }

    teams[roster.slotId] = Object.freeze({
      slotId: roster.slotId,
      activeMemberId: roster.activeMemberId,
      members: Object.freeze(
        roster.members.map((member) =>
          Object.freeze({
            id: member.id,
            creatureId: member.creatureId,
            displayName: member.displayName,
            fighterConfigId: member.creatureId
          })
        )
      )
    });
  }

  return Object.freeze({
    teams: Object.freeze(teams)
  });
}
