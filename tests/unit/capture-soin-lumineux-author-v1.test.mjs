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

test("Soin lumineux preserves the exact creator export in source archive and changes only enemy authorization", async () => {
  const original = await readFile(new URL("../../data/capture/source-exports/gensrpg-capture-skill-cap_light_special_1-2026-10-17.json", import.meta.url));
  assert.equal(original.length, 4166);
  assert.equal(createHash("sha256").update(original).digest("hex"),
    "395adeb9b56af9a1b518a99e3f746fbcaa2f7199b239b702347b5415e9fb01cf");
  const raw = await readFile(file);
  const currentAuthor = await readFile(new URL("../../data/capture/source-exports/gensrpg-capture-skill-cap_light_special_1-2026-10-18.json", import.meta.url));
  const revised = await readFile(new URL("../../data/capture/source-exports/gensrpg-capture-skill-cap_light_special_1-2026-10-24-author-revision.json",import.meta.url));
  assert.deepEqual(raw,revised,"current Soin lumineux must match the explicit author change");
  const oldRevision=importCaptureTransferJsonV1(currentAuthor.toString("utf8")).value.draft.definition;
  assert.deepEqual(oldRevision.effects.map(({kind})=>kind),["heal","consume_marker"],
    "October 18 creator export remains archived, unmodified");
  const transfer = importCaptureTransferJsonV1(raw.toString("utf8"));
  assert.equal(transfer.kind, "skill");
  const draft = transfer.value.draft;
  assert.equal(draft.id, "cap_light_special_1");
  assert.equal(draft.definition.name, "Soin lumineux");
  assert.deepEqual(draft.definition.targetRelations, ["ally", "self"]);
  assert.equal(draft.requiredLevel, 10);
  assert.equal(draft.definition.form, "self");
  assert.equal(draft.definition.energyCost, 5);
  assert.equal(draft.definition.cooldownMs, 30000);
  assert.deepEqual(draft.definition.effects.map(({kind}) => kind), ["heal", "cleanse"]);
  assert.equal(draft.definition.effects[0].amount, 35);
  assert.deepEqual(draft.definition.effects[1].statusTags,[],
    "native cleanse must remove all detrimental states and markers");
  assert.equal(draft.presentation.visual.impact.assetId,
    "pack:capture:sprite-status-healing-aura-01");
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(item => item === path).length, 1);
  
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size, CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
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


test("Soin lumineux heals through native CombatSession, not just an editable JSON field", async () => {
  const { createCombatSession } = await import("../../src/core/combat/combat-session.js");
  const raw = await readFile(file,"utf8");
  const skill = importCaptureTransferJsonV1(raw).value.draft.definition;
  const fighter = (id, initialHp) => ({
    id, maxHp:100, initialHp, maxEnergy:15, initialEnergy:15,
    energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:1,
    chargeTimeModifierPct:0
  });
  const session = createCombatSession({
    distance:"short",fighters:[fighter("player",40),fighter("opponent",100)]
  });
  const result = session.useSkill({actorId:"player",targetId:"player",skill});
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(session.snapshot().fighters.player.hp,75,
    "35 HP must be applied by the real native effect executor");
  assert.equal(session.snapshot().fighters.opponent.hp,100);
  assert.equal(session.snapshot().fighters.player.energy,10);
});
