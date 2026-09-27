import {
  normalizeCaptureCombatExportV1
} from "../../../contracts/capture-combat-export-v1.js";
import {
  captureCreatureToFighterConfig
} from "./creature-to-fighter-config.js";
import {
  adaptCaptureCombatSkill,
  adaptCaptureCombatCreatureSkills
} from "./skill-to-skill-definition.js";
import {
  adaptCaptureCombatBattleFormat,
  adaptCaptureCombatRoster
} from "./roster-format-adapter.js";
import {
  adaptCapturePresentationBindings
} from "./presentation-adapter.js";

export const CAPTURE_COMBAT_PACKAGE_SCHEMA =
  "capture-combat-package-v1";

function freezeObjectFromEntries(entries) {
  return Object.freeze(Object.fromEntries(entries));
}

export function buildCaptureCombatPackageV1(input) {
  const captureExport = normalizeCaptureCombatExportV1(input);

  const battleFormat =
    adaptCaptureCombatBattleFormat(captureExport);

  const fighterConfigs = freezeObjectFromEntries(
    captureExport.creatures.map((creature) => [
      creature.id,
      captureCreatureToFighterConfig(creature)
    ])
  );

  const skills = freezeObjectFromEntries(
    captureExport.skills.map((skill) => [
      skill.id,
      adaptCaptureCombatSkill(captureExport, skill.id)
    ])
  );

  const skillsByCreature = freezeObjectFromEntries(
    captureExport.creatures.map((creature) => [
      creature.id,
      adaptCaptureCombatCreatureSkills(
        captureExport,
        creature.id
      )
    ])
  );

  const initialFighters = Object.freeze(
    battleFormat.actors.map((actor) => {
      const config = fighterConfigs[actor.fighterConfigId];
      if (!config) {
        throw new RangeError(
          `Missing fighter config for actor ${actor.actorId}`
        );
      }
      return Object.freeze({
        ...config,
        id: actor.actorId
      });
    })
  );

  return Object.freeze({
    schema: CAPTURE_COMBAT_PACKAGE_SCHEMA,
    battleFormat,
    fighterConfigs,
    initialFighters,
    skills,
    skillsByCreature,
    roster: adaptCaptureCombatRoster(captureExport),
    presentationBindings:
      adaptCapturePresentationBindings(captureExport)
  });
}
