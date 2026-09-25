const CAPTURE_ROOT = new URL(
  "../../assets/library/capture/",
  import.meta.url
);

const CORE_ROOT = new URL(
  "../../assets/library/core/",
  import.meta.url
);

const ASSETS = Object.freeze({
  "core:arena-forest-01": Object.freeze({
    assetId: "core:arena-forest-01",
    url: new URL(
      "arenas/forest/arena_forest_01.png",
      CORE_ROOT
    ).href
  }),
  "core:icon-skill-claw-01": Object.freeze({
    assetId: "core:icon-skill-claw-01",
    url: new URL(
      "icons/skills/icon_skill_claw_01.webp",
      CORE_ROOT
    ).href
  }),
  "core:icon-skill-aerial-dive-01": Object.freeze({
    assetId: "core:icon-skill-aerial-dive-01",
    url: new URL(
      "icons/skills/icon_skill_aerial_dive_01.webp",
      CORE_ROOT
    ).href
  }),
  "core:icon-skill-teleport-strike-01": Object.freeze({
    assetId: "core:icon-skill-teleport-strike-01",
    url: new URL(
      "icons/skills/icon_skill_teleport_strike_01.webp",
      CORE_ROOT
    ).href
  }),
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
      "fx/skills/fireball/fx_skill_fireball_cast_orb_01.svg",
      CAPTURE_ROOT
    ).href,
    frameCount: 1,
    displayScale: 1.45
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
    displayScale: 2.8
  }),
  "pack:capture:sprite-fireball-impact-01": Object.freeze({
    assetId: "pack:capture:sprite-fireball-impact-01",
    url: new URL(
      "fx/skills/fireball/fx_skill_fireball_impact_burst_01.svg",
      CAPTURE_ROOT
    ).href,
    frameCount: 1,
    displayScale: 1.7
  })
});

const ARENA_BINDINGS = Object.freeze({
  forest: Object.freeze({
    background: "core:arena-forest-01"
  })
});

const SKILL_BINDINGS = Object.freeze({
  fireball: Object.freeze({
    icon: "pack:capture:icon-skill-fireball-01",
    castFx: "pack:capture:sprite-fireball-cast-01",
    castAnchor: "mouth",
    castLayerBySourceView: Object.freeze({
      player: "behind",
      opponent: "front"
    }),
    travelFx: "pack:capture:sprite-fireball-travel-01",
    travelSourceAnchor: "mouth",
    impactFx: "pack:capture:sprite-fireball-impact-01"
  }),
  claw: Object.freeze({
    icon: "core:icon-skill-claw-01"
  }),
  "aerial-dive": Object.freeze({
    icon: "core:icon-skill-aerial-dive-01"
  }),
  "teleport-strike": Object.freeze({
    icon: "core:icon-skill-teleport-strike-01"
  })
});

function resolveAsset(assetId) {
  return ASSETS[assetId] ?? null;
}

export const demoPresentationAssets = Object.freeze({
  presentationForArena(arenaId) {
    const binding = ARENA_BINDINGS[arenaId];
    if (!binding) {
      return null;
    }

    return Object.freeze({
      background: resolveAsset(binding.background)
    });
  },
  presentationForSkill(skillId, { sourceView = null } = {}) {
    const binding = SKILL_BINDINGS[skillId];
    if (!binding) {
      return null;
    }

    return Object.freeze({
      icon: resolveAsset(binding.icon),
      cast: resolveAsset(binding.castFx),
      castAnchor: binding.castAnchor ?? null,
      castLayer:
        binding.castLayerBySourceView?.[sourceView] ??
        binding.castLayer ??
        "front",
      travel: resolveAsset(binding.travelFx),
      travelSourceAnchor: binding.travelSourceAnchor ?? null,
      impact: resolveAsset(binding.impactFx)
    });
  }
});
