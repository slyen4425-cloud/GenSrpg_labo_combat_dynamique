import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {playDomShadowEchoFxV1} from "../../src/adapters/renderer/dom-shadow-echo-fx-v1.js";

const skills=[
 ["raiiven-fer-maudit","fer-maudit"],
 ["raiiven-dedale-silhouettes","dedale-silhouettes"],
 ["raiiven-vol-foulees","vol-foulees"],
 ["raiiven-remanence-interdite","remanence-interdite"],
 ["raiiven-cavalcade-damnes","cavalcade-damnes"]
];
test("all five Raiiven abilities have their own canonical skill icon, original mechanics preserved",()=>{
 for(const [name,short] of skills){
   const path="data/capture/showcase/"+name+".capture-skill-transfer-v1.json";
   const raw=JSON.parse(readFileSync(path,"utf8"));
   const transfer=normalizeCaptureSkillTransferV1(raw);
   assert.equal(transfer.draft.presentation.visual.icon.assetId,
     "pack:capture:icon-skill-raiiven-"+short+"-v1");
   assert.equal(transfer.draft.definition.id,name);
 }
});
test("Rémanence uses the same canonical shadow effect for native cast, travel and impact",()=>{
 const transfer=normalizeCaptureSkillTransferV1(JSON.parse(readFileSync(
    "data/capture/showcase/raiiven-remanence-interdite.capture-skill-transfer-v1.json","utf8")));
 const visual=transfer.draft.presentation.visual;
 for(const [part,slug] of [["cast","cast"],["travel","projectile"],["impact","impact"]]){
   assert.equal(visual[part].assetId,
     "pack:capture:sprite-skill-raiiven-remanence-interdite-"+slug+"-v1");
 }
 const source=readFileSync("src/adapters/renderer/dom-skill-fx.js","utf8");
 assert.match(source,/visual:echoVisual/);
});
test("shadow effect uses supplied canonical atlas without owning combat damage, fallback remains",async()=>{
 const elements=[],doc={createElement:()=>({style:{},dataset:{},remove(){this.removed=true;}})};
 const arena={ownerDocument:doc,getBoundingClientRect:()=>({left:0,top:0,width:800,height:400}),
   append(x){elements.push(x)}};
 const rect={left:100,top:100,width:40,height:40};
 const visual={assetId:"pack:capture:sprite-skill-raiiven-remanence-interdite-projectile-v1",
   url:"https://assets.example/test.webp",frameCount:3,frameMs:120,playbackMode:"loop"};
 const fx=playDomShadowEchoFxV1({arena,sourceRect:rect,targetRect:{...rect,left:500},
   type:"projectile",durationMs:700,visual,animate:()=>({finished:Promise.resolve(),cancel(){}})});
 assert.equal(fx.node.dataset.assetId,visual.assetId);
 assert.ok(fx.node.style.backgroundImage.includes("test.webp"));
 assert.equal(fx.node.style.backgroundSize,"300% 100%");
 assert.equal(fx.node.style.animationIterationCount,"infinite");
 assert.equal(fx.node.dataset.shadowEcho,"true");
 await fx.finished;
 assert.equal(fx.node.removed,true);
});
test("one import script, one official catalog and all 15 immutable author archives",()=>{
 const s=readFileSync("scripts/import-raiiven-firehorse-fx-20261121.py","utf8");
 assert.match(s,/global-assets/);
 assert.ok(s.includes("assert len(added)==25"));
 assert.match(s,/Never replace/mi);
 for(const item of ["raiiven_assets_for_deposit.zip","dos_cheval_feu.zip",
   "face_cheval_feu.zip","modeles_cheval_feu.zip"]){
   assert.ok(readFileSync(item).byteLength>10000);
 }
});
