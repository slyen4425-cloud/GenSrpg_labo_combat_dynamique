import {
  normalizeCaptureCombatPackage
} from "../../contracts/capture-combat-package.js";

function frozenIndex(entries) {
  return Object.freeze(Object.fromEntries(entries));
}

export function adaptCaptureCombatPackage(input) {
  const packageDefinition = normalizeCaptureCombatPackage(input);
  const { battleFormat } = packageDefinition;

  if (!battleFormat) {
    throw new TypeError(
      "battleFormat is required to adapt a Capture package for combat preview"
    );
  }

  const creatures = frozenIndex(
    packageDefinition.creatures.map((creature) => [
      creature.id,
      Object.freeze({
        id: creature.id,
        displayName: creature.displayName,
        fighterConfigId: creature.fighterConfigId,
        skillIds: creature.skillIds
      })
    ])
  );

  const fighterConfigs = frozenIndex(
    packageDefinition.creatures.map((creature) => [
      creature.fighterConfigId,
      creature.fighterConfig
    ])
  );

  const skills = frozenIndex(
    packageDefinition.skills.map((skill) => [skill.id, skill])
  );

  const fighters = Object.freeze(
    battleFormat.actors.map((actor) => {
      const fighterConfig = fighterConfigs[actor.fighterConfigId];
      return Object.freeze({
        ...fighterConfig,
        id: actor.actorId
      });
    })
  );

  const skillsByActor = frozenIndex(
    battleFormat.actors.map((actor) => {
      const creature = creatures[actor.creatureId];
      return [
        actor.actorId,
        Object.freeze(
          creature.skillIds.map((skillId) => skills[skillId])
        )
      ];
    })
  );

  return Object.freeze({
    packageDefinition,
    metadata: packageDefinition.metadata,
    creatures,
    fighterConfigs,
    skills,
    fighters,
    skillsByActor,
    roster: packageDefinition.roster,
    battleFormat,
    presentation: packageDefinition.presentation
  });
}
