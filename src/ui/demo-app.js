import { normalizeCombatVisualEvent } from "../contracts/combat-visual-event.js";
import { normalizeVisualActor } from "../contracts/visual-actor.js";
import { planAnimation } from "../core/animation/plan-animation.js";
import { createProfileRegistry } from "../core/profiles/profile-registry.js";
import { createDomActorRenderer } from "../adapters/renderer/dom-actor-renderer.js";
import {
  createDomVisibleModelCollisionModel,
  watchVisibleModelContact
} from "../adapters/renderer/dom-visible-model-contact.js";
import { createDomCameraFxRenderer } from "../adapters/renderer/dom-camera-fx.js";
import { planLocomotionCueFx } from "../core/fx/locomotion-fx-plan.js";
import { globalVisualAssetUrl } from "../assets/global-visual-library.js";

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

export async function mountCombatDemo({
  root,
  fetchImpl = fetch,
  nativeVisualSource = null
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
          initialVisible: container.hidden !== true
        })
      ];
    })
  );
  const activeApproachBySlot = new Map();

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
    finalBoundaryMs
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
    { targetSlot = null } = {}
  ) {
    if (disposed) {
      return Promise.resolve({ status: "disposed" });
    }

    const slot = slotOf(slotKey);
    if (!slot.visible) {
      return Promise.resolve({ status: "hidden" });
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
        intensity: 1
      });

      const plan = planAnimation({
        event,
        actor: slot.actor,
        profile: profiles.get(slot.actor.profile)
      });

      const handle = slot.renderer.play(plan);

      return handle.finished.then((result) => {
        if (
          result?.status === "finished" &&
          !disposed &&
          !["idle", "ko"].includes(type) &&
          slot.visible
        ) {
          startIdleFor(slotKey);
        }
        return result;
      });
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
      onContact = null
    } = {}
  ) {
    if (disposed) {
      return Promise.resolve({ status: "disposed" });
    }

    if (!["ground", "teleport", "aerial"].includes(approachMode)) {
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
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const approachDepth =
      actorCenterY >= targetCenterY ? "front" : "behind";

    const visualType =
      approachMode === "ground"
        ? "ground-attack"
        : approachMode === "teleport"
          ? "teleport-attack"
          : "aerial-attack";

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
      finalBoundaryMs: planDurationMs
    });

    slot.setApproachActive(true, approachDepth);

    const handle = slot.renderer.play(plan);
    const contactWatcher =
      typeof onContact === "function"
        ? watchVisibleModelContact({
            sourceModel: slot.collisionModel,
            targetModel: target.collisionModel,
            continuous: approachMode !== "teleport",
            onContact
          })
        : null;
    const approachRecord = Object.freeze({
      handle,
      finished: handle.finished,
      contactWatcher
    });
    activeApproachBySlot.set(slotKey, approachRecord);

    const phaseTimers = [];
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

    return handle.finished
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
        slot.setApproachActive(false);
        for (const timerId of phaseTimers) {
          globalThis.clearTimeout(timerId);
        }
      });
  }

  function cancelFor(slotKey) {
    const slot = slotOf(slotKey);
    const activeApproach =
      activeApproachBySlot.get(slotKey) ?? null;
    activeApproach?.contactWatcher?.cancel();
    activeApproachBySlot.delete(slotKey);
    slot.setApproachActive(false);
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
    cancelFor,
    startIdleFor,
    setCreatureFor,
    setSlotVisible,
    getCreatureDescriptor,
    getFxAnchorFor(slotKey, anchorName = "head") {
      return slotOf(slotKey).getFxAnchor(anchorName);
    },
    getCollisionModelFor(slotKey) {
      return slotOf(slotKey).collisionModel;
    },
    getStatusPresentationTargetFor(slotKey) {
      const slot = slotOf(slotKey);
      return Object.freeze({
        motion: slot.motion,
        image: slot.image
      });
    },
    getCreatureFor(slotKey) {
      return slotOf(slotKey).meta.id;
    },
    get slotKeys() {
      return Object.freeze(Object.keys(slots));
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      activeApproachBySlot.clear();
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
  initialVisible = true
}) {
  const slotContainer =
    container ??
    requiredElement(root, `[data-demo-slot="${key}"]`);

  const motion = requiredElement(slotContainer, "[data-demo-motion]");
  const image = requiredElement(slotContainer, "[data-demo-image]");
  const label = requiredElement(slotContainer, "[data-demo-label]");
  const profileLabel = slotContainer.querySelector("[data-demo-profile]");
  const collisionModel =
    createDomVisibleModelCollisionModel({
      motion,
      image
    });

  let meta = null;
  let actor = null;
  let renderer = null;
  let visible = Boolean(initialVisible);
  let assetReady = false;
  let imageLoadToken = 0;

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

    const profilePresentation =
      profiles.get(actor.profile).presentation ?? {};
    const shadow = profilePresentation.shadow ?? {};
    const shadowBottomPct = Number(shadow.bottomPct);
    const shadowOpacity = Number(shadow.opacity);

    if (Number.isFinite(shadowBottomPct)) {
      slotContainer.style?.setProperty?.(
        "--creature-shadow-bottom",
        String(shadow.bottomPct) + "%"
      );
    } else {
      slotContainer.style?.removeProperty?.(
        "--creature-shadow-bottom"
      );
    }

    if (
      Number.isFinite(shadowOpacity) &&
      shadowOpacity >= 0 &&
      shadowOpacity <= 1
    ) {
      slotContainer.style?.setProperty?.(
        "--creature-shadow-opacity",
        String(shadow.opacity)
      );
    } else {
      slotContainer.style?.removeProperty?.(
        "--creature-shadow-opacity"
      );
    }

    renderer = createDomActorRenderer({
      element: motion,
      actor
    });
  }

  function loadRuntimeAsset(runtimeUrl) {
    const token = ++imageLoadToken;
    assetReady = false;
    collisionModel.clear();
    image.hidden = true;
    slotContainer.dataset.visibleCollisionReady = "false";
    image.removeAttribute("src");
    image.crossOrigin = "anonymous";

    const markReady = () => {
      if (token !== imageLoadToken) {
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

    loadRuntimeAsset(runtimeUrl);
    rebuildActor(runtimeUrl);
  }

  function setVisible(nextVisible) {
    visible = Boolean(nextVisible);
    slotContainer.hidden = !visible;
    image.hidden = !visible || !assetReady;
    if (!visible) {
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
    setCreature,
    setVisible,
    setApproachActive,
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
      collisionModel.dispose();
      image.removeAttribute("src");
    }
  };
}
