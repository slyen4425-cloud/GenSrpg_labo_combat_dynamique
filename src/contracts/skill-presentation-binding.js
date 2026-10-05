import {
  normalizeSkillPresentationBindingV1
} from "./skill-presentation-binding-v1.js";
import {
  normalizeSkillPresentationBindingV2
} from "./skill-presentation-binding-v2.js";
import {
  normalizeSkillPresentationBindingV3
} from "./skill-presentation-binding-v3.js";
import {
  normalizeSkillPresentationBindingV4
} from "./skill-presentation-binding-v4.js";
import {
  normalizeSkillPresentationBindingV5
} from "./skill-presentation-binding-v5.js";

export function normalizeSkillPresentationBinding(
  input
) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new TypeError(
      "SkillPresentationBinding must be an object"
    );
  }

  if (input.version === 1) {
    return normalizeSkillPresentationBindingV1(
      input
    );
  }

  if (input.version === 2) {
    return normalizeSkillPresentationBindingV2(
      input
    );
  }

  if (input.version === 3) {
    return normalizeSkillPresentationBindingV3(
      input
    );
  }

  if (input.version === 4) {
    return normalizeSkillPresentationBindingV4(
      input
    );
  }

  if (input.version === 5) {
    return normalizeSkillPresentationBindingV5(
      input
    );
  }

  throw new RangeError(
    `Unsupported skill presentation version: ${input.version}`
  );
}
