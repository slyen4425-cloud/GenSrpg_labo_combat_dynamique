import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  createCombatRuntime
} from "../../src/core/combat/combat-runtime.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

const rect = (left, top, width, height) => ({
  left,
  top,
  width,
  height
});

function node(bounds) {
  return {
    className: "",
    dataset: {},
    style: {},
    children: [],
    ownerDocument: null,
    append(child) {
      this.children.push(child);
    },
    remove() {},
    getBoundingClientRect() {
      return bounds;
    }
  };
}

function format1v1() {
  return {
    actors: [
      { actorId: "local" },
      { actorId: "enemy" }
    ],
    teamOf(actorId) {
      return actorId === "local"
        ? "local"
        : actorId === "enemy"
          ? "enemy"
          : null;
    }
  };
}

function fighter(id) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 20,
    initialEnergy: 20,
    energyChargeAmount: 0
  };
}

function zoneSkill() {
  return normalizeSkillDefinition({
    id: "zone-visible-test",
    name: "Zone visible test",
    category: "offensive",
    form: "aura",
    loadoutSlot: "ultimate",
    element: "fire",
    approachMode: "none",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: [
      "short",
      "medium",
      "long"
    ],
    targetRelations: ["enemy"],
    effect: {
      damage: 0,
      tags: []
    },
    effects: [
      {
        kind: "persistent_zone",
        targetScope: "all_enemies",
        zoneId: "zone",
        radius: "long",
        durationMs: 5000,
        tickIntervalMs: 1000,
        reactivation: "refresh",
        maxActivations: 1,
        radiusGrowthSteps: 0,
        tickEffect: {
          kind: "damage",
          targetScope: "all_enemies",
          amount: 5,
          channel: "fire"
        }
      }
    ]
  });
}

function spatialRenderer({
  localVisible = rect(30, 30, 10, 10),
  localLogical = rect(300, 300, 80, 80),
  zoneBounds = rect(0, 0, 100, 100),
  visibleTarget = true
} = {}) {
  const arena = node(
    rect(0, 0, 400, 300)
  );
  const local = node(localLogical);
  const enemy = node(
    rect(40, 40, 40, 40)
  );

  arena.ownerDocument = {
    createElement() {
      const created = node(zoneBounds);
      created.ownerDocument =
        arena.ownerDocument;
      return created;
    }
  };

  return createDomSkillFxRenderer({
    arena,
    anchors: {
      local,
      enemy
    },
    targetAnchors: {
      local,
      enemy
    },
    targetAnchorFor(actorId) {
      if (!visibleTarget) {
        return null;
      }
      return actorId === "local"
        ? localVisible
        : rect(40, 40, 10, 10);
    },
    presentationForSkill() {
      return {
        persistentZone: {
          url: "zone.webp",
          displayScale: 1,
          playbackMode: "loop"
        },
        persistentZoneLayer: "behind"
      };
    },
    animate() {
      return {
        finished:
          new Promise(() => {}),
        cancel() {}
      };
    },
    requestFrame() {
      return null;
    },
    cancelFrame() {}
  });
}

test("persistent-zone spatial sample prefers the same visible target geometry used by projectile/collision", () => {
  const renderer = spatialRenderer();

  const sample =
    renderer.sampleZoneSpatialContext([
      {
        id: "enemy:zone-visible-test:zone",
        skillId: "zone-visible-test",
        sourceActorId: "enemy",
        radius: "long"
      }
    ]);

  const local = sample.actors.find(
    (actor) => actor.actorId === "local"
  );

  assert.deepEqual(
    local.bounds,
    rect(30, 30, 10, 10),
    "zone occupancy must sample the visible creature silhouette, not the logical motion square"
  );

  renderer.dispose();
});

test("persistent-zone spatial sample keeps logical anchor fallback when visible geometry is unavailable", () => {
  const renderer = spatialRenderer({
    visibleTarget: false
  });

  const sample =
    renderer.sampleZoneSpatialContext([
      {
        id: "enemy:zone-visible-test:zone",
        skillId: "zone-visible-test",
        sourceActorId: "enemy",
        radius: "long"
      }
    ]);

  const local = sample.actors.find(
    (actor) => actor.actorId === "local"
  );

  assert.deepEqual(
    local.bounds,
    rect(300, 300, 80, 80)
  );

  renderer.dispose();
});

test("visually covered idle target receives consecutive native zone ticks without any attack refresh", () => {
  const session = createCombatSession({
    distance: "long",
    battleFormat: format1v1(),
    fighters: [
      fighter("local"),
      fighter("enemy")
    ]
  });

  const skill = zoneSkill();
  assert.equal(
    session.useSkill({
      actorId: "enemy",
      targetId: "local",
      skill
    }).ok,
    true
  );

  const renderer = spatialRenderer();
  let clock = 0;
  let scheduled = null;

  const runtime = createCombatRuntime({
    session,
    tickMs: 50,
    now() {
      return clock;
    },
    setTimer(callback) {
      scheduled = callback;
      return 1;
    },
    clearTimer() {
      scheduled = null;
    },
    readZoneSpatialContext(state) {
      return renderer.sampleZoneSpatialContext(
        state.persistentZones ?? []
      );
    }
  });

  runtime.start();

  for (const next of [1000, 2000]) {
    clock = next;
    const callback = scheduled;
    scheduled = null;
    assert.equal(
      typeof callback,
      "function"
    );
    callback();
  }

  assert.equal(
    runtime.activeActions.length,
    0,
    "no attack may be required to refresh a zone"
  );
  assert.equal(
    session.snapshot().fighters.local.hp,
    90,
    "two visible-zone ticks must apply deterministically while idle"
  );

  runtime.dispose();
  renderer.dispose();
});

test("persistent zone behind layer stays strictly below an attacking fighter even on behind approach depth", async () => {
  const css = await readFile(
    new URL(
      "../../examples/dom-demo/demo.css",
      import.meta.url
    ),
    "utf8"
  );

  const zone = css.match(
    /\.skill-fx--persistent-zone\.skill-fx--layer-behind\s*\{[^}]*z-index:\s*(\d+)/s
  );
  const fighterBehind = css.match(
    /\.arena--coop-2v2\s+\.fighter\[data-approach-active="true"\]\[data-approach-depth="behind"\]\s*\{[^}]*z-index:\s*(\d+)/s
  );

  assert.ok(zone);
  assert.ok(fighterBehind);
  assert.ok(
    Number(zone[1]) <
      Number(fighterBehind[1]),
    "persistent zone behind must never repaint over a fighter moving behind"
  );
});
