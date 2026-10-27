import {
  CAPTURE_ULTIMATE_SKILL_SLOT_ID,
  normalizeCaptureActiveSkillLoadoutV1
} from "../../../contracts/capture-active-skill-loadout-v1.js";
export function captureLoadoutSlotTypeV1(
  slotId
) {
  return slotId ===
    CAPTURE_ULTIMATE_SKILL_SLOT_ID
      ? "ultimate"
      : "standard";
}

function skillDraftList(value) {
  if (value instanceof Map) {
    return [...value.values()];
  }
  if (!Array.isArray(value)) {
    throw new TypeError(
      "skillDrafts must be an array or Map"
    );
  }
  return value;
}

export function validateCaptureLoadoutSkillSlotsV1({
  loadout,
  skillDrafts
}) {
  const normalizedLoadout =
    normalizeCaptureActiveSkillLoadoutV1(
      loadout
    );
  const skillById = new Map(
    skillDraftList(skillDrafts).map(
      (draft, index) => {
        if (
          !draft ||
          typeof draft !== "object" ||
          Array.isArray(draft)
        ) {
          throw new TypeError(
            "skillDrafts[" +
              index +
              "] must be an object"
          );
        }

        const id = String(
          draft.id ?? ""
        ).trim();
        if (id === "") {
          throw new TypeError(
            "skillDrafts[" +
              index +
              "].id must be a non-empty string"
          );
        }

        const definition =
          draft.definition ?? {};
        const loadoutSlot =
          definition.loadoutSlot == null
            ? "standard"
            : String(
                definition.loadoutSlot
              ).trim();

        if (
          loadoutSlot !== "standard" &&
          loadoutSlot !== "ultimate"
        ) {
          throw new RangeError(
            "Unsupported loadoutSlot: " +
              loadoutSlot
          );
        }

        return [
          id,
          {
            id,
            definition: {
              loadoutSlot
            }
          }
        ];
      }
    )
  );

  for (const slot of normalizedLoadout.slots) {
    if (slot.skillId === null) {
      continue;
    }

    const skill = skillById.get(
      slot.skillId
    );
    if (!skill) {
      continue;
    }

    const expected =
      captureLoadoutSlotTypeV1(
        slot.id
      );
    const actual =
      skill.definition.loadoutSlot;

    if (actual !== expected) {
      throw new RangeError(
        "skill " +
          slot.skillId +
          " is " +
          actual +
          " and cannot be equipped in " +
          slot.id +
          " (" +
          expected +
          ")"
      );
    }
  }

  return normalizedLoadout;
}
