import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {skillPresenceReachV1} from "../../src/core/combat/combat-presence-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const archive="data/capture/source-exports/gensrpg-capture-skill-attaque-sous-terraine-author-2026-11-05-v13.json";
const active="data/capture/showcase/attaque-sous-terraine.capture-skill-transfer-v1.json";

test("RED: exact author V13 transfer is active with 25 seconds cooldown and one published ID",()=>{
 const original=read(archive),showcase=read(active);
 assert.equal(createHash("sha256").update(original).digest("hex"),"122c97ceb6fa521ff5090f08c208fdc9787bb92f49984a33b1a2490b22e32b83",
  "uploaded source must remain byte-identical");
 assert.equal(showcase,original,"Showcase must be the exact source, not an approximated rewrite");
 const payload=JSON.parse(showcase),draft=payload.draft,skill=normalizeSkillDefinition(draft.definition);
 assert.equal(payload.schema,"capture-skill-transfer-v1");
 assert.equal(draft.id,"attaque-sous-terraine");
 assert.equal(skill.approachMode,"burrow");
 assert.equal(skill.cooldownMs,25000);
 assert.equal(skill.travelMs,2000);
 assert.equal(skill.preparationMs,900);
 assert.equal(skill.effects[0].amount,15);
 assert.deepEqual(skill.hitPresenceStates,["surface","underground"]);
 assert.equal(draft.presentation.version,13);
 assert.equal(draft.presentation.visual.burrowTerrain.impact.assetId,"burrow:impact");
 assert.equal(draft.presentation.visual.burrowTerrain.impact.scale,4);
 assert.equal(draft.presentation.visual.burrowTerrain.impact.offsetY,-130);
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(path=>path===active).length,1);
 const loaded=importCaptureTransferJsonV1(showcase);
 assert.equal(loaded.kind,"skill");
 assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(loaded.value.draft)).value.draft,loaded.value.draft);
});

test("burrow owner's own hitPresenceStates do not make it vulnerable to ordinary surface attacks",()=>{
 const targetActionContext={action:{
  actionType:"skill",releaseAtMs:900,impactAtMs:2900,
  skill:{approachMode:"burrow"}
 },elapsedMs:1800};
 const ordinary={category:"offensive",form:"contact",approachMode:"ground"};
 const undergroundReach={...ordinary,hitPresenceStates:["surface","underground"]};
 const denied=skillPresenceReachV1({skill:ordinary,targetActionContext});
 assert.equal(denied.presence,"underground");
 assert.equal(denied.reachable,false);
 assert.equal(denied.implicitUndergroundRestriction,true);
 assert.equal(skillPresenceReachV1({skill:undergroundReach,targetActionContext}).reachable,true);
 assert.equal(skillPresenceReachV1({skill:ordinary,targetActionContext:{...targetActionContext,elapsedMs:800}}).reachable,true);
 assert.equal(skillPresenceReachV1({skill:ordinary,targetActionContext:{...targetActionContext,elapsedMs:3000}}).reachable,true);
});
