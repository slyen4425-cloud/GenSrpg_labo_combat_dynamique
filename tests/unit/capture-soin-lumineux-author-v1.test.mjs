import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { buildHumanEvolutionV1 } from "../../src/ui/capture-editor-human-v2.js";
import { shouldTestSavedCreatureWhenEvolutionIncompleteV1 } from "../../src/ui/capture-editor-combat-test-v1.js";

const path = "data/capture/showcase/cap_light_special_1.capture-skill-transfer-v1.json";
const file = new URL("../../" + path, import.meta.url);

test("Soin lumineux preserves the exact creator export, unique canonical ID, heals 35 and consumes all markers", async () => {
  const raw = await readFile(file);
  assert.equal(raw.length, 4166);
  assert.equal(createHash("sha256").update(raw).digest("hex"),
    "395adeb9b56af9a1b518a99e3f746fbcaa2f7199b239b702347b5415e9fb01cf");
  const transfer = importCaptureTransferJsonV1(raw.toString("utf8"));
  assert.equal(transfer.kind, "skill");
  const draft = transfer.value.draft;
  assert.equal(draft.id, "cap_light_special_1");
  assert.equal(draft.definition.name, "Soin lumineux");
  assert.equal(draft.requiredLevel, 10);
  assert.equal(draft.definition.form, "self");
  assert.equal(draft.definition.energyCost, 5);
  assert.equal(draft.definition.cooldownMs, 45000);
  assert.deepEqual(draft.definition.effects.map(({kind}) => kind), ["heal", "consume_marker"]);
  assert.equal(draft.definition.effects[0].amount, 35);
  assert.equal(draft.definition.effects[1].markerId, "*");
  assert.equal(draft.definition.effects[1].count, "all");
  assert.equal(draft.definition.effects[1].minimum, 1);
  assert.equal(draft.presentation.visual.impact.assetId,
    "pack:capture:sprite-status-healing-aura-01");
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(item => item === path).length, 1);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length, 36);
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size, 36);
});

test("Combat skill test can reuse a saved creature when an independent unsaved evolution is incomplete", () => {
  const configuredCreatures = new Map([["crea_lumilo", {draft:{id:"crea_lumilo"}}]]);
  const inputs = {
    selectedCreatureId: "crea_lumilo",
    hasUnsavedCreatureChanges: true,
    evolutionEnabled: true,
    evolutionTargetId: "",
    configuredCreatures
  };
  assert.equal(shouldTestSavedCreatureWhenEvolutionIncompleteV1(inputs), true);
  assert.equal(shouldTestSavedCreatureWhenEvolutionIncompleteV1({...inputs, evolutionTargetId:"crea_solarys"}), false);
  assert.equal(shouldTestSavedCreatureWhenEvolutionIncompleteV1({...inputs, selectedCreatureId:null}), false);
  assert.equal(shouldTestSavedCreatureWhenEvolutionIncompleteV1({...inputs, hasUnsavedCreatureChanges:false}), false);
  assert.equal(shouldTestSavedCreatureWhenEvolutionIncompleteV1({...inputs, evolutionEnabled:false}), false);
  assert.equal(shouldTestSavedCreatureWhenEvolutionIncompleteV1({...inputs, selectedCreatureId:"unknown"}), false);

  assert.throws(() => buildHumanEvolutionV1({enabled:true,targetId:"",level:18}),
    /Créature cible de l’évolution est obligatoire/);
  assert.deepEqual(buildHumanEvolutionV1({enabled:false,targetId:"",level:18}), null);
  assert.equal(buildHumanEvolutionV1({enabled:true,targetId:"crea_solarys",level:18}).targetId, "crea_solarys");
});

test("Editor only bypasses incomplete evolution for combat preview, never saves a partial evolution", async () => {
  const source = await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.match(source,/const useSavedCreatureForTest = shouldTestSavedCreatureWhenEvolutionIncompleteV1\(/);
  assert.match(source,/readCreatureRecord: \(\) => useSavedCreatureForTest\s*\? null/);
  assert.match(source,/Le brouillon créature reste inchangé/);
});
