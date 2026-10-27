import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as SKILL_FILES} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
const readSkill=id=>JSON.parse(readFileSync(
  new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),
  "utf8")).draft.definition;
const explain=id=>describeCaptureSkillV1(readSkill(id));
const sentences=view=>view.sentences.join(" ");
test("Vent arrière: one natural sentence, 4 actual modifiers and common duration, no fabricated damage buff",()=>{
  const view=explain("lib_tailwind");
  assert.equal(view.sentences.length,1);
  const s=sentences(view);
  assert.match(s,/Augmente.*vitesse de 30 points.*vitesse de recharge des compétences de 150 %.*régénération d'énergie de 100 %/);
  assert.match(s,/mais réduit la défense de 100 points pendant 15 secondes/);
  assert.doesNotMatch(s,/dégâts infligés|Déroulement|Portée|Préparation/);
});
test("Vague incendiaire: concise impact, DoT, no internals",()=>{
  const view=explain("cap_fire_atk_5");
  const s=sentences(view);
  assert.match(s,/Inflige 25 dégâts de Feu/);
  assert.match(s,/Inflige 8 dégâts de Feu toutes les 2 secondes pendant 10 secondes/);
  assert.doesNotMatch(s,/trajet|portée|préparation|récupération|Énergie :|Recharge :/i);
  assert.equal(view.sentences.length,3);
  assert.ok(view.sentences.includes("Peut aussi toucher les créatures en vol."));
});
test("Sangsue: keep contact hold, damage, healing and natural timing",()=>{
  const s=sentences(explain("sangsue"));
  assert.match(s,/Au corps à corps, reste accroché/);
  assert.match(s,/6 dégâts de Nature/);
  assert.match(s,/100 % de ces dégâts sous forme de PV/);
  assert.match(s,/chaque seconde/);
});
test("Sacrifice Kitsune: group 3 overlapping zones, preserve all effects and KO",()=>{
  const s=sentences(explain("Sacrifice_kitsune"));
  assert.match(s,/Crée des zones qui/);
  assert.match(s,/régénération d'énergie de 100 %/);
  assert.match(s,/10 PV toutes les 2 secondes/);
  assert.match(s,/dégâts infligés de 200 %/);
  assert.match(s,/pour tous les alliés pendant 45 secondes/);
  assert.match(s,/reste(nt)? actives après un rappel/);
  assert.match(s,/Met la créature K.O./);
});
test("Nid de frelon: reserves, poison ticks and 20-stack KO retained",()=>{
  const s=sentences(explain("Nid_frelon"));
  assert.match(s,/5 charges de venin static.*y compris ceux en réserve/);
  assert.match(s,/5 secondes.*2 dégâts d'Électricité/);
  assert.match(s,/À 20 charges.*K.O./);
});
test("Surcharge: multi-buff aggregation, triggered damage with accurate duration",()=>{
  const view=explain("cap_electric_special_2");
  const s=sentences(view);
  assert.match(s,/réduit le temps d'approche de 50 %/);
  assert.match(s,/vitesse de recharge des compétences de 100 %/);
  assert.match(s,/régénération d'énergie de 50 %/);
  assert.match(s,/quand la créature inflige des dégâts/);
  assert.match(s,/10 dégâts/);
  assert.doesNotMatch(s,/tags techniques|projectileClash|Déroulement/);
});
test("full penetration is natural, partial penetration states exact percentage",()=>{
  const definition=readSkill("cap_fire_atk_5");
  const use=pct=>describeCaptureSkillV1({...definition,effects:[{kind:"damage",targetScope:"target",
    amount:25,channel:"fire",ignoreResistancePct:pct,ignoreDamageReductionPct:100}]});
  const full=sentences(use(100)),partial=sentences(use(35));
  assert.match(full,/ignore la résistance et ignore la réduction des dégâts/);
  assert.doesNotMatch(full,/100 % de résistance/);
  assert.match(partial,/ignore 35 % de la résistance/);
});
test("different durations are never combined into a false shared duration",()=>{
  const original=readSkill("lib_tailwind"),e=original.effects;
  const modified={...original,effects:e.map((eff,i)=>
    i===0?{...eff,status:{...eff.status,durationMs:5000}}:eff)};
  const v=describeCaptureSkillV1(modified);
  assert.ok(v.sentences.length>=2);
  assert.match(sentences(v),/pendant 5 secondes/);
  assert.match(sentences(v),/pendant 15 secondes/);
});
test("every published Showcase skill gets frozen sentences without editor copy",()=>{
  for(const path of SKILL_FILES){
    const entry=JSON.parse(readFileSync(new URL("../../"+path,import.meta.url),"utf8"));
    const v=describeCaptureSkillV1(entry.draft.definition);
    assert.ok(Object.isFrozen(v)&&Object.isFrozen(v.sentences),path);
    assert.ok(v.sentences.length>0,path);
    assert.ok(v.sentences.every(line=>line.endsWith(".")),path);
    assert.equal("meta" in v,false,path);
    assert.equal("sections" in v,false,path);
  }
});
test("unrecognized kind is rejected by contract, not faked",()=>{
  const x=readSkill("sangsue");
  assert.throws(()=>describeCaptureSkillV1({...x,effects:[{kind:"unlisted",targetScope:"target"}]}),
    /Unsupported SkillEffectV1.kind/);
});
test("Bestiary uses only short player prose, no technical UI sections",()=>{
  const root=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
  const app=root("examples/dom-demo/bestiary.js"), model=root("src/ui/capture-bestiary-cards-v1.js");
  assert.match(model,/describeCaptureSkillV1/);
  assert.match(app,/skill.explanation.sentences/);
  assert.doesNotMatch(app,/skill.explanation.sections|skill.explanation.meta|skill.explanation.heading/);
  assert.match(app,/aria-expanded/);
});

test("ordinary and surface-only attacks never get a redundant special reach note",()=>{
  const base=readSkill("cap_earth_atk_2");
  const noReach=sentences(describeCaptureSkillV1({...base,hitPresenceStates:null,hitsIntangible:false}));
  const surface=sentences(describeCaptureSkillV1({...base,hitPresenceStates:["surface"],hitsIntangible:false}));
  for(const text of [noReach,surface]){
    assert.doesNotMatch(text,/Peut aussi toucher les créatures|mais pas celles au sol/);
  }
});
test("real Tornade, Arc électrique and Ouragan gain the anti-air detail only",()=>{
  for(const id of ["cap_air_atk_4","lib_chain_lightning","cap_air_atk_7"]){
    const d=readSkill(id);
    assert.deepEqual(d.hitPresenceStates,["surface","airborne"],id);
    const x=describeCaptureSkillV1(d).sentences;
    assert.ok(x.includes("Peut aussi toucher les créatures en vol."),id);
    assert.equal(x.filter(line=>/créatures en vol/.test(line)).length,1,id);
    assert.doesNotMatch(x.join(" "),/sous terre|immatérielles|Portée :|hitPresenceStates/,id);
  }
});
test("explicit underground and combined flight/underground/intangible reach reads real rules only",()=>{
  const base=readSkill("cap_earth_atk_2");
  const create=(hitPresenceStates,hitsIntangible=false)=>describeCaptureSkillV1({
    ...base,hitPresenceStates,hitsIntangible
  }).sentences;
  assert.ok(create(["surface","underground"]).includes(
    "Peut aussi toucher les créatures sous terre."));
  assert.ok(create(["surface","airborne","underground"],true).includes(
    "Peut aussi toucher les créatures en vol et sous terre, même immatérielles."));
  assert.ok(create(null,true).includes(
    "Peut aussi toucher les créatures immatérielles."));
  assert.ok(create(["surface"],true).includes(
    "Peut aussi toucher les créatures immatérielles."));
});
test("explicit non-surface attacks do not claim they also hit grounded defenders",()=>{
  const base=readSkill("cap_earth_atk_2");
  const air=describeCaptureSkillV1({...base,hitPresenceStates:["airborne"]}).sentences;
  assert.ok(air.includes("Peut toucher les créatures en vol, mais pas celles au sol."));
  const burrow=describeCaptureSkillV1({...base,
    hitPresenceStates:["underground"],hitsIntangible:true}).sentences;
  assert.ok(burrow.includes("Peut toucher les créatures sous terre, même immatérielles, mais pas celles au sol."));
});
test("existing unavoidable-attack detail survives special target notes",()=>{
  const base=readSkill("cap_air_atk_7");
  const s=describeCaptureSkillV1({...base,dodgeable:false}).sentences;
  assert.ok(s.includes("Peut aussi toucher les créatures en vol."));
  assert.ok(s.includes("Cette attaque ne peut pas être esquivée."));
});
