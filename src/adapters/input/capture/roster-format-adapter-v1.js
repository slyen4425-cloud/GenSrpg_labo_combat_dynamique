import {
  normalizeCaptureExportV1
} from "../../../contracts/capture-export-v1.js";
import {
  normalizeBattleFormatDefinition
} from "../../../contracts/battle-format-definition.js";

function creatureById(captureExport, creatureId) {
  const creature = captureExport.creatures.find(
    (item) => item.id === creatureId
  );

  if (!creature) {
    throw new RangeError(
      `Unknown Capture creature: ${String(creatureId)}`
    );
  }

  return creature;
}

function nativeRosterMember(captureExport, member) {
  const creature = creatureById(
    captureExport,
    member.creatureId
  );

  return Object.freeze({
    id: member.id,
    creatureId: creature.id,
    displayName: creature.displayName,
    fighterConfigId: creature.id
  });
}

export function adaptCaptureBattleFormat(
  input,
  { id = "capture-export-battle-v1" } = {}
) {
  const captureExport = normalizeCaptureExportV1(input);
  const teams = {};
  const actors = [];

  for (const team of captureExport.teams) {
    const activeMembers = team.members.filter(
      (member) => member.active
    );

    teams[team.id] = activeMembers.map(
      (member) => member.id
    );

    for (const member of activeMembers) {
      const creature = creatureById(
        captureExport,
        member.creatureId
      );

      actors.push({
        actorId: member.id,
        teamId: team.id,
        creatureId: creature.id,
        displayName: creature.displayName,
        fighterConfigId: creature.id,
        controllerId: member.controllerId
      });
    }
  }

  return normalizeBattleFormatDefinition({
    id,
    localActorId: captureExport.localMemberId,
    teams,
    actors
  });
}

export function adaptCaptureSingleActiveRoster(input) {
  const captureExport = normalizeCaptureExportV1(input);
  const teams = {};

  for (const team of captureExport.teams) {
    const activeMembers = team.members.filter(
      (member) => member.active
    );

    if (activeMembers.length !== 1) {
      throw new RangeError(
        "Capture roster adapter currently requires exactly one active member per team"
      );
    }

    teams[team.id] = Object.freeze({
      slotId: team.id,
      activeMemberId: activeMembers[0].id,
      members: Object.freeze(
        team.members.map((member) =>
          nativeRosterMember(captureExport, member)
        )
      )
    });
  }

  return Object.freeze({
    teams: Object.freeze(teams)
  });
}
