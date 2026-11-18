import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";

const root=path=>new URL("../../"+path,import.meta.url);
const read=path=>JSON.parse(readFileSync(root(path),"utf8"));
const skill=id=>read("data/capture/showcase/"+id+".capture-skill-transfer-v1.json");
const battement=skill("ephemus-battement-limbes");
const lanterne=skill("ephemus-lanterne-ames");
const ultimate=skill("ephemus-danse-mille-ames");
const textOf=t=>describeCaptureSkillV1(t.draft.definition,{markerNames:{"ephemus-voile":"Voile"}}).sentences.join(" ");

test("Éphémus Battement: actual movement-approach slowdown stays 30% for 20 seconds, never 3",()=>{
  const status=battement.draft.definition.effects.find(x=>x.status?.kind==="approach_time_modifier");
  assert.equal(status.status.modifierPct,30);
  assert.equal(status.status.durationMs,20000);
  assert.match(battement.draft.description,/20 s/);
  assert.match(textOf(battement),/temps d'approche de 30 %.*20 secondes/);
  assert.doesNotMatch(textOf(battement),/3 secondes/);
});

test("Generic Bestiary explains channel-specific damage vulnerability in French, not its internal type",()=>{
  const text=textOf(lanterne);
  assert.doesNotMatch(text,/incoming_damage_channel_modifier|Applique un effet|Effet non encore décrit/i);
  assert.match(text,/20 %/);
  assert.match(text,/dégâts d'Esprit reçus/);
  assert.match(text,/4 dégâts d'Esprit/);
  assert.match(text,/0,5 secondes/);
  assert.match(text,/5 secondes/);
  assert.match(text,/tant que les créatures s'y trouvent/);
});

test("Éphémus ultimate has coherent channel wording, exact ticks and active Voile bonus",()=>{
  const text=textOf(ultimate);
  assert.doesNotMatch(text,/Canalise inflige|durant 3 secondes maximum, interrompue/i);
  assert.match(text,/Canalise une attaque pendant 3 secondes/);
  assert.match(text,/10 dégâts d'Esprit/);
  assert.match(text,/toutes les 0,5 secondes/);
  assert.match(text,/6 pulsations maximum/);
  assert.match(text,/40 dégâts d'Esprit/);
  assert.match(text,/Voile/);
  assert.match(text,/Utilisable une fois par combat/);
});

test("Real Bestiary card consumes the unique normalized skill explanations",()=>{
  const creature=read("data/capture/showcase/Ephemus.capture-creature-transfer-v1.json");
  const skills=[
    skill("ephemus-poussiere-oubli"),battement,
    skill("ephemus-chrysalide-fantome"),lanterne,ultimate
  ];
  const visual=creature.draft.presentation.visual;
  const allIds=[
    [visual.front.assetId,"sprite"],[visual.back.assetId,"sprite"],[visual.icon.assetId,"icon"],
    ...skills.map(x=>[x.draft.presentation.visual.icon.assetId,"icon"])
  ];
  const catalog={assets:allIds.map(([id,assetType])=>({
    id,assetType,mediaType:"image",resource:{file:"capture/test.webp"}
  }))};
  const [card]=captureBestiaryCardsV1({creatureTransfers:[creature],
    skillTransfers:skills,assetCatalog:catalog,statRegistry:{stats:[]}});
  assert.equal(card.id,"Ephemus");
  assert.equal(card.skills.length,5);
  const prose=card.skills.map(s=>s.explanation?.sentences.join(" ")??"");
  assert.match(prose[1],/20 secondes/);
  assert.doesNotMatch(prose[3],/incoming_damage_channel_modifier/);
  assert.match(prose[3],/dégâts d'Esprit reçus/);
  assert.match(prose[4],/Canalise une attaque/);
  assert.match(prose[4],/Voile/);
});
