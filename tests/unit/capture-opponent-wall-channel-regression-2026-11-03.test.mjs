import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {projectCombatArenaBarrierXForSideV1,projectCombatArenaBarrierVisualSizeV1} from "../../src/adapters/renderer/combat-entity-overlay-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";

const official=id=>normalizeSkillDefinition(JSON.parse(readFileSync(
  new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),"utf8"
)).draft.definition);

test("RED: opposing authored ice wall is anchored by its actual width near its owner, not the player's midfield",()=>{
  const wall=official("mur_de_glace").effects[0];
  const mobile=projectCombatArenaBarrierVisualSizeV1(wall,1);
  const pc=projectCombatArenaBarrierVisualSizeV1(wall,2.5);
  assert.equal(mobile.width,420);
  assert.equal(pc.width,1050);
  const widthPct=mobile.width/711.111111111*100;
  const x=projectCombatArenaBarrierXForSideV1({
    authoredXPct:wall.arenaXPct,ownerCenterXPct:79,opponentSide:true,wallWidthPct:widthPct
  });
  assert.ok(x>87&&x<100,"right-side opponent wall must remain near the enemy even at large authored scale");
  assert.ok(x-widthPct/2>55,"opposing wall must not sprawl across the player's center");
  const left=projectCombatArenaBarrierXForSideV1({
    authoredXPct:wall.arenaXPct,ownerCenterXPct:21,opponentSide:true,wallWidthPct:widthPct
  });
  assert.ok(left>0&&left<13,"the same geometry works with opponents on the left");
  assert.ok(left+widthPct/2<45);
});

function setup({withWall}){
  const session=createCombatSession({fighters:[
    {id:"player",maxHp:140,initialHp:140,maxEnergy:20,initialEnergy:20,
      energyChargeAmount:0,statValuesById:{glace:30}},
    {id:"opponent",maxHp:140,initialHp:140,maxEnergy:20,initialEnergy:20,
      energyChargeAmount:0,statValuesById:{glace:30}}
  ]});
  if(withWall){
    const wall=official("mur_de_glace");
    const start=session.startSkill({actorId:"player",targetId:"player",skill:wall});
    assert.equal(start.ok,true);
    assert.equal(session.completeSkill({action:start.action}).ok,true);
    assert.equal(session.snapshot().combatEntities.length,1);
  }
  let now=0,clock=()=>{};
  const ended=[],ticks=[];
  const runtime=createCombatRuntime({session,now:()=>now,
    setTimer(fn){clock=fn;return 1;},clearTimer(){},
    onChannelEnd:e=>ended.push(e),onChannelTick:e=>ticks.push(e)
  });
  runtime.start();
  function step(at){now=at;clock();}
  return {session,runtime,ended,ticks,step};
}
test("a real opposing snowball absorbed by the official ice wall cannot interrupt Pique de glace",()=>{
  const h=setup({withWall:true});
  try{
    const wallId=h.session.snapshot().combatEntities[0].id;
    const hp=h.session.snapshot().combatEntities[0].hp;
    assert.equal(h.runtime.startSkill({actorId:"player",targetId:"opponent",skill:official("pique_glace")}).ok,true);
    h.step(100);
    assert.equal(h.runtime.hasContactHoldFor("player"),true);
    assert.equal(h.runtime.startSkill({actorId:"opponent",targetId:"player",skill:official("boule_neige")}).ok,true);
    h.step(1700);
    assert.equal(h.ticks.length,1);
    const hit=h.runtime.reportActionContact({actorId:"opponent",targetId:"player",
      skillId:"boule_neige",combatEntityId:wallId,contactPoint:{x:200,y:200}});
    assert.equal(hit.ok,true,JSON.stringify(hit));
    assert.equal(h.session.snapshot().fighters.player.hp,140);
    assert.equal(h.session.snapshot().fighters.player.damageTakenTotal,0);
    assert.ok(h.session.snapshot().combatEntities[0].hp<hp,"wall absorbs charged snowball");
    assert.equal(h.ended.length,0,"a blocked projectile cannot cancel a channel");
    assert.equal(h.runtime.hasContactHoldFor("player"),true);
    h.step(2700);
    assert.equal(h.ticks.length,2,"channel still ticks after a blocked snowball");
  }finally{h.runtime.dispose();}
});
test("without interception, actual damage still ends the same author channel",()=>{
  const h=setup({withWall:false});
  try{
    h.runtime.startSkill({actorId:"player",targetId:"opponent",skill:official("pique_glace")});
    h.step(100);
    assert.equal(h.runtime.hasContactHoldFor("player"),true);
    assert.equal(h.runtime.startSkill({actorId:"opponent",targetId:"player",skill:official("boule_neige")}).ok,true);
    h.step(1700);
    h.runtime.reportActionContact({actorId:"opponent",targetId:"player",skillId:"boule_neige",
      contactPoint:{x:200,y:200}});
    assert.ok(h.session.snapshot().fighters.player.hp<140);
    assert.equal(h.ended[0]?.reason,"damage_taken");
  }finally{h.runtime.dispose();}
});
