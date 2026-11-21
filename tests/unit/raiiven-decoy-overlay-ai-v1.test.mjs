import test from "node:test";
import assert from "node:assert/strict";
import {createDomDecoyOverlayV1,nextDecoyRealSlotV1} from "../../src/adapters/renderer/dom-decoy-overlay-v1.js";
import {chooseBattleActorDecoyV1,createBattleActorAiController} from "../../src/core/combat/battle-actor-ai-controller.js";
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

test("AI really submits a decoyId to its native startSkill path, and sees all three silhouettes",()=>{
  const state=makeState([decoy("left"),decoy("right")]);
  state.fighters.enemy.energy=30;
  state.fighters.enemy.maxEnergy=30;
  const cast={id:"test-hit",name:"Frappe de test",form:"projectile",
    targetRelations:["enemy"],category:"offensive",energyCost:0,
    effect:{damage:10,heal:0},effects:[]};
  const previews=[],started=[];
  const session={snapshot:()=>state,previewSkill:arg=>{
    previews.push(arg);return {ok:true};
  }};
  const runtime={hasActiveActionFor:()=>false,startSkill:arg=>{
    started.push(arg);return {ok:true};
  }};
  const controller=createBattleActorAiController({session,runtime,actorId:"enemy",
    targetIds:["raiiven"],skillIds:["test-hit"],skillsById:{"test-hit":cast},
    tactics:{enabled:true,seed:17}});
  for(let n=0;n<3;n++)assert.equal(controller.takeTurn().status,"skill_started");
  const selected=started.map(x=>x.decoyId);
  assert.deepEqual(new Set(selected),new Set(["left","right",null]),
    "three consecutive direct strikes include both real native decoys and the original");
  assert.deepEqual(previews.map(x=>x.decoyId),selected,
    "Combat Session previews and Runtime use the SAME chosen decoy ID");
});

test("Dédale keeps the leftmost scaled native sprite fully within the arena",()=>{
  const h=harness();
  const anchor=h.fighterContainers.raiiven;
  anchor.getBoundingClientRect=()=>({left:1,right:301,width:300,top:100,height:300});
  anchor.closest=()=>({getBoundingClientRect:()=>({left:0,right:900,width:900,top:0,height:600})});
  const realImage={getBoundingClientRect:()=>({left:-89,width:480,height:480})};
  const motion={style:{translate:"",scale:"",transform:"translate(10px, -20px) scale(1.6)"},
    querySelector:()=>realImage};
  anchor.querySelector=selector=>selector==="[data-demo-motion]"?motion:
    selector==="[data-demo-image]"?realImage:null;
  h.overlay.render(makeState([decoy("left"),decoy("right")]));
  const targets=anchor.children.filter(x=>x.className==="combat-decoy"||
    x.className==="combat-decoy-real-target");
  assert.equal(targets.length,3);
  const centers=targets.map(x=>1+300*(parseFloat(x.style.left)/100)+150);
  assert.ok(Math.min(...centers)-480/2>=4-0.001,
    "no left decoy should be clipped by computing offsets from the unscaled fighter width");
  assert.ok(Math.max(...centers)+480/2<=900-4+0.001,
    "no right decoy should leave the same visible arena");
  h.overlay.dispose();
});
