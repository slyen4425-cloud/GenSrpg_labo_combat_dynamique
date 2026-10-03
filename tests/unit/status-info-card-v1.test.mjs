import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  projectStatusEffectInfoV1
} from "../../src/adapters/renderer/status-effect-info-v1.js";
import {
  createDomStatusFxRenderer
} from "../../src/adapters/renderer/dom-status-fx.js";

function dotInstance(overrides = {}) {
  return {
    sourceActorId: "player",
    sourceSkillId: "lib_flame_bite",
    appliedAtMs: 0,
    expiresAtMs: 10000,
    remainingActionEnds: null,
    nextTickAtMs: 6000,
    stacks: 2,
    shieldRemaining: null,
    definition: {
      id: "burning",
      kind: "damage_over_time",
      polarity: "detrimental",
      durationModel: "time_ms",
      durationMs: 10000,
      stacking: "stack",
      maxStacks: 10,
      tags: ["fire"],
      amount: 5,
      channel: "fire",
      tickIntervalMs: 2000,
      damageMode: "fixed"
    },
    ...overrides
  };
}

function fakeNode() {
  return {
    className: "",
    dataset: {},
    style: {},
    textContent: "",
    title: "",
    hidden: false,
    children: [],
    ownerDocument: null,
    append(...children) {
      this.children.push(...children);
    },
    remove() {
      this.removed = true;
    },
    setAttribute(name, value) {
      this.attributes ??= {};
      this.attributes[name] = String(value);
    }
  };
}

function fakeDocument() {
  const document = {
    createElement() {
      const node = fakeNode();
      node.ownerDocument = document;
      return node;
    }
  };
  return document;
}

test("status info projects real DoT, source skill, stacks and remaining combat time", () => {
  const info = projectStatusEffectInfoV1({
    instance: dotInstance(),
    elapsedMs: 4000,
    sourceSkill: {
      id: "lib_flame_bite",
      name: "Morsure brûlante"
    }
  });

  assert.equal(info.statusId, "burning");
  assert.equal(info.typeLabel, "Debuff");
  assert.equal(
    info.sourceSkillName,
    "Morsure brûlante"
  );
  assert.equal(info.remainingLabel, "6 s");
  assert.equal(info.stacksLabel, "2 / 10");
  assert.deepEqual(
    info.effectLines,
    ["5 dégâts Feu toutes les 2 s"]
  );
});

test("status duration display follows elapsedMs from CombatState, never a UI clock", () => {
  const before = projectStatusEffectInfoV1({
    instance: dotInstance(),
    elapsedMs: 4000,
    sourceSkill: null
  });
  const after = projectStatusEffectInfoV1({
    instance: dotInstance(),
    elapsedMs: 9000,
    sourceSkill: null
  });

  assert.equal(before.remainingLabel, "6 s");
  assert.equal(after.remainingLabel, "1 s");
});

test("status info derives stat modifiers and immobilization from the active definition", () => {
  const modifier = projectStatusEffectInfoV1({
    instance: {
      ...dotInstance(),
      stacks: 1,
      definition: {
        id: "armor-break",
        kind: "stat_modifier",
        polarity: "detrimental",
        durationModel: "time_ms",
        durationMs: 5000,
        stacking: "refresh",
        maxStacks: 1,
        tags: [],
        statId: "defense",
        modifierMode: "percent",
        percent: -20
      },
      expiresAtMs: 5000
    },
    elapsedMs: 1000,
    sourceSkill: null
  });
  assert.deepEqual(
    modifier.effectLines,
    ["Defense -20 %"]
  );

  const root = projectStatusEffectInfoV1({
    instance: {
      ...dotInstance(),
      definition: {
        id: "root",
        kind: "immobilize",
        polarity: "detrimental",
        durationModel: "time_ms",
        durationMs: 3000,
        stacking: "refresh",
        maxStacks: 1,
        tags: []
      },
      stacks: 1,
      expiresAtMs: 3000
    },
    elapsedMs: 0,
    sourceSkill: null
  });
  assert.deepEqual(
    root.effectLines,
    ["Impossible de se déplacer"]
  );
});

test("tap on the active HUD icon opens a compact card from the same status snapshot", () => {
  const document = fakeDocument();
  const motion = fakeNode();
  const image = fakeNode();
  const statusHost = fakeNode();
  motion.ownerDocument = document;
  image.ownerDocument = document;
  statusHost.ownerDocument = document;
  image.src = "https://example.test/creature.webp";

  const renderer = createDomStatusFxRenderer({
    targetFor() {
      return { motion, image, statusHost };
    },
    statusPresentationFor() {
      return null;
    },
    skillPresentationFor() {
      return {
        icon: {
          assetId: "skill:flame-bite",
          url: "https://example.test/flame-bite.webp"
        }
      };
    },
    skillDefinitionFor(skillId) {
      assert.equal(skillId, "lib_flame_bite");
      return {
        id: skillId,
        name: "Morsure brûlante"
      };
    }
  });

  renderer.sync({
    elapsedMs: 4000,
    fighters: {
      enemy: {
        statusEffects: [dotInstance()]
      }
    }
  });

  const icon = statusHost.children[0];
  assert.equal(typeof icon.onclick, "function");
  icon.onclick({ stopPropagation() {} });

  const details = icon.children.find(
    (node) =>
      node.dataset.statusFx ===
      "hud-details"
  );
  assert.ok(details);
  assert.equal(details.hidden, false);
  assert.match(details.textContent, /Morsure brûlante/);
  assert.match(details.textContent, /5 dégâts Feu toutes les 2 s/);
  assert.match(details.textContent, /6 s/);
  assert.match(details.textContent, /2 \/ 10/);

  renderer.sync({
    elapsedMs: 9000,
    fighters: {
      enemy: {
        statusEffects: [dotInstance()]
      }
    }
  });
  assert.match(details.textContent, /1 s/);

  renderer.sync({
    elapsedMs: 10000,
    fighters: {
      enemy: { statusEffects: [] }
    }
  });
  assert.equal(icon.removed, true);
});

test("status info presentation has no independent clock and both clients provide canonical skill definitions", async () => {
  const infoSource = await readFile(
    new URL(
      "../../src/adapters/renderer/status-effect-info-v1.js",
      import.meta.url
    ),
    "utf8"
  );
  const rendererSource = await readFile(
    new URL(
      "../../src/adapters/renderer/dom-status-fx.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const source of [infoSource, rendererSource]) {
    assert.doesNotMatch(source, /Date\.now\s*\(/);
    assert.doesNotMatch(source, /setInterval\s*\(/);
    assert.doesNotMatch(source, /setTimeout\s*\(/);
  }

  for (const relative of [
    "src/ui/combat-test-ui.js",
    "src/ui/combat-2v2-test-ui.js"
  ]) {
    const source = await readFile(
      new URL("../../" + relative, import.meta.url),
      "utf8"
    );
    const start = source.indexOf(
      "createDomStatusFxRenderer({"
    );
    const block = source.slice(start, start + 2200);
    assert.match(block, /skillDefinitionFor/);
  }
});
