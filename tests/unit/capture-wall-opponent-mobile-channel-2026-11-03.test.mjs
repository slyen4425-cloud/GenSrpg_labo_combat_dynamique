import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {projectCombatArenaBarrierXForSideV1} from "../../src/adapters/renderer/combat-entity-overlay-v1.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {createCombatRuntime} from "../../src/core/combat/combat-runtime.js";

const load=id=>normalizeSkillDefinition(JSON.parse(readFileSync(new URL("../../data/capture/showcase/"+id+".capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft.definition);

test("RED: oversized opposing wall must not extend to player's half, on PC and phone",()=>{
  const authored=47,wallWidthPct=(420/400)*(9/16)*100;
  const phone=projectCombatArenaBarrierXForSideV1({authoredXPct:authored,ownerCenterXPct:80,opponentSide:true,visualWidthPct:wallWidthPct});
  const desktop=projectCombatArenaBarrierXForSideV1({authoredXPct:authored,ownerCenterXPct:80,opponentSide:true,visualWidthPct:wallWidthPct});
  assert.ok(phone-wallWidthPct/2>=52-0.02,"enemy wall visibly enters the player's territory");
  assert.equal(phone,desktop,"one arena-relative author projection for every device");
  assert.equal(projectCombatArenaBarrierXForSideV1({authoredXPct:authored,ownerCenterXPct:20,opponentSide:false,visualWidthPct:wallWidthPct}),47);
});

test("RED: native projectile resolution observes the real wall and leaves Pique de glace channeling active",()=>{
  const combat=createCombatSession({fighters:[
    {id:"player",maxHp:140,initialHp:140,maxEnergy:20,initialEnergy:20,statValuesById:{glace:15},energyChargeAmount:0},
    {id:"opponent",maxHp:140,initialHp:140,maxEnergy:20,initialEnergy:20,energyChargeAmount:0}
  ]});
  const wall=load("mur_de_glace");
  const created=combat.startSkill({actorId:"player",targetId:"player",skill:wall});
  assert.equal(created.ok,true);
  assert.equal(combat.completeSkill({action:created.action}).ok,true);
  const wallId=combat.snapshot().combatEntities[0].id;
  const channel=load("pique_glace");
  const snowball=normalizeSkillDefinition({
    id:"snowball-wall-channel-regression",name:"Boule de neige",category:"offensive",form:"projectile",
    element:"ice",approachMode:"none",energyCost:0,preparationMs:0,travelMs:500,recoveryMs:0,cooldownMs:0,
    targetRelations:["enemy"],targetLocations:["active"],
    effect:{damage:9,heal:0,stunMs:0,interruptsPreparation:false,tags:[]}
  });
  let now=0,tick=()=>{};const ended=[],pulses=[];
  const runtime=createCombatRuntime({session:combat,now:()=>now,setTimer(fn){tick=fn;return 1;},clearTimer(){},
    groundContactResolution:"visible",
    readBarrierContact({sourceActorId,targetActorId,kind}){
      return sourceActorId==="opponent"&&targetActorId==="player"&&kind==="projectile"
        ? {entityId:wallId}:null;
    },
    onChannelEnd:e=>ended.push(e),onChannelTick:e=>pulses.push(e)
  });
  const step=t=>{now=t;tick();};
  try{
    runtime.start();
    assert.equal(runtime.startSkill({actorId:"player",targetId:"opponent",skill:channel}).ok,true);
    step(100);
    assert.equal(runtime.hasContactHoldFor("player"),true);
    assert.equal(runtime.startSkill({actorId:"opponent",targetId:"player",skill:snowball}).ok,true);
    step(800);
    assert.equal(combat.snapshot().fighters.player.hp,140,"blocked projectile must not harm caster");
    assert.equal(combat.snapshot().combatEntities[0].hp,21,"wall absorbs the observed 9 damage");
    step(1200);
    assert.equal(runtime.hasContactHoldFor("player"),true,"blocked hit must not interrupt channel");
    assert.equal(ended.length,0);
    assert.ok(pulses.length>=1,"channel must continue ticking");
  }finally{runtime.dispose();}
});
