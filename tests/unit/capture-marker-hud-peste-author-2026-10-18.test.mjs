import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {normalizeCaptureMarkerLibraryV1, markerStatusDefinitionV1} from "../../src/contracts/capture-marker-v1.js";
import {createStatusEffectRuntimeInstanceV1} from "../../src/core/combat/status-effect-instance-v1.js";
import {projectStatusEffectInfoV1,statusEffectInfoTextV1} from "../../src/adapters/renderer/status-effect-info-v1.js";
import {captureMarkerSeedLibraryV1} from "../../src/ui/capture-marker-library-v1.js";
const read=path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
const showcase="data/capture/showcase/markers.capture-markers-v1.json";
test("historical marker archives stay immutable; five active markers bootstrap without duplicate or data loss",async()=>{
 const historic=await read("data/capture/source-exports/gensrpg-marqueurs-2026-10-18.json");
 assert.equal(createHash("sha256").update(historic).digest("hex"),"83a6d8bdd3b358828adf990e719f125351f26a8a5b83d0dde4fd1e2589cfc7b1");
 const historicMarkers=normalizeCaptureMarkerLibraryV1(JSON.parse(historic).markers);
 assert.deepEqual(historicMarkers.map(y=>y.id),["venin-static","peste"]);
 const s=await read(showcase);
 const prior=JSON.parse(await read("data/capture/source-exports/gensrpg-marqueurs-2026-10-28.json"));
 assert.equal(prior.markers.find(m=>m.id==="graine-sansue").maxStacks,10,"prior source preserved");
 assert.deepEqual(JSON.parse(s),JSON.parse(await read("data/capture/source-exports/gensrpg-marqueurs-2026-10-29-r2.json")));
 const legacy=normalizeCaptureMarkerLibraryV1(JSON.parse(
   await read("data/capture/source-exports/gensrpg-capture-markers-2026-10-23.json")).markers);
 const x=normalizeCaptureMarkerLibraryV1(JSON.parse(s).markers);
 assert.deepEqual(x.map(y=>y.id),["poison","venin-static","graine-sansue","eclat-spirituel","peste"]);
 for(const old of legacy){
   assert.deepEqual(x.find(m=>m.id===old.id),old,"2026-10-23 author marker unchanged: "+old.id);
 }
 assert.deepEqual(x.find(m=>m.id==="venin-static"),historicMarkers[0]);
 assert.deepEqual(x.find(m=>m.id==="peste"),historicMarkers[1]);
 const stored=JSON.parse(await read("data/capture/showcase/lib_paralyze.capture-skill-transfer-v1.json")).draft.definition.effects.find(e=>e.kind==="apply_marker").marker;
 assert.deepEqual(x.find(m=>m.id==="venin-static"),stored,"venin-static remains unchanged from active skill owner");
 const map=new Map([[stored.id,stored]]);
 assert.equal(captureMarkerSeedLibraryV1(map,x),4,"add poison, Eclat, Peste and Graine sansue once");
 assert.deepEqual(map.get("peste"),x.find(m=>m.id==="peste"));
 assert.deepEqual(map.get("eclat-spirituel"),x.find(m=>m.id==="eclat-spirituel"));
 assert.equal(captureMarkerSeedLibraryV1(map,x),0,"idempotent bootstrap");
 const snapshot=new Map(map);
 assert.throws(()=>captureMarkerSeedLibraryV1(map,[{...x.find(m=>m.id==="peste"),maxStacks:11}]),/Conflit|conflict/i);
 assert.deepEqual(map,snapshot,"no partial mutation on conflict");
});
test("native combat HUD clearly explains base periodic damage, stacks, clock and threshold",async()=>{
 const data=JSON.parse(await read(showcase)).markers;
 for(const [id,amount,sec,element] of [["venin-static",2,5,"Électricité"],["peste",15,30,"Ombre"]]){
  const marker=data.find(x=>x.id===id);
  const status=markerStatusDefinitionV1(marker);
  const instance=createStatusEffectRuntimeInstanceV1({definition:status,sourceActorId:"a",sourceSkillId:"test",appliedAtMs:1000,stacks:3});
  const info=projectStatusEffectInfoV1({instance,elapsedMs:1500});
  const text=statusEffectInfoTextV1(info);
  assert.match(text,new RegExp(String(amount)+" dégâts"));
  assert.match(text,new RegExp(element));
  assert.match(text,new RegExp(sec+" s"));
  assert.match(text,new RegExp(String(amount*3)));
  assert.match(text,/prochain/i);
  assert.match(text,/par charge/i);
  if(id==="venin-static")assert.match(text,/20 charges|20 stacks/i);
 }
});
test("saved standalone marker is displayed by real editor startup without exports and combat HUD uses live projection",async()=>{
 const editor=await read("src/ui/capture-editor-human-v2.js");
 assert.match(editor,/markers\.capture-markers-v1\.json/);
 assert.match(editor,/markerLibraryController\.seedMarkers/);
 const library=await read("src/ui/capture-marker-library-v1.js");
 assert.match(library,/marker-save/);
 assert.match(library,/marker\.periodic/);
 const hud=await read("src/adapters/renderer/dom-status-fx.js");
 assert.match(hud,/statusEffectInfoTextV1\(info\)/);
});

test("actual combat HUD title and tapped details render periodic marker data without export",async()=>{
 const {createDomStatusFxRenderer}=await import("../../src/adapters/renderer/dom-status-fx.js");
 const marker=JSON.parse(await read(showcase)).markers.find(x=>x.id==="peste");
 const instance=createStatusEffectRuntimeInstanceV1({definition:markerStatusDefinitionV1(marker),
   sourceActorId:"caster",sourceSkillId:"test",appliedAtMs:0,stacks:2});
 const doc={createElement(){
   return {className:"",dataset:{},style:{},hidden:false,textContent:"",children:[],ownerDocument:doc,
     append(...values){this.children.push(...values);},remove(){this.removed=true;},setAttribute(){}};
 }};
 const host=doc.createElement("div");
 const hud=createDomStatusFxRenderer({
   targetFor:()=>({statusHost:host}),
   statusPresentationFor:()=>null,
   skillPresentationFor:()=>null,
   skillDefinitionFor:()=>null
 });
 hud.sync({elapsedMs:5000,fighters:{victim:{statusEffects:[instance]}}});
 const node=host.children.find(x=>x.dataset.statusFx==="hud-icon"&&!x.removed);
 assert.ok(node);
 assert.match(node.title,/15 dégâts Ombre/);
 assert.match(node.title,/toutes les 30 s/);
 assert.match(node.title,/30 pour 2 charges/);
 assert.match(node.title,/Prochain effet dans 25 s/);
 node.onclick({stopPropagation(){}});
 const details=node.children.find(x=>x.dataset.statusFx==="hud-details");
 assert.equal(details.hidden,false);
 assert.match(details.textContent,/15 dégâts Ombre/);
 assert.match(details.textContent,/Prochain effet dans 25 s/);
 hud.dispose();
});
