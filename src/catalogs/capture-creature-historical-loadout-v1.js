import {
  CAPTURE_USED_ABILITY_CATALOG_V2
} from "./capture-used-ability-catalog-v2.js";
import {
  normalizeCaptureActiveSkillLoadoutV1
} from "../contracts/capture-active-skill-loadout-v1.js";

const ABILITY_BY_ID = new Map(
  CAPTURE_USED_ABILITY_CATALOG_V2.abilities.map(
    (ability) => [ability.id, ability]
  )
);

function requiredText(value, field) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new TypeError(
      field + " must be a non-empty string"
    );
  }
  return value.trim();
}

function levelValue(value) {
  const level = Number(value);
  if (!Number.isFinite(level) || level < 1) {
    throw new RangeError(
      "level must be a finite number >= 1"
    );
  }
  return level;
}

function abilityIdList(value) {
  if (!Array.isArray(value)) {
    throw new TypeError(
      "abilityIds must be an array"
    );
  }

  return value.map((id, index) =>
    requiredText(
      id,
      "abilityIds[" + index + "]"
    )
  );
}

function runtimeIdSet(value) {
  if (value instanceof Set) {
    return value;
  }
  if (!Array.isArray(value)) {
    throw new TypeError(
      "runtimeSkillIds must be a Set or array"
    );
  }
  return new Set(value);
}

export function buildCaptureCreatureHistoricalLoadoutV1({
  creatureId,
  level,
  abilityIds,
  runtimeSkillIds,
  maxMoves = 4
}) {
  const id = requiredText(
    creatureId,
    "creatureId"
  );
  const currentLevel = levelValue(level);
  const speciesAbilityIds =
    abilityIdList(abilityIds);
  const runtimeIds =
    runtimeIdSet(runtimeSkillIds);

  const moveLimit = Number(maxMoves);
  if (
    !Number.isInteger(moveLimit) ||
    moveLimit < 1 ||
    moveLimit > 4
  ) {
    throw new RangeError(
      "maxMoves must be an integer between 1 and 4"
    );
  }

  const historicalActiveIds = [];

  for (const abilityId of speciesAbilityIds) {
    const ability =
      ABILITY_BY_ID.get(abilityId);

    if (!ability) {
      throw new RangeError(
        "unknown historical creature ability: " +
          abilityId
      );
    }

    const requiredLevel = Math.max(
      1,
      Number(ability.requiredLevel) || 1
    );

    if (requiredLevel <= currentLevel) {
      historicalActiveIds.push(abilityId);
    }

    if (
      historicalActiveIds.length >=
      moveLimit
    ) {
      break;
    }
  }

  const unavailableActiveIds =
    historicalActiveIds.filter(
      (abilityId) =>
        !runtimeIds.has(abilityId)
    );

  const slotIds = [
    "slot-1",
    "slot-2",
    "slot-3",
    "slot-4"
  ];

  const loadout =
    normalizeCaptureActiveSkillLoadoutV1({
      schema:
        "capture-active-skill-loadout-v1",
      creatureId: id,
      slots: slotIds.map(
        (slotId, index) => {
          const abilityId =
            historicalActiveIds[index] ??
            null;

          return {
            id: slotId,
            skillId:
              abilityId !== null &&
              runtimeIds.has(abilityId)
                ? abilityId
                : null
          };
        }
      )
    });

  return Object.freeze({
    loadout,
    historicalActiveIds:
      Object.freeze([
        ...historicalActiveIds
      ]),
    unavailableActiveIds:
      Object.freeze([
        ...unavailableActiveIds
      ])
  });
}
