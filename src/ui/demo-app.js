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

  async function playEvent(type) {
    if (disposed) {
      return;
    }

    const slot = selectedSlot();
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
      setStatus(
        `${slot.meta.name} — ${type} × ${intensity.toFixed(2)}`,
        "running"
      );

      handle.finished.then((result) => {
        if (!disposed && result.status !== "running") {
          setStatus(
            `${slot.meta.name} — ${result.status}`,
            result.status === "finished" ? "ok" : "info"
          );
        }
      });
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  for (const button of root.querySelectorAll("[data-demo-event]")) {
    listen(button, "click", () => playEvent(button.dataset.demoEvent));
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

  setStatus(
    "Démo prête — Maraileron et Braisombre sont chargés automatiquement.",
    "ok"
  );

  return Object.freeze({
    playEvent,
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
  if (!profiles.has(meta.profile)) {
    throw new Error(`Unknown profile ${meta.profile} for ${meta.id}`);
  }

  const container = requiredElement(root, `[data-demo-slot="${key}"]`);
  const motion = requiredElement(container, "[data-demo-motion]");
  const image = requiredElement(container, "[data-demo-image]");
  const fileInput = requiredElement(container, "[data-demo-file]");
  const label = requiredElement(container, "[data-demo-label]");
  const profileLabel = requiredElement(container, "[data-demo-profile]");

  label.textContent = meta.name;
  profileLabel.textContent = meta.profile;

  const runtimeAsset = meta.runtimePreview?.[view] ?? meta.views[view];
  const runtimeUrl = new URL(runtimeAsset, meta.assetBaseUrl).href;

  image.src = runtimeUrl;
  image.hidden = false;

  const sourceManager = createImageSourceManager();
  let actor = null;
  let renderer = null;

  function rebuildActor(asset) {
    if (renderer) {
      renderer.dispose();
    }

    actor = normalizeVisualActor({
      id: `${meta.id}-${key}`,
      creatureId: meta.id,
      profile: meta.profile,
      asset,
      view,
      scale: meta.displayScale?.[view] ?? meta.scale ?? 1,
      position: meta.offset ?? { x: 0, y: 0 },
      transformOrigin: meta.transformOrigin ?? { x: "50%", y: "50%" }
    });

    renderer = createDomActorRenderer({
      element: motion,
      actor
    });
  }

  rebuildActor(runtimeUrl);

  return {
    key,
    meta,
    view,
    image,
    fileInput,
    sourceManager,
    rebuildActor,
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
