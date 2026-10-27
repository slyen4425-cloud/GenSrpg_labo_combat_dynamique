import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureStatRegistryV1
} from "../../src/contracts/capture-stat-registry-v1.js";
import {
  projectCaptureStatEffectsV1
} from "../../src/core/combat/capture-stat-effects-v1.js";
import {
  importMonsterCaptureStatValuesV1
} from "../../src/adapters/input/capture/monster-capture-stat-values-v1.js";

const registryUrl = new URL(
  "../../data/capture/monster-capture-stat-registry.v1.json",
  import.meta.url
);
const htmlUrl = new URL(
  "../../examples/dom-demo/capture-editor-v2.html",
  import.meta.url
);

async function registry() {
  return normalizeCaptureStatRegistryV1(
    JSON.parse(await readFile(registryUrl, "utf8"))
  );
}

test("Capture registry defines Santé / PV as a real stat with explicit PV per point", async () => {
  const value = await registry();
  const health = value.stats.find(
    (entry) => entry.id === "health"
  );

  assert.ok(health, "health stat must exist");
  assert.match(health.label, /Santé|PV/i);
  assert.equal(health.maxHpPerPoint, 1);
});

test("health stat projects max HP from stat points", async () => {
  const value = await registry();
  const projected = projectCaptureStatEffectsV1({
    registry: value,
    statValues: {
      schema: "capture-creature-stat-values-v1",
      creatureId: "crea-health-probe",
      values: Object.fromEntries(
        value.stats.map((entry) => [
          entry.id,
          entry.id === "health" ? 73 : 0
        ])
      )
    }
  });

  assert.equal(projected.maxHp, 73);
});

test("Monster Capture historical hp imports into the health stat", async () => {
  const value = await registry();
  const imported = importMonsterCaptureStatValuesV1(
    {
      id: "crea-health-import",
      hp: 42,
      stats: {
        force: 7,
        defense: 8,
        speed: 9
      }
    },
    value
  );

  assert.equal(imported.values.health, 42);
});

test("editor no longer exposes separate max/start HP controls", async () => {
  const html = await readFile(htmlUrl, "utf8");

  assert.doesNotMatch(html, /data-max-hp/);
  assert.doesNotMatch(html, /data-initial-hp/);
  assert.doesNotMatch(html, /PV restent séparés/i);
  assert.match(html, /Santé|PV/);
});
