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
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

function fighter(id) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 20,
    initialEnergy: 20
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

function reinforcingAura() {
  return normalizeSkillDefinition({
    id: "ultimate-fire-zone",
    name: "Zone ultime",
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
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effect: {
      damage: 0,
      tags: []
    },
    effects: [
      {
        kind: "persistent_zone",
        targetScope: "all_enemies",
        zoneId: "fire-zone",
        radius: "short",
        durationMs: 10000,
        tickIntervalMs: 1000,
        reactivation: "reinforce",
        maxActivations: 3,
        radiusGrowthSteps: 1,
        tickEffect: {
          kind: "damage",
          targetScope: "all_enemies",
          amount: 7,
          channel: "fire"
        }
      }
    ]
  });
}

function fakeNode(rect = {
  left: 0,
  top: 0,
  width: 20,
  height: 20
}) {
  return {
    className: "",
    dataset: {},
    style: {},
    children: [],
    removed: false,
    append(child) {
      this.children.push(child);
    },
    remove() {
      this.removed = true;
    },
    getBoundingClientRect() {
      return rect;
    }
  };
}

test("combat HUD reserves one row for all five Capture skill slots", async () => {
  const css = await readFile(
    new URL(
      "../../examples/dom-demo/demo.css",
      import.meta.url
    ),
    "utf8"
  );

  const blocks = [
    ...css.matchAll(
      /\.skill-bar__grid\s*\{([\s\S]*?)\}/g
    )
  ].map((match) => match[1]);

  assert.ok(blocks.length >= 1);
  for (const block of blocks) {
    assert.match(
      block,
      /grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/
    );
    assert.doesNotMatch(
      block,
      /repeat\(4,/
    );
  }
});

test("real persistent-zone gameplay reinforces radius and keeps applying configured tick damage", () => {
  const session = createCombatSession({
    distance: "long",
    battleFormat: format1v1(),
    fighters: [
      fighter("local"),
      fighter("enemy")
    ]
  });
  const skill = reinforcingAura();

  session.useSkill({
    actorId: "local",
    targetId: "enemy",
    skill
  });
  assert.equal(
    session.snapshot().persistentZones[0].radius,
    "short"
  );

  session.useSkill({
    actorId: "local",
    targetId: "enemy",
    skill
  });
  assert.equal(
    session.snapshot().persistentZones[0].radius,
    "medium"
  );

  session.useSkill({
    actorId: "local",
    targetId: "enemy",
    skill
  });
  const zone = session.snapshot().persistentZones[0];
  assert.equal(zone.activations, 3);
  assert.equal(zone.radius, "long");

  session.advanceMs(1000);
  assert.equal(
    session.snapshot().fighters.enemy.hp,
    93,
    "the third activation must keep the real zone damage owner active"
  );
});

test("persistent-zone atlas visual loops instead of freezing after one pass", () => {
  const arena = fakeNode({
    left: 0,
    top: 0,
    width: 400,
    height: 300
  });
  arena.ownerDocument = {
    createElement() {
      const node = fakeNode();
      node.ownerDocument = arena.ownerDocument;
      return node;
    }
  };

  const source = fakeNode({
    left: 80,
    top: 180,
    width: 40,
    height: 40
  });

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors: { local: source },
    targetAnchors: { local: source },
    presentationForSkill() {
      return {
        persistentZone: {
          assetId: "zone-atlas",
          url: "zone-atlas.png",
          frameCount: 8,
          displayScale: 1,
          playbackMode: "loop"
        },
        persistentZoneLayer: "behind"
      };
    },
    animate() {
      return {
        finished: new Promise(() => {}),
        cancel() {}
      };
    },
    requestFrame() {
      return null;
    },
    cancelFrame() {}
  });

  renderer.syncPersistentZones([
    {
      id: "local:ultimate-fire-zone:fire-zone",
      skillId: "ultimate-fire-zone",
      sourceActorId: "local",
      radius: "short"
    }
  ]);

  assert.equal(arena.children.length, 1);
  const node = arena.children[0];
  assert.equal(node.style.animationName, "skill-fx-strip");
  assert.equal(
    node.style.animationIterationCount,
    "infinite",
    "persistent atlas animation must loop for as long as the zone node exists"
  );

  renderer.dispose();
});

test("persistent-zone visual keeps the same node while radius reinforcement updates its scale", () => {
  const arena = fakeNode({
    left: 0,
    top: 0,
    width: 400,
    height: 300
  });
  arena.ownerDocument = {
    createElement() {
      const node = fakeNode();
      node.ownerDocument = arena.ownerDocument;
      return node;
    }
  };
  const source = fakeNode({
    left: 80,
    top: 180,
    width: 40,
    height: 40
  });

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors: { local: source },
    targetAnchors: { local: source },
    presentationForSkill() {
      return {
        persistentZone: {
          assetId: "zone-sequence",
          frames: [
            "zone-1.png",
            "zone-2.png",
            "zone-3.png"
          ],
          frameMs: 80,
          displayScale: 1,
          playbackMode: "loop"
        },
        persistentZoneLayer: "behind"
      };
    },
    animate() {
      return {
        finished: new Promise(() => {}),
        cancel() {}
      };
    },
    requestFrame() {
      return null;
    },
    cancelFrame() {}
  });

  renderer.syncPersistentZones([
    {
      id: "local:ultimate-fire-zone:fire-zone",
      skillId: "ultimate-fire-zone",
      sourceActorId: "local",
      radius: "short"
    }
  ]);

  const node = arena.children[0];
  const shortTransform = node.style.transform;

  renderer.syncPersistentZones([
    {
      id: "local:ultimate-fire-zone:fire-zone",
      skillId: "ultimate-fire-zone",
      sourceActorId: "local",
      radius: "medium"
    }
  ]);
  const mediumTransform = node.style.transform;

  renderer.syncPersistentZones([
    {
      id: "local:ultimate-fire-zone:fire-zone",
      skillId: "ultimate-fire-zone",
      sourceActorId: "local",
      radius: "long"
    }
  ]);

  assert.equal(arena.children[0], node);
  assert.notEqual(mediumTransform, shortTransform);
  assert.notEqual(node.style.transform, mediumTransform);
  assert.equal(node.dataset.zoneRadius, "long");

  renderer.dispose();
});
