const PRESENTATION_DEFAULTS = Object.freeze({
  iconAssetId: "",
  castAssetId: "",
  castDisplayScale: 1,
  castPlaybackMode: "once",
  castOffsetX: 0,
  castOffsetY: 0,
  castLayerPlayer: "front",
  castLayerOpponent: "front",
  travelAssetId: "",
  travelDisplayScale: 1,
  travelPlaybackMode: "stretch",
  travelLayerPlayer: "front",
  travelLayerOpponent: "front",
  impactAssetId: "",
  impactDisplayScale: 1,
  impactPlaybackMode: "once",
  impactDurationMs: 0,
  impactOffsetX: 0,
  impactOffsetY: 0,
  impactLayerPlayer: "front",
  impactLayerOpponent: "front",
  zoneAssetId: "",
  zoneDisplayScale: 1,
  zoneDisplayScaleX: 1,
  zoneDisplayScaleY: 1,
  zonePlaybackMode: "loop",
  zoneOffsetX: 0,
  zoneOffsetY: 0,
  zoneLayerPlayer: "behind",
  zoneLayerOpponent: "behind",
  castAudioAssetId: "",
  travelAudioAssetId: "",
  impactAudioAssetId: "",
  zoneAudioAssetId: ""
});

function frozenProfile({
  id,
  label,
  family,
  description,
  presentation
}) {
  return Object.freeze({
    id,
    label,
    family,
    description,
    source: "system",
    protected: true,
    presentation: Object.freeze({
      ...PRESENTATION_DEFAULTS,
      ...presentation
    })
  });
}

