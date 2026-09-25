const CAPTURE_ROOT = new URL(
  "../../assets/library/capture/",
  import.meta.url
);

const ASSETS = Object.freeze({
  "pack:capture:icon-skill-fireball-01": Object.freeze({
    assetId: "pack:capture:icon-skill-fireball-01",
    url: new URL(
      "icons/skills/icon_skill_fireball_01.webp",
      CAPTURE_ROOT
    ).href
  }),
  "pack:capture:sprite-fireball-cast-01": Object.freeze({
    assetId: "pack:capture:sprite-fireball-cast-01",
    url: new URL(
      "sprites/skills/fireball/atlases/sprite_skill_fireball_cast_atlas_01.png",
      CAPTURE_ROOT
    ).href,
    frameCount: 6,
    displayScale: 1.35
  }),
  "pack:capture:sprite-fireball-travel-01": Object.freeze({
    assetId: "pack:capture:sprite-fireball-travel-01",
    url: new URL(
      "sprites/skills/fireball/atlases/sprite_skill_fireball_travel_rl_atlas_01.png",
      CAPTURE_ROOT
    ).href,
    frameCount: 8,
    coreAnchor: Object.freeze({ x: 0.29, y: 0.5 }),
    headingRad: Math.PI,
    displayScale: 1.75
  }),
  "pack:capture:sprite-fireball-impact-01": Object.freeze({
    assetId: "pack:capture:sprite-fireball-impact-01",
    url: new URL(
      "sprites/skills/fireball/atlases/sprite_skill_fireball_impact_atlas_01.png",
      CAPTURE_ROOT
    ).href,
    frameCount: 6
  })
});

const SKILL_BINDINGS = Object.freeze({
  fireball: Object.freeze({
    icon: "pack:capture:icon-skill-fireball-01",
    castFx: "pack:capture:sprite-fireball-cast-01",
    travelFx: "pack:capture:sprite-fireball-travel-01",
    impactFx: "pack:capture:sprite-fireball-impact-01"
  })
});

function resolveAsset(assetId) {
  return ASSETS[assetId] ?? null;
}

export const demoPresentationAssets = Object.freeze({
  presentationForSkill(skillId) {
    const binding = SKILL_BINDINGS[skillId];
    if (!binding) {
      return null;
    }

    return Object.freeze({
      icon: resolveAsset(binding.icon),
      cast: resolveAsset(binding.castFx),
      travel: resolveAsset(binding.travelFx),
      impact: resolveAsset(binding.impactFx)
    });
  }
});
