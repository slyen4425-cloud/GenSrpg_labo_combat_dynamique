export const PROJECTILE_CLASH_V2_SCHEMA =
  "projectile-clash-v2";

const TOP_LEVEL_FIELDS = new Set([
  "tag",
  "rules"
]);

const RULE_FIELDS = new Set([
  "againstTag",
  "strength"
]);

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

function assertKnownFields(
  value,
  allowed,
  field
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(
        field +
          " contains unknown field: " +
          key
      );
    }
  }
}

function requiredString(value, field) {
  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    throw new TypeError(
      field +
        " must be a non-empty string"
    );
  }
  return value.trim();
}

function positiveNumber(value, field) {
  const number = Number(value);
  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    throw new RangeError(
      field +
        " must be a positive finite number"
    );
  }
  return number;
}

function normalizeRule(raw, index) {
  const field =
    "ProjectileClashV2.rules[" +
    index +
    "]";
  const value = objectValue(
    raw,
    field
  );
  assertKnownFields(
    value,
    RULE_FIELDS,
    field
  );

  return Object.freeze({
    againstTag: requiredString(
      value.againstTag,
      field + ".againstTag"
    ),
    strength: positiveNumber(
      value.strength,
      field + ".strength"
    )
  });
}

export function normalizeProjectileClashV2(
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
          "ProjectileClashV2"
        );

  assertKnownFields(
    value,
    TOP_LEVEL_FIELDS,
    "ProjectileClashV2"
  );

  const tag =
    value.tag == null ||
    value.tag === ""
      ? null
      : requiredString(
          value.tag,
          "ProjectileClashV2.tag"
        );

  const rawRules =
    value.rules ?? [];
  if (!Array.isArray(rawRules)) {
    throw new TypeError(
      "ProjectileClashV2.rules must be an array"
    );
  }

  const rules =
    rawRules.map(normalizeRule);

  if (
    tag === null &&
    rules.length > 0
  ) {
    throw new TypeError(
      "ProjectileClashV2.tag is required when rules are configured"
    );
  }

  if (
    tag !== null &&
    form !== "projectile"
  ) {
    throw new RangeError(
      "ProjectileClashV2 requires form=projectile"
    );
  }

  const againstTags =
    rules.map(
      (rule) => rule.againstTag
    );
  if (
    new Set(againstTags).size !==
    againstTags.length
  ) {
    throw new RangeError(
      "ProjectileClashV2.rules must not contain duplicate againstTag values"
    );
  }

  return Object.freeze({
    tag,
    rules: Object.freeze(rules)
  });
}

export function projectileClashStrengthAgainstTagV2(
  clashInput,
  againstTag
) {
  const clash =
    normalizeProjectileClashV2(
      clashInput,
      {
        form:
          clashInput?.tag == null
            ? null
            : "projectile"
      }
    );
  const tag = requiredString(
    againstTag,
    "againstTag"
  );
  return (
    clash.rules.find(
      (rule) =>
        rule.againstTag === tag
    )?.strength ?? 0
  );
}
