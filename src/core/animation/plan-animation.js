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
              translateX: scaled(cfg.swayX, intensity) * sign,
              translateY: -scaled(cfg.bobY, intensity),
              rotateDeg: scaled(cfg.swayRotate, intensity) * sign,
              scaleX: 1 + 0.01 * intensity,
              scaleY: 1 - 0.01 * intensity
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
              translateX: -scaled(cfg.lungeX * 0.12, intensity) * sign,
              translateY: 0,
              scaleX: 1 - scaled(cfg.squashY * 0.35, intensity),
              scaleY: 1 + scaled(cfg.squashY * 0.2, intensity),
              rotateDeg: -2 * sign * intensity
            }
          },
          {
            label: "strike",
            durationMs: strikeMs,
            easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
            transform: {
              translateX: scaled(cfg.lungeX, intensity) * sign,
              translateY: scaled(cfg.lungeY, intensity),
              scaleX: 1 + scaled(cfg.stretchX, intensity),
              scaleY: 1 - scaled(cfg.squashY, intensity),
              rotateDeg: 3 * sign * intensity
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
              translateX: scaled(cfg.recoilX, intensity) * sign,
              translateY: 0,
              rotateDeg: scaled(cfg.recoilRotate, intensity) * sign,
              scaleX: 0.98,
              scaleY: 1.02
            }
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
        segments: [
          {
            label: "ko",
            durationMs: cfg.durationMs,
            easing: "ease-in",
            transform: {
              translateX: 0,
              translateY: scaled(cfg.fallY, intensity),
              rotateDeg: scaled(cfg.rotate, intensity) * sign,
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
