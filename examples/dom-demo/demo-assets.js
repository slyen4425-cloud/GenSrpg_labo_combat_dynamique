import {
  GLOBAL_VISUAL_LIBRARY,
  globalVisualAssetUrl
} from "../../src/assets/global-visual-library.js";

const CAPTURE_ROOT = new URL(
  "capture/",
  GLOBAL_VISUAL_LIBRARY.baseUrl
);

const CORE_ROOT = new URL(
  "core/",
  GLOBAL_VISUAL_LIBRARY.baseUrl
);

const RUNTIME_AUDIO_ROOT = new URL(
  "../../assets/runtime/audio-test/",
  import.meta.url
);


function globalCaptureStripAsset({
  assetId,
  family,
  name,
  prefix,
  frameMs,
  displayScale = 1
}) {
  return Object.freeze({
    assetId,
    url: globalVisualAssetUrl(
      `capture/sprites/${family}/${name}/atlases/sprite_${prefix}_${name}_atlas_01.webp`
    ),
    frameCount: 8,
    frameMs,
    displayScale,
    playbackMode: "once"
  });
}

function captureSequenceAsset({
  assetId,
  folder,
  stem = null,
  extension = null,
  frameCount = 0,
  frameFiles = null,
  frameMs,
  displayScale,
  playbackMode = "once"
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
    displayScale,
    playbackMode
  });
}

