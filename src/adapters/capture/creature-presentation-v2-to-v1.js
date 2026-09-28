import {
  normalizeCreaturePresentationBindingV2
} from "../../contracts/creature-presentation-binding-v2.js";

export function projectCreaturePresentationV2ToV1(input) {
  if (input == null) {
    return null;
  }

  const value = normalizeCreaturePresentationBindingV2(input);

  return Object.freeze({
    id: value.id,
    version: 1,
    subjectType: value.subjectType,
    subjectId: value.subjectId,
    profileId: value.profileId,
    visual: value.visual,
    sockets: value.sockets,
    audio: value.audio
  });
}
