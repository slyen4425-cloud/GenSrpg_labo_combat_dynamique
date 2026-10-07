import { createAnimationPlan } from "./animation-plan.js";
import { ROSTER_TRANSITION_PROFILE_V1 } from "../profiles/roster-transition-profile-v1.js";
import {
  DODGE_VISUAL_PROFILE_V1,
  dodgeVisualDurationsV1
} from "../profiles/dodge-visual-profile-v1.js";
import {
  BURROW_VISUAL_PROFILE_V1,
  burrowVisualDurationsV1
} from "../profiles/burrow-visual-profile-v1.js";

function facingSign(actor) {
  return actor.facing === "right" ? 1 : -1;
}

function intensityOf(event) {
  return event.intensity ?? 1;
}

function scaled(value, intensity) {
  return value * intensity;
}

function directed(value, sign) {
  return value === 0 ? 0 : value * sign;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function approachPerspectiveScale(target, cfg) {
  const arenaHeight = target.arenaHeight > 0
    ? target.arenaHeight
    : 1;
  const depthRatio = clamp(
    target.y / arenaHeight,
    -1,
    1
  );
  const strength = Number(cfg.perspectiveScaleStrength ?? 0);
  const min = Number(cfg.perspectiveScaleMin ?? 1);
  const max = Number(cfg.perspectiveScaleMax ?? 1);

  if (
    !Number.isFinite(strength) ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min <= 0 ||
    max <= 0 ||
    min > max
  ) {
    throw new RangeError(
      "approach perspective scale config must be finite and ordered"
    );
  }

  return clamp(
    1 + depthRatio * strength,
    min,
    max
  );
}

function locomotionShape({
  cfg,
  durationMs,
  intensity,
  sign,
  pathTarget = null,
  impactScale = null,
  groundScale = 1
}) {
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
    throw new RangeError("Creature profile has no locomotion preset");
  }

  const totalDurationMs = Number(durationMs ?? cfg.durationMs);
  if (!Number.isFinite(totalDurationMs) || totalDurationMs <= 0) {
    throw new RangeError("locomotion duration must be greater than 0");
  }
  if (!Array.isArray(cfg.phases) || cfg.phases.length === 0) {
    throw new RangeError("locomotion.phases must be a non-empty array");
  }

  let previousAt = 0;
  let elapsedMs = 0;
  const segments = cfg.phases.map((phase, index) => {
    const at = Number(phase.at);
    if (!Number.isFinite(at) || at <= previousAt || at > 1) {
      throw new RangeError("locomotion phase offsets must increase from 0 to 1");
    }

    const endMs =
      at === 1
        ? totalDurationMs
        : Math.round(totalDurationMs * at);
    if (endMs <= elapsedMs) {
      throw new RangeError("locomotion duration is too short for configured phases");
    }
    const phaseDurationMs = endMs - elapsedMs;
    elapsedMs = endMs;
    previousAt = at;

    const rawScaleX = Number(phase.scaleX ?? 1);
    const rawScaleY = Number(phase.scaleY ?? 1);
    const localTranslateX = Number(phase.translateX ?? 0);
    const localTranslateY = Number(phase.translateY ?? 0);
    const localRotateDeg = Number(phase.rotateDeg ?? 0);

    for (const [field, value] of Object.entries({
      rawScaleX,
      rawScaleY,
      localTranslateX,
      localTranslateY,
      localRotateDeg
    })) {
      if (!Number.isFinite(value)) {
        throw new TypeError(`locomotion phase ${index} ${field} must be finite`);
      }
    }

    const pathX = pathTarget ? pathTarget.x * at : 0;
    const pathY = pathTarget ? pathTarget.y * at : 0;

    const baseScaleX = impactScale
      ? 1 + (impactScale.x - 1) * at
      : 1;
    const baseScaleY = impactScale
      ? 1 + (impactScale.y - 1) * at
      : 1;

    return {
      label:
        typeof phase.label === "string" && phase.label.trim()
          ? phase.label
          : `move-phase-${index + 1}`,
      durationMs: phaseDurationMs,
      easing: phase.easing ?? "ease-in-out",
      ground: {
        translateX: pathX + directed(scaled(localTranslateX, intensity), sign),
        translateY: pathY,
        scale: 1 + (groundScale - 1) * at
      },
      transform: {
        translateX:
          pathX +
          directed(scaled(localTranslateX, intensity), sign),
        translateY:
          pathY +
          scaled(localTranslateY, intensity),
        rotateDeg:
          directed(scaled(localRotateDeg, intensity), sign) +
          (pathTarget ? directed(3 * intensity * at, sign) : 0),
        scaleX:
          baseScaleX *
          (1 + (rawScaleX - 1) * intensity),
        scaleY:
          baseScaleY *
          (1 + (rawScaleY - 1) * intensity)
      }
    };
  });

  if (previousAt !== 1) {
    throw new RangeError("last locomotion phase must end at 1");
  }

  const cues = (cfg.contacts ?? []).map((contact, index) => {
    const at = Number(contact.at);
    const cueIntensity = Number(contact.intensity ?? 1);
    if (
      !Number.isFinite(at) ||
      at < 0 ||
      at > 1 ||
      !Number.isFinite(cueIntensity) ||
      cueIntensity <= 0
    ) {
      throw new RangeError(`locomotion contact ${index} is invalid`);
    }
    return {
      type: "footfall",
      atMs: Math.round(totalDurationMs * at),
      intensity: cueIntensity * intensity
    };
  });

  return Object.freeze({
    segments: Object.freeze(segments),
    cues: Object.freeze(cues)
  });
}

