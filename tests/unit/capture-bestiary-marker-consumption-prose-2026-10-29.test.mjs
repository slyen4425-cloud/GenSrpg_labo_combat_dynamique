import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";

function authoredSkill(id){
  return JSON.parse(readFileSync(new URL(
    "../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url
  ),"utf8")).draft.definition;
}
const sentences=skill=>describeCaptureSkillV1(skill).sentences;
const combined=skill=>sentences(skill).join(" ");

test("RED: Grainou Explosion florale specifies 25 Nature damage PER consumed charge",()=>{
  const source=authoredSkill("explosion_florale");
  assert.equal(source.effects[0].kind,"consume_marker");
  assert.equal(source.effects[0].perCharge,true);
  const lines=sentences(source);
  assert.ok(lines.includes("Inflige 25 dégâts de Nature par charge consommée à la cible."),
    "damage itself explains how charges scale it");
  assert.match(lines.join(" "),/Consomme les charges de graine-sansue/);
  assert.doesNotMatch(lines.join(" "),/les effets augmentent avec les charges consommées/,
    "do not replace the exact damage formula with a vague statement");
});

test("RED: all authored perCharge skills get exact scaling, including Choc venin",()=>{
  const choc=authoredSkill("choc_venin");
  const effect=choc.effects.find(item=>item.kind==="consume_marker");
  assert.equal(effect.perCharge,true);
  const actual=combined(choc);
  const child=effect.effects.find(item=>item.kind==="damage");
  assert.ok(actual.includes("Inflige "+child.amount+" dégâts d'Électricité par charge consommée à la cible."),actual);
});

test("RED: perCharge applies to child healing/energy amounts, not unrelated status",()=>{
  const source=authoredSkill("explosion_florale");
  const status={kind:"apply_status",targetScope:"target",status:{
    id:"vulnerable",kind:"stun",polarity:"detrimental",durationMs:1000,stacking:"replace"
  }};
  const effect={...source.effects[0],effects:[
    {kind:"damage",targetScope:"target",amount:11,channel:"nature"},
    {kind:"heal",targetScope:"self",amount:7},
    {kind:"energy_restore",targetScope:"self",amount:4},
    {kind:"energy_drain",targetScope:"target",amount:2},
    status
  ]};
  const actual=combined({...source,effects:[effect]});
  for(const snippet of [
    "11 dégâts de Nature par charge consommée",
    "7 PV par charge consommée",
    "4 points d'énergie par charge consommée",
    "2 points d'énergie par charge consommée"
  ]) assert.ok(actual.includes(snippet),snippet+"\n"+actual);
  assert.match(actual,/Étourdit la cible/);
  assert.doesNotMatch(actual,/Étourdit la cible par charge consommée/);
});

test("RED: legacy fixed damage and ordinary attacks never claim per-charge scaling",()=>{
  const source=authoredSkill("explosion_florale");
  const effect={...source.effects[0],perCharge:false};
  const fixed=combined({...source,effects:[effect]});
  assert.match(fixed,/Inflige 25 dégâts de Nature à la cible/);
  assert.doesNotMatch(fixed,/par charge consommée/);
  const normal=combined({...source,effects:[{kind:"damage",targetScope:"target",amount:25,channel:"nature"}]});
  assert.match(normal,/Inflige 25 dégâts de Nature à la cible/);
  assert.doesNotMatch(normal,/par charge consommée/);
});

test("RED: published Bestiary uses common explanation owner, not an Explosion-specific description",()=>{
  const base=readFileSync(new URL("../../src/ui/capture-bestiary-cards-v1.js",import.meta.url),"utf8");
  assert.match(base,/describeCaptureSkillV1\(definition\)/);
  const s=combined(authoredSkill("explosion_florale"));
  assert.match(s,/25 dégâts de Nature par charge consommée/);
  assert.equal(typeof captureBestiaryCardsV1,"function");
});
