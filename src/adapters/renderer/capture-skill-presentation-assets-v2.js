import {
  normalizeSkillPresentationBinding
} from "../../contracts/skill-presentation-binding.js";
import {builtInBurrowSpriteAssetV1} from "../../assets/burrow-terrain-builtins-v1.js";

function requiredFunction(value, field) {
  if (typeof value !== "function") {
    throw new TypeError(`${field} must be a function`);
  }
  return value;
}

function normalizePresentationMap(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new TypeError(
      "skillPresentations must be an object"
    );
  }

  return Object.freeze(
    Object.fromEntries(
      Object.entries(input).map(
        ([skillId, raw]) => {
          if (raw == null) {
            return [skillId, null];
          }

          const binding =
            normalizeSkillPresentationBinding(
              raw
            );

          if (binding.subjectId !== skillId) {
            throw new RangeError(
              `skill presentation subject mismatch: ${skillId}`
            );
          }

          return [skillId, binding];
        }
      )
    )
  );
}

function effectiveViewOffset(slot, view) {
  const offsetX = Number(slot?.offsetX) || 0;
  const offsetY = Number(slot?.offsetY) || 0;

  if (
    view !== "opponent" ||
    slot?.offsetMode == null
  ) {
    return Object.freeze({
      x: offsetX,
      y: offsetY
    });
  }

  if (slot.offsetMode === "same") {
    return Object.freeze({
      x: offsetX,
      y: offsetY
    });
  }

  if (slot.offsetMode === "mirror_x") {
    return Object.freeze({
      x: -offsetX,
      y: offsetY
    });
  }

  if (slot.offsetMode === "custom") {
    return Object.freeze({
      x:
        Number(slot.opponentOffsetX) || 0,
      y:
        Number(slot.opponentOffsetY) || 0
    });
  }

  throw new RangeError(
    "Unsupported presentation offsetMode: " +
      slot.offsetMode
  );
}

function resolvedVisual(
  assetForId,
  slot,
  view = "player"
) {
  if (!slot) {
    return null;
  }

  const asset = assetForId(slot.assetId);
  if (!asset || typeof asset !== "object") {
    throw new RangeError(
      `unknown presentation asset: ${slot.assetId}`
    );
  }

  const viewOffset =
    effectiveViewOffset(slot, view);

  return Object.freeze({
    ...asset,
    assetId: slot.assetId,
    displayScale:
      slot.displayScale ??
      asset.displayScale ??
      1,
    displayScaleX:
      slot.displayScaleX ??
      asset.displayScaleX ??
      1,
    displayScaleY:
      slot.displayScaleY ??
      asset.displayScaleY ??
      1,
    playbackMode:
      slot.playbackMode ??
      asset.playbackMode ??
      "once",
    // Presentation V11: preserve the asset's native cadence and adjust only
    // the visual frame playback of this one authored projectile.
    frameSpeedMultiplier: slot.frameSpeedMultiplier ?? 1,
    perspectiveAmount: slot.perspectiveAmount ?? 0,
    perspectiveView: view,
    ...(slot.farScaleRatio == null ? {} : { farScaleRatio: slot.farScaleRatio }),
    ...(slot.arrivalLayer == null ? {} : { arrivalLayer: slot.arrivalLayer }),
    ...(slot.durationMs == null ? {} : { durationMs: slot.durationMs }),
    rotationDeg: slot.rotationDeg ?? 0,
    opacity: slot.opacity ?? 1,
    offsetX: viewOffset.x,
    offsetY: viewOffset.y,
    attachment: slot.attachment,
    ...(slot.trajectoryMode == null ? {} : {
      trajectoryMode: slot.trajectoryMode,
      ...(slot.trajectoryMode === "skyfall" ? {
        fallHeightPx: slot.fallHeightPx,
        fallOffsetXPx: slot.fallOffsetXPx
      } : {})
    })
  });
}

function resolvedIcon(assetForId, slot) {
  if (!slot) {
    return null;
  }

  const asset = assetForId(slot.assetId);
  if (!asset || typeof asset !== "object") {
    throw new RangeError(
      `unknown presentation asset: ${slot.assetId}`
    );
  }

  return Object.freeze({
    ...asset,
    assetId: slot.assetId
  });
}

