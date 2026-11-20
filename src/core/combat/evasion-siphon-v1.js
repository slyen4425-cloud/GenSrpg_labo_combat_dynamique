import {captureCreatureReactionActionIdV1} from "../../contracts/capture-creature-defensive-reaction-v1.js";
import {stealRechargeableActionChargeV1} from "./rechargeable-action-v1.js";

function dodgeFor(state,id){
  const fighter=state.fighters?.[id],reaction=fighter?.defensiveReaction;
  if(reaction?.type!=="dodge")return null;
  return {actionId:captureCreatureReactionActionIdV1(fighter.defensiveCreatureId??id,"dodge"),
    maxCharges:reaction.maxCharges,rechargeMs:reaction.rechargeMs};
}
export function evasionSiphonDamageV1({state,targetId,skill}){
  if(!skill?.evasionSiphon)return skill.effect.damage;
  return skill.evasionSiphon.baseDamage+
    skill.evasionSiphon.perMaxChargeDamage*(dodgeFor(state,targetId)?.maxCharges??0);
}
export function applyEvasionSiphonV1({state,actorId,targetId,skill,atMs=state.elapsedMs}){
  if(!skill?.evasionSiphon)return Object.freeze({state,stolen:0,restored:0});
  const victim=dodgeFor(state,targetId),thief=dodgeFor(state,actorId);
  if(!victim||!thief)return Object.freeze({state,stolen:0,restored:0});
  return stealRechargeableActionChargeV1({state,victimId:targetId,
    victimActionId:victim.actionId,victimMaxCharges:victim.maxCharges,
    victimRechargeMs:victim.rechargeMs,thiefId:actorId,
    thiefActionId:thief.actionId,thiefMaxCharges:thief.maxCharges,
    thiefRechargeMs:thief.rechargeMs,atMs});
}
