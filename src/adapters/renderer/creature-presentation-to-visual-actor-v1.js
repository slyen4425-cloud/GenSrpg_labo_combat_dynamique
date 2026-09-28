import {
  normalizeCreaturePresentationBindingV2
} from "../../contracts/creature-presentation-binding-v2.js";
import {
  normalizeVisualActor
} from "../../contracts/visual-actor.js";

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function adaptCreaturePresentationToVisualActorV1({
  binding,
  actorId,
  view,
  resolvedAsset,
  position = { x: 0, y: 0 },
  facing = null,
  transformOrigin = null
}) {
  const presentation =
    normalizeCreaturePresentationBindingV2(binding);

  const input = {
    id: requiredString(actorId, "actorId"),
    creatureId: presentation.subjectId,
    profile: presentation.profileId,
    asset: requiredString(
      resolvedAsset,
      "resolvedAsset"
    ),
    view,
    position,
    scale: presentation.displayScale
  };

  if (facing !== null) {
    input.facing = facing;
  }
  if (transformOrigin !== null) {
    input.transformOrigin = transformOrigin;
  }

  return normalizeVisualActor(input);
}
