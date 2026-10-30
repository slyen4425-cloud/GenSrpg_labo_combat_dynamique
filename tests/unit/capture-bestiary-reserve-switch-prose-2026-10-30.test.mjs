import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describeCaptureSkillV1} from "../../src/ui/capture-skill-explanation-v1.js";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";

const readTransfer = (id,kind="skill") => JSON.parse(readFileSync(
  new URL("../../data/capture/showcase/"+id+".capture-"+kind+"-transfer-v1.json",import.meta.url),"utf8"));
const liane=readTransfer("liane_venimeuse");
const grainou=readTransfer("crea_nat_1","creature");
const lines=()=>describeCaptureSkillV1(liane.draft.definition).sentences;

test("Liane venimeuse describes the native enemy reserve forced switch, not a raw effect code",()=>{
  const out=lines();
  assert.equal(out[0],"Force la créature ennemie choisie dans sa réserve à entrer en combat à la place de la créature adverse active, si l'attaque touche.");
  assert.doesNotMatch(out.join(" "),/Effet non encore décrit|force_reserve_switch|réserve alliée/i);
  assert.match(out.join(" "),/2 charges de Graine sansue à la cible/);
  assert.match(out.join(" "),/2 charges de Poison à la cible/);
  assert.match(out.join(" "),/toutes les 3 secondes.*5 dégâts de Nature par charge/);
  assert.match(out.join(" "),/toutes les 5 secondes.*5 dégâts de Physique/);
  assert.match(out.join(" "),/Utilisable une fois par combat\./);
});

test("Grainou Bestiary ultimate uses the same normalized explanation and its real skill icon",()=>{
  const visual=grainou.draft.presentation.visual;
  const icon=liane.draft.presentation.visual.icon.assetId;
  const mock=(assetId,assetType="sprite")=>({id:assetId,assetType,mediaType:"image",resource:{file:assetId.replaceAll(":","/")+".webp"}});
  const catalog={assets:[
    mock(visual.front.assetId),mock(visual.back.assetId),
    mock(visual.icon.assetId,"portrait"),mock(icon,"icon")
  ]};
  const cards=captureBestiaryCardsV1({creatureTransfers:[grainou],
    skillTransfers:[liane],assetCatalog:catalog,nativeSkills:[],statRegistry:{stats:[]}});
  assert.equal(cards.length,1);
  const ultimate=cards[0].skills.find(s=>s.slot==="slot-ultimate");
  assert.equal(ultimate.state,"ready");
  assert.equal(ultimate.name,"Liane venimeuse");
  assert.equal(ultimate.icon.assetId,icon);
  assert.deepEqual(ultimate.explanation.sentences,lines());
});

test("ordinary Nature effects are unaffected by forced-reserve text",()=>{
  const base=readTransfer("graine_sansue_cap");
  const s=describeCaptureSkillV1(base.draft.definition).sentences.join(" ");
  assert.doesNotMatch(s,/Force la créature ennemie|force_reserve_switch/);
  assert.match(s,/Graine sansue/);
});
