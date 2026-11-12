import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {
 CAPTURE_CREATURE_DEFENSIVE_REACTION_DEFAULT_V1,
 normalizeCaptureCreatureDefensiveReactionV1
} from "../../src/contracts/capture-creature-defensive-reaction-v1.js";
import {adaptCaptureCreatureToFighterConfig} from "../../src/adapters/input/capture/capture-creature-to-fighter-config.js";

// The actual official author catalog, not a hardcoded demo fighter list.
const transfers=CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.map(path=>
 JSON.parse(readFileSync(new URL("../../"+path,import.meta.url),"utf8")));
const byId=new Map(transfers.map(record=>[record.draft.id,record]));
const legacyIds=["crea-loup","crea_ailevent","crea_dracendre",
 "crea_foudrillon","crea_maraileron","crea_voltik"];
const defenseIds=["crea_crys_2","crea_mossback","crea_nat_1","crea_scar_2","gorice","crea_sylvorne"];
const ownDodgeIds=["crea_lumilo","crea_ombre_2","crea_tox_2","kitsune_lunaire"];

test("every published Showcase creature has an explicit combat-owned defensive action",()=>{
 assert.equal(transfers.length,18,"the 16 previous author species, Sylvorne and Sélachombre remain visible once");
 assert.equal(byId.size,transfers.length,"one authority per species");
 assert.deepEqual([...byId.keys()].sort(),
  [...legacyIds,...defenseIds,...ownDodgeIds,"crea_mer_3"].sort());
 for(const [id,record] of byId){
  const reaction=record.draft.combat.reaction;
  assert.ok(reaction,id+" must not silently inherit disabled legacy gameOptions");
  const normalized=normalizeCaptureCreatureDefensiveReactionV1(reaction);
  const fighter=adaptCaptureCreatureToFighterConfig(record.draft);
  assert.deepEqual(fighter.defensiveReaction,normalized,id+" real Combat export");
  assert.equal(fighter.defensiveCreatureId,id);
  assert.equal(record.loadout.creatureId,id,"preserve five authored ability slots");
  assert.equal(record.loadout.slots.length,5);
 }
});
test("six legacy entries explicitly receive the existing standard Dodge contract",()=>{
 for(const id of legacyIds)
  assert.deepEqual(byId.get(id).draft.combat.reaction,
   CAPTURE_CREATURE_DEFENSIVE_REACTION_DEFAULT_V1,id);
});
test("preconfigured Defense and Dodge remain author-owned, not overwritten by fallback",()=>{
 for(const id of defenseIds)assert.equal(byId.get(id).draft.combat.reaction.type,"defense",id);
 for(const id of ownDodgeIds)assert.equal(byId.get(id).draft.combat.reaction.type,"dodge",id);
 // The unlocked skill named dodge is not the standalone rechargeable action.
 assert.equal(byId.get("crea_voltik").loadout.slots.some(s=>s.skillId==="dodge"),true);
 assert.equal(byId.get("crea_ailevent").loadout.slots.some(s=>s.skillId==="dodge"),false);
});
