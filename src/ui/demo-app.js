import { normalizeCombatVisualEvent } from "../contracts/combat-visual-event.js";
import { normalizeVisualActor } from "../contracts/visual-actor.js";
import { planAnimation } from "../core/animation/plan-animation.js";
import { createProfileRegistry } from "../core/profiles/profile-registry.js";
import { createDomActorRenderer } from "../adapters/renderer/dom-actor-renderer.js";
import { createImageSourceManager } from "../assets/image-source-manager.js";

const DATA_URLS = Object.freeze({
  profiles: Object.freeze({
    serpentine: new URL("../../data/profiles/serpentine.profile.json", import.meta.url),
    drake: new URL("../../data/profiles/drake.profile.json", import.meta.url)
  }),
  creatures: Object.freeze({
    maraileron: new URL(
      "../../assets/test/creatures/maraileron/maraileron.meta.json",
      import.meta.url
    ),
    braisombre: new URL(
      "../../assets/test/creatures/braisombre/braisombre.meta.json",
      import.meta.url
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

function requiredElement(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Demo element not found: ${selector}`);
  }
  return element;
}

export async function mountCombatDemo({
  root,
  fetchImpl = fetch
}) {
  if (!root || typeof root.querySelector !== "function") {
    throw new TypeError("root must provide querySelector()");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetchImpl must be a function");
  }

  const [
    serpentine,
    drake,
    maraileron,
    braisombre
  ] = await Promise.all([
    fetchJson(DATA_URLS.profiles.serpentine, fetchImpl),
    fetchJson(DATA_URLS.profiles.drake, fetchImpl),
    fetchCreatureMeta(DATA_URLS.creatures.maraileron, fetchImpl),
    fetchCreatureMeta(DATA_URLS.creatures.braisombre, fetchImpl)
  ]);

  const profiles = createProfileRegistry([serpentine, drake]);
  const status = requiredElement(root, "[data-demo-status]");
  const targetSelect = requiredElement(root, "[data-demo-target]");
  const intensityInput = requiredElement(root, "[data-demo-intensity]");
  const intensityValue = requiredElement(root, "[data-demo-intensity-value]");
  const stopButton = requiredElement(root, "[data-demo-stop]");

  let disposed = false;
  const cleanups = [];

  const bundledCreatures = Object.freeze({
    maraileron,
    braisombre
  });

  const slots = {
    player: createSlot({
      key: "player",
      meta: maraileron,
      view: "player",
      root,
      profiles
    }),
    opponent: createSlot({
      key: "opponent",
      meta: braisombre,
      view: "opponent",
      root,
      profiles
    })
  };

  function listen(element, type, handler) {
    element.addEventListener(type, handler);
    cleanups.push(() => element.removeEventListener(type, handler));
  }

  function selectedSlot() {
    return slots[targetSelect.value] ?? slots.player;
  }

  function otherSlot(slot) {
    return slot.key === "player" ? slots.opponent : slots.player;
  }

  function setStatus(message, state = "info") {
    status.textContent = message;
    status.dataset.state = state;
  }

  function startIdleFor(slotKey) {
    if (disposed) {
      return null;
    }
    const slot = slots[slotKey];
    if (!slot) {
      throw new RangeError(`Unknown demo slot: ${slotKey}`);
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

  function playEventFor(slotKey, type) {
    if (disposed) {
      return Promise.resolve({ status: "disposed" });
    }

    const slot = slots[slotKey];
    if (!slot) {
      return Promise.reject(new RangeError(`Unknown demo slot: ${slotKey}`));
    }
    const target = otherSlot(slot);
    const intensity = Number(intensityInput.value);

    try {
      const event = normalizeCombatVisualEvent({
        type,
        actorId: slot.actor.id,
        targetId: type === "attack" ? target.actor.id : null,
        intensity
      });

      const plan = planAnimation({
        event,
        actor: slot.actor,
        profile: profiles.get(slot.actor.profile)
      });

      const handle = slot.renderer.play(plan);

      if (type !== "idle") {
        setStatus(
          `${slot.meta.name} — ${type} × ${intensity.toFixed(2)}`,
          "running"
        );
      }

      return handle.finished.then((result) => {
        if (!disposed && type !== "idle") {
          startIdleFor(slotKey);
          if (result.status !== "running") {
            setStatus(
              `${slot.meta.name} — ${result.status}`,
              result.status === "finished" ? "ok" : "info"
            );
          }
        }
        return result;
      });
    } catch (error) {
      setStatus(error.message, "error");
      return Promise.reject(error);
    }
  }

  function playEvent(type) {
    return playEventFor(selectedSlot().key, type);
  }

  function cancelFor(slotKey) {
    const slot = slots[slotKey];
    if (!slot) {
      throw new RangeError(`Unknown demo slot: ${slotKey}`);
    }
    slot.renderer.cancel();
    startIdleFor(slotKey);
  }

  function setSlotEmpty(slotKey) {
    const slot = slots[slotKey];
    if (!slot) {
      throw new RangeError(`Unknown demo slot: ${slotKey}`);
    }
    slot.renderer.cancel();
    slot.setEmpty();
  }

  function loadBundledCreature(slotKey, creatureId, view = null) {
    const slot = slots[slotKey];
    const meta = bundledCreatures[creatureId];
    if (!slot) {
      throw new RangeError(`Unknown demo slot: ${slotKey}`);
    }
    if (!meta) {
      throw new RangeError(`Unknown bundled creature: ${creatureId}`);
    }

    slot.loadMeta(meta, view ?? slot.view);
    startIdleFor(slotKey);
    return Object.freeze({
      slotKey,
      creatureId: meta.id,
      name: meta.name
    });
  }

  for (const button of root.querySelectorAll("[data-demo-event]")) {
    listen(button, "click", () => {
      playEvent(button.dataset.demoEvent).catch(() => {});
    });
  }

  listen(stopButton, "click", () => {
    const slot = selectedSlot();
    slot.renderer.cancel();
    setStatus(`${slot.meta.name} — animation arrêtée`, "info");
  });

  listen(intensityInput, "input", () => {
    intensityValue.textContent = Number(intensityInput.value).toFixed(2);
  });

  for (const slot of Object.values(slots)) {
    if (!slot.fileInput) {
      continue;
    }
    listen(slot.fileInput, "change", () => {
      const [file] = slot.fileInput.files ?? [];
      if (!file) {
        return;
      }

      try {
        const url = slot.sourceManager.load(file);
        slot.image.src = url;
        slot.rebuildActor(url);
        setStatus(`${slot.meta.name} — image temporaire chargée`, "ok");
      } catch (error) {
        setStatus(error.message, "error");
      }
    });
  }

  startIdleFor("player");
  startIdleFor("opponent");

  setStatus(
    "Démo prête — Maraileron et Braisombre restent en idle par défaut.",
    "ok"
  );

  return Object.freeze({
    playEvent,
    playEventFor,
    cancelFor,
    startIdleFor,
    setSlotEmpty,
    loadBundledCreature,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      for (const cleanup of cleanups.splice(0)) {
        cleanup();
      }
      for (const slot of Object.values(slots)) {
        slot.dispose();
      }
    }
  });
}

function createSlot({
  key,
  meta,
  view,
  root,
  profiles
}) {
  let currentMeta = meta;
  let currentView = view;

  if (!profiles.has(currentMeta.profile)) {
    throw new Error(
      `Unknown profile ${currentMeta.profile} for ${currentMeta.id}`
    );
  }

  const container = requiredElement(root, `[data-demo-slot="${key}"]`);
  const motion = requiredElement(container, "[data-demo-motion]");
  const image = requiredElement(container, "[data-demo-image]");
  const fileInput = root.querySelector(`[data-demo-file="${key}"]`);
  const label = requiredElement(container, "[data-demo-label]");
  const profileLabel = requiredElement(container, "[data-demo-profile]");

  label.textContent = currentMeta.name;
  profileLabel.textContent = currentMeta.profile;

  function runtimeUrlFor(nextMeta, nextView) {
    const runtimeAsset =
      nextMeta.runtimePreview?.[nextView] ?? nextMeta.views[nextView];
    return new URL(runtimeAsset, nextMeta.assetBaseUrl).href;
  }

  let runtimeUrl = runtimeUrlFor(currentMeta, currentView);

  image.src = runtimeUrl;
  image.hidden = false;
  motion.hidden = false;

  const sourceManager = createImageSourceManager();
  let actor = null;
  let renderer = null;

  function rebuildActor(asset) {
    if (renderer) {
      renderer.dispose();
    }

    actor = normalizeVisualActor({
      id: `${currentMeta.id}-${key}`,
      creatureId: currentMeta.id,
      profile: currentMeta.profile,
      asset,
      view: currentView,
      scale:
        currentMeta.displayScale?.[currentView] ??
        currentMeta.scale ??
        1,
      position: currentMeta.offset ?? { x: 0, y: 0 },
      transformOrigin:
        currentMeta.transformOrigin ?? { x: "50%", y: "50%" }
    });

    renderer = createDomActorRenderer({
      element: motion,
      actor
    });
  }

  function loadMeta(nextMeta, nextView = currentView) {
    if (!profiles.has(nextMeta.profile)) {
      throw new Error(
        `Unknown profile ${nextMeta.profile} for ${nextMeta.id}`
      );
    }

    currentMeta = nextMeta;
    currentView = nextView;
    runtimeUrl = runtimeUrlFor(currentMeta, currentView);

    label.textContent = currentMeta.name;
    profileLabel.textContent = currentMeta.profile;
    image.src = runtimeUrl;
    image.hidden = false;
    motion.hidden = false;
    rebuildActor(runtimeUrl);
  }

  function setEmpty() {
    motion.hidden = true;
    image.hidden = true;
    label.textContent = "Aucun monstre";
    profileLabel.textContent = "";
  }

  rebuildActor(runtimeUrl);

  return {
    key,
    image,
    fileInput,
    sourceManager,
    rebuildActor,
    loadMeta,
    setEmpty,
    get meta() {
      return currentMeta;
    },
    get view() {
      return currentView;
    },
    get actor() {
      return actor;
    },
    get renderer() {
      return renderer;
    },
    dispose() {
      renderer?.dispose();
      sourceManager.dispose();
      image.removeAttribute("src");
    }
  };
}
