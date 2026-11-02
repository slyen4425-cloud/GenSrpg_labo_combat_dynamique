import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {summarizeCaptureSkillSettingsV1} from "../../src/ui/capture-editor-contextual-help-v1.js";

const userSkill = JSON.parse(readFileSync(new URL("../../data/capture/showcase/furie_bestiale.capture-skill-transfer-v1.json", import.meta.url),"utf8")).draft.definition;
const output = skill => describeCaptureSkillV1(skill).sentences.join(" ");
const selfDamage = userSkill.effects[1];
const selfHeal = {
  kind:"apply_status",targetScope:"self",
  status:{...selfDamage.status,kind:"heal_over_time",polarity:"beneficial",amount:4,durationMs:15000,tickIntervalMs:3000}
};
test("Furie bestiale: 60s Glace bonus is distinct from 10 self-damage every 10s for 60s",()=>{
  const prose = output(userSkill);
  assert.match(prose,/Augmente .*Glace de 100 points .*pendant 60 secondes/);
  assert.match(prose,/La créature qui utilise cette capacité subit 10 dégâts de Glace toutes les 10 secondes pendant 60 secondes/);
  assert.doesNotMatch(prose,/Gorice|gorille|Inflige 10 dégâts de Glace/);
});
test("Generic targetScope drives periodic damage receiver and does not mislabel opponent/self",()=>{
  const other={...selfDamage,status:{...selfDamage.status,amount:3,channel:"poison",durationMs:15000,tickIntervalMs:3000}};
  const base={...userSkill,effects:[other]};
  const own=output(base);
  assert.match(own,/La créature qui utilise cette capacité subit 3 dégâts de Poison toutes les 3 secondes pendant 15 secondes/);
  const target=output({...base,effects:[{...other,targetScope:"target"}]});
  assert.match(target,/Inflige 3 dégâts de Poison toutes les 3 secondes pendant 15 secondes sur la cible/);
  assert.doesNotMatch(target,/la créature qui utilise cette capacité subit/);
  const enemies=output({...base,effects:[{...other,targetScope:"all_enemies"}]});
  assert.match(enemies,/sur tous les ennemis/);
  assert.doesNotMatch(enemies,/la créature qui utilise cette capacité subit/);
});
test("Generic self HoT and immediate self damage identify caster, using their own cadence",()=>{
  const heal=output({...userSkill,effects:[selfHeal]});
  assert.match(heal,/La créature qui utilise cette capacité récupère 4 PV toutes les 3 secondes pendant 15 secondes/);
  const direct=output({...userSkill,effects:[{kind:"damage",targetScope:"self",amount:11,channel:"fire"}]});
  assert.match(direct,/La créature qui utilise cette capacité subit 11 dégâts de Feu/);
});
test("Author editor contextual help derives the same self-periodic prose as the Bestiary",()=>{
  const summary=summarizeCaptureSkillSettingsV1({name:"Furie bestiale",requiredLevel:20,energyCost:6,
    effects:userSkill.effects});
  assert.match(summary,/La créature qui utilise cette capacité subit 10 dégâts de Glace toutes les 10 secondes pendant 60 secondes/);
  assert.match(summary,/Augmente .*Glace de 100 points .*pendant 60 secondes/);
  assert.doesNotMatch(summary,/sur soi|sur la cible .*10 dégâts de Glace/);
});
