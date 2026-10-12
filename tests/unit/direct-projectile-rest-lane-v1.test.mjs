import test from "node:test";
import assert from "node:assert/strict";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { readFileSync } from "node:fs";

const fireball=importCaptureTransferJsonV1(readFileSync(new URL("../../data/capture/showcase/fireball.capture-skill-transfer-v1.json",import.meta.url),"utf8")).value.draft.definition;
const rect=(left,top,width=30,height=30)=>({left,top,width,height});
const CENTER=rect(0,0,500,400);

function travelGeometry({from="player",target="opponent",liveY=75,skyfall=false,liveX=null}={}){
 const requests=[];
 const makeNode=()=>({
  style:{},dataset:{},className:"",children:[],ownerDocument:null,
  append(...xs){this.children.push(...xs)},remove(){},
  getBoundingClientRect(){return rect(0,0,10,10)}
 });
 const doc={createElement(){let n=makeNode();n.ownerDocument=doc;return n}};
 const arena={ownerDocument:doc,append(){},getBoundingClientRect(){return CENTER}};
 const stable={
  player:rect(60,190,40,40),
  opponent:rect(350,160,60,50)
 };
 const mouth={
  player:rect(82,205,10,10),
  opponent:rect(355,174,10,10)
 };
 const live={
  ...stable, [target]:rect(liveX??stable[target].left,liveY,stable[target].width,stable[target].height)
 };
 const renderer=createDomSkillFxRenderer({
  arena,anchors:{player:{getBoundingClientRect(){return stable.player}},opponent:{getBoundingClientRect(){return stable.opponent}}},
  targetAnchors:{player:{getBoundingClientRect(){return stable.player}},opponent:{getBoundingClientRect(){return stable.opponent}}},
  targetAnchorFor(slot){return live[slot]},
  sourceAnchorFor(slot){return mouth[slot]},
  presentationForSkill(){
    return skyfall ? {travel:{url:"data:image/png;base64,AA==",trajectoryMode:"skyfall",fallHeightPx:200,fallOffsetXPx:0}} : null;
  },
  animate(_node,keyframes,options){requests.push({keyframes,options,startTop:_node.style.top,startLeft:_node.style.left});return {finished:new Promise(()=>{}),cancel(){}}},
  requestFrame(){return null},cancelFrame(){}
 });
 renderer.play({
  type:"projectile",skillId:"fireball",fromSlot:from,targetSlot:target,durationMs:700
 });
 assert.ok(requests.length>0,"projectile must animate through existing FX owner");
 return {animations:requests,flight:requests.at(-1).keyframes,stable,mouth,live};
}
const parseXY=(transform)=>{
 const m=/translate3d\(([-0-9.]+)px,\s*([-0-9.]+)px,\s*0\)/.exec(transform);
 assert.ok(m,transform);
 return {dx:Number(m[1]),dy:Number(m[2])};
};
const endpoint=x=>parseXY(x.flight.at(-1).transform);

test("Boule de feu remains surface-only, direct, and preserves its original hit contract",()=>{
 assert.equal(fireball.id,"fireball");
 assert.equal(fireball.form,"projectile");
 assert.equal(fireball.projectileTargeting,"direct");
 assert.deepEqual(fireball.hitPresenceStates,["surface"]);
});

test("direct projectile has one straight launch-to-rest-lane flight independent of airborne or underground visual offsets",()=>{
 const standing=travelGeometry({liveY:160});
 const airborne=travelGeometry({liveY:30});
 const buried=travelGeometry({liveY:290});
 assert.deepEqual(endpoint(airborne),endpoint(standing),"an airborne target must not bend or raise a straight shot");
 assert.deepEqual(endpoint(buried),endpoint(standing),"an underground target must not bend or lower a straight shot");
 assert.equal(endpoint(standing).dx,300,"straight shot still ends at the logical target's ground-stage slot");
 assert.equal(endpoint(standing).dy,-25,"straight shot uses the normal/resting target lane regardless of live Y");
 for(const v of [standing,airborne,buried]){
  assert.match(v.flight[0].transform,/translate3d\(0, 0, 0\)/);
  const trajectory=endpoint(v);
  assert.equal(v.flight.at(-1).transform.includes("translate3d"),true);
  assert.equal(Number.isFinite(trajectory.dx),true);
 }
});

test("direct projectile does not track vertical displacement when opponent fires at airborne or burrowing player",()=>{
 const standing=travelGeometry({from:"opponent",target:"player",liveY:190});
 const high=travelGeometry({from:"opponent",target:"player",liveY:-75});
 const low=travelGeometry({from:"opponent",target:"player",liveY:330});
 assert.deepEqual(endpoint(standing),endpoint(high));
 assert.deepEqual(endpoint(standing),endpoint(low));
 assert.ok(endpoint(standing).dx<0);
});

test("skyfall retains sky-based fixed destination derived from its distinct visual configuration",()=>{
 const a=travelGeometry({liveY:160,skyfall:true});
 const b=travelGeometry({liveY:30,skyfall:true});
 assert.notEqual(a.animations.at(-1).startTop,b.animations.at(-1).startTop,"skyfall must retain its own trajectory ownership");
});
