import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";

function transfer(id,type="skill"){
  return JSON.parse(readFileSync(new URL(
    "../../data/capture/showcase/"+id+".capture-"+type+"-transfer-v1.json",import.meta.url
  ),"utf8"));
}

test("RED: Liane venimeuse explains reserve selection, confirmed forced substitution and no-hit behavior",()=>{
  const skill=transfer("liane_venimeuse").draft.definition;
  assert.equal(skill.effects[0].kind,"force_reserve_switch");
  assert.deepEqual(skill.targetLocations,["reserve"]);
  const lines=describeCaptureSkillV1(skill).sentences;
  const displayed=lines.join(" ");
  assert.match(displayed,/créature ennemie choisie dans la réserve/i);
  assert.match(displayed,/remplace de force la créature adverse actuellement au combat/i);
  assert.match(displayed,/Si l'attaque ne touche pas, aucun échange ni effet supplémentaire n'a lieu/i);
  assert.match(displayed,/Les effets suivants s'appliquent à cette créature/i);
  assert.doesNotMatch(displayed,/force_reserve_switch|Effet non encore décrit|targetScope|targetLocations/);
  assert.ok(lines.every(line=>line.endsWith(".")));
  assert.match(displayed,/2 charges de Graine sansue/);
  assert.match(displayed,/2 charges de Poison/);
  assert.match(displayed,/une fois par combat/);
});

test("RED: ordinary attacks remain ordinary and unrecognized effects stay contract-validated",()=>{
  for(const id of ["graine_sansue_cap","Spore_soporifique","explosion_florale"]){
    const description=describeCaptureSkillV1(transfer(id).draft.definition).sentences.join(" ");
    assert.doesNotMatch(description,/remplace de force|choisie dans la réserve|aucun échange/,id);
    assert.doesNotMatch(description,/force_reserve_switch/,id);
  }
  const skill=transfer("liane_venimeuse").draft.definition;
  assert.throws(()=>describeCaptureSkillV1({...skill,effects:[{kind:"not_known",targetScope:"target"}]}),
    /Unsupported SkillEffectV1.kind/);
});

test("RED: official Grainou ultimate uses one common explanation projection, not a hardcoded note",()=>{
  const creature=transfer("crea_nat_1","creature");
  const skill=transfer("liane_venimeuse");
  assert.equal(creature.loadout.slots.find(x=>x.id==="slot-ultimate")?.skillId,skill.draft.id);
  const visual=creature.draft.presentation.visual;
  const asset=(binding,type)=>({id:binding.assetId,assetType:type,mediaType:"image",
    resource:{file:"capture/test/"+binding.assetId.split(":").pop()+".png"}});
  const images=[asset(visual.front,"sprite"),asset(visual.back,"sprite"),
    asset(visual.icon,"portrait"),asset(skill.draft.presentation.visual.icon,"icon")];
  const cards=captureBestiaryCardsV1({creatureTransfers:[creature],skillTransfers:[skill],
    assetCatalog:{assets:images}});
  assert.equal(cards.length,1);
  const ultimate=cards[0].skills.at(-1);
  assert.equal(ultimate.name,"Liane venimeuse");
  assert.match(ultimate.explanation.sentences.join(" "),/réserve.*remplace de force/);
  assert.doesNotMatch(ultimate.explanation.sentences.join(" "),/force_reserve_switch/);
});
