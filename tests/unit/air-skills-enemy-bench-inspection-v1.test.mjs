import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { importCaptureTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { mountCaptureCombatRosterPanelV1 } from "../../src/ui/capture-combat-roster-controller-v1.js";

const originals = [
  {id:"cap_air_atk_7",file:"cap_air_atk_7",hash:"1274237c8af1dfadca5c5731e6648c7ac54bf783ded628fd3ec9bf099482f30d"},
  {id:"lib_tailwind",file:"lib_tailwind",hash:"2e56ae50815052bbac261f44ad1e42abae82b95ad734484684c523967924d234"},
  {id:"cap_air_atk_4",file:"cap_air_atk_4",hash:"c090b3c52a1e5ab4ae16bb9e10370fa320846f8cb5b83b002931f693928e9f89"}
];
test("the exact three current creator skill exports each replace one stable showcase ID",async()=>{
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length,19);
  for(const {id,file,hash} of originals){
    const path="data/capture/showcase/"+file+".capture-skill-transfer-v1.json";
    assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===path).length,1);
    const raw=await readFile(new URL("../../"+path,import.meta.url),"utf8");
    assert.equal(createHash("sha256").update(raw).digest("hex"),hash);
    const imported=importCaptureTransferJsonV1(raw);
    assert.equal(imported.kind,"skill");
    assert.equal(imported.value.draft.id,id);
  }
});
test("Ouragan retains group reserve splash, active target and skyfall author data",async()=>{
  const s=JSON.parse(await readFile(new URL("../../data/capture/showcase/cap_air_atk_7.capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft;
  assert.equal(s.definition.name,"Ouragan");
  assert.deepEqual(s.definition.targetLocations,["active","reserve"]);
  assert.deepEqual(s.definition.effects.map(x=>x.targetScope),["all_enemy_reserves","target"]);
  assert.deepEqual(s.definition.effects.map(x=>x.amount),[50,50]);
  assert.equal(s.presentation.visual.travel.trajectoryMode,"skyfall");
  assert.equal(s.presentation.visual.travel.frameSpeedMultiplier,3);
});
test("Tornade and Vent arrière preserve the creator's last visual/status decisions",async()=>{
  const tornado=JSON.parse(await readFile(new URL("../../data/capture/showcase/cap_air_atk_4.capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft;
  const tailwind=JSON.parse(await readFile(new URL("../../data/capture/showcase/lib_tailwind.capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft;
  assert.equal(tornado.presentation.visual.travel.farScaleRatio,.5);
  assert.equal(tornado.presentation.visual.cast.opacity,.7);
  assert.equal(tornado.presentation.visual.impact.opacity,.6);
  assert.equal(tornado.presentation.visual.travel.arrivalLayer,"front");
  assert.deepEqual(tailwind.definition.effects.map(e=>e.status.kind),["stat_modifier","skill_cooldown_rate_modifier","energy_regen_modifier","stat_modifier"]);
});
function el(tag="span"){
  return {tagName:tag.toUpperCase(),dataset:{},style:{},children:[],disabled:false,hidden:false,open:false,
    append(...c){this.children.push(...c)},replaceChildren(...c){this.children=c},
    setAttribute(k,v){this[k]=v},getAttribute(k){return this[k]??null},
    addEventListener(k,fn){(this.listeners??={})[k]=fn},removeEventListener(k){delete this.listeners?.[k]},
    closest(sel){if(sel.includes("enemy-reserve-member-id")&&this.dataset.enemyReserveMemberId)return this;return null;}
  };
}
test("enemy bench inspection stays collapsed, displays Roster-owned PV, KO and targets exact member without recall",()=>{
  const list=el(),enemySummary=el(),enemyPanel=el("details");
  enemyPanel.querySelector=s=>s==="[data-combat-enemy-reserves-list]"?list:enemySummary;
  const host=el(),summary=el(),recallPanel=el("details");
  summary.querySelector=()=>null;
  recallPanel.querySelector=s=>s==="[data-combat-team-rosters]"?host:summary;
  recallPanel.querySelectorAll=()=>[];
  const root={ownerDocument:{createElement:tag=>el(tag)},querySelector:s=>s==="[data-combat-team-menu]"?recallPanel:s==="[data-combat-enemy-reserves]"?enemyPanel:null};
  const actors=[{actorId:"player",teamId:"friendly"},{actorId:"opponent",teamId:"enemy"}];
  const format={actors,localActorId:"player",teamOf:id=>actors.find(x=>x.actorId===id)?.teamId};
  const snapshot={
    player:{activeMemberId:"p0",selectedReserveMemberId:"p1",members:[{id:"p0",displayName:"Joueur",active:true,hp:100,maxHp:100},{id:"p1",displayName:"Soin",active:false,hp:75,maxHp:100}]},
    opponent:{activeMemberId:"e0",selectedReserveMemberId:"e1",members:[{id:"e0",displayName:"Adversaire",active:true,hp:100,maxHp:100},{id:"e1",displayName:"Loup",active:false,hp:45,maxHp:100},{id:"e2",displayName:"Golem",active:false,hp:0,maxHp:120}]}
  };
  let selected=null,recall=null;
  const view=mountCaptureCombatRosterPanelV1({root,format,controller:{snapshot:()=>snapshot,selectReserve:(...args)=>{recall=args;return{ok:true}}},commands:{switch:{name:"Rappel",preparationMs:1000}},session:{previewCommand:()=>({ok:true})},getRuntime:()=>({hasActiveActionFor:()=>false,hasActiveAction:false}),isTransitionPending:()=>false,setStatus:()=>{},reserveTargetCandidates:()=>[{targetRef:{scope:"reserve",teamId:"opponent",memberId:"e1"}}],onTargetReserve:ref=>{selected=ref;return true;}});
  try{
    view.render();
    assert.equal(enemyPanel.hidden,false);
    assert.equal(enemyPanel.open,false);
    assert.equal(enemySummary.textContent.includes("Réserves adverses"),true);
    const rows=list.children.flatMap(group=>group.children).filter(x=>x.dataset?.enemyReserveMemberId);
    assert.deepEqual(rows.map(x=>x.dataset.enemyReserveMemberId),["e1","e2"]);
    assert.equal(rows[0].disabled,false);
    assert.equal(rows[1].disabled,true);
    assert.equal(rows[0].children.find(x=>x.tagName==="PROGRESS").value,45);
    assert.equal(rows[0].children.find(x=>x.tagName==="PROGRESS").max,100);
    snapshot.opponent.members[1].hp=20;
    view.render();
    assert.equal(rows[0].children.find(x=>x.tagName==="PROGRESS").value,20);
    view.openEnemyForSkill();
    assert.equal(enemyPanel.open,true);
    enemyPanel.listeners.click({target:rows[0]});
    assert.deepEqual(selected,{scope:"reserve",teamId:"opponent",memberId:"e1"});
    assert.equal(recall,null);
  }finally{view.dispose();}
});
