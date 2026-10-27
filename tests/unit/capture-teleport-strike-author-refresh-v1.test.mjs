import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";

const path = "data/capture/showcase/teleport-strike.capture-skill-transfer-v1.json";
const source = () => readFileSync(new URL("../../" + path, import.meta.url));
const authoredSha256 = "9229bcb607939e0ffd6f8e284f3e1f2ba24ab5ec1ef493343a9000ef09f53ab2";

test("Frappe téléportée is the exact user export with one existing Showcase owner", () => {
  const bytes = source();
  assert.equal(bytes.byteLength, 2415);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), authoredSha256);
  const raw = JSON.parse(bytes.toString("utf8"));
  assert.equal(raw.schema, "capture-skill-transfer-v1");
  assert.equal(raw.version, 1);
  assert.equal(raw.draft.id, "teleport-strike");
  assert.equal(raw.draft.definition.id, "teleport-strike");
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x => x === path).length, 1);
  const imported = importCaptureTransferJsonV1(bytes.toString("utf8"));
  assert.equal(imported.kind, "skill");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(imported.value.draft)).value, imported.value);
});

test("Frappe téléportée retains authored teleport visuals and executes a 16-damage contact attack", () => {
  const d = importCaptureTransferJsonV1(source().toString("utf8")).value.draft;
  assert.equal(d.definition.name, "Frappe téléportée");
  assert.equal(d.definition.form, "contact");
  assert.equal(d.definition.approachMode, "teleport");
  assert.equal(d.definition.energyCost, 3);
  assert.equal(d.definition.preparationMs, 500);
  assert.equal(d.definition.travelMs, 120);
  assert.equal(d.definition.recoveryMs, 0);
  assert.equal(d.definition.cooldownMs, 20000);
  assert.equal(d.definition.effects.length, 1);
  assert.equal(d.definition.effects[0].kind, "damage");
  assert.equal(d.definition.effects[0].amount, 16);
  assert.equal(d.presentation.visual.icon.assetId, "core:icon-skill-teleport-strike-01");
  assert.equal(d.presentation.audio.travel.assetId, "gensrpg:sound:tower-6dbf268f");
  assert.equal(d.presentation.audio.impact.assetId, "gensrpg:sound:effect-df32b429");

  const fighter = id => ({id,maxHp:100,initialHp:100,maxEnergy:100,initialEnergy:100,energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
  const session = createCombatSession({distance:"short",fighters:[fighter("player"),fighter("enemy")]});
  const first = session.useSkill({actorId:"player",targetId:"enemy",skill:d.definition});
  assert.equal(first.ok,true);
  assert.equal(session.snapshot().fighters.enemy.hp,84);
  const early = session.useSkill({actorId:"player",targetId:"enemy",skill:d.definition});
  assert.equal(early.ok,false,"second activation must respect the 20s cooldown");
  assert.equal(session.snapshot().fighters.enemy.hp,84);
  session.advanceMs(20000);
  const next = session.useSkill({actorId:"player",targetId:"enemy",skill:d.definition});
  assert.equal(next.ok,true,"skill must reactivate after the cooldown");
  assert.equal(session.snapshot().fighters.enemy.hp,68);
});
