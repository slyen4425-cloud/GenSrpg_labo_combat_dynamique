import test from "node:test";
import assert from "node:assert/strict";
import { mountCaptureCombatRosterPanelV1 } from "../../src/ui/capture-combat-roster-controller-v1.js";

function makeNode(tag = "div") {
  return {
    tagName: tag.toUpperCase(), dataset: {}, children: [], hidden: false, disabled: false,
    attributes: {}, textContent: "",
    append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = nodes; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name] ?? null; },
    addEventListener() {}, removeEventListener() {}, querySelector() { return null; }
  };
}

test("reserve rows show their own canonical creature icon, preserve KO and missing-image fallback", () => {
  const nodes = [], snapshot = {
    local: { activeMemberId:"p0", selectedReserveMemberId:"p1", members:[
      { id:"p0",creatureId:"alpha",displayName:"Alpha",active:true,selected:false,hp:100,maxHp:100 },
      { id:"p1",creatureId:"beta",displayName:"Beta",active:false,selected:true,hp:43,maxHp:100 }
    ]},
    enemy: { activeMemberId:"e0", selectedReserveMemberId:null, members:[
      { id:"e0",creatureId:"golem",displayName:"Golem",active:true,selected:false,hp:100,maxHp:100 },
      { id:"e1",creatureId:"phoenix",displayName:"Phénix",active:false,selected:false,hp:0,maxHp:120 },
      { id:"e2",creatureId:"unknown",displayName:"Inconnu",active:false,selected:false,hp:21,maxHp:55 }
    ]}
  };
  const host=makeNode(),summary=makeNode(),enemyHost=makeNode(),enemySummary=makeNode();
  const panel=makeNode("details");panel.querySelector=s=>s==="[data-combat-team-rosters]"?host:summary;
  panel.querySelectorAll=()=>[];
  const enemyPanel=makeNode("details");
  enemyPanel.querySelector=s=>s==="[data-combat-enemy-reserves-list]"?enemyHost:
    s==="[data-combat-enemy-reserves-summary]"?enemySummary:null;
  const root={
    querySelector:s=>s==="[data-combat-team-menu]"?panel:
      s==="[data-combat-enemy-reserves]"?enemyPanel:null,
    ownerDocument:{createElement(tag) { const n=makeNode(tag); nodes.push(n); return n; }}
  };
  const actors=[{actorId:"local",teamId:"us",displayName:"Nous"},
    {actorId:"enemy",teamId:"them",displayName:"Eux"}];
  const format={actors,localActorId:"local",teamOf:id=>actors.find(a=>a.actorId===id)?.teamId};
  const getCreatureDescriptor = id => ({
    alpha: {id:"asset:alpha",iconUrl:"https://assets.test/alpha.webp"},
    beta: {id:"asset:beta",iconUrl:"https://assets.test/beta.webp"},
    phoenix: {id:"asset:phoenix",iconUrl:"https://assets.test/phoenix.webp"}
  })[id] ?? null;
  const ui=mountCaptureCombatRosterPanelV1({
    root, format, getCreatureDescriptor, controller:{
      snapshot:()=>snapshot, previewCommand:()=>({ok:false}), selectReserve:()=>({ok:true})
    }, session:{previewCommand:()=>({ok:false})},
    commands:{switch:{name:"Rappel",preparationMs:1000,energyCost:0}},
    getRuntime:()=>({hasActiveActionFor:()=>false}),
    isTransitionPending:()=>false,setStatus:()=>{}
  });
  try {
    ui.render();
    const localReserve=nodes.find(n=>n.dataset.rosterMemberId==="p1");
    const localImg=localReserve.children.find(n=>n.tagName==="IMG");
    assert.ok(localImg,"local reserve should have a real portrait element");
    assert.equal(localImg.src,"https://assets.test/beta.webp");
    assert.equal(localImg.dataset.assetId,"asset:beta");
    assert.equal(localImg.alt,"");
    assert.equal(localReserve.attributes["aria-pressed"],"true");
    assert.match(localReserve.textContent + localReserve.children.map(n=>n.textContent).join(" "),/Beta/);

    const enemyKO=nodes.find(n=>n.dataset.enemyReserveMemberId==="e1");
    const enemyPortrait=enemyKO.children.find(n=>n.tagName==="IMG");
    assert.ok(enemyPortrait,"enemy reserve should show a portrait also when KO");
    assert.equal(enemyPortrait.src,"https://assets.test/phoenix.webp");
    assert.equal(enemyKO.dataset.defeated,"true");
    assert.equal(enemyKO.disabled,true);

    const noImage=nodes.find(n=>n.dataset.enemyReserveMemberId==="e2");
    assert.equal(noImage.children.some(n=>n.tagName==="IMG" && !n.hidden),false,
      "no fabricated placeholder asset");
    assert.match(noImage.children.map(n=>n.textContent).join(" "),/Inconnu/);
  } finally { ui.dispose(); }
});
