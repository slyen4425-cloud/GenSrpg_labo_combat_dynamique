// Shared, existing licensed runtime assets — no audio copies or second engine.
// The creature profile is authoritative only when a creature did not author its
// own movement sound. Metadata and source URL remain in the canonical audio
// runtime catalog and are resolved by the existing DomCombatAudio owner.
export const CREATURE_STYLE_MOVEMENT_AUDIO_V1 = Object.freeze({
  biped: Object.freeze({assetId:"gensrpg:sound:academie-61dd7cbf",volume:0.85,mode:"once"}),
  quadruped: Object.freeze({assetId:"gensrpg:sound:academie-61dd7cbf",volume:0.85,mode:"once"}),
  flying: Object.freeze({assetId:"gensrpg:sound:effect-79dd62d8",volume:0.85,mode:"loop"}),
  serpentine: Object.freeze({assetId:"gensrpg:sound:xel-727b290b",volume:0.8,mode:"once"}),
  massive: Object.freeze({assetId:"gensrpg:sound:effect-01d545e2",volume:0.8,mode:"once"})
});

export function creatureAudioForStyleV1(profileId, authoredAudio = null) {
  const custom = authoredAudio && typeof authoredAudio === "object" ? authoredAudio : {};
  const preset = CREATURE_STYLE_MOVEMENT_AUDIO_V1[String(profileId??"")] ?? null;
  if (!preset) return custom;
  return Object.freeze({movement:preset,...custom});
}
