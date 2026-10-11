import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  importCaptureTransferJsonV1,
  exportCaptureSkillTransferJsonV1,
  exportCaptureCreatureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { normalizeCaptureStatRegistryV1 } from "../../src/contracts/capture-stat-registry-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { adaptCaptureSkillToSkillDefinition } from "../../src/adapters/input/capture/capture-skill-to-skill-definition.js";
import { buildHumanSkillDraftV1, humanSkillEditorFieldsFromDraftV1 } from "../../src/ui/capture-editor-human-v2.js";

const skillPath = "data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json";
const creaturePath = "data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json";
const load = p => readFile(new URL("../../" + p, import.meta.url), "utf8");
const sha = raw => createHash("sha256").update(raw).digest("hex");

test("the new Impact rocheux author JSON is exact, unique, has its preserved FX and authored direct targeting", async () => {
  const raw = await load(skillPath);
  assert.equal(sha(raw), "04c1330d6993bb0d5e90afd2c39d544944d2c8aa4b009cdbd075f18d4c4bed6b");
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p => p === skillPath).length, 1);
  const authored = JSON.parse(raw);
  const imported = importCaptureTransferJsonV1(raw);
  assert.equal(imported.kind, "skill");
  const d = imported.value.draft;
  assert.equal(d.id, "cap_earth_atk_4");
  assert.equal(d.definition.name, "Impact rocheux");
  assert.equal(authored.draft.definition.projectileTargeting, "fixed_point");
  const userOriginalBytes = raw.replace('"projectileTargeting": "fixed_point"', '"projectileTargeting": "direct"');
  assert.equal(sha(userOriginalBytes), "67554e742c0045b882bbfe6053cd4d5dfb93e1bb2855ea4b13eb0f68d2632bb9", "all author bytes except approved targeting correction");
  assert.equal(authored.draft.presentation.visual.travel.trajectoryMode, "skyfall");
  assert.equal(adaptCaptureSkillToSkillDefinition({ id: authored.draft.id, definition: authored.draft.definition }, authored.draft.presentation).projectileTargeting, "fixed_point");
  assert.equal(buildHumanSkillDraftV1(humanSkillEditorFieldsFromDraftV1(d)).definition.projectileTargeting, "fixed_point", "saving after opening editor must keep skyfall fixed-point");
  assert.equal(d.presentation.visual.travel.fallHeightPx, 650);
  assert.equal(d.presentation.visual.impact.displayScale, 1.7);
  assert.equal(d.presentation.visual.impact.offsetY, 0);
  assert.equal(d.presentation.visual.impact.opacity, 0.7);
  assert.equal(d.presentation.feedback.cameraShake.amplitudePx, 5);
  assert.deepEqual(d.presentation.feedback.projectileTrail,
    {color:"#ffffff",count:6,lengthPx:50,sizePx:8,opacity:1,anchorX:0.5,anchorY:0.4});
  assert.equal(d.presentation.feedback.aftermathSmoke.sizePx, 35);
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(d)).value.draft, d);
});

test("Moussados author JSON is exact, unique, imports views without changing stats, sockets or loadout", async () => {
  const raw = await load(creaturePath);
  assert.equal(sha(raw), "1c9ec63d0b5ff99e67cb228039a3bd7420fefc27e7eccc5078a401124027fa3e");
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(p => p === creaturePath).length, 1);
  const registry = normalizeCaptureStatRegistryV1(JSON.parse(await load("data/capture/monster-capture-stat-registry.v1.json")));
  const imported = importCaptureTransferJsonV1(raw, {statRegistry:registry});
  assert.equal(imported.kind, "creature");
  const {draft,statValues,loadout} = imported.value;
  assert.equal(draft.id, "crea_mossback");
  assert.equal(draft.displayName, "Moussados");
  assert.equal(draft.level, 1);
  assert.deepEqual(draft.presentation.viewOverrides, {
    player:{displayScale:1.7,position:{x:0,y:0}},
    opponent:{displayScale:1.2,position:{x:-30,y:35}}
  });
  assert.equal(draft.presentation.profileId, "massive");
  assert.equal(draft.presentation.sockets.find(s=>s.id==="mouth").back.x, 0.9318691325306842);
  assert.equal(draft.presentation.sockets.find(s=>s.id==="mouth").front.y, 0.6934029261271158);
  assert.equal(statValues.values.health, 200);
  assert.equal(statValues.values.earth, 10);
  assert.equal(draft.resistances.find(r=>r.kind==="element:fire").value,50);
  assert.deepEqual(loadout.slots.map(s=>s.skillId),
    ["cap_earth_atk_2","lib_earth_guard","cap_earth_atk_4","cap_earth_atk_3","cap_earth_atk_7"]);
  assert.deepEqual(
    importCaptureTransferJsonV1(exportCaptureCreatureTransferJsonV1(imported.value), {statRegistry:registry}).value,
    imported.value
  );
});

test("Human editor derives fixed_point from skyfall and direct from linear without extra game authority", () => {
  const base = {
    id:"skyfall-export-test",name:"Skyfall export",description:"",requiredLevel:1,
    usageScopes:["capture"],category:"offensive",form:"projectile",element:"earth",
    approachMode:"none",energyCost:1,preparationMs:100,travelMs:400,recoveryMs:100,
    cooldownMs:1000,allowedDistances:["medium"],targetRelations:["enemy"],
    damage:10,heal:0,stunMs:0,presentation:{travelAssetId:"pack:capture:sprite-falling-rock-skyfall-01",travelTrajectoryMode:"skyfall",fallHeightPx:650,fallOffsetXPx:0}
  };
  assert.equal(buildHumanSkillDraftV1(base).definition.projectileTargeting,"fixed_point");
  const linear = {...base,presentation:{...base.presentation,travelTrajectoryMode:"linear"}};
  assert.equal(buildHumanSkillDraftV1(linear).definition.projectileTargeting,"direct");
});
