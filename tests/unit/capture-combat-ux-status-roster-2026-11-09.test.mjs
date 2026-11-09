import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createDomStatusFxRenderer} from "../../src/adapters/renderer/dom-status-fx.js";
const read=p=>readFile(new URL("../../"+p,import.meta.url),"utf8");
function documentStub(){
 const doc={createElement(){return {dataset:{},style:{},hidden:false,children:[],ownerDocument:doc,
  append(...args){this.children.push(...args);},remove(){this.removed=true;},
  setAttribute(){},set textContent(value){this._text=value;},get textContent(){return this._text;}};}};
 return doc;
}
test("HUD status cards are exclusive across actors and expire after five native combat seconds",()=>{
 const doc=documentStub(),hosts={};
 for(const id of ["local-1","opponent-1"]){
  const statusHost=doc.createElement("span");
  hosts[id]={statusHost};
 }
 const renderer=createDomStatusFxRenderer({
  targetFor:id=>hosts[id],statusPresentationFor:()=>null,
  skillPresentationFor:()=>null,
  skillDefinitionFor:id=>({id,name:id})
 });
 function snapshot(ms){return {elapsedMs:ms,fighters:Object.fromEntries(Object.keys(hosts).map(id=>[id,{
  statusEffects:[{sourceSkillId:"test",sourceActorId:id,stacks:1,expiresAtMs:20000,
   definition:{id:"slow-"+id,kind:"immobilize",polarity:"detrimental",
   durationModel:"time_ms",durationMs:20000,stacking:"refresh",maxStacks:1,tags:[]}}]
 }]))};}
 renderer.sync(snapshot(1000));
 const a=hosts["local-1"].statusHost.children[0],b=hosts["opponent-1"].statusHost.children[0];
 a.onclick({stopPropagation(){}});
 const aDetails=a.children.find(x=>x.dataset.statusFx==="hud-details");
 assert.equal(aDetails.hidden,false);
 b.onclick({stopPropagation(){}});
 const bDetails=b.children.find(x=>x.dataset.statusFx==="hud-details");
 assert.equal(aDetails.hidden,true);
 assert.equal(bDetails.hidden,false);
 renderer.syncCountdowns(snapshot(5999));
 assert.equal(bDetails.hidden,false);
 renderer.syncCountdowns(snapshot(6000));
 assert.equal(bDetails.hidden,true);
 a.onclick({stopPropagation(){}});
 assert.equal(aDetails.hidden,false);
 a.onclick({stopPropagation(){}});
 assert.equal(aDetails.hidden,true);
 renderer.dispose();
});
test("reserve selection uses the existing official switch command and closes after acceptance",async()=>{
 const src=await read("src/ui/capture-combat-roster-controller-v1.js");
 assert.match(src,/previewCommand\("switch"\)/);
 assert.match(src,/getRuntime\(\)\.startCommand\(/);
 assert.match(src,/if \(switched\.ok\) \{\s*panel\.open=false;/);
 assert.match(src,/if\(result\.ok\)panel\.open=false;/);
});
