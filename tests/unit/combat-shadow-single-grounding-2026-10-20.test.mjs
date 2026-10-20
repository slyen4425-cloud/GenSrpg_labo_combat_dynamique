import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {groundShadowLayoutFromOpaqueMaskV2} from "../../src/adapters/renderer/dom-ground-shadow-v2.js";
const text=p=>readFile(new URL("../../"+p,import.meta.url),"utf8");
const mask=(contact=80)=>{
 const opaque=new Uint8Array(10000);
 for(let y=25;y<=contact;y++)for(let x=20;x<=80;x++)opaque[y*100+x]=1;
 return {width:100,height:100,opaque};
};
test("one resolver calculates shadow footprint and contact, never duplicates profile bottom",()=>{
 const profile={bottomPct:40,opacity:0.6,widthMultiplier:1.25};
 const a=groundShadowLayoutFromOpaqueMaskV2(mask(80),profile);
 const b=groundShadowLayoutFromOpaqueMaskV2(mask(93),profile);
 assert.ok(a.widthPct>46&&a.widthPct<=92);
 assert.ok(a.bottomPct>0&&a.bottomPct<40,"contact from opaque feet beats unrelated profile placeholder");
 assert.ok(b.bottomPct<a.bottomPct,"lower actual feet place shadow lower, regardless of profile bottom");
 assert.equal(a.opacity,0.6);
 const empty=groundShadowLayoutFromOpaqueMaskV2({width:100,height:100,opaque:new Uint8Array(10000)},profile);
 assert.equal(empty.bottomPct,40,"profile only used when no opaque footprint exists");
 assert.equal(empty.opacity,0.6);
});
test("cached and async image follow identical source after actor rebuild, with one shadow writer",async()=>{
 const source=await text("src/ui/demo-app.js");
 const start=source.indexOf("  function setCreature(nextMeta");
 const end=source.indexOf("  function setVisible(",start);
 assert.ok(start>=0&&end>start);
 const setCreature=source.slice(start,end);
 assert.ok(setCreature.indexOf("rebuildActor(runtimeUrl)")<setCreature.indexOf("loadRuntimeAsset(runtimeUrl)"));
 const rebuild=source.slice(source.indexOf("  function rebuildActor("),source.indexOf("  function loadRuntimeAsset("));
 assert.doesNotMatch(rebuild,/--creature-shadow-bottom|--creature-shadow-opacity/,"profile rebuild may not override measured shadow");
 const load=source.slice(source.indexOf("  function loadRuntimeAsset("),start);
 assert.equal((load.match(/--creature-shadow-bottom/g)||[]).length,1);
 assert.equal((load.match(/--creature-shadow-opacity/g)||[]).length,1);
 assert.match(load,/token !== imageLoadToken \|\| settled/);
 assert.match(load,/shadowElement\.style\.visibility = "hidden"/);
 assert.match(load,/shadowElement\.style\.visibility = "visible"/);
 assert.match(load,/groundShadowLayoutFromOpaqueMaskV2/);
});
