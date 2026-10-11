import { impactVisualDelayForCameraShakeV1 } from "./dom-skill-fx.js";

// A presentation-only bridge between a resolved direct skill hit and the
// ensuing Runtime HP delta. Runtime remains the only owner of the actual HP.
export function createCombatImpactHealthCueSyncV1({ presentationForSkill }) {
  if (typeof presentationForSkill !== "function") {
    throw new TypeError("presentationForSkill must be a function");
  }
  let pending = [];

  function register(resolution) {
    if (!resolution?.ok || resolution.actionType !== "skill" ||
        resolution.persistentZoneOnly === true || resolution.outcome !== "hit") {
      return;
    }
    const skillId = resolution.skillId ??
      resolution.events?.find(item => item.type === "skill-arrive")?.skillId;
    if (!skillId) return;

    const presentation = presentationForSkill(skillId, {
      sourceActorId: resolution.actorId,
      sourceView: resolution.actorId,
      targetView: resolution.targetId,
      fxType: "impact"
    });
    const delayMs = impactVisualDelayForCameraShakeV1(
      presentation?.feedback?.cameraShake
    );
    if (delayMs <= 0) return;

    const hits = new Map();
    for (const event of resolution.events ?? []) {
      if (event.type !== "hit" || event.reflected === true ||
          !(Number(event.appliedDamage) > 0)) continue;
      const actorId = String(event.actorId ?? "");
      const amount = Number(event.appliedDamage);
      const hpAfter = Number(event.hpAfter);
      const hpBefore = Number(event.hpBefore);
      if (!actorId || ![amount, hpBefore, hpAfter].every(Number.isFinite)) continue;
      const previous = hits.get(actorId);
      if (previous && previous.hpAfter !== hpBefore) {
        // The hit chain is not contiguous: do not guess about other HP changes.
        hits.delete(actorId);
        continue;
      }
      hits.set(actorId, {
        actorId, kind: "damage", hpBefore: previous?.hpBefore ?? hpBefore,
        hpAfter, amount: (previous?.amount ?? 0) + amount, delayMs
      });
    }
    pending.push(...hits.values());
  }

  function delayFor(feedback) {
    if (feedback?.kind !== "damage") return 0;
    const index = pending.findIndex(cue =>
      cue.actorId === feedback.actorId &&
      cue.hpBefore === Number(feedback.hpBefore) &&
      cue.hpAfter === Number(feedback.hpAfter) &&
      cue.amount === Number(feedback.amount)
    );
    if (index < 0) return 0;
    const [cue] = pending.splice(index, 1);
    return cue.delayMs;
  }

  function clear() {
    pending = [];
  }

  return Object.freeze({ register, delayFor, clear });
}
