import {
  normalizeCreaturePresentationBindingV1
} from "./creature-presentation-binding-v1.js";
import {
  normalizeCreaturePresentationBindingV2
} from "./creature-presentation-binding-v2.js";
import {
  normalizeCreaturePresentationBindingV3
} from "./creature-presentation-binding-v3.js";

export function normalizeCreaturePresentationBinding(
  input
) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new TypeError(
      "CreaturePresentationBinding must be an object"
    );
  }

  if (input.version === 1) {
    return normalizeCreaturePresentationBindingV1(
      input
    );
  }

  if (input.version === 2) {
    return normalizeCreaturePresentationBindingV2(
      input
    );
  }

  if (input.version === 3) {
    return normalizeCreaturePresentationBindingV3(
      input
    );
  }

  throw new RangeError(
    "Unsupported creature presentation version: " +
      input.version
  );
}