function locomotionPlan({
  cfg,
  actorId,
  intensity,
  sign,
  transformOrigin
}) {
  const shape = locomotionShape({
    cfg,
    durationMs: cfg?.durationMs,
    intensity,
    sign
  });

  return createAnimationPlan({
    actorId,
    eventType: "move",
    transformOrigin,
    cues: shape.cues,
    segments: shape.segments
  });
}

function visualTarget(event) {
  const x = Number(event.metadata?.targetTranslateX ?? 0);
  const y = Number(event.metadata?.targetTranslateY ?? 0);
  const travelMs = Number(event.metadata?.travelMs ?? 0);
  const exitY = Number(event.metadata?.arenaExitTranslateY ?? 0);
  const arenaHeight = Number(event.metadata?.arenaHeight ?? 0);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(exitY) ||
    !Number.isFinite(arenaHeight)
  ) {
    throw new TypeError("special attack target offsets must be finite");
  }
  if (!Number.isFinite(travelMs) || travelMs <= 0) {
    throw new RangeError("special attack travelMs must be greater than 0");
  }

  return Object.freeze({ x, y, travelMs, exitY, arenaHeight });
}

export function planAnimation({ event, actor, profile }) {
  if (!event || !actor || !profile) {
    throw new TypeError("event, actor and profile are required");
  }
  if (event.actorId !== actor.id) {
    throw new Error(`Event actorId ${event.actorId} does not match actor ${actor.id}`);
  }

  const intensity = intensityOf(event);
  const sign = facingSign(actor);

  switch (event.type) {
    case "recall": {
      const cfg = profile.recall ?? ROSTER_TRANSITION_PROFILE_V1.recall;
      const durationMs = Number(event.metadata?.durationMs);
      if (!Number.isFinite(durationMs) || durationMs <= 0) throw new RangeError("recall requires positive command durationMs");
      const holdMs = durationMs * cfg.holdFraction;
      return createAnimationPlan({ actorId: actor.id, eventType: event.type, restoreBaseState: false, segments: [
        { label: "recall-channel", durationMs: holdMs, easing: "ease-in-out", transform: { scaleX: cfg.pulseScale, scaleY: cfg.pulseScale }, ground: { scale: cfg.pulseScale }, opacity: 1, filter: { brightness: cfg.pulseBrightness } },
        { label: "recall-contract", durationMs: durationMs - holdMs, easing: "ease-in", transform: { scaleX: cfg.endScale, scaleY: cfg.endScale }, ground: { scale: cfg.endScale }, opacity: cfg.endOpacity, filter: { brightness: cfg.endBrightness } }
      ] });
    }
    case "enter": {
      const cfg = profile.enter ?? ROSTER_TRANSITION_PROFILE_V1.enter;
      const firstMs = cfg.durationMs * cfg.arrivalFraction;
      const settleMs = (cfg.durationMs - firstMs) / 2;
      return createAnimationPlan({ actorId: actor.id, eventType: event.type, segments: [
        { label: "arrival-flash", durationMs: firstMs, easing: "ease-out", transform: { scaleX: cfg.startScale, scaleY: cfg.startScale }, ground: { scale: cfg.startScale }, opacity: cfg.startOpacity, filter: { brightness: cfg.brightness } },
        { label: "arrival-expand", durationMs: settleMs, easing: "ease-out", transform: { scaleX: cfg.overshootScale, scaleY: cfg.overshootScale }, ground: { scale: cfg.overshootScale }, opacity: 1 },
        { label: "arrival-settle", durationMs: settleMs, easing: "ease-in-out", transform: { scaleX: 1, scaleY: 1 }, ground: { scale: 1 }, opacity: 1 }
      ] });
    }
    case "idle": {
      const cfg = profile.idle;
      const swayMode = cfg.swayMode ?? "single";
      if (!["single", "alternate"].includes(swayMode)) {
        throw new RangeError(
          `Unsupported idle.swayMode: ${swayMode}`
        );
      }

      const awayTransform = (direction = 1) => ({
        translateX:
          directed(
            scaled(cfg.swayX, intensity) * direction,
            sign
          ),
        translateY:
          Number(cfg.bobY) === 0
            ? 0
            : -scaled(cfg.bobY, intensity),
        rotateDeg:
          directed(
            scaled(cfg.swayRotate, intensity) * direction,
            sign
          ),
        scaleX:
          1 + scaled(cfg.scaleXDelta ?? 0, intensity),
        scaleY:
          1 + scaled(cfg.scaleYDelta ?? 0, intensity)
      });

      const homeTransform = {
        translateX: 0,
        translateY: 0,
        rotateDeg: 0,
        scaleX: 1,
        scaleY: 1
      };

      const segments =
        swayMode === "alternate"
          ? [
              {
                label: "idle-right",
                durationMs: cfg.durationMs / 4,
                easing: "ease-in-out",
                transform: awayTransform(1)
              },
              {
                label: "idle-center-1",
                durationMs: cfg.durationMs / 4,
                easing: "ease-in-out",
                transform: homeTransform
              },
              {
                label: "idle-left",
                durationMs: cfg.durationMs / 4,
                easing: "ease-in-out",
                transform: awayTransform(-1)
              },
              {
                label: "idle-home",
                durationMs: cfg.durationMs / 4,
                easing: "ease-in-out",
                transform: homeTransform
              }
            ]
          : [
              {
                label: "idle-out",
                durationMs: cfg.durationMs / 2,
                easing: "ease-in-out",
                transform: awayTransform(1)
              },
              {
                label: "idle-home",
                durationMs: cfg.durationMs / 2,
                easing: "ease-in-out",
                transform: homeTransform
              }
            ];

      return createAnimationPlan({
        actorId: actor.id,
        eventType: event.type,
        loop: true,
        transformOrigin: cfg.transformOrigin ?? null,
        segments
      });
    }

    case "move": {
      return locomotionPlan({
        cfg: profile.locomotion,
        actorId: actor.id,
        intensity,
        sign,
        transformOrigin:
          profile.locomotion?.transformOrigin ??
          profile.idle?.transformOrigin ??
          null
      });
    }

    case "attack": {
      const cfg = profile.attack;
      const anticipationMs = Math.max(60, Math.round(cfg.durationMs * 0.28));
      const strikeMs = Math.max(80, cfg.durationMs - anticipationMs);
      return createAnimationPlan({
        actorId: actor.id,
        eventType: event.type,
        segments: [
          {
            label: "anticipation",
            durationMs: anticipationMs,
            easing: "ease-out",
            transform: {
              translateX: directed(-scaled(cfg.lungeX * 0.12, intensity), sign),
              translateY: 0,
              scaleX: 1 - scaled(cfg.squashY * 0.35, intensity),
              scaleY: 1 + scaled(cfg.squashY * 0.2, intensity),
              rotateDeg: directed(-2 * intensity, sign)
            }
          },
          {
            label: "strike",
            durationMs: strikeMs,
            easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
            transform: {
              translateX: directed(scaled(cfg.lungeX, intensity), sign),
              translateY: scaled(cfg.lungeY, intensity),
              scaleX: 1 + scaled(cfg.stretchX, intensity),
              scaleY: 1 - scaled(cfg.squashY, intensity),
              rotateDeg: directed(3 * intensity, sign)
            }
          },
          {
            label: "recover",
            durationMs: cfg.recoveryMs,
            easing: "ease-out",
            transform: {
              translateX: 0,
              translateY: 0,
              scaleX: 1,
              scaleY: 1,
              rotateDeg: 0
            }
          }
        ]
      });
    }

    case "ground-attack": {
      const cfg = profile.specialMoves?.ground;
      if (!cfg) {
        throw new RangeError(`Profile ${profile.id} has no ground preset`);
      }

      const locomotion = profile.locomotion;
      if (!locomotion) {
        throw new RangeError(
          `Profile ${profile.id} has no locomotion preset for ground approach`
        );
      }

      const target = visualTarget(event);
      const perspectiveScale =
        approachPerspectiveScale(
          target,
          profile.specialMoves?.perspective ?? {}
        );

      const approach = locomotionShape({
        cfg: locomotion,
        durationMs: target.travelMs,
        intensity,
        sign,
        pathTarget: target,
        groundScale: perspectiveScale,
        impactScale: {
          x: cfg.impactScaleX * perspectiveScale,
          y: cfg.impactScaleY * perspectiveScale
        }
      });
      const approachSegments = approach.segments.map(
        (segment, index, segments) => ({
          ...segment,
          label:
            index === segments.length - 1
              ? "ground-approach-impact"
              : `ground-${segment.label}`
        })
      );

      return createAnimationPlan({
        actorId: actor.id,
        eventType: event.type,
        transformOrigin:
          locomotion.transformOrigin ??
          profile.idle?.transformOrigin ??
          null,
        cues: approach.cues,
        segments: [
          ...approachSegments,
          {
            label: "ground-home",
            durationMs: cfg.returnMs,
            easing: "ease-out",
            transform: {
              translateX: 0,
              translateY: 0,
              scaleX: 1,
              scaleY: 1,
              rotateDeg: 0
            },
            opacity: 1
          }
        ]
      });
    }

    case "teleport-attack": {
      const cfg = profile.specialMoves?.teleport;
      if (!cfg) {
        throw new RangeError(`Profile ${profile.id} has no teleport preset`);
      }

      const target = visualTarget(event);
      const perspectiveScale =
        approachPerspectiveScale(
          target,
          profile.specialMoves?.perspective ?? {}
        );
      const vanishMs = Math.max(
        1,
        Math.round(target.travelMs * cfg.vanishRatio)
      );
      const appearMs = Math.max(1, target.travelMs - vanishMs);

      return createAnimationPlan({
        actorId: actor.id,
        eventType: event.type,
        segments: [
          {
            label: "teleport-vanish",
            durationMs: vanishMs,
            easing: "ease-in",
            transform: {
              translateX: 0,
              translateY: 0,
              scaleX: 0.96,
              scaleY: 1.04,
              rotateDeg: 0
            },
            opacity: 0
          },
          {
            label: "teleport-impact",
            durationMs: appearMs,
            easing: "linear",
            ground: { translateX: target.x, translateY: target.y, scale: perspectiveScale },
            transform: {
              translateX: target.x,
              translateY: target.y,
              scaleX: 1.04 * perspectiveScale,
              scaleY: 0.98 * perspectiveScale,
              rotateDeg: 0
            },
            opacity: 1
          },
          {
            label: "teleport-return-vanish",
            durationMs: cfg.returnVanishMs,
            easing: "ease-in",
            ground: { translateX: target.x, translateY: target.y, scale: perspectiveScale },
            transform: {
              translateX: target.x,
              translateY: target.y,
              scaleX: 0.96 * perspectiveScale,
              scaleY: 1.02 * perspectiveScale,
              rotateDeg: 0
            },
            opacity: 0
          },
          {
            label: "teleport-home",
            durationMs: cfg.returnMs,
            easing: "ease-out",
            transform: {
              translateX: 0,
              translateY: 0,
              scaleX: 1,
              scaleY: 1,
              rotateDeg: 0
            },
            opacity: 1
          }
        ]
      });
    }

    case "aerial-attack": {
      const cfg = profile.specialMoves?.aerial;
      if (!cfg) {
        throw new RangeError(`Profile ${profile.id} has no aerial preset`);
      }

      const target = visualTarget(event);
      const perspectiveScale =
        approachPerspectiveScale(
          target,
          profile.specialMoves?.perspective ?? {}
        );
      const riseY =
        target.exitY < 0
          ? Math.min(cfg.riseY, target.exitY)
          : cfg.riseY;
      const apexY = Math.min(
        riseY,
        target.y - cfg.diveHeight
      );
      const riseMs = Math.max(
        1,
        Math.round(target.travelMs * cfg.riseRatio)
      );
      const diveMs = Math.max(
        1,
        target.travelMs - riseMs
      );
      const apexProgress =
        riseMs / target.travelMs;

      return createAnimationPlan({
        actorId: actor.id,
        eventType: event.type,
        segments: [
          {
            label: "aerial-arc-apex",
            durationMs: riseMs,
            easing: "cubic-bezier(0.42, 0, 0.58, 1)",
            ground: {
              translateX: target.x * apexProgress,
              translateY: target.y * apexProgress,
              scale: 1 + (perspectiveScale - 1) * apexProgress
            },
            transform: {
              translateX: target.x * apexProgress,
              translateY: apexY,
              scaleX: 0.98 * perspectiveScale,
              scaleY: 1.02 * perspectiveScale,
              rotateDeg: directed(2, sign)
            },
            opacity: 1
          },
          {
            label: "aerial-arc-impact",
            durationMs: diveMs,
            easing: "cubic-bezier(0.42, 0, 0.58, 1)",
            ground: { translateX: target.x, translateY: target.y, scale: perspectiveScale },
            transform: {
              translateX: target.x,
              translateY: target.y,
              scaleX: 1.05 * perspectiveScale,
              scaleY: 0.96 * perspectiveScale,
              rotateDeg: directed(7, sign)
            },
            opacity: 1
          },
          {
            label: "aerial-home",
            durationMs: cfg.returnMs,
            easing: "ease-out",
            transform: {
              translateX: 0,
              translateY: 0,
              scaleX: 1,
              scaleY: 1,
              rotateDeg: 0
            },
            opacity: 1
          }
        ]
      });
    }

    case "burrow-attack": {
      const target = visualTarget(event);
      const perspectiveScale =
        approachPerspectiveScale(
          target,
          profile.specialMoves?.perspective ?? {}
        );
      const timing =
        burrowVisualDurationsV1(
          target.travelMs,
          BURROW_VISUAL_PROFILE_V1
        );
      const cfg =
        BURROW_VISUAL_PROFILE_V1;
      const hiddenY =
        target.y + cfg.emergeStartOffsetY;
      const segments = [];

      if (timing.diveMs > 0) {
        segments.push({
          label: "burrow-dive",
          durationMs: timing.diveMs,
          easing: "ease-in",
          transform: {
            translateX: 0,
            translateY: cfg.diveY,
            scaleX: cfg.diveScaleX,
            scaleY: cfg.diveScaleY,
            rotateDeg: 0
          },
          opacity: 0
        });
      }

      if (timing.hiddenMs > 0) {
        segments.push({
          label: "burrow-hidden",
          durationMs: timing.hiddenMs,
          easing: "linear",
          ground: {
            translateX: target.x,
            translateY: target.y,
            scale: perspectiveScale
          },
          transform: {
            translateX: target.x,
            translateY: hiddenY,
            scaleX: perspectiveScale,
            scaleY: perspectiveScale,
            rotateDeg: 0
          },
          opacity: 0
        });
      }

      if (timing.emergeMs > 0) {
        segments.push({
          label: "burrow-emerge-impact",
          durationMs: timing.emergeMs,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          ground: {
            translateX: target.x,
            translateY: target.y,
            scale: perspectiveScale
          },
          transform: {
            translateX: target.x,
            translateY: target.y,
            scaleX:
              cfg.impactScaleX *
              perspectiveScale,
            scaleY:
              cfg.impactScaleY *
              perspectiveScale,
            rotateDeg: 0
          },
          opacity: 1
        });
      }

      segments.push({
        label: "burrow-home",
        durationMs: cfg.returnMs,
        easing: "ease-out",
        transform: {
          translateX: 0,
          translateY: 0,
          scaleX: 1,
          scaleY: 1,
          rotateDeg: 0
        },
        opacity: 1
      });

      return createAnimationPlan({
        actorId: actor.id,
        eventType: event.type,
        transformOrigin:
          profile.idle?.transformOrigin ??
          null,
        segments
      });
    }

    case "dodge": {
      const durationMs = Number(
        event.metadata?.durationMs
      );
      const timing =
        dodgeVisualDurationsV1(
          durationMs,
          DODGE_VISUAL_PROFILE_V1
        );

      const hiddenTransform = {
        translateX: 0,
        translateY: 0,
        rotateDeg: 0,
        scaleX:
          DODGE_VISUAL_PROFILE_V1
            .vanishScaleX,
        scaleY:
          DODGE_VISUAL_PROFILE_V1
            .vanishScaleY
      };

      const segments = [
        {
          label: "dodge-vanish",
          durationMs: timing.vanishMs,
          easing: "ease-in",
          transform: hiddenTransform,
          opacity: 0,
          filter: {
            brightness:
              DODGE_VISUAL_PROFILE_V1
                .vanishBrightness
          }
        }
      ];

      if (timing.hiddenMs > 0) {
        segments.push({
          label: "dodge-hidden",
          durationMs: timing.hiddenMs,
          easing: "linear",
          transform: hiddenTransform,
          opacity: 0,
          filter: {
            brightness:
              DODGE_VISUAL_PROFILE_V1
                .vanishBrightness
          }
        });
      }

      if (timing.returnMs > 0) {
        segments.push({
          label: "dodge-return",
          durationMs: timing.returnMs,
          easing: "ease-out",
          transform: {
            translateX: 0,
            translateY: 0,
            rotateDeg: 0,
            scaleX: 1,
            scaleY: 1
          },
          opacity: 1
        });
      }

      return createAnimationPlan({
        actorId: actor.id,
        eventType: event.type,
        segments
      });
    }

    case "hit": {
      const cfg = profile.hit;
      return createAnimationPlan({
        actorId: actor.id,
        eventType: event.type,
        segments: [
          {
            label: "recoil",
            durationMs: cfg.durationMs,
            easing: "ease-out",
            transform: {
              translateX: directed(scaled(cfg.recoilX, intensity), sign),
              translateY: 0,
              rotateDeg: directed(scaled(cfg.recoilRotate, intensity), sign),
              scaleX: 0.98,
              scaleY: 1.02
            },
            filter: cfg.filter
          },
          {
            label: "recover",
            durationMs: Math.max(100, Math.round(cfg.durationMs * 0.65)),
            easing: "ease-in-out",
            transform: {
              translateX: 0,
              translateY: 0,
              rotateDeg: 0,
              scaleX: 1,
              scaleY: 1
            }
          }
        ]
      });
    }

    case "ko": {
      const cfg = profile.ko;
      return createAnimationPlan({
        actorId: actor.id,
        eventType: event.type,
        restoreBaseState: false,
        segments: [
          {
            label: "ko",
            durationMs: cfg.durationMs,
            easing: "ease-in",
            transform: {
              translateX: 0,
              translateY: scaled(cfg.fallY, intensity),
              rotateDeg: directed(scaled(cfg.rotate, intensity), sign),
              scaleX: 1,
              scaleY: 0.96
            },
            opacity: cfg.fadeTo
          }
        ]
      });
    }

    default:
      throw new RangeError(`No V1 animation planner for event type: ${event.type}`);
  }
}
