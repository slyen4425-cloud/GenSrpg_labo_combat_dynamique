export const PROJECTILE_POWER_V1_SCHEMA =
  "projectile-power-v1";

const ALLOWED_FIELDS =
  new Set(["power"]);

function objectValue(value, field) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(
      field + " must be an object"
    );
  }
  return value;
}

function nonNegativeNumber(
  value,
  field
) {
  const number = Number(value ?? 0);
  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    throw new RangeError(
      field +
        " must be a non-negative finite number"
    );
  }
  return number;
}

export function normalizeProjectilePowerV1(
  input,
  {
    form = null
  } = {}
) {
  const value =
    input == null
      ? {}
      : objectValue(
          input,
          "ProjectilePowerV1"
        );

  for (
    const key of
    Object.keys(value)
  ) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw new TypeError(
        "ProjectilePowerV1 contains unknown field: " +
          key
      );
    }
  }

  const power =
    nonNegativeNumber(
      value.power,
      "ProjectilePowerV1.power"
    );

  if (
    power > 0 &&
    form !== "projectile"
  ) {
    throw new RangeError(
      "ProjectilePowerV1 requires form=projectile when power > 0"
    );
  }

  return Object.freeze({
    power
  });
}
