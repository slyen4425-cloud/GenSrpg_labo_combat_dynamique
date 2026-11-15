// Read-only terminal signal from the existing BattleFormat and RosterSession.
// Never decide HP, trigger KO, invent survivors or become a second battle owner.
export function resolveCaptureCombatBattleOutcomeV1({format,rosterSnapshot,defeatedActorId}) {
  if (!format || !format.teams || typeof format.teamOf!=="function" ||
      typeof format.localActorId!=="string") throw new TypeError("native battle format required");
  if (!rosterSnapshot || typeof rosterSnapshot!=="object") return null;
  const teamEntries=Object.entries(format.teams);
  if (teamEntries.length!==2 || teamEntries.some(([,actors])=>!Array.isArray(actors)||!actors.length))
    throw new TypeError("exactly two native teams required");
  const defeatedTeamId=format.teamOf(defeatedActorId);
  const localTeamId=format.teamOf(format.localActorId);
  if (!teamEntries.some(([id])=>id===defeatedTeamId)) return null;
  const liveFor=actors=>{
    let alive=false;
    for(const actorId of actors){
      const members=rosterSnapshot[actorId]?.members;
      if(!Array.isArray(members))return null; // Do not guess from missing reserves.
      if(members.some(member=>Number(member.hp)>0))alive=true;
    }
    return alive;
  };
  const defeatedActors=teamEntries.find(([id])=>id===defeatedTeamId)[1];
  const otherActors=teamEntries.find(([id])=>id!==defeatedTeamId)[1];
  const defeatedLive=liveFor(defeatedActors);
  const opponentsLive=liveFor(otherActors);
  if(defeatedLive!==false || opponentsLive===null) return null;
  if(opponentsLive===false)return "draw";
  return defeatedTeamId===localTeamId ? "defeat" : "victory";
}
