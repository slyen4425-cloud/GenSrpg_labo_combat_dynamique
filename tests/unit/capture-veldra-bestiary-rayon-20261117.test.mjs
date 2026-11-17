import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";
const transfer=(id,kind="skill")=>JSON.parse(readFileSync(new URL(
  "../../data/capture/showcase/"+id+".capture-"+kind+"-transfer-v1.json",import.meta.url),"utf8"));
const ids=["veldra-plume-solaire","veldra-percee-aurore","veldra-egide-zenith",
  "veldra-rayon-cardinal","veldra-releve-celeste"];
const skill=id=>transfer(id).draft;
const prose=definition=>describeCaptureSkillV1(definition).sentences.join(" ");

test("Relève céleste Bestiary text projects the native effect without a fixed Veldra description",()=>{
  const original=skill(ids[4]).definition;
  const text=prose(original);
  for(const phrase of ["propre réserve","K.O.","100 PV","20 %","30 secondes","place du lanceur","verrous"])
    assert.ok(text.includes(phrase),phrase+" absent from "+text);
  assert.doesNotMatch(text,/Effet non encore décrit|ally_reserve_relay/);
  const effect=original.effects[0];
  const altered=prose({...original,effects:[{...effect,healAmount:45,outgoingDamagePct:35,durationMs:14000}]});
  assert.match(altered,/45 PV/);
  assert.match(altered,/35 %/);
  assert.match(altered,/14 secondes/);
  assert.doesNotMatch(altered,/100 PV|20 %|30 secondes/);
});

test("Rayon cardinal is 5×8 in 2 seconds, with +10 only on actual fifth tick when marked",()=>{
  const def=skill(ids[3]).definition;
  assert.equal(def.channeling.maxTicks,5);
  assert.equal(def.channeling.tickIntervalMs,400);
  assert.equal(def.channeling.effects[0].amount,8);
  assert.equal(def.channeling.finalTickEffects[0].amount,10);
  const text=prose(def);
  assert.match(text,/8 dégâts de Lumière toutes les 0,4 secondes/);
  assert.match(text,/5 pulsations maximum/);
  assert.match(text,/5e pulsation réellement atteinte/);
  assert.match(text,/10 dégâts de Lumière/);
  assert.match(text,/si la cible possède au moins une charge/i);
});

test("Égide describes only removal of slowdown and keeps other debuffs",()=>{
  const text=prose(skill(ids[2]).definition);
  assert.match(text,/25 PV/);
  assert.match(text,/défense de 200 points/);
  assert.match(text,/Supprime uniquement les ralentissements/);
  assert.doesNotMatch(text,/Supprime tous les effets et marqueurs négatifs/);
});

test("Veldra real Bestiary card displays authored ultimate and beam explanations",()=>{
  const creature=transfer("Veldra_crea","creature"),skills=ids.map(id=>transfer(id));
  const visual=creature.draft.presentation.visual;
  const catalog={assets:[
    ...[visual.front.assetId,visual.back.assetId,visual.icon.assetId].map((id,i)=>({
      id,assetType:i===2?"icon":"sprite",mediaType:"image",resource:{file:"capture/test.webp"}})),
    ...skills.map(t=>({id:t.draft.presentation.visual.icon.assetId,assetType:"icon",
      mediaType:"image",resource:{file:"capture/test.webp"}}))
  ]};
  const [card]=captureBestiaryCardsV1({creatureTransfers:[creature],
    skillTransfers:skills,assetCatalog:catalog,statRegistry:{stats:[]}});
  assert.ok(card);
  const last=card.skills.find(x=>x.slot==="slot-ultimate");
  const beam=card.skills.find(x=>x.slot==="slot-4");
  assert.equal(last.state,"ready");
  assert.equal(last.name,"Relève céleste");
  assert.match(last.explanation.sentences.join(" "),/100 PV.*20 %.*30 secondes/);
  assert.match(beam.explanation.sentences.join(" "),/8 dégâts.*5e pulsation/);
});

test("Veldra has four official FX sprite bindings; Percée icon only remains an explicit author gap",()=>{
  const roles=["cast","beamStart","travel","impact","zone","aura","status"];
  const visuals=ids.map(id=>skill(id).presentation.visual);
  assert.deepEqual(visuals.map(v=>roles.filter(r=>v[r]?.assetId).length),[1,0,1,3,1]);
  assert.ok(visuals.every(v=>v.icon?.assetId));
});
