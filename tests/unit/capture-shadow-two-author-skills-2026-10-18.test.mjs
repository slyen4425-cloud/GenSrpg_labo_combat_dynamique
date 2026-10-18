import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as catalog } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1, planCaptureTransferImportV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { buildCaptureEditorDatabaseV1, applyCaptureTransferPlanToEditorStateV1 } from "../../src/ui/capture-editor-file-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { normalizeCaptureProgressionRulesV1 } from "../../src/contracts/capture-progression-rules-v1.js";
import { capturePortableNativeSkillDraftsV1 } from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import { captureComplexNativeSkillDraftsV1 } from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";

const fixtures = [
  { id: "lib_lifesteal_strike", name: "Frappe vampirique", hash: "05837ae77fd87d7281179c9f0f8fae3d91dc4f38154b6455617f2b22eae3dec9", source: "gensrpg-capture-skill-lib_lifesteal_strike-2026-10-18-r2.json", damage: 18, icon: "core:icon-skill-arcane-seal-01" },
  { id: "cap_shadow_atk_1", name: "Ombre vive", hash: "eaa07086056b89e75efb8bb7909ccbb2f6f4ce61f79bb023d4a83f9ac9f64346", source: "gensrpg-capture-skill-cap_shadow_atk_1-2026-10-18.json", damage: 12, icon: "core:icon-skill-speed-dash-01" }
];
const read = p => readFile(new URL("../../" + p, import.meta.url), "utf8");
const path = id => "data/capture/showcase/" + id + ".capture-skill-transfer-v1.json";

test("shadow author skills: full supplied bytes, source archive, identity and single active catalog entry", async () => {
  for (const f of fixtures) {
    assert.equal(catalog.filter(p => p === path(f.id)).length, 1, f.id);
    const raw = await read(path(f.id));
    assert.equal(raw, await read("data/capture/source-exports/" + f.source), f.id + " source archive");
    assert.equal(createHash("sha256").update(raw).digest("hex"), f.hash, f.id + " authored bytes");
    const transfer = importCaptureTransferJsonV1(raw);
    assert.equal(transfer.kind, "skill");
    const draft = transfer.value.draft;
    assert.equal(draft.id, f.id);
    assert.equal(draft.definition.id, f.id);
    assert.equal(draft.definition.name, f.name);
    assert.equal(draft.definition.element, "shadow");
    assert.equal(draft.definition.effects.find(e => e.kind === "damage").amount, f.damage);
    assert.equal(draft.presentation.visual.icon.assetId, f.icon);
    assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft, draft);
  }
});

test("Frappe vampirique has exact author's 50% life steal before 18 damage; Ombre vive keeps teleport approach", async () => {
  const vampire = importCaptureTransferJsonV1(await read(path("lib_lifesteal_strike"))).value.draft;
  assert.deepEqual(vampire.definition.effects.map(e => e.kind), ["life_steal", "damage"]);
  assert.equal(vampire.definition.effects[0].percent, 50);
  assert.equal(vampire.definition.energyCost, 4);
  assert.equal(vampire.definition.cooldownMs, 25000);
  assert.equal(vampire.presentation.visual.impact.assetId, "pack:capture:sprite-life-drain-impact-01");
  assert.equal(vampire.presentation.audio.impact.assetId, "gensrpg:sound:effect-ee93278c");
  const shadow = importCaptureTransferJsonV1(await read(path("cap_shadow_atk_1"))).value.draft;
  assert.equal(shadow.definition.approachMode, "teleport");
  assert.equal(shadow.definition.preparationMs, 600);
  assert.equal(shadow.definition.energyCost, 3);
  assert.equal(shadow.definition.cooldownMs, 10000);
  assert.equal(shadow.presentation.visual.cast.assetId, "pack:capture:sprite-projectile-shadow-01");
  assert.equal(shadow.presentation.visual.impact.assetId, "pack:capture:sprite-projectile-shadow-01");
  assert.equal(shadow.presentation.audio.travel.assetId, "gensrpg:sound:tower-6dbf268f");
});

test("both skill transfers hydrate the existing configuredSkills owner without duplication or changing unrelated drafts", async () => {
  const statRegistry = normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules = normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
  const configuredCreatures = new Map();
  const configuredSkills = new Map(capturePortableNativeSkillDraftsV1().map(s => [s.id, s]));
  for (const s of captureComplexNativeSkillDraftsV1()) if (!configuredSkills.has(s.id)) configuredSkills.set(s.id, s);
  const control = configuredSkills.get("cap_fire_atk_6");
  for (const f of fixtures) {
    const transfer = importCaptureTransferJsonV1(await read(path(f.id)));
    const beforeSize = configuredSkills.size;
    const db = buildCaptureEditorDatabaseV1({statRegistry, progressionRules, configuredCreatures, configuredSkills, metadata: {producer:"shadow-author-skill-test"}});
    const plan = planCaptureTransferImportV1({currentDatabase:db, transfer, mode:"replace"});
    assert.ok(["add-skill", "replace-skill"].includes(plan.action));
    applyCaptureTransferPlanToEditorStateV1({plan, configuredCreatures, configuredSkills, statRegistry, progressionRules});
    assert.deepEqual(configuredSkills.get(f.id), transfer.value.draft);
    assert.equal(configuredSkills.size, beforeSize + (plan.action === "add-skill" ? 1 : 0));
  }
  assert.equal(configuredSkills.get("cap_fire_atk_6"), control);
});
