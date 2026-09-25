import { normalizeCombatVisualEvent } from "../contracts/combat-visual-event.js";
import { normalizeVisualActor } from "../contracts/visual-actor.js";
import { planAnimation } from "../core/animation/plan-animation.js";
import { createProfileRegistry } from "../core/profiles/profile-registry.js";
import { createDomActorRenderer } from "../adapters/renderer/dom-actor-renderer.js";

const DATA_URLS = Object.freeze({
  profiles: Object.freeze({
    serpentine: new URL(
      "../../data/profiles/serpentine.profile.json",
      import.meta.url
    ),
    drake: new URL(
      "../../data/profiles/drake.profile.json",
      import.meta.url
    )
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
  const creatureMetas = new Map([
    [maraileron.id, maraileron],
    [braisombre.id, braisombre]
  ]);

  let disposed = false;

  const slots = {
    player: createSlot({
      key: "player",
      initialMeta: maraileron,
      view: "player",
      root,
      profiles
    }),
    opponent: createSlot({
      key: "opponent",
      initialMeta: braisombre,
      view: "opponent",
      root,
      profiles
    })
  };

  function slotOf(slotKey) {
    const slot = slots[slotKey];
    if (!slot) {
      throw new RangeError(`Unknown demo slot: ${slotKey}`);
    }
    return slot;
  }

  function otherSlot(slot) {
    return slot.key === "player" ? slots.opponent : slots.player;
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

  function playEventFor(slotKey, type) {
    if (disposed) {
      return Promise.resolve({ status: "disposed" });
    }

    const slot = slotOf(slotKey);
    if (!slot.visible) {
      return Promise.resolve({ status: "hidden" });
    }

    const target = otherSlot(slot);

    try {
      const event = normalizeCombatVisualEvent({
        type,
        actorId: slot.actor.id,
        targetId:
          type === "attack" && target.visible
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
        if (!disposed && type !== "idle" && slot.visible) {
          startIdleFor(slotKey);
        }
        return result;
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function cancelFor(slotKey) {
    const slot = slotOf(slotKey);
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
      iconUrl: new URL(iconAsset, meta.assetBaseUrl).href
    });
  }

  startIdleFor("player");
  startIdleFor("opponent");

  return Object.freeze({
    playEventFor,
    cancelFor,
    startIdleFor,
    setCreatureFor,
    setSlotVisible,
    getCreatureDescriptor,
    getCreatureFor(slotKey) {
      return slotOf(slotKey).meta.id;
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
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
  profiles
}) {
  const container = requiredElement(root, `[data-demo-slot="${key}"]`);
  const motion = requiredElement(container, "[data-demo-motion]");
  const image = requiredElement(container, "[data-demo-image]");
  const label = requiredElement(container, "[data-demo-label]");
  const profileLabel = container.querySelector("[data-demo-profile]");

  let meta = null;
  let actor = null;
  let renderer = null;
  let visible = true;

  function rebuildActor(asset) {
    renderer?.dispose();

    actor = normalizeVisualActor({
      id: `${meta.id}-${key}`,
      creatureId: meta.id,
      profile: meta.profile,
      asset,
      view,
      scale: meta.displayScale?.[view] ?? meta.scale ?? 1,
      position: meta.offset ?? { x: 0, y: 0 },
      transformOrigin:
        meta.transformOrigin ?? { x: "50%", y: "50%" }
    });

    renderer = createDomActorRenderer({
      element: motion,
      actor
    });
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
    const runtimeUrl = new URL(
      runtimeAsset,
      meta.assetBaseUrl
    ).href;

    image.src = runtimeUrl;
    image.hidden = false;
    rebuildActor(runtimeUrl);
  }

  function setVisible(nextVisible) {
    visible = Boolean(nextVisible);
    container.hidden = !visible;
    if (!visible) {
      renderer?.cancel();
    }
  }

  setCreature(initialMeta);

  return {
    key,
    view,
    image,
    setCreature,
    setVisible,
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
      renderer?.dispose();
      image.removeAttribute("src");
    }
  };
}
