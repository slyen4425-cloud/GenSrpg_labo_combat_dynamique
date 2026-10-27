import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createDomStatusFxRenderer} from "../../src/adapters/renderer/dom-status-fx.js";

const FILE="data/capture/showcase/cap_water_special_2.capture-skill-transfer-v1.json";
const SOURCE_SHA256="911b33e756b83652dc25f367b8719e91393864824f5d6f00f2d9b0fd766f7606";
async function rawFile(){return readFile(new URL("../../"+FILE,import.meta.url));}
async function transfer(){return importCaptureTransferJsonV1((await rawFile()).toString("utf8")).value.draft;}
function fighter(id){return {id,maxHp:200,initialHp:200,maxEnergy:20,initialEnergy:20,statValuesById:{defense:0},statEffectRulesById:{defense:{damageReductionPctPerPoint:0.2,damagePctPerPoint:0,resistancePctPerPoint:0,chargeTimeReductionPctPerPoint:0}}};}
function fakeDoc(){
  const document={createElement(){const obj={ownerDocument:document,children:[],dataset:{},style:{},textContent:"",append(...children){this.children.push(...children);},remove(){this.removed=true;},setAttribute(){},getAttribute(){return null;}};return obj;}};
  return document;
}
test("author transfer is stored losslessly and registered exactly once as an Ultimate", async()=>{
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===FILE).length,1);
  const src=await rawFile();
  assert.equal(createHash("sha256").update(src).digest("hex"),SOURCE_SHA256,"author export must not be silently modified");
  const draft=await transfer();
  assert.equal(draft.id,"cap_water_special_2");
  assert.equal(draft.definition.name,"Voile aqueux");
  assert.equal(draft.definition.preparationMs,2000);
  assert.equal(draft.definition.maxUsesPerCombat,1);
  assert.equal(draft.presentation.visual.aura.attachment,"fixed-source");
  assert.equal(draft.presentation.visual.aura.displayScale,4);
  assert.equal(draft.presentation.visual.aura.offsetY,-35);
  assert.equal(draft.definition.loadoutSlot,"ultimate");
  assert.equal(draft.requiredLevel,20);
  assert.equal(draft.definition.effects[0].durationMs,60000);
  assert.equal(draft.definition.effects[0].tickEffect.status.durationMs,10000);
  assert.equal(draft.definition.effects[0].tickEffect.status.deltaPoints,100);
  assert.equal(draft.definition.effects[0].persistAfterRecall,true);
  assert.equal(draft.presentation.visual.icon.assetId,"core:icon-skill-barrier-dome-01");
  assert.equal(draft.presentation.visual.aura.assetId,"pack:capture:sprite-status-energy-shield-01");
  const normalized=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(draft)).value.draft;
  assert.deepEqual(normalized,draft);
});
test("native persistent zone owns buff lifetime and exposes source icon under protected creature",async()=>{
  const draft=await transfer();
  const session=createCombatSession({
    fighters:[fighter("player"),fighter("enemy")],
    distance:"short",
    battleFormat:{actors:[{actorId:"player"},{actorId:"enemy"}],teamOf(id){return id==="player"?"local":"enemy";}}
  });
  const cast=session.useSkill({actorId:"player",targetId:"player",skill:draft.definition});
  assert.equal(cast.ok,true);
  session.advanceMs(1);
  let snapshot=session.snapshot();
  let effect=snapshot.fighters.player.statusEffects[0];
  assert.ok(effect,"a while_inside zone must grant the status through Combat Session");
  assert.equal(effect.sourceSkillId,draft.id);
  assert.equal(effect.definition.kind,"stat_modifier");
  assert.equal(effect.expiresAtMs>=snapshot.persistentZones[0].expiresAtMs,true);
  const document=fakeDoc(),host=document.createElement("div");
  const motion=document.createElement("div"), image=document.createElement("img");
  const renderer=createDomStatusFxRenderer({
    targetFor(){return {motion,image,statusHost:host};},
    statusPresentationFor(){return {mode:"none"};},
    skillPresentationFor(id){
      assert.equal(id,draft.id);
      return {icon:{assetId:draft.presentation.visual.icon.assetId,url:"https://example.test/barrier-dome.webp"}};
    },
    skillDefinitionFor(){return draft.definition;}
  });
  renderer.sync(snapshot);
  assert.equal(host.children.length,1,"HUD must show a status below affected creature");
  assert.equal(host.children[0].dataset.sourceSkillId,draft.id);
  assert.match(host.children[0].style.backgroundImage,/barrier-dome.webp/);
  const zoneExpiresAt = snapshot.persistentZones[0].expiresAtMs;
  session.advanceMs(zoneExpiresAt - snapshot.elapsedMs - 1);
  snapshot=session.snapshot();
  assert.equal(snapshot.persistentZones.length,1);
  assert.equal(snapshot.fighters.player.statusEffects.length,1);
  session.advanceMs(1);
  snapshot=session.snapshot();
  assert.equal(snapshot.persistentZones.length,0);
  assert.equal(snapshot.fighters.player.statusEffects.length,0);
  renderer.sync(snapshot);
  assert.equal(host.children[0].removed,true);
  renderer.dispose();
});
test("Human Editor displays a zone-bound duration explanation while preserving stored on-enter duration",async()=>{
  const ui=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  assert.match(ui,/skillZoneStatusDurationField/);
  assert.match(ui,/skillZoneStatusDurationNote/);
  assert.match(ui,/Tant que la cr.ature reste dans la zone/);
  assert.match(ui,/data-skill-zone-status-behavior/);
});
