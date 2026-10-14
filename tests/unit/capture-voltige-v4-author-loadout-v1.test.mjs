import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {
 importCaptureTransferJsonV1,
 exportCaptureCreatureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as creatures} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as skills} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
const path="data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json";
const source=()=>readFileSync(new URL("../../"+path,import.meta.url));
const registry=normalizeCaptureStatRegistryV1(JSON.parse(readFileSync(new URL("../../data/capture/monster-capture-stat-registry.v1.json",import.meta.url),"utf8")));
const expected="27a57678225ce2ed0f1a0ae270b59a2bcd48ccca79af59e96b84aba09e6c4fd6";

test("RED before transfer replacement: Voltige V4 is byte-identical to the authored 5458-byte export",()=>{
 const b=source();
 assert.equal(b.byteLength,5458);
 assert.equal(createHash("sha256").update(b).digest("hex"),expected);
 assert.equal(JSON.parse(b.toString("utf8")).draft.id,"crea_voltik");
 assert.equal(creatures.filter(p=>p===path).length,1);
});
test("Voltige V4 equips dodge and Surcharge ultimate without discarding the character and authored sockets",()=>{
 const d=JSON.parse(source().toString("utf8"));
 assert.equal(d.draft.skillIds.length,15);
 assert.equal(d.draft.skillIds.filter(x=>x==="dodge").length,1);
 assert.deepEqual(d.loadout.slots.map(x=>x.skillId),[
   "teleport-strike","lib_static_bite","lib_chain_lightning","dodge","cap_electric_special_2"
 ]);
 assert.equal(d.draft.presentation.profileId,"biped");
 assert.equal(d.draft.presentation.displayScale,1.08);
 assert.equal(d.draft.presentation.viewOverrides.player.displayScale,0.9);
 assert.equal(d.draft.presentation.viewOverrides.opponent.displayScale,0.7);
 assert.deepEqual(d.draft.presentation.viewOverrides.opponent.position,{x:0,y:60});
 assert.equal(d.draft.combat.approachTimeModifierPct,-40);
 assert.equal(d.statValues.values.health,120);
 assert.equal(d.statValues.values.electric,15);
 assert.equal(d.draft.presentation.sockets.length,5);
 assert.equal(d.draft.capture.evolution.targetId,"crea_fulguro");
 for(const id of ["dodge","cap_electric_special_2"]) {
   const skillPath="data/capture/showcase/"+id+".capture-skill-transfer-v1.json";
   assert.equal(skills.filter(p=>p===skillPath).length,1,"capability already registered, never duplicated");
   const skill=JSON.parse(readFileSync(new URL("../../"+skillPath,import.meta.url),"utf8"));
   assert.equal(skill.draft.id,id);
 }
 const transfer=importCaptureTransferJsonV1(source().toString("utf8"),{statRegistry:registry});
 assert.equal(transfer.kind,"creature");
 assert.deepEqual(transfer.value.loadout.slots.map(s=>s.skillId),d.loadout.slots.map(s=>s.skillId));
 const round=importCaptureTransferJsonV1(exportCaptureCreatureTransferJsonV1(transfer.value,{statRegistry:registry}),{statRegistry:registry});
 assert.deepEqual(round.value,transfer.value);
});
