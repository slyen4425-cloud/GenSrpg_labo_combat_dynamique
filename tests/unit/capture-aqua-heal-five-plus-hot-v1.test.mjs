import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  importCaptureTransferJsonV1,
  exportCaptureSkillTransferJsonV1,
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  buildHumanSkillDraftV1,
  humanSkillEditorFieldsFromDraftV1
} from "../../src/ui/capture-editor-human-v2.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";

const FILE = "../../data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json";
const transferFile = async () => importCaptureTransferJsonV1(
  await readFile(new URL(FILE, import.meta.url), "utf8")
);

test("Onde régénérante is configured exactly: +5 immediate and +5/3s for 20s", async () => {
  const transfer = await transferFile();
  assert.equal(transfer.kind, "skill");
  const draft = transfer.value.draft;
  assert.equal(draft.id, "lib_aqua_heal");
  assert.equal(draft.definition.name, "Onde régénérante");
  assert.equal(draft.requiredLevel, 15);
  assert.deepEqual(draft.usageScopes, ["capture", "combat"]);
  assert.equal(draft.definition.category, "heal");
  assert.equal(draft.definition.form, "self");
  assert.deepEqual(draft.definition.targetRelations, ["self"]);
  assert.deepEqual(draft.definition.targetLocations, ["active"]);
  assert.equal(draft.definition.energyCost, 8);
  assert.equal(draft.definition.preparationMs, 2500);
  assert.equal(draft.definition.cooldownMs, 30000);
  assert.equal(draft.definition.effect.heal, 0, "do not double-apply legacy heal alongside tactical effects");
  assert.deepEqual(draft.definition.effects, [
    {kind:"heal",targetScope:"self",amount:5},
    {kind:"apply_status",targetScope:"self",status:{
      id:"lib_aqua_heal_regeneration",
      kind:"heal_over_time",
      polarity:"beneficial",
      durationModel:"time_ms",
      durationMs:20000,
      stacking:"refresh",
      maxStacks:1,
      amount:5,
      tickIntervalMs:3000,
      tags:[]
    }}
  ]);
  assert.equal(draft.presentation, null, "no fictional FX or audio");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft, draft);
});

test("CombatSession heals 5 instantly and ticks 5 only every 3s through 20s, then expires", async () => {
  const draft = (await transferFile()).value.draft;
  const fighter = (id,hp) => ({
    id,maxHp:100,initialHp:hp,maxEnergy:100,initialEnergy:100,
    energyChargeAmount:0,energyChargeIntervalMs:2000,
    movementEnergyPerStep:1,chargeTimeModifierPct:0
  });
  const session = createCombatSession({
    distance:"short",
    fighters:[fighter("self",25),fighter("enemy",100)]
  });
  const played = session.useSkill({actorId:"self",targetId:"self",skill:draft.definition});
  assert.equal(played.ok,true);
  assert.equal(session.snapshot().fighters.self.hp,30, "immediate +5 PV");
  assert.equal(session.snapshot().fighters.self.energy,92);
  assert.equal(session.snapshot().fighters.self.statusEffects.length,1);
  assert.equal(session.snapshot().fighters.self.statusEffects[0].definition.kind,"heal_over_time");
  const steps = [
    [2999,30], [1,35], [2999,35], [1,40], [3000,45],
    [3000,50], [3000,55], [3000,60],
    [1999,60], [1,60], [3000,60]
  ];
  for (const [ms,hp] of steps) {
    session.advanceMs(ms);
    assert.equal(session.snapshot().fighters.self.hp,hp,`at ${ms}ms step`);
  }
  assert.equal(session.snapshot().fighters.self.statusEffects.length,0);
  assert.equal(session.snapshot().fighters.enemy.hp,100);
});

test("Human Editor form roundtrip preserves configured healing and timing", async () => {
  const draft = (await transferFile()).value.draft;
  const fields = humanSkillEditorFieldsFromDraftV1(draft);
  const roundtrip = buildHumanSkillDraftV1(fields);
  assert.deepEqual(roundtrip.definition.effects, draft.definition.effects);
  assert.deepEqual(roundtrip.definition.targetRelations, ["self"]);
  assert.equal(roundtrip.definition.effect.heal, 0);
});
