export const VISUAL_ACTOR_VIEWS = Object.freeze(["opponent", "player"]);
export const VISUAL_ACTOR_FACING = Object.freeze(["left", "right"]);

const VALID_VIEWS = new Set(VISUAL_ACTOR_VIEWS);
const VALID_FACING = new Set(VISUAL_ACTOR_FACING);

function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function finiteNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`${field} must be a finite number`);
  }
  return number;
}

function normalizeTransformOrigin(input) {
  if (input == null) {
    return Object.freeze({ x: "50%", y: "50%" });
  }
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("transformOrigin must be an object");
  }

  return Object.freeze({
    x: nonEmptyString(input.x ?? "50%", "transformOrigin.x"),
    y: nonEmptyString(input.y ?? "50%", "transformOrigin.y")
  });
}

export function normalizeVisualActor(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("VisualActor must be an object");
  }

  const id = nonEmptyString(input.id, "id");
  const creatureId = nonEmptyString(input.creatureId, "creatureId");
  const profile = nonEmptyString(input.profile, "profile");
  const asset = nonEmptyString(input.asset, "asset");

  const view = input.view ?? "opponent";
  if (!VALID_VIEWS.has(view)) {
    throw new RangeError(`Unsupported actor view: ${view}`);
  }

  const facing = input.facing ?? (view === "player" ? "right" : "left");
  if (!VALID_FACING.has(facing)) {
    throw new RangeError(`Unsupported actor facing: ${facing}`);
  }

  const position = input.position ?? {};
  const x = finiteNumber(position.x ?? 0, "position.x");
  const y = finiteNumber(position.y ?? 0, "position.y");

  const scale = finiteNumber(input.scale ?? 1, "scale");
  if (scale <= 0) {
    throw new RangeError("scale must be greater than 0");
  }

  const transformOrigin = normalizeTransformOrigin(input.transformOrigin);

  return Object.freeze({
    id,
    creatureId,
    profile,
    asset,
    view,
    facing,
    position: Object.freeze({ x, y }),
    scale,
    transformOrigin
  });
}
