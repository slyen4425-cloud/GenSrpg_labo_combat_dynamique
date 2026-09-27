import {
  normalizeCaptureExportV1
} from "../../../contracts/capture-export-v1.js";
import {
  adaptCaptureCreature
} from "./creature-adapter-v1.js";
import {
  adaptCaptureCreatureSkills
} from "./skill-adapter-v1.js";
import {
  adaptCaptureBattleFormat
} from "./roster-format-adapter-v1.js";

export function buildCaptureCombatBundle(
  input,
  { battleFormatId = "capture-export-battle-v1" } = {}
) {
  const captureExport = normalizeCaptureExportV1(input);
  const battleFormat = adaptCaptureBattleFormat(
    captureExport,
    { id: battleFormatId }
  );

  const fighters = Object.freeze(
    battleFormat.actors.map((actor) => {
      const { fighterConfig } = adaptCaptureCreature(
        captureExport,
        actor.creatureId
      );

      return Object.freeze({
        ...fighterConfig,
        id: actor.actorId
      });
    })
  );

  const skillsByActor = {};
  for (const actor of battleFormat.actors) {
    skillsByActor[actor.actorId] =
      adaptCaptureCreatureSkills(
        captureExport,
        actor.creatureId
      );
  }

  return Object.freeze({
    battleFormat,
    fighters,
    skillsByActor: Object.freeze(skillsByActor)
  });
}
