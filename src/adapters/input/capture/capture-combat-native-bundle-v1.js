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

export const CAPTURE_COMBAT_NATIVE_BUNDLE_SCHEMA =
  "capture-combat-native-bundle-v1";

function frozenIndex(entries) {
  return Object.freeze(Object.fromEntries(entries));
}

export function adaptCaptureCombatExportToNativeBundle(input) {
  const exported = normalizeCaptureCombatExportV1(input);

  const fighterConfigs = frozenIndex(
    exported.creatures.map((creature) => [
      creature.id,
      adaptCaptureCreatureToFighterConfig(creature)
    ])
  );

  const skills = frozenIndex(
    exported.skills.map((skill) => [
      skill.id,
      adaptCaptureSkillToSkillDefinition(skill)
    ])
  );

  const battleFormat = adaptCaptureExportToBattleFormat(
    exported
  );

  const roster = adaptCaptureExportToRosterDefinition(
    exported
  );

  const skillPresentations = frozenIndex(
    exported.skills.map((skill) => [
      skill.id,
      adaptCaptureSkillPresentationBinding(
        exported,
        skill.id
      )
    ])
  );

  return Object.freeze({
    schema: CAPTURE_COMBAT_NATIVE_BUNDLE_SCHEMA,
    fighterConfigs,
    skills,
    battleFormat,
    roster,
    skillPresentations
  });
}
