import test from "node:test";
import assert from "node:assert/strict";
import { restingProjectileAimRectV1, createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { visibleModelOpaqueAimPoint, screenPointToModelUnit } from "../../src/adapters/renderer/dom-visible-model-contact.js";

const rect=(left,top,width,height)=>({left,top,width,height});
const center=r=>({x:r.left+r.width/2,y:r.top+r.height/2});
const offset=(r,dx,dy)=>rect(r.left+dx,r.top+dy,r.width,r.height);
const mask=Object.freeze({
  width:5,height:5,
  // Donut: its bounding-box center is transparent despite real opaque pixels around it.
  opaque:new Uint8Array([
    0,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0
  ])
});
function frameFrom(rectangle) {
  return {mask,origin:{x:rectangle.left,y:rectangle.top},
    axisX:{x:rectangle.left+rectangle.width,y:rectangle.top},
    axisY:{x:rectangle.left,y:rectangle.top+rectangle.height}};
}
const opaque=(frame,point)=>{
  const u=screenPointToModelUnit(frame,point);
  assert.ok(u,"a visible point must map to model coordinates");
  const x=Math.max(0,Math.min(mask.width-1,Math.floor(u.u*mask.width)));
  const y=Math.max(0,Math.min(mask.height-1,Math.floor(u.v*mask.height)));
  return mask.opaque[y*mask.width+x]===1;
};

test("opaque target aim never chooses a transparent bounding-box center",()=>{
  const frame=frameFrom(rect(100,150,100,100));
  const point=visibleModelOpaqueAimPoint(frame);
  assert.ok(point);
  assert.equal(opaque(frame,point),true,"a target point must be an actual opaque pixel");
  assert.equal(opaque(frame,center(rect(100,150,100,100))),false,
    "the historical bbox-center shortcut would fly through an alpha hole");
});

test("author-position offset survives resting projection at variable scale, flight and burrow do not steer the shot",()=>{
  const slot=rect(350,160,60,50);
  for(const scale of [0.7,1,1.8]){
    for(const nativeY of [-26,0,35]){
      let rest=null;
      for(const motionY of [0,-130,140]){
        const motion=rect(350+(60-60*scale)/2,160+(50-50*scale)/2+nativeY+motionY,60*scale,50*scale);
        const frame=frameFrom(motion);
        const aim=visibleModelOpaqueAimPoint(frame);
        const shot=restingProjectileAimRectV1({
          slotRect:slot,motionRect:motion,
          visibleRect:rect(aim.x-0.5,aim.y-0.5,1,1),
          restingOffset:{x:0,y:nativeY}
        });
        assert.ok(Number.isFinite(shot.top));
        // Landing point is sampled on the opaque body at its AUTHORED rest placement.
        const restModel=offset(motion,0,-motionY);
        assert.equal(opaque(frameFrom(restModel),{x:shot.left,y:shot.top}),true,
          "resting straight line must intersect the scaled, opaque silhouette");
        if(rest)assert.deepEqual(shot,rest,"air/underground motion cannot redirect a direct shot");
        else rest=shot;
      }
    }
  }
});

function render({fromSlot="player",targetSlot="opponent",nativeX=14,nativeY=35,motionShiftY=0}={}){
  const slots={player:rect(40,220,40,40),opponent:rect(350,160,60,50)};
  const r=slots[targetSlot];
  const moved=offset(r,nativeX,nativeY+motionShiftY);
  const frame=frameFrom(moved);
  const animations=[];
  const doc={createElement(){return {style:{},dataset:{},className:"",children:[],append(x){this.children.push(x)},remove(){},getBoundingClientRect(){return rect(0,0,10,10)}}}};
  const arena={ownerDocument:doc,append(){},getBoundingClientRect(){return rect(0,0,500,400)}};
  const anchorRects={...slots,[targetSlot]:moved};
  const anchors=Object.fromEntries(Object.entries(anchorRects).map(([k,v])=>[k,{getBoundingClientRect(){return v}}]));
  const targetAnchors=Object.fromEntries(Object.entries(slots).map(([k,v])=>[k,{getBoundingClientRect(){return v}}]));
  const fx=createDomSkillFxRenderer({
    arena,anchors,targetAnchors,
    targetAnchorFor(slot){return slot===targetSlot?moved:null},
    targetCollisionModelFor(slot){return slot===targetSlot?{snapshot(){return frame}}:null},
    restingOffsetFor(slot){return slot===targetSlot?{x:nativeX,y:nativeY}:{x:0,y:0}},
    animate(_node,keyframes){animations.push(keyframes);return {cancel(){},finished:new Promise(()=>{})}},
    requestFrame(){return null},cancelFrame(){}
  });
  fx.play({type:"projectile",skillId:"fireball",fromSlot,targetSlot,durationMs:700});
  const animation=animations.at(-1);
  assert.ok(animation);
  const match=/translate3d\\(([-0-9.]+)px, ([-0-9.]+)px, 0\\)/.exec(animation.at(-1).transform);
  assert.ok(match,animation.at(-1).transform);
  const launch=center(slots[fromSlot]),landing={x:launch.x+Number(match[1]),y:launch.y+Number(match[2])};
  fx.dispose();
  return {landing,frame,moved,slots};
}

test("real projectile renderer uses authored creature position and opaque collision model in both firing directions",()=>{
  for(const [fromSlot,targetSlot] of [["player","opponent"],["opponent","player"]]){
    const standing=render({fromSlot,targetSlot});
    const airborne=render({fromSlot,targetSlot,motionShiftY:-140});
    const underground=render({fromSlot,targetSlot,motionShiftY:150});
    assert.deepEqual(standing.landing,airborne.landing);
    assert.deepEqual(standing.landing,underground.landing);
    assert.equal(opaque(standing.frame,standing.landing),true,
      "a resting creature must actually be on the physical lane, not below it");
  }
});
