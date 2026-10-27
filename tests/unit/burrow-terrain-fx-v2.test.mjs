import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {BURROW_TERRAIN_FX_PRESET_V2,planBurrowTerrainFxV2} from "../../src/core/fx/burrow-terrain-fx-v2.js";
import {playDomBurrowTerrainFxV2} from "../../src/adapters/renderer/dom-burrow-terrain-fx-v2.js";

test("burrow terrain FX shares existing timing, follows positions and arrives at Runtime impact",()=>{
  const plan=planBurrowTerrainFxV2({
    from:{x:92,y:240},to:{x:540,y:119},travelMs:650
  });
  assert.equal(plan.totalMs,650);
  assert.equal(plan.emergeAtMs+plan.emergeMs,650);
  assert.equal(plan.trailAtMs,plan.phases.diveMs);
  assert.equal(plan.trailLengthPx,Math.hypot(448,-121));
  assert.ok(plan.trailAngleDeg<0);
  assert.equal(plan.debris.length,BURROW_TERRAIN_FX_PRESET_V2.debrisCount);
  assert.ok(plan.phases.hiddenMs>0);
  assert.notEqual(plan.to.x,plan.from.x);
});

test("burrow terrain FX handles 1 and 2ms attack without negative durations or second impact clock",()=>{
  for(const travelMs of [1,2,8,40,650,2100]){
    const plan=planBurrowTerrainFxV2({
      from:{x:200,y:100},to:{x:200,y:100},travelMs
    });
    assert.equal(plan.totalMs,travelMs);
    assert.equal(plan.emergeAtMs+plan.emergeMs,travelMs);
    assert.ok(plan.trailMs>0);
    assert.equal(plan.trailLengthPx,0);
    assert.ok(plan.debris.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)));
  }
  for(const bad of [0,-1,NaN,Infinity]){
    assert.throws(()=>planBurrowTerrainFxV2({
      from:{x:0,y:0},to:{x:1,y:1},travelMs:bad
    }),RangeError);
  }
  assert.throws(()=>planBurrowTerrainFxV2({
    from:{x:NaN,y:0},to:{x:1,y:1},travelMs:30
  }),TypeError);
});

function fakeArena(){
  const nodes=[];
  const effects=[];
  const ownerDocument={
    createElement(){
      const node={
        style:{},dataset:{},removed:false,
        setAttribute(){},
        animate(frames,options){
          const a={frames,options,cancelled:false,cancel(){this.cancelled=true;}};
          effects.push(a);return a;
        },
        remove(){this.removed=true;}
      };
      nodes.push(node);
      return node;
    }
  };
  return {arena:{ownerDocument,append(){}},nodes,effects};
}

test("visible soil opening, route, exit crater and rocks are created and cancelled together",()=>{
  const {arena,nodes,effects}=fakeArena();
  const fx=playDomBurrowTerrainFxV2({
    arena,from:{x:12,y:68},to:{x:410,y:180},travelMs:700
  });
  assert.equal(fx.status,"playing");
  assert.equal(nodes.filter(n=>n.dataset.burrowFx==="entry").length,1);
  assert.equal(nodes.filter(n=>n.dataset.burrowFx==="trench").length,1);
  assert.equal(nodes.filter(n=>n.dataset.burrowFx==="crest").length,1);
  assert.equal(nodes.filter(n=>n.dataset.burrowFx==="emergence").length,1);
  assert.equal(nodes.filter(n=>n.dataset.burrowFx==="debris").length,9);
  assert.ok(effects.every(a=>a.options.duration>0&&a.options.delay>=0));
  assert.ok(nodes.every(n=>n.style.pointerEvents==="none"));
  assert.ok(nodes.every(n=>n.style.zIndex==="6"));
  fx.cancel();
  fx.cancel();
  assert.ok(nodes.every(n=>n.removed));
  assert.ok(effects.every(a=>a.cancelled));
});

test("no false sillon for zero-distance target and no residual DOM",()=>{
  const {arena,nodes}=fakeArena();
  const fx=playDomBurrowTerrainFxV2({
    arena,from:{x:22,y:30},to:{x:22,y:30},travelMs:2
  });
  assert.equal(nodes.filter(n=>n.dataset.burrowFx==="trench").length,0);
  fx.cancel();
  assert.ok(nodes.every(n=>n.removed));
});

test("burrow FX is called by real approach only, and all interruption paths release it",async()=>{
  const src=await readFile(new URL("../../src/ui/demo-app.js",import.meta.url),"utf8");
  assert.match(src,/approachMode === "burrow"[\s\S]*?playDomBurrowTerrainFxV2\(/);
  assert.match(src,/const handle = slot\.renderer\.play\(plan\)/);
  assert.match(src,/activeBurrowTerrainFxBySlot\.set\(slotKey,burrowTerrainFx\)/);
  assert.match(src,/\.finally\(\(\) => \{[\s\S]*?cancelBurrowTerrainFxFor\(slotKey\)/);
  assert.match(src,/function cancelFor\(slotKey\)[\s\S]*?cancelBurrowTerrainFxFor\(slotKey\)/);
  assert.match(src,/function setCreatureFor\([\s\S]*?cancelBurrowTerrainFxFor\(slotKey\)/);
  assert.match(src,/function setSlotVisible\([\s\S]*?cancelBurrowTerrainFxFor\(slotKey\)/);
  assert.match(src,/dispose\(\) \{[\s\S]*?for \(const key of activeBurrowTerrainFxBySlot\.keys\(\)\)/);
});
