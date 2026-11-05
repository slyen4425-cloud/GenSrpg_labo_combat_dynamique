import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1,exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const sources={
 gorice:"data/capture/source-exports/gensrpg-capture-creature-gorice-2026-11-05-1925.json",
 wall:"data/capture/source-exports/gensrpg-capture-skill-mur_de_glace-2026-11-05-1925.json"
};
const live={
 gorice:"data/capture/showcase/gorice.capture-creature-transfer-v1.json",
 wall:"data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json"
};

test("RED: author original Gorice V9 is the exact single published transfer, with player and opponent movement",()=>{
 const archived=read(sources.gorice),published=read(live.gorice);
 assert.equal(createHash("sha256").update(archived).digest("hex"),
  "56496a621efe6a5003fdb21c7abefc0f9fd306007390729aabab7bbda2b808d8",
  "original user upload must never be edited");
 assert.equal(published,archived,"active Gorice must be the identical author export, not a rewritten approximation");
 const d=JSON.parse(published);
 assert.equal(d.schema,"capture-creature-transfer-v1");
 assert.equal(d.draft.id,"gorice");
 assert.equal(d.draft.presentation.version,9);
 assert.equal(d.draft.presentation.visual.movementBack.assetId,
  "pack:capture:creature-gorille-des-glaces-movement-player-12-v1");
 assert.equal(d.draft.presentation.visual.movement.assetId,
  "pack:capture:creature-gorille-des-glaces-movement-opponent-12-v1");
 assert.deepEqual(d.draft.presentation.visual.movementScaleByView,{player:1.5,opponent:1.5});
 assert.deepEqual(d.loadout.slots.map(slot=>slot.skillId),[
  "boule_neige","poing_givrant","mur_de_glace","pique_glace","furie_bestiale"]);
 assert.equal(d.statValues.values.glace,15);
 assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(path=>path===live.gorice).length,1);
 assert.equal(importCaptureTransferJsonV1(published).value.draft.id,"gorice");
});

test("RED: the final ice-wall export replaces exactly one official skill and keeps independent enemy placement",()=>{
 const archived=read(sources.wall),published=read(live.wall);
 assert.equal(createHash("sha256").update(archived).digest("hex"),
  "add2d3b89ec271a6445b166e72d11fdc08856f402be1cfc057bb4e4b15d51940",
  "original user upload must never be edited");
 assert.equal(published,archived,"active wall must preserve all author fields unchanged");
 const d=JSON.parse(published),effect=d.draft.definition.effects[0];
 assert.equal(d.draft.id,"mur_de_glace");
 assert.equal(d.draft.definition.effects.length,1);
 assert.equal(effect.kind,"summon_entity");
 assert.equal(effect.hpPerStatPoint,2);
 assert.deepEqual(effect.interceptKinds,["projectile","beam","contact"]);
 assert.deepEqual({
  player:[effect.arenaXPct,effect.arenaYPct,effect.visualScale,effect.visualScaleX,effect.visualScaleY],
  enemy:[effect.opponentArenaXPct,effect.opponentArenaYPct,effect.opponentVisualScale,
   effect.opponentVisualScaleX,effect.opponentVisualScaleY]
 },{player:[47,55,2.5,1.5,1.2],enemy:[70,50,1.5,1.5,1.2]});
 assert.equal(effect.opponentPlacementMode,"arena");
 assert.equal(normalizeSkillEffectV1(effect).opponentArenaXPct,70);
 assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(path=>path===live.wall).length,1);
 assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(d.draft))
  .value.draft.definition.effects[0],normalizeSkillEffectV1(effect));
});
