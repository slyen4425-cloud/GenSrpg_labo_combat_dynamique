import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {projectCombatArenaBarrierXForSideV1} from "../../src/adapters/renderer/combat-entity-overlay-v1.js";
import {planSkillPreparationFx} from "../../src/core/fx/skill-fx-plan.js";
import {createCombatResolutionPresenter} from "../../src/adapters/renderer/combat-resolution-presenter.js";
import {createDomCombatAudio} from "../../src/adapters/audio/dom-combat-audio.js";

test("opponent free-arena wall is next to its protected creature, player coordinates unchanged",()=>{
  const authoredXPct=47;
  assert.equal(projectCombatArenaBarrierXForSideV1({authoredXPct,ownerCenterXPct:80,opponentSide:false}),47);
  const enemy=projectCombatArenaBarrierXForSideV1({authoredXPct,ownerCenterXPct:80,opponentSide:true});
  assert.ok(enemy>=74&&enemy<80,`enemy wall must stay in opponent area, got ${enemy}`);
  const swapped=projectCombatArenaBarrierXForSideV1({authoredXPct,ownerCenterXPct:20,opponentSide:true});
  assert.ok(swapped>20&&swapped<=26,`flipped arena must stay near its own fighter, got ${swapped}`);
  assert.equal(projectCombatArenaBarrierXForSideV1({authoredXPct:47,ownerCenterXPct:NaN,opponentSide:true}),53);
});

test("only native channeling holds the authored cast loop across release",()=>{
  const skill={id:"pique-glace",form:"area",channeling:{tickIntervalMs:1000}};
  const action={actionType:"skill",skill,preparationMs:400,releaseAtMs:400};
  assert.equal(planSkillPreparationFx({action})[0].holdUntilCancelled,true);
  assert.equal(planSkillPreparationFx({action:{...action,skill:{id:"normal",form:"area"}}})[0].holdUntilCancelled,undefined);
  const calls=[];let cancels=0;let audioCalls=[];
  const presenter=createCombatResolutionPresenter({
    visuals:{
      playEventFor(){return Promise.resolve({status:"finished"});},
      cancelFor(){},
      hasHeldAttackPoseFor(){return false;},
      releaseHeldAttackPoseFor(){return false;}
    },
    fx:{
      play(plan){calls.push(plan);return {status:"running",holdUntilCancelled:plan.holdUntilCancelled===true,animation:{cancel(){cancels++;}},finished:new Promise(()=>{})};},
      cancelProjectileFor(){return 0;}
    },
    audio:{play(event){audioCalls.push(event);return {status:"ignored",finished:Promise.resolve()};}}
  });
  try{
    presenter.presentPreparation({action});
    assert.equal(calls[0].holdUntilCancelled,true);
    presenter.presentRelease({action});
    assert.equal(cancels,0,"native release must not stop a channeled cast");
    presenter.presentOutcome({resolution:{ok:true,outcome:"hit",channelingStart:true,events:[]}});
    assert.equal(cancels,0,"accepted native channel retains its one visual");
    presenter.endChannelPose({actorSlot:"player"});
    assert.equal(cancels,1,"native channel end cleans up cast exactly once");
  }finally{presenter.dispose();}
});

test("cancelled or failed channel cleans cast without a lingering loop",()=>{
  const action={actionType:"skill",skill:{id:"pique-glace",form:"area",channeling:{tickIntervalMs:1000}},preparationMs:400,releaseAtMs:400};
  let cancelled=0;
  const presenter=createCombatResolutionPresenter({
    visuals:{playEventFor(){return Promise.resolve({status:"finished"});},cancelFor(){}},
    fx:{play(plan){return {status:"running",holdUntilCancelled:plan.holdUntilCancelled===true,animation:{cancel(){cancelled++;}},finished:new Promise(()=>{})};}}
  });
  try{
    presenter.presentPreparation({action});presenter.presentRelease({action});
    presenter.presentOutcome({resolution:{ok:true,outcome:"blocked",channelingStart:false,events:[]}});
    assert.equal(cancelled,1);
    presenter.presentPreparation({action});
    presenter.cancelActionPresentation("player");
    assert.equal(cancelled,2);
  }finally{presenter.dispose();}
});

test("native under-target channel tick plays configured projectile/travel sound once per pulse",()=>{
  const played=[];
  const audio=createDomCombatAudio({
    presentationForSkill(){return {
      travel:{trajectoryMode:"under_target"},
      travelSound:{assetId:"sfx:ice-emerge"},
      impactSound:{assetId:"sfx:ice-hit"}
    };},
    resolveAudioAsset(id){return {url:"https://example.test/"+id};},
    createAudio(url){return {volume:1,loop:false,currentTime:0,onended:null,onerror:null,play(){played.push(url);return Promise.resolve();},pause(){}};}
  });
  try{
    for(let tick=1;tick<=3;tick++){
      const handle=audio.play({type:"channel-pulse",skillId:"pique-glace",actorSlot:"player",targetSlot:"opponent",loop:false});
      assert.equal(handle.status,"running");handle.stop();
    }
    assert.deepEqual(played,Array(3).fill("https://example.test/sfx:ice-emerge"));
  }finally{audio.dispose();}
  const source=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
  for(const path of ["src/ui/combat-test-ui.js","src/ui/combat-2v2-test-ui.js"]){
    assert.match(source(path),/combatAudio\.play\(\{type:"channel-pulse"/);
  }
});
