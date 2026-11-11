import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {captureBestiaryCardsV1} from "../../src/ui/capture-bestiary-cards-v1.js";
const source=async p=>readFile(new URL("../../"+p,import.meta.url),"utf8");
test("native Claw uses 10 base damage with the original timings",async()=>{
 const catalog=JSON.parse(await source("data/combat/skills/catalog.v1.json"));
 const claw=catalog.entries.find(e=>e.id==="claw").definition;
 assert.equal(claw.effect.damage,10);
 assert.equal(claw.energyCost,2);
 assert.equal(claw.preparationMs,1200);
 assert.equal(claw.travelMs,1500);
 assert.equal(claw.recoveryMs,500);
});
test("live cooldown derives from CombatState deadline, not action preview or a UI timer",async()=>{
 const src=await source("src/ui/combat-2v2-test-ui.js");
 assert.match(src,/skillCooldownRemainingMs\(/);
 assert.doesNotMatch(src,/skillCooldowns/);
 assert.match(src,/state\.elapsedMs/);
 assert.match(src,/Math\.ceil\(remainingCooldownMs \/ 1000\)/);
 assert.doesNotMatch(src,/preview\?\.outcome === "cooldown"/);
});
test("Bestiary exposes skill cooldowns from the native and authored definition",async()=>{
 const authored=JSON.parse(await source("data/capture/showcase/krakenor-perle-pression.capture-skill-transfer-v1.json"));
 const creature=JSON.parse(await source("data/capture/showcase/crea_mer_3.capture-creature-transfer-v1.json"));
 const visuals=creature.draft.presentation.visual;
 const catalogue={assets:[
  ...["front","back","icon"].map((key,i)=>({
    id:visuals[key].assetId,mediaType:"image",assetType:i===2?"portrait":"sprite",
    resource:{file:"capture/creatures/pieuvre/runtime/"+["pieuvre_face.png","pieuvre_dos.png","pieuvre_icon.png"][i]}
  })),
  {id:authored.draft.presentation.visual.icon.assetId,mediaType:"image",assetType:"icon",resource:{file:"capture/icons/skills/icon_skill_cascade_percutante_01.webp"}}
 ]};
 const cards=captureBestiaryCardsV1({creatureTransfers:[creature],skillTransfers:[authored],assetCatalog:catalogue});
 const s=cards[0].skills.find(x=>x.name==="Perle de pression");
 assert.equal(s.cooldownMs,15000);
 const nativeCatalog=JSON.parse(await source("data/combat/skills/catalog.v1.json"));
 const claw=nativeCatalog.entries.find(x=>x.id==="claw").definition;
 const nativeCreature={...creature,loadout:{...creature.loadout,slots:creature.loadout.slots.map(x=>
   x.id==="slot-1"?{...x,skillId:"claw"}:x)}};
 catalogue.assets.push({
  id:"core:icon-skill-claw-01",label:"Griffe",category:"skill",
  source:{scope:"core"},mediaType:"image",assetType:"icon",
  resource:{file:"core/icons/skills/icon_skill_claw_01.webp"}
 });
 const native=captureBestiaryCardsV1({creatureTransfers:[nativeCreature],nativeSkills:[{definition:claw}],assetCatalog:catalogue});
 assert.equal(native[0].skills[0].name,"Griffe");
 assert.equal(native[0].skills[0].cooldownMs,0);
 assert.equal(native[0].skills[0].icon.assetId,"core:icon-skill-claw-01");
 assert.equal(native[0].skills[0].icon.file,"core/icons/skills/icon_skill_claw_01.webp");
 const absent=captureBestiaryCardsV1({
   creatureTransfers:[nativeCreature],nativeSkills:[{definition:claw}],
   assetCatalog:{assets:catalogue.assets.filter(asset=>asset.id!=="core:icon-skill-claw-01")}
 });
 assert.equal(absent[0].skills[0].icon,null,"never display unpublished native icons");
});
