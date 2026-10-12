import test from "node:test";
import assert from "node:assert/strict";
import { combatSkillReserveTargetOptionsV2 } from "../../src/ui/combat-2v2-test-ui.js";
import { mountCaptureCombatRosterPanelV1 } from "../../src/ui/capture-combat-roster-controller-v1.js";

const actors = [{actorId:"player",teamId:"heroes"},{actorId:"opponent",teamId:"enemies"}];
const format = {
  actors, localActorId:"player",
  teamOf(id) { return actors.find(x=>x.actorId===id)?.teamId ?? null; }
};
function roster() {
  return {
    player:{activeMemberId:"p0",selectedReserveMemberId:"p1",members:[
      {id:"p0",displayName:"Héro",active:true,hp:100,maxHp:100},
      {id:"p1",displayName:"Soigneur",active:false,hp:60,maxHp:100}
    ]},
    opponent:{activeMemberId:"e0",selectedReserveMemberId:"e1",members:[
      {id:"e0",displayName:"Dragon",active:true,hp:100,maxHp:100},
      {id:"e1",displayName:"Loup",active:false,hp:100,maxHp:100},
      {id:"e2",displayName:"Golem",active:false,hp:0,maxHp:100}
    ]}
  };
}
function scope(relations=["enemy"]) {
  return {id:"bench-bolt",targetLocations:["reserve"],targetRelations:relations};
}

test("reserve candidate UI uses Roster-owned previews, filters KO and keeps exact member IDs",()=>{
  const requested=[];
  const result = combatSkillReserveTargetOptionsV2({
    format,actorId:"player",skill:scope(),rosterSnapshot:roster(),
    previewTarget(args) {
      requested.push(args.targetRef);
      return {ok:args.targetRef.teamId==="opponent"};
    }
  });
  assert.deepEqual(result.map(x=>x.targetRef),[
    {scope:"reserve",teamId:"opponent",memberId:"e1"}
  ]);
  assert.deepEqual(requested.map(x=>x.memberId),["p1","e1"]);
  assert.deepEqual(combatSkillReserveTargetOptionsV2({
    format,actorId:"player",skill:{targetLocations:["active"]},rosterSnapshot:roster(),
    previewTarget(){throw new Error("active-only skill cannot inspect reserve");}
  }),[]);
});

function node() {
  return {dataset:{},children:[],disabled:false,append(...kids){this.children.push(...kids);},
    replaceChildren(...kids){this.children=kids;},setAttribute(name,value){this[name]=value;}};
}
test("real roster panel selects one enemy bench target without changing voluntary recall choice",()=>{
  const elements=[];const listeners={};let recallSelection=null;let activated=null;
  const host=node(),summary=node();
  const panel={
    querySelector(selector) {return selector==="[data-combat-team-rosters]"?host:summary;},
    querySelectorAll(){return[];},
    addEventListener(kind,handler){listeners[kind]=handler;},
    removeEventListener(){}
  };
  const root={querySelector(){return panel;},ownerDocument:{createElement(){
    const n=node();elements.push(n);return n;
  }}};
  const snapshot=roster();
  const controller={
    snapshot(){return snapshot;},
    selectReserve(actorId,memberId){recallSelection=[actorId,memberId];return{ok:true};}
  };
  const ui=mountCaptureCombatRosterPanelV1({
    root,controller,format,
    commands:{switch:{name:"Rappel",preparationMs:1000}},
    session:{previewCommand(){return{ok:true};}},
    getRuntime:()=>({hasActiveActionFor:()=>false,hasActiveAction:false}),
    isTransitionPending:()=>false,setStatus(){},
    reserveTargetCandidates:()=>[{targetRef:{scope:"reserve",teamId:"opponent",memberId:"e1"}}],
    onTargetReserve(ref){activated=ref;return true;}
  });
  try {
    ui.render();
    const enemyBench=elements.find(n=>n.dataset.rosterMemberId==="e1");
    const enemyKO=elements.find(n=>n.dataset.rosterMemberId==="e2");
    const localBench=elements.find(n=>n.dataset.rosterMemberId==="p1");
    assert.equal(enemyBench.disabled,false);
    assert.equal(enemyBench.dataset.skillReserveCandidate,"true");
    assert.equal(enemyKO.disabled,true);
    listeners.click({target:{closest:selector=>selector.includes("roster-member-id")?enemyBench:null}});
    assert.deepEqual(activated,{scope:"reserve",teamId:"opponent",memberId:"e1"});
    assert.equal(recallSelection,null);
    listeners.click({target:{closest:selector=>selector.includes("roster-member-id")?localBench:null}});
    assert.deepEqual(recallSelection,["player","p1"]);
  } finally {ui.dispose();}
});
