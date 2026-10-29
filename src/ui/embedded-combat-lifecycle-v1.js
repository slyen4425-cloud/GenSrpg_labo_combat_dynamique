// Presentation lifecycle for an embedded native Combat Lab session.
// It never owns combat rules, timers, AI, damage or a second CombatSession.
export function createEmbeddedCombatLifecycleV1({format}) {
  const actors=format?.actors;
  if (!Array.isArray(actors)||![2,4].includes(actors.length)||
      typeof format?.teamOf!=="function"||
      typeof format?.localActorId!=="string"||
      !actors.some(actor=>actor.actorId===format.localActorId)) {
    throw new TypeError("Native embedded battle requires official Lab BattleFormat");
  }
  const teamIds=[...new Set(actors.map(actor=>format.teamOf(actor.actorId)))];
  if(teamIds.length!==2||teamIds.some(id=>!id)||
     actors.some(actor=>typeof actor.actorId!=="string"||!actor.actorId||
       format.teamOf(actor.actorId)!==actor.teamId&&actor.teamId!==undefined)) {
    throw new TypeError("Native embedded combat must have two valid teams");
  }
  const ownTeam=format.teamOf(format.localActorId);
  const enemyTeam=teamIds.find(id=>id!==ownTeam);
  let settled=false,lastState=null;
  let resolveCompletion;
  const completion=new Promise(resolve=>{resolveCompletion=resolve;});
  function validate(state){
    if(!state||typeof state!=="object"||!state.fighters)
      throw new TypeError("Native Combat state is missing");
    for(const actor of actors){
      const fighter=state.fighters[actor.actorId];
      if(!fighter||!Number.isFinite(fighter.hp)||fighter.hp<0||
         !Number.isFinite(fighter.maxHp)||fighter.maxHp<=0||
         fighter.hp>fighter.maxHp) {
        throw new TypeError("Native Combat fighter missing or invalid: "+actor.actorId);
      }
    }
    return state;
  }
  function finish(outcome,state){
    if(settled)return false;
    lastState=validate(state);
    settled=true;
    resolveCompletion(Object.freeze({outcome,state:lastState}));
    return true;
  }
  function observe(state){
    if(settled)return false;
    lastState=validate(state);
    const allDown=team=>actors.filter(actor=>format.teamOf(actor.actorId)===team)
      .every(actor=>state.fighters[actor.actorId].hp<=0);
    const ownOut=allDown(ownTeam),enemyOut=allDown(enemyTeam);
    if(ownOut&&enemyOut)throw new Error("Simultaneous team KO cannot be inferred as victory or defeat");
    if(ownOut)return finish("defeat",state);
    if(enemyOut)return finish("victory",state);
    return false;
  }
  return Object.freeze({
    completion,observe,
    flee(state){return finish("flee",state);},
    get settled(){return settled;},
    get lastState(){return lastState;}
  });
}
