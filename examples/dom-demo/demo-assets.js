const CAPTURE_ROOT = new URL(
  "../../assets/library/capture/",
  import.meta.url
);

const CORE_ROOT = new URL(
  "../../assets/library/core/",
  import.meta.url
);

function captureSequenceAsset({
  assetId,
  folder,
  stem = null,
  extension = null,
  frameCount = 0,
  frameFiles = null,
  frameMs,
  displayScale
}) {
  const files = Array.isArray(frameFiles)
    ? frameFiles
    : Array.from({ length: frameCount }, (_, index) => {
        const frame = String(index + 1).padStart(2, "0");
        return `${stem}_${frame}.${extension}`;
      });

  return Object.freeze({
    assetId,
    frames: Object.freeze(
      files.map((file) =>
        new URL(
          `sprites/skills/${folder}/frames/${file}`,
          CAPTURE_ROOT
        ).href
      )
    ),
    frameMs,
    displayScale
  });
}

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
  "pack:capture:sprite-claw-impact-01": captureSequenceAsset({
    assetId: "pack:capture:sprite-claw-impact-01",
    folder: "claw_impact",
    frameFiles: Object.freeze([
      "sprite_skill_claw_impact_01.png",
      "sprite_skill_claw_impact_02.png",
      "sprite_skill_claw_impact_03.svg",
      "sprite_skill_claw_impact_04.svg",
      "sprite_skill_claw_impact_05.svg",
      "sprite_skill_claw_impact_06.svg",
      "sprite_skill_claw_impact_07.svg",
      "sprite_skill_claw_impact_08.svg"
    ]),
    frameMs: 55,
    displayScale: 2.2
  }),
  "pack:capture:sprite-teleportation-1": captureSequenceAsset({
    assetId: "pack:capture:sprite-teleportation-1",
    folder: "teleportation_1",
    stem: "sprite_skill_teleportation_1",
    extension: "svg",
    frameCount: 8,
    frameMs: 42,
    displayScale: 2.35
  }),
  "pack:capture:sprite-teleportation-2": captureSequenceAsset({
    assetId: "pack:capture:sprite-teleportation-2",
    folder: "teleportation_2",
    stem: "sprite_skill_teleportation_2",
    extension: "svg",
    frameCount: 8,
    frameMs: 38,
    displayScale: 2.1
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
    icon: "core:icon-skill-claw-01",
    impactFx: "pack:capture:sprite-claw-impact-01"
  }),
  "aerial-dive": Object.freeze({
    icon: "core:icon-skill-aerial-dive-01",
    castFx: "pack:capture:sprite-teleportation-1",
    castLayer: "front",
    impactFx: "pack:capture:sprite-claw-impact-01"
  }),
  "teleport-strike": Object.freeze({
    icon: "core:icon-skill-teleport-strike-01",
    phaseFxByLabel: Object.freeze({
      "teleport-vanish": "pack:capture:sprite-teleportation-2",
      "teleport-return-vanish": "pack:capture:sprite-teleportation-2"
    })
  })
});

function resolveAsset(assetId) {
  return ASSETS[assetId] ?? null;
}

function resolveAssetMap(bindings = {}) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(bindings).map(([key, assetId]) => [
        key,
        resolveAsset(assetId)
      ])
    )
  );
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
      impact: resolveAsset(binding.impactFx),
      phaseFx: resolveAssetMap(binding.phaseFxByLabel)
    });
  }
});
