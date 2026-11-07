import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {burrowGroundPointForApproachV1} from "../../src/ui/demo-app.js";
import {planBurrowTerrainFxV2} from "../../src/core/fx/burrow-terrain-fx-v2.js";
import {playDomBurrowTerrainFxV2} from "../../src/adapters/renderer/dom-burrow-terrain-fx-v2.js";

test("RED: underground target stays at resting ground even while its model is airborne",()=>{
  const container={
    offsetWidth:120,
    getBoundingClientRect(){return {left:450,top:120,width:120,height:140};},
    closest(){return null;}
  };
  const target={
    container,
    actor:{position:{x:10,y:-5}},
    motion:{getBoundingClientRect(){throw new Error("airborne motion must not own underground aim");}}
  };
  const arena={left:50,top:20,height:500};
  const resting=burrowGroundPointForApproachV1(target,arena);
  assert.equal(resting.x,470);
  assert.ok(Math.abs(resting.y-218.2)<1e-8);
  const liveAirborneRect={left:450,top:-450,width:120,height:140,bottom:-310};
  assert.notEqual(resting.y,liveAirborneRect.bottom-arena.top);
});

test("RED: burrow approach and sprite impact share the same resting target owner",()=>{
  const source=readFileSync(new URL("../../src/ui/demo-app.js",import.meta.url),"utf8");
  assert.match(source,/const targetAim =[^;]*approachMode === "burrow"/);
  assert.match(source,/to: burrowGroundPointForApproachV1\(target, arenaRect\)/);
  assert.match(source,/targetTranslateY: targetCenterY - actorCenterY/);
  assert.match(source,/onContact !== null/);
});

function playTravel(from,to){
  const animations=[],nodes=[];
  const arena={ownerDocument:{createElement(){
    const node={
      className:"",dataset:{},style:{},setAttribute(){},remove(){this.removed=true;},
      animate(frames,options){
        const a={frames,options,cancel(){this.cancelled=true;}};
        animations.push(a);return a;
      }
    };
    nodes.push(node);return node;
  }},append(){}};
  const fx=playDomBurrowTerrainFxV2({
    arena,from,to,travelMs:800,
    sprites:{start:{url:"/soil-start.webp",frameCount:1},
      travel:{url:"/soil-travel.webp",frameCount:1},
      impact:{url:"/soil-impact.webp",frameCount:1}}
  });
  const travel=animations.find(a=>a.frames[0]?.transform?.includes("rotate("));
  return {fx,nodes,animations,travel};
}

test("RED: enemy burrow atlas mirrors horizontally, never rotates 180 degrees",()=>{
  const outbound=playTravel({x:100,y:160},{x:450,y:180});
  const inbound=playTravel({x:450,y:180},{x:100,y:160});
  assert.equal(outbound.fx.plan.trailSpriteMirrorX,false);
  assert.equal(inbound.fx.plan.trailSpriteMirrorX,true);
  assert.ok(Math.abs(outbound.fx.plan.trailSpriteAngleDeg)<30);
  assert.ok(Math.abs(inbound.fx.plan.trailSpriteAngleDeg)<30);
  assert.ok(!outbound.travel.frames[0].transform.includes("scaleX(-1)"));
  assert.match(inbound.travel.frames[0].transform,/scaleX\(-1\)/);
  assert.doesNotMatch(inbound.travel.frames[0].transform,/rotate\(1[78]\d/);
  for(const node of inbound.nodes){
    assert.ok(inbound.animations.some(a=>a.frames.some(f=>f.transform?.includes("scaleX(-1)"))));
    assert.ok(node.dataset.burrowFx.startsWith("sprite-"));
  }
  outbound.fx.cancel(); inbound.fx.cancel();
  assert.ok(inbound.nodes.every(node=>node.removed));
  assert.ok(inbound.animations.every(a=>a.cancelled));
});

test("burrow trajectory geometry is unchanged for player/opponent and vertical paths",()=>{
  const east=planBurrowTerrainFxV2({from:{x:100,y:160},to:{x:400,y:190},travelMs:700});
  const west=planBurrowTerrainFxV2({from:{x:400,y:190},to:{x:100,y:160},travelMs:700});
  const vertical=planBurrowTerrainFxV2({from:{x:100,y:200},to:{x:100,y:80},travelMs:700});
  assert.equal(east.trailLengthPx,west.trailLengthPx);
  assert.equal(east.totalMs,west.totalMs);
  assert.equal(east.emergeAtMs,west.emergeAtMs);
  assert.equal(vertical.trailSpriteMirrorX,false);
  assert.ok(Number.isFinite(vertical.trailSpriteAngleDeg));
});
