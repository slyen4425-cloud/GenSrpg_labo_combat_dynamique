import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureMarkerLibraryV1} from "../../src/contracts/capture-marker-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const root = new URL("../../",import.meta.url);
const read = path=>readFile(new URL(path,root),"utf8");
const creatureFile="data/capture/showcase/crea_nat_1.capture-creature-transfer-v1.json";
const markerFile="data/capture/showcase/markers.capture-markers-v1.json";
const skillFile="data/capture/showcase/graine_sansue_cap.capture-skill-transfer-v1.json";
const cSource="data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r3.json";
const mSource="data/capture/source-exports/gensrpg-marqueurs-2026-10-29-r2.json";

test("exact author creature r3 source, one canonical Grainou and Spore equipped in slot 3",async()=>{
 const raw=await read(cSource);
 assert.equal(createHash("sha256").update(raw).digest("hex"),"70a9390ff81d42d7f2dc9ec574091078a31e20bdad48f8540a23ea627c78a72b");
 const author=JSON.parse(raw);
 const active=JSON.parse(await read(creatureFile));
 assert.notDeepEqual(active,author,"Grainou r4 supersedes the archived r3 source");
 const registry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
 assert.equal(importCaptureTransferJsonV1(await read(creatureFile),{statRegistry:registry}).kind,"creature");
 assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x===creatureFile).length,1);
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x==="data/capture/showcase/Spore_soporifique.capture-skill-transfer-v1.json").length,1);
 assert.equal(active.draft.combat.reaction.activeWindowMs,800);
 assert.ok(active.draft.skillIds.includes("Spore_soporifique"));
 assert.deepEqual(active.loadout.slots.map(x=>x.skillId),["coupe_feuille","graine_sansue_cap","Spore_soporifique","explosion_florale","liane_venimeuse"]);
 assert.equal(active.draft.presentation.visual.front.assetId,"pack:capture:creature-heriplante-opponent-01");
 assert.equal(active.draft.presentation.visual.back.assetId,"pack:capture:creature-heriplante-player-01");
});

test("exact author marker r2 source, one active library and the SAME Graine sansue limit in skill",async()=>{
 const raw=await read(mSource);
 assert.equal(createHash("sha256").update(raw).digest("hex"),"9eb2fd0018119aaf672ffc04edf092b3c91dde2aad72620c263b47ddd003c1b5");
 const author=JSON.parse(raw);
 const active=JSON.parse(await read(markerFile));
 assert.deepEqual(active,author,"one canonical marker library must match author JSON");
 assert.equal(active.markers.length,5);
 assert.equal(new Set(active.markers.map(x=>x.id)).size,5);
 const normalized=normalizeCaptureMarkerLibraryV1(active.markers);
 const marker=normalized.find(m=>m.id==="graine-sansue");
 assert.equal(marker.maxStacks,2);
 const skill=JSON.parse(await read(skillFile));
 assert.equal(skill.draft.definition.effects[0].marker.maxStacks,2,
    "the active skill embeds the same canonical marker, not an outdated maxStacks 10 definition");
 assert.deepEqual(skill.draft.definition.effects[0].marker,marker);
});

test("historical author's skill and marker archives remain immutable, never rewritten for r3",async()=>{
 const previous=await read("data/capture/source-exports/gensrpg-capture-skill-graine_sansue_cap-2026-10-28-r2.json");
 assert.equal(JSON.parse(previous).draft.definition.effects[0].marker.maxStacks,10);
 const historical=JSON.parse(await read("data/capture/source-exports/gensrpg-marqueurs-2026-10-28.json"));
 assert.equal(historical.markers.find(m=>m.id==="graine-sansue").maxStacks,10);
});