function resolvedAudio(audioAssetForId, slot) {
  if (!slot) {
    return null;
  }

  const asset = audioAssetForId(slot.assetId);
  if (!asset || typeof asset !== "object") {
    return null;
  }

  return Object.freeze({
    ...asset,
    assetId: slot.assetId,
    volume: slot.volume ?? asset.volume ?? 1,
    loop: slot.loop === true
  });
}

function semanticView(context) {
  const actorView = ["impact", "clash-impact"].includes(context?.fxType)
    ? context?.targetView : context?.sourceView;
  const view = context?.view ?? (["player", "opponent"].includes(actorView) ? actorView : "player");
  if (
    view !== "player" &&
    view !== "opponent"
  ) {
    throw new RangeError(
      `Unsupported presentation view: ${view}`
    );
  }
  return view;
}

function layerFor(slot, bindingVersion, view) {
  if (!slot) {
    return "front";
  }

  if (bindingVersion >= 2) {
    return (
      slot.layerByView?.[view] ??
      "front"
    );
  }

  return slot.layer ?? "front";
}

function statusVisualRegistry(bindings) {
  const registry = new Map();

  for (const binding of Object.values(bindings)) {
    for (
      const [statusId, presentation] of
      Object.entries(
        binding?.statusVisuals ?? {}
      )
    ) {
      const existing =
        registry.get(statusId) ?? null;

      if (existing === null) {
        registry.set(
          statusId,
          Object.freeze({
            presentation,
            ambiguous: false
          })
        );
        continue;
      }

      if (
        JSON.stringify(existing.presentation) ===
        JSON.stringify(presentation)
      ) {
        continue;
      }

      registry.set(
        statusId,
        Object.freeze({
          presentation: null,
          ambiguous: true
        })
      );
    }
  }

  return registry;
}

function resolvedStatusPresentation(
  assetForId,
  presentation,
  view = "player"
) {
  if (!presentation) {
    return null;
  }

  const sprite = presentation.sprite
    ? resolvedVisual(
        assetForId,
        {
          ...presentation.sprite,
          playbackMode:
            presentation.sprite.playbackMode ??
            "loop",
          rotationDeg: 0,
          offsetX:
            presentation.sprite.offsetX ?? 0,
          offsetY:
            presentation.sprite.offsetY ?? 0
        },
        view
      )
    : null;

  return Object.freeze({
    mode: presentation.mode,
    tintColor: presentation.tintColor,
    tintOpacity: presentation.tintOpacity,
    tintBlinkEnabled: presentation.tintBlinkEnabled === true,
    tintBlinkPeriodMs: presentation.tintBlinkPeriodMs ?? 600,
    sprite: sprite ? Object.freeze({ ...sprite, layer: presentation.sprite.layerByView?.[view] ?? "front" }) : null
  });
}

