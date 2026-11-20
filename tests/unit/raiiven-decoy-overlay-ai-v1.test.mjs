import test from "node:test";
import assert from "node:assert/strict";
import {createDomDecoyOverlayV1,nextDecoyRealSlotV1} from "../../src/adapters/renderer/dom-decoy-overlay-v1.js";
import {chooseBattleActorDecoyV1} from "../../src/core/combat/battle-actor-ai-controller.js";
const makeState=(statuses,elapsedMs=0)=>({elapsedMs,fighters:{raiiven:{hp:120,statusEffects:statuses},enemy:{hp:100,statusEffects:[]}}});
const decoy=id=>({definition:{id,kind:"decoy",durationMs:20000},appliedAtMs:0,expiresAtMs:20000});
function harness({formationFor=()=>null}={}){
  const clicked=[];
  const doc={createElement(tag){
    return {tag,ownerDocument:doc,style:{},dataset:{},listeners:{},
      setAttribute(k,v){this[k]=v;},
      addEventListener(k,fn){this.listeners[k]=fn;},
      append(node){(this.children??=[]).push(node);},
      remove(){this.removed=true;},
      querySelector(){return null;}
    };
  }};
  const fighterContainers={raiiven:doc.createElement("div"),enemy:doc.createElement("div")};
  const overlay=createDomDecoyOverlayV1({fighterContainers,appearanceFor:()=>null,
    formationFor,random:()=>0,onChoose:choice=>clicked.push(choice),
    applySpriteVisual:()=>({frameAnimation:null})});
  return {clicked,overlay,fighterContainers};
}
test("Dédale overlays reflect only two actual status instances, choice is explicit and disposes",()=>{
  const h=harness();
  h.overlay.render(makeState([decoy("left"),decoy("right")]));
  assert.equal(h.overlay.count(),2);
  const [a,b,real]=h.fighterContainers.raiiven.children;
  assert.equal(h.fighterContainers.raiiven.children.length,3,"three visible identical target surfaces");
  real.listeners.click({stopPropagation(){},preventDefault(){}});
  assert.deepEqual(h.clicked,[{actorId:"raiiven",decoyId:null}]);
  h.clicked.length=0;
  a.listeners.click({stopPropagation(){},preventDefault(){}});
  assert.deepEqual(h.clicked,[{actorId:"raiiven",decoyId:"left"}]);
  h.overlay.render(makeState([decoy("right")]));
  assert.equal(h.overlay.count(),1);
  assert.equal(a.removed,true);
  h.overlay.render(makeState([decoy("right")],20001));
  assert.equal(h.overlay.count(),0);
  h.overlay.dispose();
  assert.equal(b.removed,true);
});
test("AI may deliberately hit a selectable silhouette but cannot fake a zone target",()=>{
  const state=makeState([decoy("left"),decoy("right")]);
  const hit={category:"offensive",form:"projectile",targetRelations:["enemy"]};
  const results=new Set(Array.from({length:30},(_,turn)=>
    chooseBattleActorDecoyV1({state,targetId:"raiiven",skill:hit,turn})));
  assert.ok(results.has(null));
  assert.ok([...results].some(x=>x==="left"||x==="right"));
  assert.equal(chooseBattleActorDecoyV1({state,targetId:"raiiven",skill:{...hit,form:"area"}}),null);
  assert.equal(chooseBattleActorDecoyV1({state,targetId:"enemy",skill:hit}),null);
  const debuff={...hit,category:"buff_debuff"};
  assert.ok(["left","right",null].includes(chooseBattleActorDecoyV1({state,targetId:"raiiven",skill:debuff,turn:1})));
  assert.equal(chooseBattleActorDecoyV1({state,targetId:"raiiven",skill:{...hit,targetRelations:["ally"]}}),null);
});

test("Dédale's visible real horse changes position and never repeats its current slot",()=>{
 assert.equal(nextDecoyRealSlotV1(null,()=>0),0);
 assert.equal(nextDecoyRealSlotV1(0,()=>0),1);
 assert.equal(nextDecoyRealSlotV1(1,()=>0),2);
 const h=harness();
 h.overlay.render(makeState([decoy("left"),decoy("right")],0));
 const real=h.fighterContainers.raiiven.children[2];
 const first=real.style.left;
 h.overlay.render(makeState([decoy("left"),decoy("right")],5000));
 assert.notEqual(real.style.left,first);
 assert.equal(h.overlay.count(),2);
 h.overlay.dispose();
 assert.equal(real.removed,true);
});

test("Author-defined shuffle interval is honored at runtime, not overwritten by generic default",()=>{
  const h=harness({formationFor:()=>({reshuffleMs:2500,spacingPct:84})});
  const state=at=>makeState([decoy("left"),decoy("right")],at);
  h.overlay.render(state(0));
  const real=h.fighterContainers.raiiven.children[2];
  const first=real.style.left;
  h.overlay.render(state(2400));
  assert.equal(real.style.left,first,"no premature 5-second-default or early shuffle");
  h.overlay.render(state(2500));
  assert.notEqual(real.style.left,first,"actual author value 2.5s takes precedence");
  h.overlay.dispose();
});
