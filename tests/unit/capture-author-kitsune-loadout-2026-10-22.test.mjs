import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const path="data/capture/showcase/kitsune_lunaire.capture-creature-transfer-v1.json";
const archiveOld="data/capture/source-exports/gensrpg-capture-creature-kitsune_lunaire-2026-10-22.json";
const archiveNew="data/capture/source-exports/gensrpg-capture-creature-kitsune_lunaire-2026-10-22-r2.json";
const registry=normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));
const active=()=>importCaptureTransferJsonV1(read(path),{statRegistry:registry}).value;

test("Kitsune R2 source archives remain intact as new active author slots are added",()=>{
 assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(p=>p===path).length,1);
 assert.notEqual(read(path),read(archiveNew),"R2 inactive archive remains immutable after the newer active author export");
 assert.ok(read(archiveOld)!==read(archiveNew),"original Kitsune R1 must remain archived immutably");
 assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.includes(archiveNew),false);
 const old=JSON.parse(read(archiveOld));
 assert.deepEqual(old.draft.skillIds,[]);
 assert.equal(active().draft.id,"kitsune_lunaire");
});

test("Kitsune equips the five exact authored skills, whose configuredSkill imports resolve",()=>{
 const creature=active();
 const ids=["teleport-strike","Onde Spirituel","fleche_spirituel","aura-lunaire","Sacrifice_kitsune"];
 assert.deepEqual(creature.draft.skillIds,ids);
 assert.deepEqual(creature.loadout.slots.map(s=>s.skillId),ids);
 for(const id of ids){
   const skillPath="data/capture/showcase/"+id+".capture-skill-transfer-v1.json";
   assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===skillPath).length,1);
   const skill=importCaptureTransferJsonV1(read(skillPath));
   assert.equal(skill.kind,"skill");
   assert.equal(skill.value.draft.id,id);
 }
});

test("Kitsune R2 updates only explicitly authored view overrides and slots, preserving static 3 assets and sockets",()=>{
 const previous=JSON.parse(read(archiveOld)),next=active();
 const old=previous.draft.presentation,visual=next.draft.presentation;
 assert.deepEqual(visual.visual,old.visual);
 assert.deepEqual(visual.sockets,old.sockets);
 assert.deepEqual(visual.audio,old.audio);
 assert.deepEqual(visual.viewOverrides,{player:{displayScale:1,position:{x:0,y:0}},opponent:{displayScale:.7,position:{x:-30,y:50}}});
 assert.equal(next.draft.presentation.profileId,old.profileId);
 assert.deepEqual(next.statValues,previous.statValues);
 assert.deepEqual(next.draft.combat,previous.draft.combat);
 assert.deepEqual(next.draft.capture,previous.draft.capture);
});
