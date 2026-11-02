import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";

const src=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const wall=JSON.parse(src("data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json")).draft.definition;
const story=definition=>describeCaptureSkillV1(definition).sentences.join(" ");

test("RED: defensive wall bestiary explains functional blocking without editor X/Y or dodge language",()=>{
 const result=story(wall);
 assert.match(result,/2 PV par point/);
 assert.match(result,/projectiles/);
 assert.match(result,/rayons/);
 assert.match(result,/contact/);
 assert.match(result,/s'arrête au mur même si celui-ci est détruit/);
 assert.doesNotMatch(result,/Position libre|depuis la gauche|depuis le haut|X 47|Y 55/i);
 assert.doesNotMatch(result,/attaque ne peut pas être esquivée|esquive/i);
});
test("RED: other barrier placements never leak technical layout into bestiary",()=>{
 for(const mode of ["behind","protected"]){
  const {arenaXPct,arenaYPct,...base}=wall.effects[0];
  const result=story({...wall,effects:[{...base,placementMode:mode}]});
  assert.match(result,/barrière destructible/);
  assert.doesNotMatch(result,/Placement|Position|derrière|coordonnées|esquiv/i);
 }
});
test("non-dodgeable hostile offensive attacks still say they cannot be dodged",()=>{
 const strike=JSON.parse(src("data/combat/skills/fireball.skill.json"));
 const result=story({...strike,dodgeable:false,category:"offensive",targetRelations:["enemy"],targetLocations:["active"]});
 assert.match(result,/Cette attaque ne peut pas être esquivée/);
});
test("RED: one overlay keeps native collision geometry and positions the sole HP badge above the wall",()=>{
 const renderer=src("src/adapters/renderer/combat-entity-overlay-v1.js");
 assert.match(renderer,/dataset\.combatEntityHp/);
 assert.match(renderer,/position:absolute.*top:/s,"badge must leave the normal flex-flow below sprite");
 assert.match(renderer,/arenaRect|visibleRect|bounds/,"badge must clamp into the visible arena at large sprite scales");
 assert.doesNotMatch(renderer,/cloneNode\(/);
});

test("real Gorice Bestiary card from the two official Showcase transfers displays only gameplay",()=>{
 const creature=JSON.parse(src("data/capture/showcase/gorice.capture-creature-transfer-v1.json"));
 const skill=JSON.parse(src("data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json"));
 const visuals=creature.draft.presentation.visual;
 const assets=["front","back","icon"].map(role=>({
   id:visuals[role].assetId,assetType:role==="icon"?"icon":"portrait",
   mediaType:"image",resource:{file:"capture/creatures/gorice/"+role+".webp"}
 }));
 const cards=captureBestiaryCardsV1({creatureTransfers:[creature],skillTransfers:[skill],assetCatalog:{assets}});
 assert.equal(cards.length,1);
 const equip=cards[0].skills.find(s=>s.name==="Mur de glace");
 assert.ok(equip,"Mur de glace must resolve through the actual bestiary equip chain");
 const prose=equip.explanation.sentences.join(" ");
 assert.match(prose,/2 PV par point/);
 assert.doesNotMatch(prose,/X 47|Y 55|Position|Placement|esquiv/i);
});
