import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {captureArenaAuthorPositionScaleV1} from "../../src/ui/demo-app.js";
import {fxArenaScaleV1,fxAuthorPixelsV1} from "../../src/adapters/renderer/dom-skill-fx.js";
import {playDomBurrowTerrainFxV2} from "../../src/adapters/renderer/dom-burrow-terrain-fx-v2.js";
import {cameraShakeTimelineV1} from "../../src/adapters/renderer/dom-camera-fx.js";

const read=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const css=read("examples/dom-demo/demo.css");
const demo=read("src/ui/demo-app.js");
function arena(height,width){
 const style={values:{},setProperty(k,v){this.values[k]=String(v);},getPropertyValue(k){return this.values[k]??"";}};
 const nodes=[],animations=[];
 const el={style,getBoundingClientRect(){return {left:0,top:0,width,height};},
  ownerDocument:{createElement(){const node={className:"",dataset:{},style:{},setAttribute(){},
   remove(){this.removed=true;},animate(frames,options){
    const a={frames,options,cancel(){this.cancelled=true;}};animations.push(a);return a;
   }};nodes.push(node);return node;}},
  append(){}};
 style.setProperty("--combat-arena-author-offset-scale",captureArenaAuthorPositionScaleV1(el));
 return {el,nodes,animations};
}
const sprites={start:{url:"/start.webp",scale:4,offsetX:12,offsetY:-130,frameCount:1},
 travel:{url:"/travel.webp",scale:3,offsetX:-5,offsetY:-130,frameCount:1},
 impact:{url:"/impact.webp",scale:4,offsetX:10,offsetY:-130,frameCount:1}};

test("RED: PC/mobile share one arena height, never host width or mobile shell",()=>{
 const a=arena(400,711),b=arena(600,1600),c=arena(600,950);
 assert.equal(fxArenaScaleV1(a.el),1);
 assert.equal(fxArenaScaleV1(b.el),1.5);
 assert.equal(fxArenaScaleV1(c.el),1.5);
 assert.equal(fxAuthorPixelsV1(b.el,-130),-195);
 assert.equal(fxAuthorPixelsV1(c.el,12),18);
 assert.doesNotMatch(demo,/const phoneArenaAuthorOffsets = Boolean/);
 assert.match(demo,/const applyArenaPositionScale = \(\) =>/);
 assert.match(demo,/new globalThis.ResizeObserver\(applyArenaPositionScale\)/);
});
test("RED: every conventional FX sprite shares the same 400px arena-height CSS unit",()=>{
 const expected={"projectile":44.793,"channel-pulse":44.793,"sprite-shell":68.967,
  "cast":100.962,"impact":100.962,"persistent-zone":183.438,"tactical-zone":183.438,
  "clash-impact":137.934,"phase":110.205};
 for(const [name,px] of Object.entries(expected)){
  assert.match(css,new RegExp("\\[data-combat-arena\\] \\.skill-fx--"+name),"scoped "+name);
  assert.ok(css.includes("width: calc("+px+"px * var(--combat-arena-author-offset-scale, 1))"),
    name+" uses the stage reference");
  assert.equal(px*1.5/px,1.5);
 }
 assert.doesNotMatch(css,/\.capture-preview-shell\[data-landscape-required="true"\] \[data-combat-arena\] \.skill-fx--cast/);
});
test("RED: three authored burrow stages and fallback terrain respond identically on PC and phone",()=>{
 const a=arena(400,711),b=arena(600,1600),c=arena(600,950);
 const fxA=playDomBurrowTerrainFxV2({arena:a.el,from:{x:30,y:100},to:{x:350,y:180},travelMs:800,sprites});
 const fxB=playDomBurrowTerrainFxV2({arena:b.el,from:{x:45,y:150},to:{x:525,y:270},travelMs:800,sprites});
 const fxC=playDomBurrowTerrainFxV2({arena:c.el,from:{x:45,y:150},to:{x:525,y:270},travelMs:800,sprites});
 for(let i=0;i<3;i++){
  assert.equal(parseFloat(b.nodes[i].style.width),parseFloat(a.nodes[i].style.width)*1.5);
  assert.equal(parseFloat(c.nodes[i].style.width),parseFloat(b.nodes[i].style.width));
 }
 assert.equal(fxA.plan.holeWidthPx*1.5,fxB.plan.holeWidthPx);
 assert.equal(fxB.plan.holeWidthPx,fxC.plan.holeWidthPx);
 assert.equal(fxB.plan.trailWidthPx,fxA.plan.trailWidthPx*1.5);
 assert.equal(fxA.plan.trailLengthPx*1.5,fxB.plan.trailLengthPx);
 assert.equal(b.nodes[0].style.top,"-420px");
 fxA.cancel();fxB.cancel();fxC.cancel();
 assert.ok(a.nodes.every(x=>x.removed));
});
test("RED: camera effects project authored pixels but preserve runtime timing",()=>{
 const raw={type:"camera-shake",amplitudePx:4,durationMs:300};
 const a=cameraShakeTimelineV1(raw),b=cameraShakeTimelineV1(raw,{arenaScale:1.5});
 assert.equal(a.durationMs,b.durationMs);
 assert.equal(a.keyframes.length,b.keyframes.length);
 assert.equal(a.keyframes[1].transform,"translate3d(4px, 1.4px, 0)");
 assert.match(b.keyframes[1].transform,/translate3d\(6px, 2\.0?9/);
});
test("RED: movement, dodge and wall offsets all share one visual pixel unit",()=>{
 for(const file of ["src/adapters/renderer/dom-creature-dodge-fx-v1.js",
  "src/adapters/renderer/dom-creature-movement-visual-v1.js",
  "src/adapters/renderer/combat-entity-overlay-v1.js"]){
  assert.match(read(file),/fxAuthorPixelsV1\(/,file);
 }
 const original=read("data/capture/showcase/attaque-sous-terraine.capture-skill-transfer-v1.json");
 assert.match(original,/"scale": 4/);
 assert.match(original,/"offsetY": -130/);
});
