import { normalizeCombatVisualEvent } from "../contracts/combat-visual-event.js";
import { normalizeVisualActor } from "../contracts/visual-actor.js";
import { planAnimation } from "../core/animation/plan-animation.js";
import { createProfileRegistry } from "../core/profiles/profile-registry.js";
import { createDomActorRenderer } from "../adapters/renderer/dom-actor-renderer.js";
import { createDomCreatureMovementVisualV1 } from "../adapters/renderer/dom-creature-movement-visual-v1.js";
import {
  groundShadowLayoutFromOpaqueMaskV2
} from "../adapters/renderer/dom-ground-shadow-v2.js";
import {
  normalizeArenaShadowLightV1,
  projectArenaShadowLightV1,
  shadowSilhouetteUrlFromOpaqueMaskV1
} from "../adapters/renderer/dom-shadow-light-v1.js";
import {
  createDomVisibleModelCollisionModel,
  visibleModelOpaqueRect,
  watchVisibleModelContact
} from "../adapters/renderer/dom-visible-model-contact.js";
import { createDomCameraFxRenderer } from "../adapters/renderer/dom-camera-fx.js";
import {
  playDomCreatureDodgeFxV1
} from "../adapters/renderer/dom-creature-dodge-fx-v1.js";
import { planLocomotionCueFx } from "../core/fx/locomotion-fx-plan.js";
import { globalVisualAssetUrl } from "../assets/global-visual-library.js";

// Pure presentation choice: slot "player" sees the creature's back,
// slot "opponent" sees its front. V5 single-sprite authors retain fallback.
export function creatureMovementAppearanceForViewV1(meta, view) {
  if (!["player","opponent"].includes(view)) throw new RangeError("unknown creature view");
  return meta?.movementFxByView?.[view] ?? meta?.movementFx ?? null;
}

// Aerial and ground approaches share the existing movement-sprite owner.
export function creatureMovementAppearanceForApproachV1(meta, view, approachMode) {
  return approachMode === "ground" || approachMode === "aerial"
    ? creatureMovementAppearanceForViewV1(meta, view)
    : null;
}

export function creatureRangedAppearanceForViewV1(meta, view) {
  if (view === "player") return meta?.rangedAttackBackFx ?? meta?.rangedAttackFx ?? null;
  if (view === "opponent") return meta?.rangedAttackFx ?? null;
  throw new RangeError("unknown creature view");
}

const DATA_URLS = Object.freeze({
  profiles: Object.freeze({
    serpentine: new URL(
      "../../data/profiles/serpentine.profile.json",
      import.meta.url
    ),
    flying: new URL(
      "../../data/profiles/flying.profile.json",
      import.meta.url
    )
  }),
  creatures: Object.freeze({
    maraileron: globalVisualAssetUrl(
      "capture/creatures/maraileron/maraileron.meta.json"
    ),
    braisombre: globalVisualAssetUrl(
      "capture/creatures/braisombre/braisombre.meta.json"
    ),
    loupVolcanique: globalVisualAssetUrl(
      "capture/creatures/loup_volcanique/loup_volcanique.meta.json"
    ),
    golemMoussu: globalVisualAssetUrl(
      "capture/creatures/golem_moussu/golem_moussu.meta.json"
    )
  })
});

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchCreatureMeta(url, fetchImpl) {
  const meta = await fetchJson(url, fetchImpl);
  return Object.freeze({
    ...meta,
    assetBaseUrl: new URL(".", url).href
  });
}


export async function loadCombatDemoVisualSource({
  nativeVisualSource = null,
  fetchImpl = fetch
} = {}) {
  if (nativeVisualSource !== null) {
    if (
      !nativeVisualSource ||
      typeof nativeVisualSource !== "object" ||
      Array.isArray(nativeVisualSource)
    ) {
      throw new TypeError(
        "nativeVisualSource must be an object"
      );
    }
    if (!Array.isArray(nativeVisualSource.profiles)) {
      throw new TypeError(
        "nativeVisualSource.profiles must be an array"
      );
    }
    if (!Array.isArray(nativeVisualSource.creatureMetas)) {
      throw new TypeError(
        "nativeVisualSource.creatureMetas must be an array"
      );
    }

    return Object.freeze({
      profiles: Object.freeze([
        ...nativeVisualSource.profiles
      ]),
      creatureMetas: Object.freeze([
        ...nativeVisualSource.creatureMetas
      ])
    });
  }

  const [
    serpentine,
    flying,
    maraileron,
    braisombre,
    loupVolcanique,
    golemMoussu
  ] = await Promise.all([
    fetchJson(DATA_URLS.profiles.serpentine, fetchImpl),
    fetchJson(DATA_URLS.profiles.flying, fetchImpl),
    fetchCreatureMeta(DATA_URLS.creatures.maraileron, fetchImpl),
    fetchCreatureMeta(DATA_URLS.creatures.braisombre, fetchImpl),
    fetchCreatureMeta(DATA_URLS.creatures.loupVolcanique, fetchImpl),
    fetchCreatureMeta(DATA_URLS.creatures.golemMoussu, fetchImpl)
  ]);

  return Object.freeze({
    profiles: Object.freeze([
      serpentine,
      flying
    ]),
    creatureMetas: Object.freeze([
      maraileron,
      braisombre,
      loupVolcanique,
      golemMoussu
    ])
  });
}

