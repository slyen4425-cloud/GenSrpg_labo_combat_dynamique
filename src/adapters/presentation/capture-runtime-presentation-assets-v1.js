import {
  normalizeSkillPresentationBinding
} from "../../contracts/skill-presentation-binding.js";

function objectValue(value, field) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(
      field + " must be an object"
    );
  }
  return value;
}

function resolveVisualAsset(
  baseAssets,
  config,
  field
) {
  if (config == null) {
    return null;
  }

  const asset =
    baseAssets.asset?.(
      config.assetId
    ) ?? null;

  if (!asset) {
    throw new RangeError(
      "Missing configured visual asset " +
        config.assetId +
        " for " +
        field
    );
  }

  return Object.freeze({
    ...asset,
    displayScale:
      config.displayScale ??
      asset.displayScale ??
      1,
    ...(
      config.displayScaleX == null
        ? {}
        : {
            displayScaleX:
              config.displayScaleX
          }
    ),
    ...(
      config.displayScaleY == null
        ? {}
        : {
            displayScaleY:
              config.displayScaleY
          }
    ),
    ...(
      config.offsetX == null
        ? {}
        : {
            offsetX: config.offsetX
          }
    ),
    ...(
      config.offsetY == null
        ? {}
        : {
            offsetY: config.offsetY
          }
    ),
    ...(
      config.rotationDeg == null
        ? {}
        : {
            rotationDeg:
              config.rotationDeg
          }
    ),
    ...(
      config.opacity == null
        ? {}
        : {
            opacity:
              config.opacity
          }
    ),
    ...(
      config.playbackMode == null
        ? {}
        : {
            playbackMode:
              config.playbackMode
          }
    )
  });
}

function resolveIconAsset(
  baseAssets,
  config,
  field
) {
  if (config == null) {
    return null;
  }

  const asset =
    baseAssets.asset?.(
      config.assetId
    ) ?? null;

  if (!asset) {
    throw new RangeError(
      "Missing configured icon asset " +
        config.assetId +
        " for " +
        field
    );
  }

  return asset;
}

function layerFor(
  config,
  view
) {
  if (config == null) {
    return "front";
  }

  return (
    config.layerByView?.[view] ??
    config.layer ??
    "front"
  );
}

function resolveAudioAsset(
  baseAssets,
  config
) {
  if (config == null) {
    return null;
  }

  const asset =
    baseAssets.audioAsset?.(
      config.assetId
    ) ?? null;

  if (!asset) {
    return null;
  }

  return Object.freeze({
    ...asset,
    volume:
      config.volume ??
      asset.volume ??
      1,
    loop:
      config.loop === true
  });
}

function phaseFxFromBinding(
  baseAssets,
  visual
) {
  const output = {};

  if (visual.vanish) {
    const vanish =
      resolveVisualAsset(
        baseAssets,
        visual.vanish,
        "visual.vanish"
      );
    output["teleport-vanish"] =
      vanish;
    output["teleport-return-vanish"] =
      vanish;
  }

  if (visual.reappear) {
    output["teleport-reappear"] =
      resolveVisualAsset(
        baseAssets,
        visual.reappear,
        "visual.reappear"
      );
  }

  if (visual.return) {
    output["teleport-return"] =
      resolveVisualAsset(
        baseAssets,
        visual.return,
        "visual.return"
      );
  }

  return Object.freeze(output);
}

function phaseSoundFromBinding(
  baseAssets,
  audio
) {
  const output = {};

  if (audio.vanish) {
    const vanish =
      resolveAudioAsset(
        baseAssets,
        audio.vanish
      );
    if (vanish) {
      output["teleport-vanish"] =
        vanish;
      output["teleport-return-vanish"] =
        vanish;
    }
  }

  if (audio.reappear) {
    const reappear =
      resolveAudioAsset(
        baseAssets,
        audio.reappear
      );
    if (reappear) {
      output["teleport-reappear"] =
        reappear;
    }
  }

  return Object.freeze(output);
}

