// UI-only shortcuts over the existing V1 FX presets. Not a new FX or gameplay authority.
import { applyCaptureFxGlowPresetV1 } from "../catalogs/capture-fx-glow-presets-v1.js";
import { applyCaptureFxParticlePresetV1 } from "../catalogs/capture-fx-particle-presets-v1.js";

export const CAPTURE_FX_QUICK_PROFILES_V1 = Object.freeze([
  Object.freeze({id:"discreet",label:"Discret",description:"Effets légers pour lire clairement les combats.",glowPresetId:"discreet",particlePresetId:"discreet",shakeAmplitudePx:2}),
  Object.freeze({id:"balanced",label:"Équilibré",description:"Lueur, traînée et fumée visibles sans couvrir les créatures.",glowPresetId:"visible",particlePresetId:"visible",shakeAmplitudePx:5}),
  Object.freeze({id:"spectacular",label:"Spectaculaire",description:"Effets marqués pour les attaques puissantes, toujours bornés pour mobile.",glowPresetId:"intense",particlePresetId:"intense",shakeAmplitudePx:9})
]);

export function captureFxQuickProfileByIdV1(id) {
  return CAPTURE_FX_QUICK_PROFILES_V1.find(p=>p.id===id) ?? null;
}

export function applyCaptureFxQuickProfileV1({profileId,presentation = {}}) {
  const profile=captureFxQuickProfileByIdV1(profileId);
  if(!profile) throw new RangeError("Unknown beginner FX profile: "+profileId);
  const glow=applyCaptureFxGlowPresetV1({presetId:profile.glowPresetId,presentation});
  const particles=applyCaptureFxParticlePresetV1({presetId:profile.particlePresetId,presentation:glow});
  // Keep colors, sprite bindings, sound, projectile anchor, authored camera sequence and all tactical fields.
  return {...particles,impactShakeAmplitudePx:profile.shakeAmplitudePx};
}

export function captureFxQuickWarningsV1(presentation = {}) {
  const number=(key)=>Number(presentation[key]) || 0;
  const result=[];
  if(number("projectileTrailSizePx")>24 || number("projectileTrailLengthPx")>95)
    result.push("Les particules de traînée sont très grandes : l’effet peut sembler détaché du projectile.");
  if(number("impactShakeAmplitudePx")>24)
    result.push("La secousse dépasse 24 px : l’arène risque de bouger beaucoup trop.");
  if(number("aftermathSmokeSizePx")>80)
    result.push("La fumée est très grande : elle risque de masquer les combattants.");
  if(Array.isArray(presentation.impactShakeSequence) && presentation.impactShakeSequence.length)
    result.push("Une séquence de secousses existe : elle reste prioritaire sur la secousse simple.");
  return result;
}

export function captureFxQuickTrajectoryHintV1({form,trajectoryMode}={}) {
  if(form==="projectile" && trajectoryMode==="skyfall")
    return "Projectile tombant du ciel : la traînée suit la chute du rocher, pas le lanceur. Commence avec de petites particules.";
  if(form==="beam") return "Rayon continu : règle d’abord le départ, le corps et la fin du rayon ; une traînée de projectile classique n’est pas nécessaire.";
  if(form==="projectile") return "Projectile classique : la traînée est derrière le tir ; ajuste sa longueur et son point d’ancrage dans les réglages avancés.";
  return "Choisis une intensité pour la lueur, les particules et la secousse ; les sprites et les sons ne changent pas.";
}
