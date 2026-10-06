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

function fighter(id) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 30,
    initialEnergy: 30,
    energyChargeAmount: 0
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

function fakeNode(bounds = {
  left: 0,
  top: 0,
  width: 40,
  height: 40
}) {
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

async function firestormDraft() {
  return JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json",
        import.meta.url
      ),
      "utf8"
    )
  ).draft;
}

test("real Tempête runtime reaches short medium long and renderer follows the same node", async () => {
  const draft = await firestormDraft();
  const skill = normalizeSkillDefinition(
    draft.definition
  );

  const session = createCombatSession({
    distance: "long",
    battleFormat: format1v1(),
    fighters: [
      fighter("local"),
      fighter("enemy")
    ]
  });

  const arena = fakeNode({
    left: 0,
    top: 0,
    width: 400,
    height: 300
  });
  arena.ownerDocument = {
    createElement() {
      const created = fakeNode();
      created.ownerDocument =
        arena.ownerDocument;
      return created;
    }
  };
  const local = fakeNode({
    left: 80,
    top: 180,
    width: 40,
    height: 40
  });
  const enemy = fakeNode({
    left: 280,
    top: 80,
    width: 40,
    height: 40
  });
  const aura =
    draft.presentation.visual.aura;

  const fx = createDomSkillFxRenderer({
    arena,
    anchors: { local, enemy },
    targetAnchors: { local, enemy },
    presentationForSkill(skillId) {
      assert.equal(skillId, skill.id);
      return {
        persistentZone: {
          ...aura,
          url: "fire-zone.webp"
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

  let clock = 0;
  let scheduled = null;
  const seen = [];
  const resolutions = [];

  const runtime = createCombatRuntime({
    session,
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
    onResolved(resolution) {
      resolutions.push(resolution);
    },
    onState(state) {
      fx.syncPersistentZones(
        state.persistentZones ?? []
      );
      const zone =
        state.persistentZones?.[0] ?? null;
      if (zone) {
        seen.push({
          elapsedMs: state.elapsedMs,
          radius: zone.radius,
          activations: zone.activations,
          appliedAtMs: zone.appliedAtMs,
          nextTickAtMs: zone.nextTickAtMs,
          expiresAtMs: zone.expiresAtMs,
          nodeRadius:
            arena.children[0]?.dataset?.zoneRadius ??
            null,
          transform:
            arena.children[0]?.style?.transform ??
            null
        });
      }
    }
  });

  const advanceTo = (atMs) => {
    clock = atMs;
    const callback = scheduled;
    scheduled = null;
    assert.equal(
      typeof callback,
      "function",
      "Runtime tick must remain scheduled"
    );
    callback();
  };

  runtime.start();

  advanceTo(25000);

  assert.equal(
    runtime.startSkill({
      actorId: "local",
      targetId: "enemy",
      skill
    }).ok,
    true
  );

  advanceTo(27000);
  let zone =
    session.snapshot().persistentZones[0];
  assert.equal(zone.radius, "short");
  assert.equal(zone.activations, 1);
  assert.equal(
    zone.appliedAtMs,
    27000,
    "zone timestamp must be the real combat impact time, not state time plus preparation twice"
  );
  assert.equal(zone.nextTickAtMs, 28000);
  assert.equal(zone.expiresAtMs, 34000);
  const node = arena.children[0];
  const shortTransform = node.style.transform;
  assert.equal(node.dataset.zoneRadius, "short");
  assert.equal(
    resolutions[0]?.persistentZoneOnly,
    true,
    "Core must expose that Tempête is a pure persistent-zone resolution"
  );

  advanceTo(28500);
  assert.equal(
    runtime.startSkill({
      actorId: "local",
      targetId: "enemy",
      skill
    }).ok,
    true
  );

  advanceTo(30500);
  zone = session.snapshot().persistentZones[0];
  assert.equal(zone.radius, "medium");
  assert.equal(zone.activations, 2);
  assert.equal(zone.appliedAtMs, 30500);
  assert.equal(zone.nextTickAtMs, 31500);
  assert.equal(arena.children[0], node);
  const mediumTransform = node.style.transform;
  assert.equal(node.dataset.zoneRadius, "medium");
  assert.notEqual(mediumTransform, shortTransform);

  advanceTo(32000);
  assert.equal(
    runtime.startSkill({
      actorId: "local",
      targetId: "enemy",
      skill
    }).ok,
    true
  );

  assert.equal(
    node.dataset.zoneRadius,
    "medium",
    "during the authored 2 s preparation the already-active zone legitimately stays medium"
  );

  advanceTo(34000);
  zone = session.snapshot().persistentZones[0];
  assert.equal(zone.radius, "long");
  assert.equal(zone.activations, 3);
  assert.equal(zone.appliedAtMs, 34000);
  assert.equal(zone.nextTickAtMs, 35000);
  assert.equal(arena.children[0], node);
  assert.equal(node.dataset.zoneRadius, "long");
  assert.notEqual(
    node.style.transform,
    mediumTransform
  );

  assert.ok(
    seen.some(
      (entry) =>
        entry.radius === "long" &&
        entry.nodeRadius === "long"
    ),
    "true Runtime onState path must project long into the existing zone node"
  );

  runtime.dispose();
  fx.dispose();
});

test("Tempête's remaining apparent wait is authored preparation, not projectile travel", async () => {
  const draft = await firestormDraft();
  assert.equal(
    draft.definition.preparationMs,
    2000
  );
  assert.equal(
    draft.definition.travelMs,
    0
  );
  assert.notEqual(
    draft.definition.form,
    "projectile"
  );
});
