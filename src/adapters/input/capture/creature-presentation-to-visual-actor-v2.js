import {
  normalizeCreaturePresentationBindingV2
} from "../../../contracts/creature-presentation-binding-v2.js";
import {
  normalizeVisualActor
} from "../../../contracts/visual-actor.js";

function objectValue(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${field} must be an object`);
  }
  return value;
}

export function adaptCreaturePresentationBindingV2ToVisualActor({
  binding,
  visualActor
}) {
  const presentation =
    normalizeCreaturePresentationBindingV2(
      binding
    );
  const actor = objectValue(
    visualActor,
    "visualActor"
  );

  if (
    actor.creatureId !==
    presentation.subjectId
  ) {
    throw new RangeError(
      "visualActor.creatureId must match binding.subjectId"
    );
  }

  return normalizeVisualActor({
    ...actor,
    profile: presentation.profileId,
    scale: presentation.displayScale,
    position: presentation.position,
    transformOrigin:
      presentation.transformOrigin
  });
}
