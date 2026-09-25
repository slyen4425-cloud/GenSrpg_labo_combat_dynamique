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
  "pack:capture:sprite-fireball-travel-01": Object.freeze({
    assetId: "pack:capture:sprite-fireball-travel-01",
    url: new URL(
      "sprites/skills/fireball/atlases/sprite_skill_fireball_travel_lr_atlas_01.png",
      CAPTURE_ROOT
    ).href,
    frameCount: 8
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
    travelFx: "pack:capture:sprite-fireball-travel-01",
    impactFx: "pack:capture:sprite-fireball-impact-01"
  })
});

function resolveAsset(assetId) {
  return ASSETS[assetId] ?? null;
}

export const demoPresentationAssets = Object.freeze({
  resolveSkillPresentation(skillId) {
    const binding = SKILL_BINDINGS[skillId];
    if (!binding) {
      return null;
    }

    return Object.freeze({
      icon: resolveAsset(binding.icon),
      travel: resolveAsset(binding.travelFx),
      impact: resolveAsset(binding.impactFx)
    });
  }
});
