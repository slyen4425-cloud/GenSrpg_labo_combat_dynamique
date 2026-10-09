import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {projectCaptureStatEffectsV1} from "../../src/core/combat/capture-stat-effects-v1.js";
import {
  explainCaptureStatV1,
  summarizeCaptureSkillSettingsV1
} from "../../src/ui/capture-editor-contextual-help-v1.js";

const readJson = async path => JSON.parse(await readFile(new URL("../../"+path, import.meta.url), "utf8"));

test("new default Defense is 0.20 percent/point; five points reduce ordinary damage by one percent", async () => {
  const registry = normalizeCaptureStatRegistryV1(await readJson("data/capture/monster-capture-stat-registry.v1.json"));
  const def = registry.stats.find(entry => entry.id === "defense");
  assert.equal(def.damageReductionPctPerPoint, 0.2);
  const projected = projectCaptureStatEffectsV1({
    registry,
    statValues: {schema:"capture-creature-stat-values-v1",creatureId:"test",values:{defense:5}}
  });
  assert.equal(projected.damageReductionPct, 1);
  assert.match(explainCaptureStatV1({definition:def,points:5}), /0,2 %/);
  assert.match(explainCaptureStatV1({definition:def,points:5}), /1 %/);
});

test("Defense is optional and user-defined coefficients remain authoritative", async () => {
  const raw = await readJson("data/capture/monster-capture-stat-registry.v1.json");
  const withoutDefense = normalizeCaptureStatRegistryV1({
    ...raw, stats: raw.stats.filter(s => s.id !== "defense")
  });
  assert.equal(withoutDefense.stats.some(s => s.id === "defense"), false);
  const absent = projectCaptureStatEffectsV1({
    registry:withoutDefense,
    statValues:{schema:"capture-creature-stat-values-v1",creatureId:"custom",values:{fire:2}}
  });
  assert.equal(absent.damageReductionPct, 0);
  const modified = normalizeCaptureStatRegistryV1({...raw,stats:raw.stats.map(s => s.id === "defense" ? {...s,damageReductionPctPerPoint:0.75} : s)});
  const defense = modified.stats.find(s => s.id === "defense");
  assert.match(explainCaptureStatV1({definition:defense,points:12}), /0,75 %/);
  assert.match(explainCaptureStatV1({definition:defense,points:12}), /9 %/);
  assert.equal(projectCaptureStatEffectsV1({registry:modified,statValues:{schema:"capture-creature-stat-values-v1",creatureId:"custom",values:{defense:12}}}).damageReductionPct, 9);
});

test("skill explanation is derived from actual effect fields, not a fixed spell name", async () => {
  const file = await readJson("data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json");
  const draft=file.draft;
  const summary = summarizeCaptureSkillSettingsV1({
    name:draft.definition.name,
    form:draft.definition.form,
    element:draft.definition.element,
    energyCost:draft.definition.energyCost,
    requiredLevel:draft.requiredLevel,
    preparationMs:draft.definition.preparationMs,
    travelMs:draft.definition.travelMs,
    recoveryMs:draft.definition.recoveryMs,
    cooldownMs:draft.definition.cooldownMs,
    maxUsesPerCombat:draft.definition.maxUsesPerCombat,
    effects:draft.definition.effects
  });
  assert.match(summary,/15 s/);
  assert.match(summary,/5 dégâts de base/);
  assert.match(summary,/1 s/);
  assert.match(summary,/agrand/);
  assert.match(summary,/3 activations/);
  assert.match(summary,/niveau 20/);
  assert.match(summary,/2 s/);
  assert.doesNotMatch(summary,/7 s/);
  assert.doesNotMatch(summary,/projectile invisible/);
  const custom=summarizeCaptureSkillSettingsV1({
    name:"Compétence personnelle",energyCost:8,requiredLevel:3,
    effects:[{kind:"heal",targetScope:"self",amount:21},
      {kind:"apply_status",targetScope:"self",status:{kind:"heal_over_time",durationMs:9000,tickIntervalMs:3000,amount:4}}]
  });
  assert.match(custom,/21 PV/);
  assert.match(custom,/4 PV/);
  assert.match(custom,/3 s/);
  assert.match(custom,/9 s/);
  assert.match(custom,/8 énergie/);
});

test("editor includes tactile native info controls, live previews and no forced defense", async () => {
  const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const ui=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.match(html,/<details[^>]*data-context-help="stats"/);
  assert.match(html,/<details[^>]*data-context-help="skill"/);
  assert.match(html,/data-context-stat-summary/);
  assert.match(html,/data-context-skill-summary/);
  assert.match(html,/<summary[^>]*>[^<]*ⓘ/);
  assert.match(ui,/mountCaptureContextualHelpV1/);
  assert.match(ui,/data-stat-definition-remove/);
});
