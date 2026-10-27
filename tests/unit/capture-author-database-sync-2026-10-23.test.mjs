import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>JSON.parse(readFileSync(new URL("../../"+path,import.meta.url),"utf8"));
const manifest=read("data/capture/source-exports/capture-author-refresh-manifest-2026-10-23.json");
const stable=x=>Array.isArray(x)?`[${x.map(stable).join(",")}]`:x&&typeof x==="object"?`{${Object.keys(x).sort().map(k=>JSON.stringify(k)+":"+stable(x[k])).join(",")}}`:JSON.stringify(x);
const fingerprint=x=>{let h=2166136261,s=stable(x);for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h.toString(16).padStart(8,"0")};
const skill=id=>read("data/capture/showcase/"+id+".capture-skill-transfer-v1.json").draft;
const creature=id=>{const j=read("data/capture/showcase/"+id+".capture-creature-transfer-v1.json");return {draft:j.draft,statValues:j.statValues,loadout:j.loadout}};
test("every one of 4 materially edited author skills is published with exact field content",()=>{
 assert.equal(manifest.authorChangedSkillIds.length,4);
 for(const id of manifest.authorChangedSkillIds)assert.equal(fingerprint(skill(id)),manifest.publishedFingerprints[id],id);
});
test("the 2 adjusted creature records include author loadouts and animations",()=>{
 assert.equal(manifest.authorChangedCreatureIds.length,2);
 for(const id of manifest.authorChangedCreatureIds){
  const record=creature(id);
  assert.equal(typeof record.draft.id,"string",id);
  assert.ok(Array.isArray(record.loadout.slots),id);
  assert.ok(record.draft.presentation?.visual,id);
  // Historic fingerprint is provenance for the October 23 snapshot, not a lock on subsequent author exports.
 }
});
test("author fire ultimate cost, personal settings, and safe sacrificial effects remain",()=>{
 assert.equal(skill("cap_fire_atk_7").definition.energyCost,8);
 assert.equal(skill("lib_heat_wave").definition.energyCost,0);
 const x=skill("Sacrifice_kitsune");
 assert.deepEqual(x.definition.targetRelations,["self"]);
 assert.deepEqual(manifest.originalSacrificeKitsuneTargetRelations,["ally","self"]);
 const z=x.definition.effects.filter(e=>e.kind==="persistent_zone");
 assert.equal(z.length,3);assert.ok(z.every(e=>e.durationMs===45000&&e.persistAfterRecall&&e.targetScope==="all_allies"));
 assert.deepEqual(z.map(e=>e.tickEffect.status.kind),["energy_regen_modifier","heal_over_time","outgoing_damage_modifier"]);
 assert.equal(z[0].tickEffect.status.modifierPct,100);assert.equal(z[1].tickEffect.status.amount,10);
 assert.equal(z[1].tickEffect.status.tickIntervalMs,2000);assert.equal(z[2].tickEffect.status.modifierPct,200);
 assert.equal(x.definition.effects.at(-1).kind,"knockout");
 assert.equal(x.presentation.visual.aura.opacity,0.2);
 assert.deepEqual(creature("kitsune_lunaire").loadout.slots.map(a=>a.skillId),["teleport-strike","Onde Spirituel","fleche_spirituel","aura-lunaire","Sacrifice_kitsune"]);
 assert.deepEqual(creature("crea_dracendre").draft.presentation.visual.movementScaleByView,{player:1.7,opponent:1.7});
});