function projectSkillPresentation(
  baseAssets,
  binding,
  {
    view = "player"
  } = {}
) {
  const visual =
    binding.visual ?? {};
  const audio =
    binding.audio ?? {};

  return Object.freeze({
    icon:
      resolveIconAsset(
        baseAssets,
        visual.icon,
        binding.subjectId + ".icon"
      ),
    cast:
      resolveVisualAsset(
        baseAssets,
        visual.cast,
        binding.subjectId + ".cast"
      ),
    castAnchor:
      visual.cast?.anchor ?? null,
    castLayer:
      layerFor(
        visual.cast,
        view
      ),
    travel:
      resolveVisualAsset(
        baseAssets,
        visual.travel,
        binding.subjectId + ".travel"
      ),
    travelSourceAnchor:
      visual.travel?.anchor ?? null,
    travelLayer:
      layerFor(
        visual.travel,
        view
      ),
    impact:
      resolveVisualAsset(
        baseAssets,
        visual.impact,
        binding.subjectId + ".impact"
      ),
    persistentZone:
      resolveVisualAsset(
        baseAssets,
        visual.aura,
        binding.subjectId + ".aura"
      ),
    persistentZoneLayer:
      layerFor(
        visual.aura,
        view
      ),
    phaseFx:
      phaseFxFromBinding(
        baseAssets,
        visual
      ),
    castSound:
      resolveAudioAsset(
        baseAssets,
        audio.cast
      ),
    releaseSound:
      resolveAudioAsset(
        baseAssets,
        audio.release
      ),
    travelSound:
      resolveAudioAsset(
        baseAssets,
        audio.travel
      ),
    impactSound:
      resolveAudioAsset(
        baseAssets,
        audio.impact
      ),
    phaseSound:
      phaseSoundFromBinding(
        baseAssets,
        audio
      )
  });
}

function stableStatusVisual(
  baseAssets,
  visual,
  statusId
) {
  return Object.freeze({
    mode: visual.mode,
    tintColor: visual.tintColor,
    tintOpacity: visual.tintOpacity,
    sprite:
      visual.sprite == null
        ? null
        : Object.freeze({
            ...resolveVisualAsset(
              baseAssets,
              visual.sprite,
              "statusVisuals." +
                statusId +
                ".sprite"
            ),
            displayScale:
              visual.sprite.displayScale,
            opacity:
              visual.sprite.opacity
          })
  });
}

function sameValue(a, b) {
  return JSON.stringify(a) ===
    JSON.stringify(b);
}

export function createCaptureRuntimePresentationAssetsV1({
  baseAssets,
  skillPresentations = {}
}) {
  objectValue(
    baseAssets,
    "baseAssets"
  );
  objectValue(
    skillPresentations,
    "skillPresentations"
  );

  if (
    typeof baseAssets.asset !==
    "function"
  ) {
    throw new TypeError(
      "baseAssets.asset must be a function"
    );
  }

  const bindings =
    new Map();
  const statuses =
    new Map();

  for (
    const [
      skillId,
      rawBinding
    ] of Object.entries(
      skillPresentations
    )
  ) {
    if (rawBinding == null) {
      continue;
    }

    const binding =
      normalizeSkillPresentationBinding(
        rawBinding
      );

    if (
      binding.subjectId !==
      skillId
    ) {
      throw new RangeError(
        "skill presentation key must match subjectId: " +
          skillId
      );
    }

    bindings.set(
      skillId,
      binding
    );

    for (
      const [
        statusId,
        statusVisual
      ] of Object.entries(
        binding.statusVisuals ?? {}
      )
    ) {
      const projected =
        stableStatusVisual(
          baseAssets,
          statusVisual,
          statusId
        );
      const current =
        statuses.get(statusId);

      if (
        current &&
        !sameValue(
          current,
          projected
        )
      ) {
        throw new RangeError(
          "Conflicting status presentation for " +
            statusId
        );
      }

      statuses.set(
        statusId,
        projected
      );
    }
  }

  return Object.freeze({
    globalLibrary:
      baseAssets.globalLibrary ?? null,
    asset(assetId) {
      return (
        baseAssets.asset?.(
          assetId
        ) ?? null
      );
    },
    audioAsset(assetId) {
      return (
        baseAssets.audioAsset?.(
          assetId
        ) ?? null
      );
    },
    arenaOptions() {
      return (
        baseAssets.arenaOptions?.() ??
        Object.freeze([])
      );
    },
    presentationForArena(arenaId) {
      return (
        baseAssets
          .presentationForArena?.(
            arenaId
          ) ?? null
      );
    },
    presentationForSkill(
      skillId,
      context = {}
    ) {
      const binding =
        bindings.get(skillId);

      if (!binding) {
        return (
          baseAssets
            .presentationForSkill?.(
              skillId,
              context
            ) ?? null
        );
      }

      return projectSkillPresentation(
        baseAssets,
        binding,
        {
          view:
            context.view ??
            context.sourceView ??
            "player"
        }
      );
    },
    statusPresentationFor(
      statusId
    ) {
      return (
        statuses.get(statusId) ??
        baseAssets
          .statusPresentationFor?.(
            statusId
          ) ??
        null
      );
    }
  });
}
