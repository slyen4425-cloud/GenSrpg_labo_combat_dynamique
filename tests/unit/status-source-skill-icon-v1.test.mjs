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
  createDomStatusFxRenderer
} from "../../src/adapters/renderer/dom-status-fx.js";

function fighter(id) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 20,
    initialEnergy: 20,
    movementEnergyPerStep: 1
  };
}

function sourceSkill(id) {
  return normalizeSkillDefinition({
    id,
    name: "Morsure brûlante",
    category: "buff_debuff",
    form: "contact",
    element: "fire",
    approachMode: "ground",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effect: {
      damage: 0,
      heal: 0,
      tags: []
    },
    effects: [{
      kind: "apply_status",
      targetScope: "target",
      status: {
        id: "burning",
        kind: "damage_over_time",
        polarity: "detrimental",
        durationMs: 10000,
        stacking: "stack",
        maxStacks: 10,
        amount: 5,
        channel: "fire",
        tickIntervalMs: 2000
      }
    }]
  });
}

function fakeNode() {
  return {
    className: "",
    dataset: {},
    style: {},
    textContent: "",
    title: "",
    children: [],
    ownerDocument: null,
    append(...children) {
      this.children.push(...children);
    },
    remove() {
      this.removed = true;
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

test("active status instance keeps the skill id that actually applied it", () => {
  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: sourceSkill("lib_flame_bite")
  });

  const instance =
    session.snapshot().fighters.b.statusEffects[0];

  assert.equal(instance.definition.id, "burning");
  assert.equal(instance.sourceActorId, "a");
  assert.equal(
    instance.sourceSkillId,
    "lib_flame_bite"
  );
});

test("stacked status stays one runtime instance with one deterministic latest skill provenance", () => {
  const session = createCombatSession({
    fighters: [fighter("a"), fighter("b")]
  });

  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: sourceSkill("burn-source-a")
  });
  session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: sourceSkill("burn-source-b")
  });

  const statuses =
    session.snapshot().fighters.b.statusEffects;

  assert.equal(statuses.length, 1);
  assert.equal(statuses[0].stacks, 2);
  assert.equal(
    statuses[0].sourceSkillId,
    "burn-source-b"
  );
});

test("HUD status icon prefers the canonical icon of the source skill over the status sprite", () => {
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
      return {
        mode: "sprite",
        tintColor: "#d73920",
        tintOpacity: 0.8,
        sprite: {
          assetId: "status:burn",
          url: "https://example.test/status-burn.webp",
          displayScale: 1,
          opacity: 1
        }
      };
    },
    skillPresentationFor(skillId) {
      assert.equal(skillId, "lib_flame_bite");
      return {
        icon: {
          assetId: "core:icon-skill-fire-rain-01",
          url: "https://example.test/flame-bite-icon.webp"
        }
      };
    }
  });

  renderer.sync({
    fighters: {
      enemy: {
        statusEffects: [{
          sourceActorId: "player",
          sourceSkillId: "lib_flame_bite",
          stacks: 1,
          definition: {
            id: "burning",
            polarity: "detrimental"
          }
        }]
      }
    }
  });

  assert.equal(statusHost.children.length, 1);
  const icon = statusHost.children[0];
  assert.match(
    icon.style.backgroundImage,
    /flame-bite-icon\.webp/
  );
  assert.doesNotMatch(
    icon.style.backgroundImage,
    /status-burn\.webp/
  );

  renderer.sync({
    fighters: {
      enemy: { statusEffects: [] }
    }
  });
  assert.equal(icon.removed, true);
});

test("1v1 and 2v2 pass the same canonical skill presentation resolver to the single status renderer", async () => {
  const oneVsOne = await readFile(
    new URL(
      "../../src/ui/combat-test-ui.js",
      import.meta.url
    ),
    "utf8"
  );
  const oneStart = oneVsOne.indexOf(
    "createDomStatusFxRenderer({"
  );
  const oneBlock = oneVsOne.slice(
    oneStart,
    oneStart + 1800
  );
  assert.match(oneBlock, /skillPresentationFor/);
  assert.match(
    oneBlock,
    /presentationAssets\?\.presentationForSkill/
  );

  const twoVsTwo = await readFile(
    new URL(
      "../../src/ui/combat-2v2-test-ui.js",
      import.meta.url
    ),
    "utf8"
  );
  const twoStart = twoVsTwo.indexOf(
    "createDomStatusFxRenderer({"
  );
  const twoBlock = twoVsTwo.slice(
    twoStart,
    twoStart + 1800
  );
  assert.match(twoBlock, /skillPresentationFor/);
  assert.match(
    twoBlock,
    /presentationForActorSkill/
  );

  const helperStart = twoVsTwo.indexOf(
    "function presentationForActorSkill"
  );
  const helperBlock = twoVsTwo.slice(
    helperStart,
    helperStart + 1400
  );
  assert.match(
    helperBlock,
    /presentationAssets\?\.presentationForSkill/
  );
});
