import {
  normalizeCaptureStatRegistryV1
} from "../../../contracts/capture-stat-registry-v1.js";
import {
  normalizeCaptureCreatureStatValuesV1
} from "../../../contracts/capture-creature-stat-values-v1.js";

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(field + " must be an object");
  }
  return value;
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(field + " must be a non-empty string");
  }
  return value.trim();
}

function firstNumber(object, keys, fallback = 0) {
  for (const key of keys) {
    if (
      object?.[key] != null &&
      Number.isFinite(Number(object[key]))
    ) {
      return Math.max(0, Number(object[key]));
    }
  }
  return fallback;
}

const STANDARD_ALIASES = Object.freeze({
  speed: Object.freeze([
    "speed",
    "initiative",
    "agility",
    "agilite"
  ]),
  physical: Object.freeze([
    "physical",
    "power",
    "force"
  ]),
  fire: Object.freeze(["fire"]),
  water: Object.freeze(["water"]),
  earth: Object.freeze(["earth"]),
  air: Object.freeze(["air"]),
  electric: Object.freeze([
    "electric",
    "electricity"
  ]),
  light: Object.freeze(["light"]),
  shadow: Object.freeze(["shadow"]),
  poison: Object.freeze(["poison"])
});

export function importMonsterCaptureStatValuesV1(
  sourceInput,
  registryInput
) {
  const source = objectValue(
    sourceInput,
    "MonsterCaptureCreatureSource"
  );
  const registry =
    normalizeCaptureStatRegistryV1(registryInput);
  const stats = objectValue(
    source.stats ?? {},
    "MonsterCaptureCreatureSource.stats"
  );

  const values = {};
  for (const entry of registry.stats) {
    const aliases =
      STANDARD_ALIASES[entry.id] ??
      [entry.id];

    values[entry.id] = firstNumber(
      stats,
      aliases,
      0
    );
  }

  return normalizeCaptureCreatureStatValuesV1(
    {
      schema:
        "capture-creature-stat-values-v1",
      creatureId: requiredString(
        source.id,
        "id"
      ),
      values
    },
    registry
  );
}
