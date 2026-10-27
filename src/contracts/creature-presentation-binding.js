import {
  normalizeCreaturePresentationBindingV1
} from "./creature-presentation-binding-v1.js";
import {
  normalizeCreaturePresentationBindingV2
} from "./creature-presentation-binding-v2.js";
import {
  normalizeCreaturePresentationBindingV3
} from "./creature-presentation-binding-v3.js";
import { normalizeCreaturePresentationBindingV4 } from "./creature-presentation-binding-v4.js";
import { normalizeCreaturePresentationBindingV5 } from "./creature-presentation-binding-v5.js";
import { normalizeCreaturePresentationBindingV6 } from "./creature-presentation-binding-v6.js";
import { normalizeCreaturePresentationBindingV7 } from "./creature-presentation-binding-v7.js";
import { normalizeCreaturePresentationBindingV8 } from "./creature-presentation-binding-v8.js";
import { normalizeCreaturePresentationBindingV9 } from "./creature-presentation-binding-v9.js";
import { normalizeCreaturePresentationBindingV10 } from "./creature-presentation-binding-v10.js";

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

  if (input.version === 4) return normalizeCreaturePresentationBindingV4(input);
  if (input.version === 5) return normalizeCreaturePresentationBindingV5(input);
  if (input.version === 6) return normalizeCreaturePresentationBindingV6(input);
  if (input.version === 7) return normalizeCreaturePresentationBindingV7(input);
  if (input.version === 8) return normalizeCreaturePresentationBindingV8(input);
  if (input.version === 9) return normalizeCreaturePresentationBindingV9(input);
  if (input.version === 10) return normalizeCreaturePresentationBindingV10(input);

  throw new RangeError(
    "Unsupported creature presentation version: " +
      input.version
  );
}
