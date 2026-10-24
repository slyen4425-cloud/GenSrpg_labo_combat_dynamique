import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";

const readSkill=id=>JSON.parse(readFileSync(
  new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),
  "utf8")).draft.definition;
const explain=id=>describeCaptureSkillV1(readSkill(id));
const lines=view=>view.sections.flatMap(section=>section.lines).join("\n");
test("Vague incendiaire : damage, DoT interval, duration, range, timing and energy",()=>{
  const desc=explain("cap_fire_atk_5"),s=lines(desc);
  assert.match(s,/25 dégâts Feu/);
  assert.match(s,/Dégâts répétés : 8 Feu toutes les 2 s/);
  assert.match(s,/durée 10 s/);
  assert.match(s,/Portée : courte, moyenne, longue/);
  assert.match(s,/Préparation : 1,7 s/);
  assert.ok(desc.meta.includes("Énergie : 6"));
  assert.ok(desc.meta.includes("Recharge : 45 s"));
  assert.doesNotMatch(s,/Attaque Feu de puissance/);
});
test("Sangsue : grounded contact hold, tick, damage then life steal",()=>{
  const desc=explain("sangsue"),s=lines(desc);
  assert.match(desc.heading,/approche terrestre/);
  assert.match(s,/maintien avec déclenchement toutes les 1 s/);
  assert.match(s,/6 dégâts Nature/);
  assert.match(s,/100 % des dégâts infligés en PV/);
});
test("Sacrifice Kitsune : zones, allies, boosts, healing and KO on self",()=>{
  const desc=explain("Sacrifice_kitsune"),s=lines(desc);
  assert.match(s,/zone de portée courte pendant 45 s sur tous les alliés/);
  assert.match(s,/Régénération d'énergie : \+100 %/);
  assert.match(s,/Soins répétés : 10 PV toutes les 2 s/);
  assert.match(s,/Dégâts infligés : \+200 %/);
  assert.match(s,/Met K.O. l'utilisateur/);
  assert.ok(desc.meta.includes("Utilisations par combat : 1"));
});
test("Nid de frelon : status marker, reserve, periodic and threshold",()=>{
  const desc=explain("Nid_frelon"),s=lines(desc);
  assert.match(s,/Applique 5 charge\(s\) de « venin static » sur les ennemis en réserve/);
  assert.match(s,/2 dégâts Électricité toutes les 5 s/);
  assert.match(s,/À 20 charges/);
  assert.match(s,/Met K.O. la cible/);
});
test("Surcharge : complex triggers, stat buffs and cooldowns",()=>{
  const s=lines(explain("cap_electric_special_2"));
  assert.match(s,/Temps d'approche : -50 %/);
  assert.match(s,/Vitesse de recharge des compétences : \+100 %/);
  assert.match(s,/Quand l'utilisateur inflige des dégâts/);
  assert.match(s,/10 dégâts/);
});
test("unknown normalized kind is rejected by authority, not invented",()=>{
  const input=readSkill("sangsue");
  assert.throws(()=>describeCaptureSkillV1({...input,effects:[{kind:"nonsense",targetScope:"target"}]}),
    /Unsupported SkillEffectV1.kind/);
});
test("Bestiary entry description is generated; handwritten note not reintroduced",()=>{
  const root=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
  const model=root("src/ui/capture-bestiary-cards-v1.js");
  const app=root("examples/dom-demo/bestiary.js");
  const css=root("examples/dom-demo/bestiary.css");
  assert.match(model,/describeCaptureSkillV1/);
  assert.doesNotMatch(model,/description:\s*typeof draft.description/);
  assert.doesNotMatch(app,/skill\.description/);
  assert.match(app,/aria-expanded/);
  assert.match(app,/skill\.explanation\.sections/);
  assert.match(css,/\.stat\{/);
  assert.match(css,/\.skill__icon/);
});
