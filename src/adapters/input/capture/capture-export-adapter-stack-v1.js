import {
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  adaptCaptureCreatureToFighterConfig
} from "./capture-creature-to-fighter-config.js";
import {
  adaptCaptureSkillToSkillDefinition
} from "./capture-skill-to-skill-definition.js";
import {
  adaptCaptureExportToBattleFormat,
  adaptCaptureExportToRosterDefinition
} from "./capture-roster-format-adapter-v1.js";
import {
  adaptCaptureSkillPresentationBinding
} from "./capture-skill-presentation-adapter-v1.js";

export function adaptCaptureCombatExportStackV1(input) {
  const exported = normalizeCaptureCombatExportV1(input);
  const creatureById = new Map(
    exported.creatures.map((creature) => [creature.id, creature])
  );

  const fighterConfigs = Object.freeze(
    Object.fromEntries(
      exported.creatures.map((creature) => [
        creature.id,
        adaptCaptureCreatureToFighterConfig(creature)
      ])
    )
  );

  const fighters = Object.freeze(
    exported.actors.map((actor) =>
      adaptCaptureCreatureToFighterConfig(
        creatureById.get(actor.creatureId),
        { fighterId: actor.actorId }
      )
    )
  );

  const skills = Object.freeze(
    Object.fromEntries(
      exported.skills.map((skill) => [
        skill.id,
        adaptCaptureSkillToSkillDefinition(skill)
      ])
    )
  );

  const skillIdsByActor = Object.freeze(
    Object.fromEntries(
      exported.actors.map((actor) => [
        actor.actorId,
        creatureById.get(actor.creatureId).skillIds
      ])
    )
  );

  const skillIdsByCreature = Object.freeze(
    Object.fromEntries(
      exported.creatures.map((creature) => [
        creature.id,
        creature.skillIds
      ])
    )
  );

  const skillPresentations = Object.freeze(
    Object.fromEntries(
      exported.skills.map((skill) => [
        skill.id,
        adaptCaptureSkillPresentationBinding(exported, skill.id)
      ])
    )
  );

  return Object.freeze({
    battleFormat: adaptCaptureExportToBattleFormat(exported),
    skillSpeedMultiplier:
      exported.battle.skillSpeedMultiplier,
    roster: adaptCaptureExportToRosterDefinition(exported),
    fighterConfigs,
    fighters,
    skills,
    skillIdsByActor,
    skillIdsByCreature,
    skillPresentations
  });
}