function creatureAssetUrl(meta, relativePath) {
  const url = new URL(relativePath, meta.assetBaseUrl);
  if (meta.visualRevision) {
    url.searchParams.set("v", meta.visualRevision);
  }
  return url.href;
}

function requiredElement(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Demo element not found: ${selector}`);
  }
  return element;
}

// Stable ground-facing aim for a target whose model is temporarily flying.
// This is a visual geometry helper, not a second combat reach or damage owner.
export function restingTargetCenterForApproachV1(targetSlot) {
  const container = targetSlot.container;
  const rect = container.getBoundingClientRect();
  const nativeWidth = Number(container.offsetWidth);
  const scale =
    Number.isFinite(nativeWidth) && nativeWidth > 0
      ? rect.width / nativeWidth
      : 1;
  return Object.freeze({
    x: rect.left + rect.width / 2 +
      (Number(targetSlot.actor?.position?.x) || 0) * scale,
    y: rect.top + rect.height / 2 +
      (Number(targetSlot.actor?.position?.y) || 0) * scale
  });
}

export async function mountCombatDemo({
  root,
  fetchImpl = fetch,
  nativeVisualSource = null,
  initialArenaLight = null
}) {
  if (!root || typeof root.querySelector !== "function") {
    throw new TypeError("root must provide querySelector()");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetchImpl must be a function");
  }

  const visualSource =
    await loadCombatDemoVisualSource({
      nativeVisualSource,
      fetchImpl
    });

  const profiles = createProfileRegistry(
    visualSource.profiles
  );
  const creatureMetas = new Map(
    visualSource.creatureMetas.map((meta) => [
      meta.id,
      meta
    ])
  );

  if (creatureMetas.size === 0) {
    throw new RangeError(
      "combat visual source must contain at least one creature"
    );
  }

  const creatureIds = [...creatureMetas.keys()];
  const preferredCreatureId = (
    preferredId,
    fallbackIndex = 0
  ) =>
    creatureMetas.has(preferredId)
      ? preferredId
      : creatureIds[
          Math.min(
            fallbackIndex,
            creatureIds.length - 1
          )
        ];

  let disposed = false;
  const arena = requiredElement(root, "[data-combat-arena]");
  const cameraFx = createDomCameraFxRenderer({
    element: arena
  });
  const movementCueTimers = new Set();

  // One lighting state for the whole arena; each existing shadow slot
  // projects it using the collision-owned alpha of its current sprite.
  const lightControls = arena.querySelector?.("[data-shadow-light-controls]") ?? null;
  function readLightControls() {
    // The Capture Combat tab supplies its lighting at preview mount time.
    // Keep embedded controls for standalone lab fixtures and old integrations.
    if (!lightControls) return normalizeArenaShadowLightV1(initialArenaLight ?? {});
    const field = (name, fallback) =>
      lightControls?.querySelector?.("[data-shadow-light-" + name + "]")?.value ?? fallback;
    return normalizeArenaShadowLightV1({
      mode: field("mode", "silhouette"),
      azimuthDeg: field("azimuth", 50),
      elevationDeg: field("elevation", 48),
      softness: Number(field("softness", 50)) / 100,
      intensity: Number(field("intensity", 60)) / 100,
      flightHeightPx: field("flight-height", 38)
    });
  }
  let arenaLight = readLightControls();

  const slotElements =
    typeof root.querySelectorAll === "function"
      ? [...root.querySelectorAll("[data-demo-slot]")]
      : [
          requiredElement(root, '[data-demo-slot="player"]'),
          requiredElement(root, '[data-demo-slot="opponent"]')
        ];

  if (slotElements.length < 2) {
    throw new Error("Combat demo requires at least two visual slots");
  }

  const slots = Object.fromEntries(
    slotElements.map((container) => {
      const key = container.dataset?.demoSlot;
      if (!key) {
        throw new Error("data-demo-slot must define a slot key");
      }

      const view =
        container.dataset?.demoView ??
        (key.startsWith("opponent") ? "opponent" : "player");
      if (!["player", "opponent"].includes(view)) {
        throw new RangeError(`Unsupported demo view: ${view}`);
      }

      const defaultCreatureId =
        key === "player"
          ? preferredCreatureId("maraileron", 0)
          : key === "opponent"
            ? preferredCreatureId("braisombre", 1)
            : view === "player"
              ? preferredCreatureId("loup_volcanique", 0)
              : preferredCreatureId("golem_moussu", 1);
      const initialCreatureId =
        container.dataset?.demoCreature ?? defaultCreatureId;
      const initialMeta = creatureMetas.get(initialCreatureId);
      if (!initialMeta) {
        throw new RangeError(
          `Unknown initial demo creature: ${initialCreatureId}`
        );
      }

      return [
        key,
        createSlot({
          key,
          initialMeta,
          view,
          root,
          profiles,
          container,
          initialVisible: container.hidden !== true,
          getArenaLight: () => arenaLight
        })
      ];
    })
  );
  const onLightControlInput = () => {
    arenaLight = readLightControls();
    for (const slot of Object.values(slots)) slot.applyShadowLight(arenaLight);
  };
  lightControls?.addEventListener?.("input", onLightControlInput);
  lightControls?.addEventListener?.("change", onLightControlInput);

  const activeApproachBySlot = new Map();
  const activeDodgeFxBySlot = new Map();

  function slotOf(slotKey) {
    const slot = slots[slotKey];
    if (!slot) {
      throw new RangeError(`Unknown demo slot: ${slotKey}`);
    }
    return slot;
  }

  function defaultTargetFor(slot) {
    if (slot.key === "player" && slots.opponent) {
      return slots.opponent;
    }
    if (slot.key === "opponent" && slots.player) {
      return slots.player;
    }

    return (
      Object.values(slots).find(
        (candidate) =>
          candidate.key !== slot.key &&
          candidate.visible &&
          candidate.view !== slot.view
      ) ?? null
    );
  }

  function targetFor(slot, targetSlot = null) {
    if (targetSlot !== null) {
      return slotOf(targetSlot);
    }
    return defaultTargetFor(slot);
  }

  function cancelDodgeAppearanceFx(
    slotKey
  ) {
    const active =
      activeDodgeFxBySlot.get(slotKey) ??
      null;
    if (!active) {
      return false;
    }
    activeDodgeFxBySlot.delete(slotKey);
    active.cancel?.();
    return true;
  }

  function playDodgeAppearanceFx(
    slotKey,
    durationMs
  ) {
    const slot = slotOf(slotKey);
    const visual =
      slot.meta?.dodgeFx ?? null;

    cancelDodgeAppearanceFx(slotKey);

    if (
      visual === null ||
      !slot.visible
    ) {
      return Object.freeze({
        status: "ignored",
        finished: Promise.resolve({
          status: "ignored"
        }),
        cancel() {}
      });
    }

    const handle =
      playDomCreatureDodgeFxV1({
        arena,
        anchor: slot.motion,
        visual,
        durationMs
      });

    if (handle.status !== "running") {
      return handle;
    }

    activeDodgeFxBySlot.set(
      slotKey,
      handle
    );

    Promise.resolve(
      handle.finished
    )
      .finally(() => {
        if (
          activeDodgeFxBySlot.get(
            slotKey
          ) === handle
        ) {
          activeDodgeFxBySlot.delete(
            slotKey
          );
        }
      })
      .catch(() => {});

    return handle;
  }

  function startIdleFor(slotKey) {
    if (disposed) {
      return null;
    }

    const slot = slotOf(slotKey);
    if (!slot.visible) {
      return null;
    }

    const event = normalizeCombatVisualEvent({
      type: "idle",
      actorId: slot.actor.id,
      intensity: 1
    });
    const plan = planAnimation({
      event,
      actor: slot.actor,
      profile: profiles.get(slot.actor.profile)
    });
    return slot.renderer.play(plan);
  }

  function schedulePlanCues({
    slot,
    profile,
    plan,
    finalBoundaryMs,
    onCue = null
  }) {
    const emitCue = (cue) => {
      if (disposed || !slot.visible) {
        return;
      }
      for (const fxPlan of planLocomotionCueFx({
        profile,
        cue
      })) {
        cameraFx.play(fxPlan);
      }
      // The same Animation Core contact cue drives optional attack-step audio.
      // No second timing sequence is created.
      try { onCue?.(cue); } catch {}
    };

    const finalCues = [];
    const localTimers = [];

    for (const cue of plan.cues ?? []) {
      if (cue.atMs >= finalBoundaryMs) {
        finalCues.push(cue);
        continue;
      }

      const timerId = globalThis.setTimeout(() => {
        movementCueTimers.delete(timerId);
        emitCue(cue);
      }, cue.atMs);
      movementCueTimers.add(timerId);
      localTimers.push(timerId);
    }

    return Object.freeze({
      flushFinal() {
        for (const cue of finalCues) {
          emitCue(cue);
        }
      },
      clear() {
        for (const timerId of localTimers) {
          globalThis.clearTimeout(timerId);
          movementCueTimers.delete(timerId);
        }
      }
    });
  }

  function playMovementFor(slotKey) {
    if (disposed) {
      const durationMs = 0;
      return Object.freeze({
        status: "disposed",
        durationMs,
        finished: Promise.resolve({ status: "disposed" })
      });
    }

    const slot = slotOf(slotKey);
    if (!slot.visible) {
      const durationMs = 0;
      return Object.freeze({
        status: "hidden",
        durationMs,
        finished: Promise.resolve({ status: "hidden" })
      });
    }

    const profile = profiles.get(slot.actor.profile);
    const event = normalizeCombatVisualEvent({
      type: "move",
      actorId: slot.actor.id,
      intensity: 1
    });
    const plan = planAnimation({
      event,
      actor: slot.actor,
      profile
    });
    const durationMs = plan.segments.reduce(
      (sum, segment) => sum + segment.durationMs,
      0
    );

    const cueSchedule = schedulePlanCues({
      slot,
      profile,
      plan,
      finalBoundaryMs: durationMs
    });

    const movementAppearance = slot.playMovementAppearance(
      creatureMovementAppearanceForViewV1(slot.meta, slot.view),
      durationMs,
      slot.view === "player" ? 1 : -1
    );
    const handle = slot.renderer.play(plan);
    const finished = handle.finished
      .then((result) => {
        if (
          result?.status === "finished" &&
          !disposed &&
          slot.visible
        ) {
          cueSchedule.flushFinal();
          startIdleFor(slotKey);
        }
        return result;
      })
      .finally(() => {
        cueSchedule.clear();
        movementAppearance?.cancel?.();
      });

    return Object.freeze({
      status: "moving",
      durationMs,
      finished
    });
  }

  function playEventFor(
    slotKey,
    type,
    { targetSlot = null, metadata = {} } = {}
  ) {
    if (disposed) {
      return Promise.resolve({ status: "disposed" });
    }

    const slot = slotOf(slotKey);
    if (!slot.visible) {
      return Promise.resolve({ status: "hidden" });
    }

    if (type === "defense") {
      // Reuse the creature's own dodge FX sprite, but not Dodge's vanish
      // animation. Defense keeps the model visible and CombatDamage owns
      // the reduction; this branch is presentation-only.
      return Promise.resolve(
        playDodgeAppearanceFx(slotKey, metadata?.durationMs).finished
      );
    }

    const activeApproach = activeApproachBySlot.get(slotKey);
    if (type === "hit" && activeApproach) {
      return Promise.resolve(activeApproach.finished).then(
        (approachResult) => {
          if (
            disposed ||
            !slot.visible ||
            approachResult?.status !== "finished"
          ) {
            return approachResult ?? { status: "cancelled" };
          }
          return playEventFor(slotKey, type, { targetSlot });
        }
      );
    }

    const target =
      type === "attack"
        ? targetFor(slot, targetSlot)
        : null;

    try {
      const event = normalizeCombatVisualEvent({
        type,
        actorId: slot.actor.id,
        targetId:
          type === "attack" && target?.visible
            ? target.actor.id
            : null,
        intensity: 1,
        metadata
      });

      const plan = planAnimation({
        event,
        actor: slot.actor,
        profile: profiles.get(slot.actor.profile)
      });

      // The slot's real camera view chooses the pose. A V5 single-sprite
      // creature continues using its original rangedAttackFx for both sides.
      const rangedVisual = creatureRangedAppearanceForViewV1(slot.meta, slot.view);
      const rangedAppearance =
        type === "attack" &&
        metadata?.useRangedAppearance === true &&
        rangedVisual?.url
          ? slot.playMovementAppearance(
              rangedVisual,
              plan.segments.reduce((sum, segment) => sum + segment.durationMs, 0),
              slot.view === "player" ? 1 : -1
            )
          : null;

      const dodgeAppearance =
        type === "dodge"
          ? playDodgeAppearanceFx(
              slotKey,
              metadata?.durationMs
            )
          : null;

      let handle;
      try {
        handle = slot.renderer.play(plan);
      } catch (error) {
        dodgeAppearance?.cancel?.();
        rangedAppearance?.cancel?.();
        throw error;
      }

      return handle.finished.then((result) => {
        if (
          result?.status === "finished" &&
          !disposed &&
          !["idle", "ko", "recall"].includes(type) &&
          slot.visible
        ) {
          startIdleFor(slotKey);
        }
        return result;
      }).finally(() => rangedAppearance?.cancel?.());
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function playApproachFor(
    slotKey,
    approachMode,
    {
      travelMs,
      targetSlot = null,
      onPhase = null,
      onContact = null,
      onFootfall = null,
      holdOnContact = false
    } = {}
  ) {
    if (disposed) {
      return Promise.resolve({ status: "disposed" });
    }

    if (!["ground", "teleport", "aerial", "burrow"].includes(approachMode)) {
      return playEventFor(slotKey, "attack", {
        targetSlot
      });
    }

    if (
      onContact !== null &&
      typeof onContact !== "function"
    ) {
      throw new TypeError(
        "onContact must be a function when supplied"
      );
    }

    if (onFootfall !== null && typeof onFootfall !== "function") {
      throw new TypeError("onFootfall must be a function when supplied");
    }

    const slot = slotOf(slotKey);
    const target = targetFor(slot, targetSlot);
    if (!slot.visible || !target?.visible) {
      return Promise.resolve({ status: "hidden" });
    }

    const actorRect = slot.motion.getBoundingClientRect();
    const targetRect = target.motion.getBoundingClientRect();
    const arenaRect = arena.getBoundingClientRect();

    const actorCenterX = actorRect.left + actorRect.width / 2;
    const actorCenterY = actorRect.top + actorRect.height / 2;
    // Ground melee must never use the vertical translation of an opponent's
    // active aerial attack as its own destination. The live silhouettes
    // remain authoritative for deciding whether physical contact happens.
    const airborneTarget =
      approachMode === "ground" &&
      activeApproachBySlot.get(targetSlot)?.approachMode === "aerial";
    const targetAim = airborneTarget
      ? restingTargetCenterForApproachV1(target)
      : {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.top + targetRect.height / 2
        };
    const targetCenterX = targetAim.x;
    const targetCenterY = targetAim.y;
    const approachDepth =
      actorCenterY >= targetCenterY ? "front" : "behind";

    const visualType =
      approachMode === "ground"
        ? "ground-attack"
        : approachMode === "teleport"
          ? "teleport-attack"
          : approachMode === "aerial"
            ? "aerial-attack"
            : "burrow-attack";

    const arenaExitTranslateY =
      -(actorRect.bottom - arenaRect.top + 24);

    const event = normalizeCombatVisualEvent({
      type: visualType,
      actorId: slot.actor.id,
      targetId: target.actor.id,
      intensity: 1,
      metadata: {
        targetTranslateX: targetCenterX - actorCenterX,
        targetTranslateY: targetCenterY - actorCenterY,
        arenaHeight: arenaRect.height,
        arenaExitTranslateY,
        travelMs
      }
    });

    const profile = profiles.get(slot.actor.profile);
    const plan = planAnimation({
      event,
      actor: slot.actor,
      profile
    });
    const planDurationMs = plan.segments.reduce(
      (sum, segment) => sum + segment.durationMs,
      0
    );
    const cueSchedule = schedulePlanCues({
      slot,
      profile,
      plan,
      finalBoundaryMs: planDurationMs,
      onCue: onFootfall ? cue => {
        if (cue.type === "footfall") onFootfall(cue);
      } : null
    });

    slot.setApproachActive(true, approachDepth);

    const approachAppearance = creatureMovementAppearanceForApproachV1(
      slot.meta, slot.view, approachMode
    );
    const movementAppearance = approachAppearance
      ? slot.playMovementAppearance(
          approachAppearance,
          approachMode === "aerial" ? planDurationMs : travelMs,
          targetCenterX >= actorCenterX ? 1 : -1
        )
      : null;
    const handle = slot.renderer.play(plan);
    // Flight/gliding/teleport have no footfalls: one travel sound at takeoff.
    if (onFootfall && !(plan.cues ?? []).some(cue => cue.type === "footfall")) {
      try { onFootfall({ type: "movement", atMs: 0, intensity: 1 }); } catch {}
    }
    const phaseTimers = [];
    let contactReturnHandle = null;
    let contactStoppedOutbound = false;
    let heldAtContact = false;

    const contactWatcher =
      approachMode !== "burrow" &&
      typeof onContact === "function"
        ? watchVisibleModelContact({
            sourceModel: slot.collisionModel,
            targetModel: target.collisionModel,
            continuous: approachMode !== "teleport",
            onContact() {
              if (
                !contactStoppedOutbound &&
                approachMode !== "teleport" &&
                typeof slot.renderer.returnActiveToBaseFromCurrent === "function"
              ) {
                contactStoppedOutbound = true;
                cueSchedule.clear();
                for (const timerId of phaseTimers) {
                  globalThis.clearTimeout(timerId);
                }
                phaseTimers.length = 0;

                const paused = holdOnContact === true &&
                  typeof slot.renderer.pauseActive === "function" &&
                  slot.renderer.pauseActive();
                const contactResult = onContact();
                if (paused && contactResult?.outcome === "contact_held") {
                  heldAtContact = true;
                  contactWatcher?.cancel();
                } else {
                  contactReturnHandle =
                    slot.renderer.returnActiveToBaseFromCurrent();
                }
                return;
              }

              onContact();
            }
          })
        : null;

    const finished = handle.finished.then(async (result) => {
      if (contactReturnHandle) {
        return contactReturnHandle.finished;
      }
      return result;
    });

    const approachRecord = Object.freeze({
      handle,
      finished,
      contactWatcher,
      approachMode,
      releaseHold() {
        if (!heldAtContact || contactReturnHandle) return false;
        heldAtContact = false;
        contactReturnHandle =
          slot.renderer.returnActiveToBaseFromCurrent();
        return true;
      }
    });
    activeApproachBySlot.set(slotKey, approachRecord);

    let phaseAtMs = 0;

    if (typeof onPhase === "function") {
      for (const segment of plan.segments) {
        const payload = Object.freeze({
          label: segment.label,
          phaseDurationMs: segment.durationMs,
          atMs: phaseAtMs
        });

        if (phaseAtMs === 0) {
          try {
            onPhase(payload);
          } catch {}
        } else {
          const timerId = globalThis.setTimeout(() => {
            if (disposed || !slot.visible) {
              return;
            }
            try {
              onPhase(payload);
            } catch {}
          }, phaseAtMs);
          phaseTimers.push(timerId);
        }

        phaseAtMs += segment.durationMs;
      }
    }

    return finished
      .then((result) => {
        if (activeApproachBySlot.get(slotKey) === approachRecord) {
          activeApproachBySlot.delete(slotKey);
        }
        if (
          result?.status === "finished" &&
          !disposed &&
          slot.visible
        ) {
          cueSchedule.flushFinal();
          startIdleFor(slotKey);
        }
        return result;
      })
      .finally(() => {
        contactWatcher?.cancel();
        cueSchedule.clear();
        if (activeApproachBySlot.get(slotKey) === approachRecord) {
          activeApproachBySlot.delete(slotKey);
        }
        movementAppearance?.cancel?.();
        slot.setApproachActive(false);
        for (const timerId of phaseTimers) {
          globalThis.clearTimeout(timerId);
        }
      });
  }

  function releaseHeldApproachFor(slotKey) {
    const active = activeApproachBySlot.get(slotKey);
    return active?.releaseHold?.() === true;
  }

  function cancelFor(slotKey) {
    const slot = slotOf(slotKey);
    const activeApproach =
      activeApproachBySlot.get(slotKey) ?? null;
    activeApproach?.contactWatcher?.cancel();
    activeApproachBySlot.delete(slotKey);
    cancelDodgeAppearanceFx(slotKey);
    slot.setApproachActive(false);
    slot.cancelMovementAppearance();
    slot.renderer.cancel();
    if (slot.visible) {
      startIdleFor(slotKey);
    }
  }

  function setCreatureFor(
    slotKey,
    creatureId,
    { displayName = null } = {}
  ) {
    if (disposed) {
      throw new Error("combat visual controller has been disposed");
    }

    const meta = creatureMetas.get(creatureId);
    if (!meta) {
      throw new RangeError(`Unknown demo creature: ${creatureId}`);
    }

    const slot = slotOf(slotKey);
    cancelDodgeAppearanceFx(slotKey);
    slot.setCreature(meta, displayName);
    slot.setVisible(true);
    startIdleFor(slotKey);

    return Object.freeze({
      slotKey,
      creatureId,
      displayName: displayName ?? meta.name,
      profile: meta.profile
    });
  }

  function setSlotVisible(slotKey, visible) {
    const slot = slotOf(slotKey);
    if (!visible) {
      cancelDodgeAppearanceFx(slotKey);
    }
    slot.setVisible(Boolean(visible));
    if (slot.visible) {
      startIdleFor(slotKey);
    }
  }

  function getCreatureDescriptor(creatureId) {
    const meta = creatureMetas.get(creatureId);
    if (!meta) {
      throw new RangeError(`Unknown demo creature: ${creatureId}`);
    }
    const iconAsset =
      meta.runtimePreview?.icon ?? meta.views.icon;
    return Object.freeze({
      id: meta.id,
      name: meta.name,
      profile: meta.profile,
      iconUrl: creatureAssetUrl(meta, iconAsset)
    });
  }

  for (const slotKey of Object.keys(slots)) {
    startIdleFor(slotKey);
  }

  return Object.freeze({
    playEventFor,
    playMovementFor,
    playApproachFor,
    releaseHeldApproachFor,
    cancelFor,
    startIdleFor,
    setCreatureFor,
    setSlotVisible,
    getCreatureDescriptor,
    playCameraFx(plan) {
      return cameraFx.play(plan);
    },
    getFxAnchorFor(slotKey, anchorName = "head") {
      return slotOf(slotKey).getFxAnchor(anchorName);
    },
    getCollisionModelFor(slotKey) {
      return slotOf(slotKey).collisionModel;
    },
    getVisibleTargetRectFor(slotKey) {
      const frame =
        slotOf(slotKey).collisionModel.snapshot();
      return visibleModelOpaqueRect(frame);
    },
    // Actor profile alone owns its base placement. The FX renderer uses
    // this resting offset without following transient flight/burrow motion.
    getRestingOffsetFor(slotKey) {
      const position = slotOf(slotKey).actor?.position;
      return Object.freeze({
        x: Number(position?.x) || 0,
        y: Number(position?.y) || 0
      });
    },
    getStatusPresentationTargetFor(slotKey) {
      const slot = slotOf(slotKey);
      const tinted = slot.getMovementTintTarget();
      return Object.freeze({
        motion: slot.motion,
        image: slot.image,
        tintHost: tinted.host,
        tintMaskUrl: tinted.maskUrl
      });
    },
    getCreatureFor(slotKey) {
      return slotOf(slotKey).meta.id;
    },
    getCreatureAudioFor(slotKey) {
      return slotOf(slotKey).meta.audio ?? null;
    },
    get slotKeys() {
      return Object.freeze(Object.keys(slots));
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      lightControls?.removeEventListener?.("input", onLightControlInput);
      lightControls?.removeEventListener?.("change", onLightControlInput);
      activeApproachBySlot.clear();
      for (
        const handle of
        activeDodgeFxBySlot.values()
      ) {
        handle.cancel?.();
      }
      activeDodgeFxBySlot.clear();
      for (const timerId of movementCueTimers) {
        globalThis.clearTimeout(timerId);
      }
      movementCueTimers.clear();
      cameraFx.dispose();
      for (const slot of Object.values(slots)) {
        slot.dispose();
      }
    }
  });
}

function createSlot({
  key,
  initialMeta,
  view,
  root,
  profiles,
  container = null,
  initialVisible = true,
  getArenaLight = () => normalizeArenaShadowLightV1()
}) {
  const slotContainer =
    container ??
    requiredElement(root, `[data-demo-slot="${key}"]`);

  const shadowElement =
    requiredElement(
      slotContainer,
      "[data-demo-shadow]"
    );
  const motion = requiredElement(slotContainer, "[data-demo-motion]");
  const image = requiredElement(slotContainer, "[data-demo-image]");
  const label = requiredElement(slotContainer, "[data-demo-label]");
  const profileLabel = slotContainer.querySelector("[data-demo-profile]");
  const collisionModel =
    createDomVisibleModelCollisionModel({
      motion,
      image
    });
  const movementAppearance = createDomCreatureMovementVisualV1({
    motion, image, collisionModel
  });

  let meta = null;
  let actor = null;
  let renderer = null;
  let visible = Boolean(initialVisible);
  let assetReady = false;
  let imageLoadToken = 0;
  let lastShadowLayout = null;
  let silhouetteMaskUrl = null;

  function applyShadowLight(light = getArenaLight()) {
    if (!lastShadowLayout) return;
    const settings = normalizeArenaShadowLightV1(light);
    const profile = profiles.get(actor.profile);
    const flying = profile?.locomotion?.style === "flight" || actor.profile === "flying";
    const projection = projectArenaShadowLightV1(settings, { flying });
    const projected = settings.mode === "silhouette" && silhouetteMaskUrl !== null;
    const resolvedMode = projected ? "silhouette" : settings.mode === "silhouette" ? "soft" : settings.mode;
    shadowElement.dataset.shadowMode = resolvedMode;
    shadowElement.style.width = projected ? "100%" : lastShadowLayout.widthPct.toFixed(2) + "%";
    // The model paints into the motion's square image frame. An absolute
    // 100% HEIGHT shadow instead measures the taller fighter container,
    // detaching the shadow from scaled player sprites (e.g. 1.7x).
    // In projected mode CSS aspect-ratio copies the same square image frame.
    shadowElement.style.height = projected ? "auto" : lastShadowLayout.heightPct.toFixed(2) + "%";
    shadowElement.style.filter = projected ? "none" : "blur(" + projection.blurPx.toFixed(2) + "px)";
    slotContainer.style?.setProperty?.("--creature-shadow-left", (projected ? 50 : lastShadowLayout.centerXPct).toFixed(2) + "%");
    // The small ellipse's bottom offset is not the full alpha canvas origin.
    // Preserve the real sprite-frame alignment and pivot on its ground contact.
    slotContainer.style?.setProperty?.("--creature-shadow-bottom", (projected ? 0 : lastShadowLayout.bottomPct).toFixed(2) + "%");
    slotContainer.style?.setProperty?.("--shadow-light-foot-x", lastShadowLayout.contactXPct.toFixed(2) + "%");
    slotContainer.style?.setProperty?.("--shadow-light-foot-y", (lastShadowLayout.contactYPct ?? (100 - lastShadowLayout.bottomPct - lastShadowLayout.heightPct / 2)).toFixed(2) + "%");
    slotContainer.style?.setProperty?.("--creature-shadow-opacity", String(settings.mode === "contact" ? lastShadowLayout.opacity : projection.opacity));
    slotContainer.style?.setProperty?.("--shadow-light-cast-x", projection.castXPct.toFixed(2) + "%");
    slotContainer.style?.setProperty?.("--shadow-light-cast-y", projection.castYPct.toFixed(2) + "%");
    slotContainer.style?.setProperty?.("--shadow-light-skew", projection.skewDeg.toFixed(2) + "deg");
    slotContainer.style?.setProperty?.("--shadow-light-flatten", String(projection.flatten));
    slotContainer.style?.setProperty?.("--shadow-light-blur", projection.blurPx.toFixed(2) + "px");
    slotContainer.style?.setProperty?.("--shadow-light-mask", silhouetteMaskUrl ?? "none");
  }

  function rebuildActor(asset) {
    renderer?.dispose();

    actor = normalizeVisualActor({
      id: `${meta.id}-${key}`,
      creatureId: meta.id,
      profile: meta.profile,
      asset,
      view,
      scale: meta.displayScale?.[view] ?? meta.scale ?? 1,
      position: meta.offsetByView?.[view] ?? meta.offset ?? { x: 0, y: 0 },
      transformOrigin:
        meta.transformOrigin ?? { x: "50%", y: "50%" }
    });

    slotContainer.style?.setProperty?.(
      "--creature-display-scale",
      String(actor.scale)
    );

    // Ground shadow layout is set once, from the accepted resting image.
    // The profile must not independently overwrite contact position.

    renderer = createDomActorRenderer({
      element: motion,
      shadowElement,
      actor
    });
  }

  function loadRuntimeAsset(runtimeUrl) {
    const token = ++imageLoadToken;
    assetReady = false;
    collisionModel.clear();
    lastShadowLayout = null;
    silhouetteMaskUrl = null;
    image.hidden = true;
    shadowElement.style.visibility = "hidden";
    slotContainer.dataset.visibleCollisionReady = "false";
    image.removeAttribute("src");
    image.crossOrigin = "anonymous";

    let settled = false;
    const markReady = () => {
      if (token !== imageLoadToken || settled) {
        return;
      }

      const collisionReady =
        collisionModel.refreshFromImage();
      if (!collisionReady) {
        assetReady = false;
        image.hidden = true;
        slotContainer.dataset.visibleCollisionReady = "false";
        return;
      }

      // The collision mask is already available after refreshFromImage().
      // A DOM snapshot can still be null when this arena is initially
      // hidden: ground-shadow layout must not depend on screen geometry.
      const opaqueMask = collisionModel.opaqueMask;
      if (!opaqueMask) return;
      const profileShadow =
        profiles.get(actor.profile).presentation?.shadow ?? {};
      const layout = groundShadowLayoutFromOpaqueMaskV2(
        opaqueMask, profileShadow
      );
      lastShadowLayout = layout;
      silhouetteMaskUrl = shadowSilhouetteUrlFromOpaqueMaskV1(opaqueMask);
      shadowElement.dataset.shadowFootprint = layout.opaqueWidthRatio.toFixed(3);
      applyShadowLight();
      settled = true;
      shadowElement.style.visibility = "visible";
      assetReady = true;
      slotContainer.dataset.visibleCollisionReady = "true";
      image.hidden = !visible;
    };

    image.addEventListener("load", markReady, {
      once: true
    });
    image.src = runtimeUrl;

    if (image.complete && image.naturalWidth > 0) {
      markReady();
    }
  }

  function setCreature(nextMeta, displayName = null) {
    if (!profiles.has(nextMeta.profile)) {
      throw new Error(
        `Unknown profile ${nextMeta.profile} for ${nextMeta.id}`
      );
    }

    meta = nextMeta;
    label.textContent = displayName ?? meta.name;
    if (profileLabel) {
      profileLabel.textContent = meta.profile;
    }

    const runtimeAsset =
      meta.runtimePreview?.[view] ?? meta.views[view];
    const runtimeUrl = creatureAssetUrl(
      meta,
      runtimeAsset
    );

    movementAppearance.prepare(
      creatureMovementAppearanceForViewV1(meta, view),
      runtimeUrl,
      meta.rangedAttackFx ?? null,
      meta.rangedAttackBackFx ?? null
    );
    // The actor/profile must exist before a cached image may fire onload.
    // A late callback from an older sprite cannot become a second owner.
    rebuildActor(runtimeUrl);
    loadRuntimeAsset(runtimeUrl);
  }

  function setVisible(nextVisible) {
    visible = Boolean(nextVisible);
    slotContainer.hidden = !visible;
    image.hidden = !visible || !assetReady;
    if (!visible) {
      movementAppearance.cancel();
      slotContainer.removeAttribute("data-approach-active");
      slotContainer.removeAttribute("data-approach-depth");
      renderer?.cancel();
    }
  }

  function setApproachActive(active, depth = null) {
    if (active) {
      slotContainer.dataset.approachActive = "true";
      slotContainer.dataset.approachDepth =
        depth === "front" ? "front" : "behind";
    } else {
      slotContainer.removeAttribute("data-approach-active");
      slotContainer.removeAttribute("data-approach-depth");
    }
  }

  function getFxAnchor(anchorName = "head") {
    const anchorsForView = meta.fxAnchors?.[view] ?? {};
    const point =
      anchorsForView[anchorName] ??
      anchorsForView.head ??
      { x: 0.5, y: 0.5 };

    const rect = motion.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, Number(point.x) || 0));
    const y = Math.min(1, Math.max(0, Number(point.y) || 0));

    return Object.freeze({
      left: rect.left + rect.width * x,
      top: rect.top + rect.height * y,
      width: 0,
      height: 0
    });
  }

  setCreature(initialMeta);
  setVisible(initialVisible);

  return {
    key,
    view,
    image,
    motion,
    shadowElement,
    container: slotContainer,
    setCreature,
    setVisible,
    setApproachActive,
    applyShadowLight,
    playMovementAppearance: movementAppearance.play,
    cancelMovementAppearance: movementAppearance.cancel,
    getMovementTintTarget: movementAppearance.tintTarget,
    getFxAnchor,
    collisionModel,
    get meta() {
      return meta;
    },
    get actor() {
      return actor;
    },
    get renderer() {
      return renderer;
    },
    get visible() {
      return visible;
    },
    dispose() {
      slotContainer.removeAttribute("data-approach-active");
      slotContainer.removeAttribute("data-approach-depth");
      renderer?.dispose();
      movementAppearance.dispose();
      collisionModel.dispose();
      image.removeAttribute("src");
    }
  };
}
