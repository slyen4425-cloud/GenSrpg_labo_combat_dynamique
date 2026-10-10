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

test("same status renderer exposes own-creature buffs and enemy debuffs with independent cards", () => {
  const document = fakeDocument();
  const hosts = Object.fromEntries(["local-1", "opponent-1"].map(id => {
    const motion = fakeNode();
    const image = fakeNode();
    const statusHost = fakeNode();
    for (const node of [motion, image, statusHost]) node.ownerDocument = document;
    image.src = "https://example.test/creature.webp";
    return [id, { motion, image, statusHost }];
  }));
  const ownBuff = dotInstance({
    sourceActorId: "local-1",
    sourceSkillId: "lib_aqua_heal",
    stacks: 1,
    expiresAtMs: 12000,
    definition: {
      ...dotInstance().definition,
      id: "healing",
      kind: "heal_over_time",
      polarity: "beneficial",
      durationMs: 12000,
      stacking: "refresh",
      amount: 3,
      tickIntervalMs: 2000
    }
  });
  const renderer = createDomStatusFxRenderer({
    targetFor: actorId => hosts[actorId],
    statusPresentationFor: () => null,
    skillPresentationFor: () => null,
    skillDefinitionFor: skillId => ({
      id: skillId,
      name: skillId === "lib_aqua_heal" ? "Aura de soin" : "Morsure brûlante"
    })
  });
  renderer.sync({
    elapsedMs: 2000,
    fighters: {
      "local-1": { statusEffects: [ownBuff] },
      "opponent-1": { statusEffects: [dotInstance()] }
    }
  });
  const own = hosts["local-1"].statusHost.children[0];
  const enemy = hosts["opponent-1"].statusHost.children[0];
  assert.equal(own.dataset.polarity, "beneficial");
  assert.equal(enemy.dataset.polarity, "detrimental");
  own.onclick({ stopPropagation() {} });
  enemy.onclick({ stopPropagation() {} });
  const ownDetails = own.children.find(node => node.dataset.statusFx === "hud-details");
  const enemyDetails = enemy.children.find(node => node.dataset.statusFx === "hud-details");
  assert.equal(ownDetails.hidden, false);
  assert.match(ownDetails.textContent, /Buff/);
  assert.match(ownDetails.textContent, /Aura de soin/);
  assert.match(ownDetails.textContent, /3 PV toutes les 2 s/);
  assert.equal(enemyDetails.hidden, false);
  assert.match(enemyDetails.textContent, /Debuff/);
  assert.match(enemyDetails.textContent, /Morsure brûlante/);

  renderer.sync({
    elapsedMs: 12000,
    fighters: {
      "local-1": { statusEffects: [] },
      "opponent-1": { statusEffects: [dotInstance({ expiresAtMs: 14000 })] }
    }
  });
  assert.equal(own.removed, true);
  assert.notEqual(enemy.removed, true);
  renderer.dispose();
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


test("status info explains physical stat reduction with gameplay meaning instead of raw stat math", () => {
  const instance = {
    ...dotInstance(),
    stacks: 1,
    definition: {
      id: "physical-down",
      kind: "stat_modifier",
      polarity: "detrimental",
      durationModel: "time_ms",
      durationMs: 8000,
      stacking: "refresh",
      maxStacks: 1,
      tags: [],
      statId: "physical",
      modifierMode: "points",
      deltaPoints: -50
    },
    expiresAtMs: 8000
  };

  const info = projectStatusEffectInfoV1({
    instance,
    elapsedMs: 1000,
    sourceSkill: {
      id: "cap_fire_special_1",
      name: "Cendre aveuglante"
    },
    fighter: {
      statValuesById: {
        physical: 0
      },
      statEffectRulesById: {
        physical: {
          damageChannel: "physical",
          resistanceChannel: "physical",
          damagePctPerPoint: 1,
          resistancePctPerPoint: 1,
          chargeTimeReductionPctPerPoint: 0,
          damageReductionPctPerPoint: 0
        }
      },
      statusEffects: [instance]
    }
  });

  assert.deepEqual(
    info.effectLines,
    [
      "Dégâts physiques réduits de 50 %",
      "Résistance physique réduite de 50 %"
    ]
  );
});


test("recovery status HUD describes energy regeneration buff/debuff and author source", () => {
  const source = { id: "cap_earth_atk_3", name: "Charge tellurique" };
  const info = pct => projectStatusEffectInfoV1({
    instance: dotInstance({
      sourceSkillId: "cap_earth_atk_3",
      stacks: 1,
      definition: {
        ...dotInstance().definition,
        id: "cap_earth_atk_3:0",
        kind: "energy_regen_modifier",
        polarity: pct < 0 ? "detrimental" : "beneficial",
        modifierPct: pct
      }
    }),
    elapsedMs: 1000,
    sourceSkill: source
  });
  assert.equal(info(50).statusName, "Régénération d’énergie");
  assert.equal(info(50).sourceSkillName, "Charge tellurique");
  assert.deepEqual(info(50).effectLines, [
    "Énergie récupérée par tick augmentée de 50 %"
  ]);
  assert.deepEqual(info(-50).effectLines, [
    "Énergie récupérée par tick réduite de 50 %"
  ]);
  assert.deepEqual(info(-120).effectLines, [
    "Régénération d’énergie suspendue (0 énergie par tick)"
  ]);
  assert.deepEqual(info(0).effectLines, [
    "Énergie récupérée par tick inchangée"
  ]);
});

test("recovery status HUD describes cooldown rate, stacks and paused recovery", () => {
  const info = (pct, stacks = 1) => projectStatusEffectInfoV1({
    instance: dotInstance({
      stacks,
      definition: {
        ...dotInstance().definition,
        id: "cooldown-speed-1",
        kind: "skill_cooldown_rate_modifier",
        polarity: pct < 0 ? "detrimental" : "beneficial",
        modifierPct: pct
      }
    }),
    elapsedMs: 4000
  });
  assert.equal(info(100).statusName, "Recharge des compétences");
  assert.deepEqual(info(100).effectLines, [
    "Vitesse de recharge des compétences augmentée de 100 %"
  ]);
  assert.deepEqual(info(-50).effectLines, [
    "Vitesse de recharge des compétences réduite de 50 %"
  ]);
  assert.deepEqual(info(-100).effectLines, [
    "Recharge des compétences en pause"
  ]);
  assert.deepEqual(info(50, 2).effectLines, [
    "Vitesse de recharge des compétences augmentée de 100 %"
  ]);
  assert.deepEqual(info(0).effectLines, [
    "Vitesse de recharge des compétences inchangée"
  ]);
});
