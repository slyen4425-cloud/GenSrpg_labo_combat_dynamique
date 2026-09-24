export const COMBAT_VISUAL_EVENT_TYPES = Object.freeze([
  "idle",
  "enter",
  "attack",
  "hit",
  "dodge",
  "ko",
  "recover",
  "skill",
  "projectile"
]);

const EVENT_TYPES = new Set(COMBAT_VISUAL_EVENT_TYPES);

function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function normalizeCombatVisualEvent(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("CombatVisualEvent must be an object");
  }

  const type = assertNonEmptyString(input.type, "type");
  if (!EVENT_TYPES.has(type)) {
    throw new RangeError(`Unsupported CombatVisualEvent type: ${type}`);
  }

  const actorId = assertNonEmptyString(input.actorId, "actorId");
  const targetId = input.targetId == null
    ? null
    : assertNonEmptyString(input.targetId, "targetId");

  const variant = input.variant == null
    ? "basic"
    : assertNonEmptyString(input.variant, "variant");

  const intensity = input.intensity == null ? 1 : Number(input.intensity);
  if (!Number.isFinite(intensity) || intensity <= 0) {
    throw new RangeError("intensity must be a finite number greater than 0");
  }

  const metadata = input.metadata == null ? {} : input.metadata;
  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new TypeError("metadata must be an object");
  }

  return Object.freeze({
    type,
    actorId,
    targetId,
    variant,
    intensity,
    metadata: Object.freeze({ ...metadata })
  });
}
