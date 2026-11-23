import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {projectOpponentSkillLoadoutV1} from "../../src/ui/combat-2v2-test-ui.js";

const skill=(id,name,energyCost=2,loadoutSlot="standard")=>({
  id,name,energyCost,loadoutSlot
});
const skillsById={
  fang:skill("fang","Morsure",2),
  veil:skill("veil","Voile",5),
  burst:skill("burst","Choc",8,"ultimate")
};
const state={
  elapsedMs:1500,
  fighters:{
    enemy1:{hp:50,energy:10,skillCooldowns:{fang:6300}},
    enemy2:{hp:80,energy:8,skillCooldowns:{}}
  }
};
const currentLoadouts={enemy1:["fang","veil"],enemy2:["burst"]};
const args={
  enemyActorIds:["enemy1","enemy2"],
  skillsById,
  skillIdsFor:id=>currentLoadouts[id],
  actorNameFor:id=>id==="enemy1"?"Golem":"Papillon",
  state
};

test("read-only enemy HUD uses each native loadout, exact cooldown and source names in 1v1/2v2",()=>{
  const rows=projectOpponentSkillLoadoutV1(args);
  assert.deepEqual(rows.map(row=>row.name),["Golem","Papillon"]);
  assert.deepEqual(rows[0].skills.map(skill=>skill.id),["fang","veil"]);
  assert.equal(rows[0].skills[0].cooldownMs,4800);
  assert.equal(rows[0].skills[1].cooldownMs,0);
  assert.equal(rows[1].skills[0].ultimate,true);
  assert.equal(rows[1].skills[0].energyCost,8);
  assert.equal(projectOpponentSkillLoadoutV1({...args,enemyActorIds:["enemy1"]}).length,1);
});

test("enemy HUD observes native roster replacement and KO; no stale hidden menu authority",()=>{
  const original=currentLoadouts.enemy1;
  try{
    currentLoadouts.enemy1=["burst"];
    const snapshot=projectOpponentSkillLoadoutV1({
      ...args,state:{...state,fighters:{...state.fighters,
        enemy1:{...state.fighters.enemy1,hp:0}}}
    });
    assert.deepEqual(snapshot[0].skills.map(s=>s.id),["burst"]);
    assert.equal(snapshot[0].defeated,true);
    assert.equal(snapshot[1].defeated,false);
    assert.throws(()=>projectOpponentSkillLoadoutV1({
      ...args,skillsById:{},enemyActorIds:["enemy1"]
    }),/Unknown opponent equipped skill/);
  }finally{currentLoadouts.enemy1=original;}
});

test("opponent view is a collapsible, read-only widget, never a second skill command or permanent overlay",()=>{
  const html=readFileSync(new URL(
    "../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const css=readFileSync(new URL(
    "../../examples/dom-demo/capture-editor-v2.css",import.meta.url),"utf8");
  const ui=readFileSync(new URL(
    "../../src/ui/combat-2v2-test-ui.js",import.meta.url),"utf8");
  assert.match(html,/<details class="combat-test-enemy-skills"/);
  assert.match(html,/data-combat-hud-widget="opponent-skill-loadout"/);
  assert.match(html,/data-combat-enemy-skills-list/);
  assert.match(css,/\.combat-test-enemy-skills__body\s*\{/);
  assert.match(ui,/rosterController\?\.skillIdsFor\(actorId\)/);
  assert.match(ui,/skillCooldownRemainingMs\(state,actorId,id\)/);
  assert.match(ui,/opponentSkillIconUrl\(group.actorId,skill.id\)/);
  assert.match(ui,/if\(!opponentSkillPanel\?\.open\|\|!opponentSkillHost\)return/);
  assert.doesNotMatch(ui,/const enemySkillCooldowns=new Map/);
});
