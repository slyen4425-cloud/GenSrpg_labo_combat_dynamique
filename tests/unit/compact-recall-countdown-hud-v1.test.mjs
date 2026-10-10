import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mountCaptureCombatRosterPanelV1 } from "../../src/ui/capture-combat-roster-controller-v1.js";

const file = async path => readFile(path,"utf8");

test("always-visible recap puts a compact recall badge inside the fixed summary, not scrollable popup",async()=>{
  const html=await file("examples/dom-demo/capture-editor-v2.html");
  const menu=html.match(/<details class="combat-test-team-menu"[\\s\\S]*?<\\/details>/)?.[0];
  assert.ok(menu,"native roster dropdown must exist");
  const summary=menu.match(/<summary[\\s\\S]*?<\\/summary>/)?.[0];
  assert.ok(summary,"always-visible summary must exist");
  assert.match(summary,/data-combat-team-summary-label/);
  assert.match(summary,/data-combat-recall-countdown/);
  assert.ok(summary.indexOf("data-combat-recall-countdown")<summary.indexOf("</summary>"));
  assert.ok(menu.indexOf("data-combat-recall-countdown")<menu.indexOf("combat-test-team-menu__body"));
  assert.match(html,/data-combat-roster-command="switch"/);
});

test("compact pill styles fit landscape/mobile and are hidden cleanly at zero",async()=>{
  const css=await file("examples/dom-demo/capture-editor-v2.css");
  assert.match(css,/\\.combat-test-team-menu\\s+summary/);
  assert.match(css,/\\[data-combat-recall-countdown\\]/);
  assert.match(css,/\\[data-combat-recall-countdown\\]\\[hidden\\]/);
  assert.match(css,/font-variant-numeric:\\s*tabular-nums/);
});

function node(extra={}) {
  return {
    dataset:{}, children:[], textContent:"", hidden:false, disabled:false,
    append(...args){this.children.push(...args)},
    replaceChildren(...args){this.children=args},
    setAttribute(){},
    ...extra
  };
}

test("native Roster snapshot drives only a small visible badge; long explanatory paragraph remains static",()=>{
  const label=node(),countdown=node({hidden:true}),summary=node({
    querySelector(sel){
      if(sel==="[data-combat-team-summary-label]")return label;
      if(sel==="[data-combat-recall-countdown]")return countdown;
      return null;
    }
  });
  const host=node(),note=node(),button=node({dataset:{combatRosterCommand:"switch"}});
  const panel={
    hidden:true,
    querySelector(sel){
      if(sel==="[data-combat-team-rosters]")return host;
      if(sel==="[data-combat-team-summary]")return summary;
      if(sel==="[data-combat-recall-note]")return note;
      return null;
    },
    querySelectorAll(sel){return sel==="[data-combat-roster-command]"?[button]:[]},
    addEventListener(){},removeEventListener(){}
  };
  const root={querySelector:()=>panel,ownerDocument:{createElement:()=>node()}};
  let remainingMs=45000;
  const member=(id,active)=>({id,displayName:id,hp:10,maxHp:10,active,selected:!active});
  const controller={
    snapshot(){return {player:{
      activeMemberId:"a",selectedReserveMemberId:"b",
      voluntarySwitchCooldownRemainingMs:remainingMs,
      members:[member("a",true),member("b",false)]
    }}},
    previewCommand(){return {ok:remainingMs===0}},
    selectReserve(){return {ok:true}}
  };
  const ui=mountCaptureCombatRosterPanelV1({
    root,controller,format:{
      localActorId:"player",actors:[{actorId:"player",teamId:"team"}],
      teamOf:()=> "team"
    },
    commands:{switch:{kind:"switch",name:"Rappel et invocation",energyCost:0,preparationMs:2000}},
    session:{},getRuntime:()=>({hasActiveActionFor:()=>false,hasActiveAction:false}),
    isTransitionPending:()=>false,setStatus(){}
  });
  try{
    assert.equal(panel.hidden,false);
    ui.render();
    assert.match(label.textContent,/Rappel/);
    assert.equal(countdown.textContent,"45 s");
    assert.equal(countdown.hidden,false);
    assert.equal(button.disabled,true);
    const staticNote=note.textContent;
    assert.doesNotMatch(staticNote,/Prochain changement volontaire dans/);
    remainingMs=11250;
    ui.render();
    assert.equal(countdown.textContent,"12 s");
    assert.equal(note.textContent,staticNote);
    remainingMs=0;
    ui.render();
    assert.equal(countdown.hidden,true);
    assert.equal(countdown.textContent,"");
    assert.equal(button.disabled,false);
    assert.equal(host.children.length,1,"roster items are reused, no duplicate nodes");
  }finally{ui.dispose()}
});