const ASSETS = Object.freeze({
  "pack:capture:sprite-cast-blade-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-cast-blade-01",
    family: "casts",
    name: "blade",
    prefix: "cast",
    frameMs: 60
  }),
  "pack:capture:sprite-cast-electric-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-cast-electric-01",
    family: "casts",
    name: "electric",
    prefix: "cast",
    frameMs: 60
  }),
  "pack:capture:sprite-cast-nature-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-cast-nature-01",
    family: "casts",
    name: "nature",
    prefix: "cast",
    frameMs: 60
  }),
  "pack:capture:sprite-cast-physical-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-cast-physical-01",
    family: "casts",
    name: "physical",
    prefix: "cast",
    frameMs: 60
  }),
  "pack:capture:sprite-cast-water-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-cast-water-01",
    family: "casts",
    name: "water",
    prefix: "cast",
    frameMs: 60
  }),
  "pack:capture:sprite-impact-blade-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-impact-blade-01",
    family: "impacts",
    name: "blade",
    prefix: "impact",
    frameMs: 45
  }),
  "pack:capture:sprite-impact-electric-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-impact-electric-01",
    family: "impacts",
    name: "electric",
    prefix: "impact",
    frameMs: 45
  }),
  "pack:capture:sprite-impact-nature-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-impact-nature-01",
    family: "impacts",
    name: "nature",
    prefix: "impact",
    frameMs: 45
  }),
  "pack:capture:sprite-impact-physical-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-impact-physical-01",
    family: "impacts",
    name: "physical",
    prefix: "impact",
    frameMs: 45
  }),
  "pack:capture:sprite-impact-water-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-impact-water-01",
    family: "impacts",
    name: "water",
    prefix: "impact",
    frameMs: 45
  }),
  "pack:capture:sprite-projectile-earth-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-projectile-earth-01",
    family: "projectiles",
    name: "earth",
    prefix: "projectile",
    frameMs: 45
  }),
  "pack:capture:sprite-projectile-electric-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-projectile-electric-01",
    family: "projectiles",
    name: "electric",
    prefix: "projectile",
    frameMs: 45
  }),
  "pack:capture:sprite-projectile-fire-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-projectile-fire-01",
    family: "projectiles",
    name: "fire",
    prefix: "projectile",
    frameMs: 45
  }),
  "pack:capture:sprite-projectile-ice-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-projectile-ice-01",
    family: "projectiles",
    name: "ice",
    prefix: "projectile",
    frameMs: 45
  }),
  "pack:capture:sprite-projectile-light-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-projectile-light-01",
    family: "projectiles",
    name: "light",
    prefix: "projectile",
    frameMs: 45
  }),
  "pack:capture:sprite-projectile-shadow-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-projectile-shadow-01",
    family: "projectiles",
    name: "shadow",
    prefix: "projectile",
    frameMs: 45
  }),
  "pack:capture:sprite-projectile-thorn-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-projectile-thorn-01",
    family: "projectiles",
    name: "thorn",
    prefix: "projectile",
    frameMs: 45
  }),
  "pack:capture:sprite-projectile-water-01": globalCaptureStripAsset({
    assetId: "pack:capture:sprite-projectile-water-01",
    family: "projectiles",
    name: "water",
    prefix: "projectile",
    frameMs: 45
  }),
  "core:arena-forest-01": Object.freeze({
    assetId: "core:arena-forest-01",
    url: globalVisualAssetUrl(
      "core/arenas/forest/arena_forest_01.png"
    )
  }),
  "core:arena-cave-01": Object.freeze({
    assetId: "core:arena-cave-01",
    url: globalVisualAssetUrl(
      "core/arenas/cave/arena_cave_01.webp"
    )
  }),
  "core:arena-snow-01": Object.freeze({
    assetId: "core:arena-snow-01",
    url: globalVisualAssetUrl(
      "core/arenas/snow/arena_snow_01.webp"
    )
  }),
  "core:arena-city-01": Object.freeze({
    assetId: "core:arena-city-01",
    url: globalVisualAssetUrl(
      "core/arenas/city/arena_city_01.webp"
    )
  }),
  "core:arena-lava-01": Object.freeze({
    assetId: "core:arena-lava-01",
    url: globalVisualAssetUrl(
      "core/arenas/lava/arena_lava_01.webp"
    )
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
  "pack:capture:sprite-fire-zone-loop-01": Object.freeze({
    assetId: "pack:capture:sprite-fire-zone-loop-01",
    url: globalVisualAssetUrl(
      "capture/sprites/skills/fire_zone_loop/atlases/sprite_skill_fire_zone_loop_01_atlas.webp"
    ),
    frameCount: 16,
    frameMs: 80,
    displayScale: 1,
    playbackMode: "loop"
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
    displayScale: 3.0
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
  }),
  "gensrpg:sound:fire-cast-01": Object.freeze({
    assetId: "gensrpg:sound:fire-cast-01",
    mediaType: "audio",
    url: new URL("fire_cast.mp3", RUNTIME_AUDIO_ROOT).href,
    volume: 0.72
  }),
  "gensrpg:sound:melee-impact-01": Object.freeze({
    assetId: "gensrpg:sound:melee-impact-01",
    mediaType: "audio",
    url: new URL("melee_impact.mp3", RUNTIME_AUDIO_ROOT).href,
    volume: 0.82
  }),
  "gensrpg:sound:teleport-01": Object.freeze({
    assetId: "gensrpg:sound:teleport-01",
    mediaType: "audio",
    url: new URL("teleport.mp3", RUNTIME_AUDIO_ROOT).href,
    volume: 0.76
  })
});

