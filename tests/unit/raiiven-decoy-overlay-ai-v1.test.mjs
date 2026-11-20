import test from "node:test";
import assert from "node:assert/strict";
import {createDomDecoyOverlayV1} from "../../src/adapters/renderer/dom-decoy-overlay-v1.js";
import {chooseBattleActorDecoyV1} from "../../src/core/combat/battle-actor-ai-controller.js";
const makeState=(statuses,elapsedMs=0)=>({elapsedMs,fighters:{raiiven:{hp:120,statusEffects:statuses},enemy:{hp:100,statusEffects:[]}}});
const decoy=id=>({definition:{id,kind:"decoy",durationMs:20000},appliedAtMs:0,expiresAtMs:20000});
function harness(){
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
    onChoose:choice=>clicked.push(choice),
    applySpriteVisual:()=>({frameAnimation:null})});
  return {clicked,overlay,fighterContainers};
}
test("Dédale overlays reflect only two actual status instances, choice is explicit and disposes",()=>{
  const h=harness();
  h.overlay.render(makeState([decoy("left"),decoy("right")]));
  assert.equal(h.overlay.count(),2);
  const [a,b]=h.fighterContainers.raiiven.children;
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
  const hit={category:"offensive",form:"projectile"};
  const results=new Set(Array.from({length:30},(_,turn)=>
    chooseBattleActorDecoyV1({state,targetId:"raiiven",skill:hit,turn})));
  assert.ok(results.has(null));
  assert.ok([...results].some(x=>x==="left"||x==="right"));
  assert.equal(chooseBattleActorDecoyV1({state,targetId:"raiiven",skill:{...hit,form:"area"}}),null);
  assert.equal(chooseBattleActorDecoyV1({state,targetId:"enemy",skill:hit}),null);
});