export function createCaptureSkillPresentationAssetsV2({
  skillPresentations,
  assetForId,
  audioAssetForId = () => null
}) {
  const bindings =
    normalizePresentationMap(
      skillPresentations
    );
  const resolveAsset = requiredFunction(
    assetForId,
    "assetForId"
  );
  const resolveAudio = requiredFunction(
    audioAssetForId,
    "audioAssetForId"
  );
  const statusVisuals =
    statusVisualRegistry(bindings);

  function presentationForSkill(
    skillId,
    context = {}
  ) {
    const binding =
      bindings[skillId] ?? null;
    if (!binding) {
      return null;
    }

    const view = semanticView(context);
    // Beam start/body belong to the source view; its target endcap
    // must share the exact view-dependent position of the eventual impact.
    const impactView =
      context.fxType === "beam" &&
      ["player", "opponent"].includes(context.targetView)
        ? context.targetView
        : view;
    const visual = binding.visual;
    const audio = binding.audio;

    const castVisual =
      resolvedVisual(
        resolveAsset,
        visual.cast,
        view
      );
    const beamStartVisual =
      resolvedVisual(
        resolveAsset,
        visual.beamStart,
        view
      );
    const travelVisual =
      resolvedVisual(
        resolveAsset,
        visual.travel,
        view
      );
    const impactVisual =
      resolvedVisual(
        resolveAsset,
        visual.impact,
        impactView
      );
    const persistentZoneVisual =
      resolvedVisual(
        resolveAsset,
        visual.aura,
        view
      );

    const burrowTerrain = binding.version === 13
      ? Object.freeze(Object.fromEntries(["start","travel","impact"].map(stage=>{
          const slot=visual.burrowTerrain?.[stage] ?? null;
          if(!slot)return [stage,null];
          const media=builtInBurrowSpriteAssetV1(slot.assetId) ?? resolveAsset(slot.assetId);
          if(!media)throw new RangeError("unknown burrow sprite asset: "+slot.assetId);
          return [stage,Object.freeze({
            ...media,assetId:slot.assetId,
            scale:slot.scale,offsetX:slot.offsetX,offsetY:slot.offsetY,
            frameMs:slot.frameMs,
            playbackMode:stage==="travel"?"loop":"once"
          })];
        }))) : null;
    return Object.freeze({
      burrowTerrain,
      icon: resolvedIcon(
        resolveAsset,
        visual.icon
      ),
      cast: castVisual,
      castAnchor:
        visual.cast?.anchor ?? null,
      castLayer: layerFor(
        visual.cast,
        binding.version,
        view
      ),
      beamStart: beamStartVisual,
      beamStartLayer: layerFor(visual.beamStart, binding.version, view),
      travel: travelVisual,
      travelSourceAnchor:
        visual.travel?.anchor ?? null,
      travelLayer: layerFor(
        visual.travel,
        binding.version,
        view
      ),
      // Independent from the source layer: only V12 projectiles opt into
      // depth switching while the existing shell animation is progressing.
      travelArrivalLayer: visual.travel?.arrivalLayer ?? null,
      impact: impactVisual,
      impactFeedbackOffset:
        binding.version >= 9
          ? Object.freeze({
              x:
                impactVisual?.offsetX ?? 0,
              y:
                impactVisual?.offsetY ?? 0
            })
          : null,
      impactLayer: layerFor(visual.impact, binding.version, impactView),
      persistentZone:
        persistentZoneVisual,
      persistentZoneLayer: layerFor(
        visual.aura,
        binding.version,
        view
      ),
      castSound: resolvedAudio(
        resolveAudio,
        audio.cast
      ),
      releaseSound: resolvedAudio(
        resolveAudio,
        audio.release
      ),
      travelSound: resolvedAudio(
        resolveAudio,
        audio.travel
      ),
      impactSound: resolvedAudio(
        resolveAudio,
        audio.impact
      ),
      auraSound: resolvedAudio(
        resolveAudio,
        audio.aura
      ),
      feedback:
        binding.version >= 4
          ? binding.feedback
          : null
    });
  }

  function statusPresentationFor(statusId, context = {}) {
    const id = String(statusId ?? "").trim();
    if (!id) {
      return null;
    }

    const sourceSkillId =
      typeof context.sourceSkillId === "string"
        ? context.sourceSkillId.trim()
        : "";

    let presentation = null;

    if (sourceSkillId !== "") {
      presentation =
        bindings[sourceSkillId]
          ?.statusVisuals?.[id] ??
        null;
    } else {
      const fallback =
        statusVisuals.get(id) ?? null;

      presentation =
        fallback !== null &&
        fallback.ambiguous === false
          ? fallback.presentation
          : null;
    }

    return resolvedStatusPresentation(
      resolveAsset,
      presentation,
      semanticView(context)
    );
  }

  return Object.freeze({
    presentationForSkill,
    statusPresentationFor,
    // Share the canonical catalog resolver with persistent CombatEntity visuals.
    // No duplicate asset registry or ID-to-URL translation in the battle UI.
    visualAsset(assetId) {
      return resolveAsset(assetId);
    },
    audioAsset(assetId) {
      return resolveAudio(assetId);
    }
  });
}
