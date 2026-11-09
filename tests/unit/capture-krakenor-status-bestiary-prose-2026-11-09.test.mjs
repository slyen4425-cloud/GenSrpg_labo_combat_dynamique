import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {markerStatusDefinitionV1} from "../../src/contracts/capture-marker-v1.js";
import {projectStatusEffectInfoV1,statusEffectInfoTextV1} from "../../src/adapters/renderer/status-effect-info-v1.js";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";
const read=async path=>JSON.parse(await readFile(new URL("../../"+path,import.meta.url),"utf8"));
const ids=["krakenor-perle-pression","krakenor-etau-tentaculaire","krakenor-voile-encre","krakenor-bulle-implosion","krakenor-abysse-huit-bras"];
test("Pression HUD reveals real threshold, water damage, immobilization, reset and lifetime",async()=>{
 const perle=await read("data/capture/showcase/krakenor-perle-pression.capture-skill-transfer-v1.json");
 const marker=perle.draft.definition.effects.find(e=>e.kind==="apply_marker").marker;
 const info=projectStatusEffectInfoV1({instance:{definition:markerStatusDefinitionV1(marker),sourceSkillId:ids[0],stacks:2,expiresAtMs:20000},elapsedMs:5000,sourceSkill:perle.draft.definition});
 const text=statusEffectInfoTextV1(info);
 assert.equal(info.statusName,"Pression abyssale");
 assert.equal(info.typeLabel,"Marqueur");
 assert.match(text,/À 3 charges/);
 assert.match(text,/8 dégâts d.Eau/i);
 assert.match(text,/immobilise la cible pendant 1,1 s/i);
 assert.match(text,/charges sont remises à zéro/i);
 assert.doesNotMatch(text,/apply_status|damage, apply_status|effet configuré/);
});
test("Krakenor Bestiary shows five explanatory cards, named pressure and conditional ultimate",async()=>{
 const skills=await Promise.all(ids.map(id=>read("data/capture/showcase/"+id+".capture-skill-transfer-v1.json")));
 const c=await read("data/capture/showcase/crea_mer_3.capture-creature-transfer-v1.json");
 const imageIds=["pack:capture:creature-pieuvre-opponent-01","pack:capture:creature-pieuvre-player-01","pack:capture:creature-pieuvre-icon-01"];
 const files=["pieuvre_face.png","pieuvre_dos.png","pieuvre_icon.png"];
 const icons=skills.map(s=>s.draft.presentation.visual.icon.assetId);
 const assetCatalog={assets:[
 ...imageIds.map((id,i)=>({id,assetType:i===2?"portrait":"sprite",mediaType:"image",resource:{file:"capture/creatures/pieuvre/runtime/"+files[i]}})),
 ...icons.map((id,i)=>({id,assetType:"icon",mediaType:"image",resource:{file:"capture/icons/skills/test_"+i+".webp"}}))
 ]};
 const cards=captureBestiaryCardsV1({creatureTransfers:[c],skillTransfers:skills,assetCatalog});
 assert.equal(cards.length,1);
 assert.equal(cards[0].name,"Krakenor");
 const slots=cards[0].skills;
 assert.equal(slots.length,5);
 assert.ok(slots.every(slot=>slot.state==="ready"&&slot.icon&&slot.explanation.sentences.length>0));
 const lines=slots.map(slot=>slot.explanation.sentences.join(" "));
 assert.match(lines[0],/À 3 charges.*8 dégâts d.Eau.*immobilise la cible.*1,1 seconde/i);
 assert.match(lines[2],/20 %.*7 secondes/i);
 assert.match(lines[3],/Après 2,2 secondes.*18 dégâts d.Eau/i);
 assert.match(lines[4],/Pression abyssale/);
 assert.match(lines[4],/Si la cible possède au moins 2 charges de Pression abyssale, immobilise la cible pendant 1,4 seconde/i);
 assert.match(lines[4],/6 dégâts d.Eau par charge consommée/i);
 for(const line of lines)assert.doesNotMatch(line,/apply_status|consume_marker|scheduled_effect|krakenor-pression/);
});
