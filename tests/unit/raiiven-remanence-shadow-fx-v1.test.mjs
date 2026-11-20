import test from "node:test";
import assert from "node:assert/strict";
import {playDomShadowEchoFxV1} from "../../src/adapters/renderer/dom-shadow-echo-fx-v1.js";
import {planSkillPreparationFx,planSkillReleaseFx,planSkillOutcomeFx} from "../../src/core/fx/skill-fx-plan.js";
const frame={left:0,top:0,width:800,height:400};
function arena(){
 const elements=[],doc={createElement(tag){return {tag,style:{},dataset:{},remove(){this.removed=true;}};}};
 return {ownerDocument:doc,getBoundingClientRect:()=>frame,append:e=>elements.push(e),elements};
}
test("one CSS shadow orb asset is used for cast, projectile and heal impact, no independent collision",async()=>{
 const host=arena(),animations=[];
 for(const type of ["cast","projectile","impact"]){
   const effect=playDomShadowEchoFxV1({arena:host,type,
     sourceRect:{left:100,top:90,width:40,height:40},
     targetRect:{left:450,top:160,width:40,height:40},
     durationMs:350,animate:(node,frames,opts)=>{
       animations.push({node,frames,opts});return {finished:Promise.resolve(),cancel(){}};
     }});
   assert.equal(effect.node.dataset.shadowEcho,"true");
   assert.match(effect.node.style.background,/radial-gradient/);
   await effect.finished;
   assert.equal(effect.node.removed,true);
 }
 assert.equal(new Set(animations.map(x=>x.node.style.background)).size,1);
 assert.notEqual(animations[1].frames[0].transform,animations[1].frames[1].transform);
});
test("the echo visual plans follow existing native skill form and actual outcome",()=>{
 const action={skill:{id:"raiiven-remanence-interdite",form:"projectile",
   echoSourceSkillId:"copied-shot",element:"shadow"},preparationMs:600,travelMs:900};
 assert.equal(planSkillPreparationFx({action})[0].shadowEcho,true);
 assert.equal(planSkillReleaseFx({action})[0].shadowEcho,true);
 const result={ok:true,outcome:"hit",echoCopied:true,skillId:action.skill.id,events:[]};
 assert.equal(planSkillOutcomeFx({resolution:result})[0].shadowEcho,true);
 assert.equal(planSkillOutcomeFx({resolution:{...result,outcome:"evaded"}})[0].type,"miss");
});