export const CAPTURE_FX_STARTER_PROFILES_V1 = Object.freeze([
  frozenProfile({
    id: "capture:fx-profile:fireball-classic",
    label: "Boule de feu",
    family: "fire",
    description:
      "Cast, projectile et impact feu prêts à l’emploi.",
    presentation: {
      iconAssetId:
        "pack:capture:icon-skill-fireball-01",
      castAssetId:
        "pack:capture:sprite-fireball-cast-01",
      castDisplayScale: 1.6,
      castPlaybackMode: "loop",
      castLayerPlayer: "behind",
      castLayerOpponent: "front",
      travelAssetId:
        "pack:capture:sprite-fireball-travel-01",
      travelDisplayScale: 1.9,
      travelPlaybackMode: "loop",
      travelLayerPlayer: "behind",
      travelLayerOpponent: "front",
      impactAssetId:
        "pack:capture:sprite-fireball-impact-01",
      impactDisplayScale: 1.7,
      castAudioAssetId:
        "gensrpg:sound:effect-135ee2ed",
      travelAudioAssetId:
        "gensrpg:sound:genrpg-pack2-a30f1071"
    }
  }),
  frozenProfile({
    id: "capture:fx-profile:water-projectile",
    label: "Projectile d’eau",
    family: "water",
    description:
      "Charge eau, projectile et éclaboussure d’impact.",
    presentation: {
      iconAssetId:
        "core:icon-skill-water-wave-01",
      castAssetId:
        "pack:capture:sprite-cast-water-01",
      castDisplayScale: 1.45,
      castPlaybackMode: "loop",
      travelAssetId:
        "pack:capture:sprite-projectile-water-01",
      travelDisplayScale: 1.55,
      travelPlaybackMode: "loop",
      impactAssetId:
        "pack:capture:sprite-impact-water-01",
      impactDisplayScale: 1.45,
      castAudioAssetId:
        "gensrpg:sound:xel-cbc6cf88",
      travelAudioAssetId:
        "gensrpg:sound:genrpg-pack2-eb271979"
    }
  }),
  frozenProfile({
    id: "capture:fx-profile:electric-projectile",
    label: "Projectile électrique",
    family: "electric",
    description:
      "Charge électrique, projectile et impact électrique.",
    presentation: {
      iconAssetId:
        "core:icon-skill-lightning-strike-01",
      castAssetId:
        "pack:capture:sprite-cast-electric-01",
      castDisplayScale: 1.45,
      castPlaybackMode: "loop",
      travelAssetId:
        "pack:capture:sprite-projectile-electric-01",
      travelDisplayScale: 1.5,
      travelPlaybackMode: "loop",
      impactAssetId:
        "pack:capture:sprite-impact-electric-01",
      impactDisplayScale: 1.5,
      castAudioAssetId:
        "gensrpg:sound:sanctuary-822691df",
      travelAudioAssetId:
        "gensrpg:sound:genrpg-pack2-350eb251"
    }
  }),
  frozenProfile({
    id: "capture:fx-profile:nature-thorn",
    label: "Épine naturelle",
    family: "nature",
    description:
      "Charge nature, projectile épine et impact naturel.",
    presentation: {
      iconAssetId:
        "core:icon-skill-thorn-vines-01",
      castAssetId:
        "pack:capture:sprite-cast-nature-01",
      castDisplayScale: 1.35,
      castPlaybackMode: "loop",
      travelAssetId:
        "pack:capture:sprite-projectile-thorn-01",
      travelDisplayScale: 1.45,
      travelPlaybackMode: "loop",
      impactAssetId:
        "pack:capture:sprite-impact-nature-01",
      impactDisplayScale: 1.45
    }
  }),
  frozenProfile({
    id: "capture:fx-profile:physical-claw",
    label: "Griffe physique",
    family: "physical",
    description:
      "Charge physique et impact de griffe pour une attaque de contact.",
    presentation: {
      iconAssetId:
        "core:icon-skill-claw-01",
      castAssetId:
        "pack:capture:sprite-cast-physical-01",
      castDisplayScale: 1.15,
      castPlaybackMode: "once",
      impactAssetId:
        "pack:capture:sprite-claw-impact-01",
      impactDisplayScale: 1.35,
      impactAudioAssetId:
        "gensrpg:sound:effect-7b158ebd"
    }
  }),
  frozenProfile({
    id: "capture:fx-profile:fire-zone",
    label: "Zone de flammes",
    family: "fire",
    description:
      "Cast feu, impact puis zone de flammes persistante.",
    presentation: {
      iconAssetId:
        "core:icon-skill-fire-rain-01",
      castAssetId:
        "pack:capture:sprite-fireball-cast-01",
      castDisplayScale: 1.5,
      castPlaybackMode: "loop",
      impactAssetId:
        "pack:capture:sprite-fireball-impact-01",
      impactDisplayScale: 1.55,
      zoneAssetId:
        "pack:capture:sprite-fire-zone-loop-01",
      zoneDisplayScale: 1.35,
      zoneDisplayScaleX: 1.45,
      zoneDisplayScaleY: 1,
      zonePlaybackMode: "loop",
      zoneLayerPlayer: "behind",
      zoneLayerOpponent: "behind",
      castAudioAssetId:
        "gensrpg:sound:effect-135ee2ed"
    }
  }),
  frozenProfile({
    id: "capture:fx-profile:healing-aura",
    label: "Aura de soins",
    family: "light",
    description:
      "Aura de soins persistante utilisable pour soin ou régénération.",
    presentation: {
      iconAssetId:
        "core:icon-skill-healing-heart-01",
      zoneAssetId:
        "pack:capture:sprite-status-healing-aura-01",
      zoneDisplayScale: 1.2,
      zonePlaybackMode: "loop",
      zoneLayerPlayer: "front",
      zoneLayerOpponent: "front"
    }
  }),
  frozenProfile({
    id: "capture:fx-profile:energy-shield",
    label: "Bouclier d’énergie",
    family: "defense",
    description:
      "Aura de protection prête pour les capacités défensives.",
    presentation: {
      iconAssetId:
        "core:icon-skill-magic-shield-01",
      zoneAssetId:
        "pack:capture:sprite-status-energy-shield-01",
      zoneDisplayScale: 1.25,
      zonePlaybackMode: "loop",
      zoneLayerPlayer: "front",
      zoneLayerOpponent: "front"
    }
  })
]);

const BY_ID = new Map(
  CAPTURE_FX_STARTER_PROFILES_V1.map(
    (profile) => [profile.id, profile]
  )
);

export function captureFxStarterProfileByIdV1(
  profileId
) {
  return BY_ID.get(String(profileId ?? "")) ?? null;
}

export function applyCaptureFxStarterProfileV1({
  profileId,
  presentation = {}
}) {
  if (
    !presentation ||
    typeof presentation !== "object" ||
    Array.isArray(presentation)
  ) {
    throw new TypeError(
      "presentation must be an object"
    );
  }

  const profile =
    captureFxStarterProfileByIdV1(profileId);

  if (profile === null) {
    throw new RangeError(
      "Unknown Capture FX starter profile: " +
        profileId
    );
  }

  const socketId =
    presentation.socketId ?? null;
  const statusVisuals =
    presentation.statusVisuals ?? {};

  return {
    ...presentation,
    ...PRESENTATION_DEFAULTS,
    ...profile.presentation,
    socketId,
    statusVisuals
  };
}
