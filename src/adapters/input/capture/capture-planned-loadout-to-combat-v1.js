import {
  normalizeCaptureActiveSkillLoadoutV1
} from "../../../contracts/capture-active-skill-loadout-v1.js";
import {
  normalizeCaptureCreatureEditorDraftV3
} from "../../../contracts/capture-creature-editor-draft-v3.js";
import {
  normalizeCaptureProgressionRulesV1,
  captureActiveSkillSlotsForLevelV1
} from "../../../contracts/capture-progression-rules-v1.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../../../contracts/capture-skill-editor-draft-v1.js";
import {
  CAPTURE_ULTIMATE_SKILL_SLOT_ID
} from "../../../contracts/capture-active-skill-loadout-v1.js";
import {
  validateCaptureLoadoutSkillSlotsV1
} from "./capture-loadout-skill-slot-v1.js";

function arrayValue(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(field + " must be an array");
  }
  return value;
}

export function projectCapturePlannedLoadoutsToCombatV1({
  progressionRules,
  creatureDrafts,
  skillDrafts,
  loadouts
}) {
  const rules =
    normalizeCaptureProgressionRulesV1(
      progressionRules
    );
  const creatures =
    arrayValue(
      creatureDrafts,
      "creatureDrafts"
    ).map((draft) =>
      normalizeCaptureCreatureEditorDraftV3(
        draft
      )
    );
  const skills =
    arrayValue(
      skillDrafts,
      "skillDrafts"
    ).map((draft) =>
      normalizeCaptureSkillEditorDraftV1(
        draft
      )
    );
  const normalizedLoadouts =
    arrayValue(
      loadouts,
      "loadouts"
    ).map((loadout) =>
      normalizeCaptureActiveSkillLoadoutV1(
        loadout
      )
    );

  const creatureById = new Map(
    creatures.map((draft) => [
      draft.id,
      draft
    ])
  );
  const skillById = new Map(
    skills.map((draft) => [
      draft.id,
      draft
    ])
  );

  return Object.freeze(
    normalizedLoadouts.map((loadout) => {
      validateCaptureLoadoutSkillSlotsV1({
        loadout,
        skillDrafts: skills
      });

      const creature =
        creatureById.get(loadout.creatureId);

      if (!creature) {
        return loadout;
      }

      const unlockedSlotCount =
        captureActiveSkillSlotsForLevelV1(
          rules,
          creature.level
        );

      return normalizeCaptureActiveSkillLoadoutV1({
        schema:
          "capture-active-skill-loadout-v1",
        creatureId: loadout.creatureId,
        slots: loadout.slots.map(
          (slot, index) => {
            if (slot.skillId === null) {
              return {
                id: slot.id,
                skillId: null
              };
            }

            const isUltimate =
              slot.id ===
              CAPTURE_ULTIMATE_SKILL_SLOT_ID;

            if (
              !isUltimate &&
              index >= unlockedSlotCount
            ) {
              return {
                id: slot.id,
                skillId: null
              };
            }

            const skill =
              skillById.get(slot.skillId);

            if (!skill) {
              return slot;
            }

            return {
              id: slot.id,
              skillId:
                skill.requiredLevel <=
                creature.level
                  ? slot.skillId
                  : null
            };
          }
        )
      });
    })
  );
}
