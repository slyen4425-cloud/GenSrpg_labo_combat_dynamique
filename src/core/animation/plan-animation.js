import { createAnimationPlan } from "./animation-plan.js";

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
    case "idle": {
      const cfg = profile.idle;
      const half = cfg.durationMs / 2;
      return createAnimationPlan({
        actorId: actor.id,
        eventType: event.type,
        loop: true,
        segments: [
          {
            label: "idle-out",
            durationMs: half,
            easing: "ease-in-out",
            transform: {
              translateX: directed(scaled(cfg.swayX, intensity), sign),
              translateY: -scaled(cfg.bobY, intensity),
              rotateDeg: directed(scaled(cfg.swayRotate, intensity), sign),
              scaleX: 1 + scaled(cfg.scaleXDelta ?? 0, intensity),
              scaleY: 1 + scaled(cfg.scaleYDelta ?? 0, intensity)
            }
          },
          {
            label: "idle-home",
            durationMs: half,
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

      const target = visualTarget(event);
      const perspectiveScale =
        approachPerspectiveScale(
          target,
          profile.specialMoves?.perspective ?? {}
        );

      return createAnimationPlan({
        actorId: actor.id,
        eventType: event.type,
        segments: [
          {
            label: "ground-approach-impact",
            durationMs: target.travelMs,
            easing: "cubic-bezier(0.2, 0.75, 0.25, 1)",
            transform: {
              translateX: target.x,
              translateY: target.y,
              scaleX:
                cfg.impactScaleX * perspectiveScale,
              scaleY:
                cfg.impactScaleY * perspectiveScale,
              rotateDeg: directed(3 * intensity, sign)
            },
            opacity: 1
          },
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
      const riseMs = Math.max(
        1,
        Math.round(target.travelMs * cfg.riseRatio)
      );
      const repositionMs = Math.max(
        1,
        Math.round(target.travelMs * cfg.repositionRatio)
      );
      const diveMs = Math.max(
        1,
        target.travelMs - riseMs - repositionMs
      );

      return createAnimationPlan({
        actorId: actor.id,
        eventType: event.type,
        segments: [
          {
            label: "aerial-rise",
            durationMs: riseMs,
            easing: "ease-out",
            transform: {
              translateX: 0,
              translateY: riseY,
              scaleX: 0.98 * perspectiveScale,
              scaleY: 1.02 * perspectiveScale,
              rotateDeg: 0
            },
            opacity: 1
          },
          {
            label: "aerial-reposition",
            durationMs: repositionMs,
            easing: "ease-in",
            transform: {
              translateX: target.x,
              translateY: Math.min(
                riseY,
                target.y - cfg.diveHeight
              ),
              scaleX: 0.94 * perspectiveScale,
              scaleY: 1.06 * perspectiveScale,
              rotateDeg: directed(4, sign)
            },
            opacity: 0
          },
          {
            label: "aerial-dive-impact",
            durationMs: diveMs,
            easing: "cubic-bezier(0.15, 0.8, 0.2, 1)",
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
