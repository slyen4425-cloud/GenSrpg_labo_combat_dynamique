import { normalizeCaptureCreatureTransferV1 } from "../contracts/capture-creature-transfer-v1.js";

// One authoritative authoring-time preset policy. Original uploaded creature
// JSON files remain immutable and continue to be validated by historical tests.
// This profile-aware composition happens ONCE on showroom preset hydration.
// Once imported, presentation.audio.movement is still the only runtime owner.
const STYLE_GROUPS = Object.freeze([
  Object.freeze({
    style: "insect-wings",
    profile: "flying",
    creatureIds: Object.freeze(["Ephemus", "crea_foudrillon"]),
    sound: Object.freeze({ assetId: "gensrpg:sound:effect-79dd62d8", volume: 1, mode: "loop" })
  }),
  Object.freeze({
    style: "air-movement",
    profile: "flying",
    creatureIds: Object.freeze(["Veldra_crea", "crea_ailevent", "crea_dracendre"]),
    sound: Object.freeze({ assetId: "gensrpg:sound:genrpg-pack2-9320854b", volume: 1, mode: "once" })
  }),
  Object.freeze({
    style: "quadruped-rustle",
    profile: "quadruped",
    creatureIds: Object.freeze(["crea-loup", "crea_nat_1", "kitsune_lunaire"]),
    sound: Object.freeze({ assetId: "gensrpg:sound:sanctuary-367a77dd", volume: 1, mode: "once" })
  })
]);

const RULES_BY_CREATURE_ID = new Map();
for (const group of STYLE_GROUPS) {
  for (const id of group.creatureIds) {
    if (RULES_BY_CREATURE_ID.has(id)) {
      throw new RangeError("Duplicate showcase movement preset: " + id);
    }
    RULES_BY_CREATURE_ID.set(id, group);
  }
}

export function showcaseCreatureMovementAudioRulesV1() {
  return STYLE_GROUPS;
}

export function applyCaptureShowcaseCreatureMovementAudioV1(transfer, statRegistry) {
  if (transfer?.kind !== "creature" || !transfer.value?.draft) {
    throw new TypeError("Normalized creature transfer required");
  }

  const original = transfer.value;
  const draft = original.draft;
  const group = RULES_BY_CREATURE_ID.get(draft.id) ?? null;
  if (group === null) return transfer;
  const presentation = draft.presentation;
  if (!presentation || presentation.profileId !== group.profile) {
    throw new RangeError(
      "Showcase movement profile mismatch for " + draft.id + ": expected " + group.profile
    );
  }

  const audio = presentation.audio ?? {};
  const current = audio.movement ?? null;
  // Keep an existing matching author sound, including its loop, volume,
  // and interval; this specifically preserves Foudrillon's reviewed sound.
  if (current?.assetId === group.sound.assetId) return transfer;

  // All other creature audio roles and all non-audio author fields survive.
  // The canonical CreaturePresentationBinding remains the ONLY runtime audio
  // source. No per-actor fallback or duplicate sound registry is installed.
  const updated = normalizeCaptureCreatureTransferV1({
    ...original,
    draft: {
      ...draft,
      presentation: {
        ...presentation,
        audio: { ...audio, movement: group.sound }
      }
    }
  }, statRegistry);

  return Object.freeze({ kind: "creature", value: updated });
}
