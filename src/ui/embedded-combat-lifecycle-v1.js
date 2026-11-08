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
  function validateRoster(roster){
    if(roster===null||roster===undefined)return null; // Legacy 1v1/2v2 snapshot.
    if(typeof roster!=='object'||Array.isArray(roster))
      throw new TypeError("Official Combat roster snapshot required");
    for(const actor of actors){
      const team=roster[actor.actorId];
      if(!team||!Array.isArray(team.members)||!team.members.length||
         team.members.some(m=>typeof m.id!=='string'||!Number.isFinite(m.hp)||m.hp<0))
        throw new TypeError("Official Combat roster member HP missing: "+actor.actorId);
    }
    return roster;
  }
  function finish(outcome,state,roster=null){
    if(settled)return false;
    lastState=validate(state);
    const snapshot=validateRoster(roster);
    settled=true;
    resolveCompletion(Object.freeze({outcome,state:lastState,
      ...(snapshot===null?{}:{roster:snapshot})}));
    return true;
  }
  function observe(state,roster=null){
    if(settled)return false;
    lastState=validate(state);
    const snapshot=validateRoster(roster);
    const allDown=team=>actors.filter(actor=>format.teamOf(actor.actorId)===team)
      .every(actor=>{
        if(state.fighters[actor.actorId].hp>0)return false;
        // A single active creature KO is NOT a team defeat while the native
        // Roster Session still contains an available reserve. The same
        // Combat-owned member HP also decides victory for NPC rosters.
        const members=snapshot?.[actor.actorId]?.members;
        return !members?.some(member=>member.hp>0);
      });
    const ownOut=allDown(ownTeam),enemyOut=allDown(enemyTeam);
    if(ownOut&&enemyOut)throw new Error("Simultaneous team KO cannot be inferred as victory or defeat");
    if(ownOut)return finish("defeat",state,snapshot);
    if(enemyOut)return finish("victory",state,snapshot);
    return false;
  }
  return Object.freeze({
    completion,observe,
    flee(state,roster=null){return finish("flee",state,roster);},
    get settled(){return settled;},
    get lastState(){return lastState;}
  });
}
