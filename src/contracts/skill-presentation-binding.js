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
import {
  normalizeSkillPresentationBindingV6
} from "./skill-presentation-binding-v6.js";
import {
  normalizeSkillPresentationBindingV7
} from "./skill-presentation-binding-v7.js";
import {
  normalizeSkillPresentationBindingV8
} from "./skill-presentation-binding-v8.js";
import {
  normalizeSkillPresentationBindingV9
} from "./skill-presentation-binding-v9.js";

import { normalizeSkillPresentationBindingV10 } from "./skill-presentation-binding-v10.js";

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

  if (input.version === 6) {
    return normalizeSkillPresentationBindingV6(
      input
    );
  }

  if (input.version === 7) {
    return normalizeSkillPresentationBindingV7(
      input
    );
  }

  if (input.version === 8) {
    return normalizeSkillPresentationBindingV8(
      input
    );
  }

  if (input.version === 9) {
    return normalizeSkillPresentationBindingV9(
      input
    );
  }

  if (input.version === 10) {
    return normalizeSkillPresentationBindingV10(input);
  }

  throw new RangeError(
    `Unsupported skill presentation version: ${input.version}`
  );
}
