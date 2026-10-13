import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mountCaptureCombatRosterPanelV1 } from "../../src/ui/capture-combat-roster-controller-v1.js";

const css = readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.css",import.meta.url),"utf8");
const html = readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
const rosterCode = readFileSync(new URL("../../src/ui/capture-combat-roster-controller-v1.js",import.meta.url),"utf8");

function node(tag="div") {
  return {tagName:tag.toUpperCase(),dataset:{},children:[],hidden:false,disabled:false,attributes:{},
    textContent:"",append(...v){this.children.push(...v)},replaceChildren(...v){this.children=v},
    setAttribute(k,v){this.attributes[k]=String(v)},getAttribute(k){return this.attributes[k]??null},
    addEventListener(){},removeEventListener(){},querySelector(){return null}};
}
function scenario(benchCount){
 const roster={local:{members:[{id:"l1",creatureId:"wolf",displayName:"Loup",active:true,hp:100,maxHp:100}]},
 enemy:{members:[{id:"e1",creatureId:"golem",displayName:"Golem",active:true,hp:100,maxHp:100},
 ...Array.from({length:benchCount},(_,i)=>({id:"e"+(i+2),creatureId:"golem",displayName:"Réserve",active:false,hp:20,maxHp:100}))]}};
 const host=node(), summary=node(), enemyHost=node(), enemySummary=node();
 const panel=node("details");panel.querySelector=q=>q==="[data-combat-team-rosters]"?host:summary;panel.querySelectorAll=()=>[];
 const enemy=node("details");enemy.hidden=true;enemy.querySelector=q=>q==="[data-combat-enemy-reserves-list]"?enemyHost:q==="[data-combat-enemy-reserves-summary]"?enemySummary:null;
 const root={querySelector:q=>q==="[data-combat-team-menu]"?panel:q==="[data-combat-enemy-reserves]"?enemy:null,ownerDocument:{createElement:node}};
 const actors=[{actorId:"local",teamId:"a"},{actorId:"enemy",teamId:"b"}],format={actors,localActorId:"local",teamOf:id=>actors.find(x=>x.actorId===id).teamId};
 const ui=mountCaptureCombatRosterPanelV1({root,format,controller:{snapshot:()=>roster,previewCommand:()=>({ok:false})},
 commands:{switch:{name:"Rappel",energyCost:0,preparationMs:1000}},session:{previewCommand:()=>({ok:false})},
 getRuntime:()=>({hasActiveActionFor:()=>false}),isTransitionPending:()=>false,setStatus:()=>{}});
 try {ui.render();return{hidden:enemy.hidden,summary:enemySummary.textContent,body:enemyHost.children}}finally{ui.dispose();}
}

test("1v1 enemy reserve shortcut is visible even if all current opponents are active",()=>{
 assert.equal(scenario(0).hidden,false,"Do not hide the only native enemy bench shortcut");
 assert.match(scenario(0).summary,/Réserves adverses · 0/);
 assert.equal(scenario(2).hidden,false);
 assert.match(scenario(2).summary,/Réserves adverses · 2/);
 assert.match(rosterCode,/enemyPanel\.hidden = false/);
 assert.match(html,/<details class="combat-test-enemy-reserves" data-combat-enemy-reserves/);
});
test("2v2 enemies use separate top-left and top-right health cards, without moving 1v1 cards",()=>{
 const block=css.slice(css.indexOf("/* Combat 2v2 readable mobile HUD and enemy bench V1"));
 assert.ok(block.length>0);
 assert.match(block,/\[data-combat-active-count="2"\] \.squad-card--opponent-b\s*\{[^}]*left\s*:/s);
 assert.match(block,/\[data-combat-active-count="2"\] \.squad-card--opponent\s*\{[^}]*right\s*:/s);
 assert.match(block,/\[data-combat-active-count="2"\] > \.combat-test-enemy-reserves\s*\{[^}]*top\s*:/s);
 assert.doesNotMatch(block,/\[data-combat-active-count="1"\] \.squad-card--/);
});
test("solo 2v2 retains a genuinely narrow skill panel and exposes ally in freed arena space",()=>{
 const block=css.slice(css.indexOf("/* Combat 2v2 readable mobile HUD and enemy bench V1"));
 assert.match(block,/\[data-combat-active-count="2"\] \.coop-command-stack\s*\{[^}]*width\s*:\s*min\(\d+(?:\.\d+)?rem,\s*3[0-9]%\)/s);
 assert.match(block,/\[data-combat-active-count="2"\] \.action-option--skill\s*\{[^}]*aspect-ratio\s*:\s*auto/s);
 assert.match(block,/\[data-combat-active-count="2"\] \.fighter--ally\s*\{[^}]*left\s*:/s);
 assert.match(block,/\[data-combat-active-count="2"\] \.squad-card--command-ally\s*\{[^}]*position\s*:\s*absolute/s);
 assert.match(html,/data-combat-dodge/);
 assert.match(html,/data-combat-roster-command="switch"/);
});