const ARENA_BINDINGS = Object.freeze({
  forest: Object.freeze({
    label: "Forêt",
    background: "core:arena-forest-01"
  }),
  cave: Object.freeze({
    label: "Grotte",
    background: "core:arena-cave-01"
  }),
  snow: Object.freeze({
    label: "Neige",
    background: "core:arena-snow-01"
  }),
  city: Object.freeze({
    label: "Ville",
    background: "core:arena-city-01",
    backgroundPosition: "center bottom",
    backgroundSize: "auto 100%"
  }),
  lava: Object.freeze({
    label: "Lave",
    background: "core:arena-lava-01"
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
    impactFx: "pack:capture:sprite-fireball-impact-01",
    castSound: "gensrpg:sound:fire-cast-01",
    impactSound: "gensrpg:sound:melee-impact-01"
  }),
  claw: Object.freeze({
    icon: "core:icon-skill-claw-01",
    impactFx: "pack:capture:sprite-claw-impact-01",
    impactSound: "gensrpg:sound:melee-impact-01"
  }),
  "aerial-dive": Object.freeze({
    icon: "core:icon-skill-aerial-dive-01",
    castFx: "pack:capture:sprite-teleportation-1",
    castLayer: "front",
    castOptions: Object.freeze({
      playbackMode: "loop"
    }),
    impactFx: "pack:capture:sprite-claw-impact-01",
    castSound: "gensrpg:sound:teleport-01",
    impactSound: "gensrpg:sound:melee-impact-01"
  }),
  "teleport-strike": Object.freeze({
    icon: "core:icon-skill-teleport-strike-01",
    phaseFxByLabel: Object.freeze({
      "teleport-vanish": "pack:capture:sprite-teleportation-2",
      "teleport-return-vanish": "pack:capture:sprite-teleportation-2"
    }),
    phaseSoundByLabel: Object.freeze({
      "teleport-vanish": "gensrpg:sound:teleport-01",
      "teleport-return-vanish": "gensrpg:sound:teleport-01"
    }),
    impactSound: "gensrpg:sound:melee-impact-01"
  })
});

function resolveAsset(assetId) {
  return ASSETS[assetId] ?? null;
}

function resolvePresentationAsset(assetId, options = null) {
  const asset = resolveAsset(assetId);
  if (!asset || !options) {
    return asset;
  }

  return Object.freeze({
    ...asset,
    ...options
  });
}

function resolveAssetMap(bindings = {}, optionsByKey = {}) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(bindings).map(([key, assetId]) => [
        key,
        resolvePresentationAsset(
          assetId,
          optionsByKey?.[key] ?? null
        )
      ])
    )
  );
}

export const demoPresentationAssets = Object.freeze({
  globalLibrary: GLOBAL_VISUAL_LIBRARY,
  asset(assetId) {
    return resolveAsset(assetId);
  },
  arenaOptions() {
    return Object.freeze(
      Object.entries(ARENA_BINDINGS).map(
        ([id, binding]) =>
          Object.freeze({
            id,
            label: binding.label
          })
      )
    );
  },
  presentationForArena(arenaId) {
    const binding = ARENA_BINDINGS[arenaId];
    if (!binding) {
      return null;
    }

    return Object.freeze({
      background: resolveAsset(binding.background),
      backgroundPosition: binding.backgroundPosition ?? "center",
      backgroundSize: binding.backgroundSize ?? "cover"
    });
  },
  presentationForSkill(skillId, { sourceView = null } = {}) {
    const binding = SKILL_BINDINGS[skillId];
    if (!binding) {
      return null;
    }

    return Object.freeze({
      icon: resolveAsset(binding.icon),
      cast: resolvePresentationAsset(
        binding.castFx,
        binding.castOptions ?? null
      ),
      castAnchor: binding.castAnchor ?? null,
      castLayer:
        binding.castLayerBySourceView?.[sourceView] ??
        binding.castLayer ??
        "front",
      travel: resolveAsset(binding.travelFx),
      travelSourceAnchor: binding.travelSourceAnchor ?? null,
      impact: resolveAsset(binding.impactFx),
      phaseFx: resolveAssetMap(
        binding.phaseFxByLabel,
        binding.phaseOptionsByLabel
      ),
      castSound: resolveAsset(binding.castSound),
      releaseSound: resolveAsset(binding.releaseSound),
      impactSound: resolveAsset(binding.impactSound),
      phaseSound: resolveAssetMap(binding.phaseSoundByLabel)
    });
  },
  audioAsset(assetId) {
    const asset = resolveAsset(assetId);
    return asset?.mediaType === "audio" ? asset : null;
  }
});
