import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  humanStatEffectSummaryV1
} from "../../src/ui/capture-editor-human-v2.js";

test("Defense stat summary explains global damage reduction per point and current total", () => {
  assert.equal(
    humanStatEffectSummaryV1({
      definition: {
        id: "defense",
        label: "Défense",
        damageChannel: null,
        resistanceChannel: null,
        damagePctPerPoint: 0,
        resistancePctPerPoint: 0,
        chargeTimeReductionPctPerPoint: 0,
        damageReductionPctPerPoint: 1.5
      },
      value: 12
    }),
    "1 point = -1.5 % dégâts reçus · 12 points = -18 % dégâts reçus"
  );
});

test("Human Editor exposes Defense coefficient for system and custom stats", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );
  const ui = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    html,
    /Réduction globale dégâts reçus % \/ point/
  );
  assert.match(
    html,
    /data-stat-custom-damage-reduction-pct-per-point/
  );
  assert.match(
    ui,
    /data-stat-definition-damage-reduction-rate/
  );
  assert.match(
    ui,
    /damageReductionPctPerPoint/
  );
});

test("Defense stat row remains mobile-stackable", async () => {
  const css = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.css",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    css,
    /@media[\s\S]*?\.stat-definition-row\s*\{[\s\S]*?grid-template-columns:\s*1fr/
  );
});
