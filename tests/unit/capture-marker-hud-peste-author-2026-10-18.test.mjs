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
test("two markers from author export are bootstrapped without duplicate or data loss",async()=>{
 const s=await read(showcase);
 assert.equal(s,await read("data/capture/source-exports/gensrpg-marqueurs-2026-10-18.json"));
 assert.equal(createHash("sha256").update(s).digest("hex"),"83a6d8bdd3b358828adf990e719f125351f26a8a5b83d0dde4fd1e2589cfc7b1");
 const x=normalizeCaptureMarkerLibraryV1(JSON.parse(s).markers);
 assert.deepEqual(x.map(y=>y.id),["venin-static","peste"]);
 const stored=JSON.parse(await read("data/capture/showcase/lib_paralyze.capture-skill-transfer-v1.json")).draft.definition.effects.find(e=>e.kind==="apply_marker").marker;
 assert.deepEqual(x[0],stored,"venin-static is unchanged from active skill owner");
 const map=new Map([[stored.id,stored]]);
 assert.equal(captureMarkerSeedLibraryV1(map,x),1,"Peste inserted, existing venom kept");
 assert.deepEqual(map.get("peste"),x[1]);
 assert.equal(captureMarkerSeedLibraryV1(map,x),0,"idempotent bootstrap");
 const snapshot=new Map(map);
 assert.throws(()=>captureMarkerSeedLibraryV1(map,[{...x[1],maxStacks:11}]),/Conflit|conflict/i);
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
 assert.match(editor,/markers\\.capture-markers-v1\\.json/);
 assert.match(editor,/markerLibraryController\\.seedMarkers/);
 const library=await read("src/ui/capture-marker-library-v1.js");
 assert.match(library,/marker-save/);
 assert.match(library,/marker\\.periodic/);
 const hud=await read("src/adapters/renderer/dom-status-fx.js");
 assert.match(hud,/statusEffectInfoTextV1\\(info\\)/);
});
