// View-only projection of Combat State combatEntities. No gameplay damage, timers,
// or entity life cycle is allowed here. Works in both 1v1 and 2v2 previews.
export function createCombatEntityOverlayV1({fighterContainers}){
  const hosts={};
  for(const [actorId,container] of Object.entries(fighterContainers)){
    const host=document.createElement("div");
    host.dataset.combatEntitiesHost=actorId;
    host.style.cssText="position:absolute;bottom:12%;left:50%;transform:translateX(-50%);z-index:12;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:3px;max-width:90%;";
    container.append(host);hosts[actorId]=host;
  }
  function render(state){
    for(const [actorId,host] of Object.entries(hosts)){
      host.replaceChildren();
      const barriers=(state?.combatEntities??[]).filter(e=>e.kind==="barrier"&&
        e.protectedActorId===actorId&&Number(e.hp)>0);
      for(const entity of barriers){
        const panel=document.createElement("div");
        panel.dataset.combatEntityId=entity.id;
        panel.dataset.combatEntityKind=entity.kind;
        panel.style.cssText="border:2px solid #a1e8fb;border-radius:8px;background:linear-gradient(140deg,rgba(141,225,250,.92),rgba(28,103,166,.87));box-shadow:0 0 13px rgba(130,223,253,.75);color:#071c35;padding:3px 7px;min-width:70px;text-align:center;font-weight:700;font-size:11px;white-space:nowrap;";
        panel.textContent="🧊 Mur "+Math.round(entity.hp*100)/100+" / "+Math.round(entity.maxHp*100)/100+" PV";
        panel.setAttribute("role","status");
        panel.setAttribute("aria-label","Mur destructible, "+entity.hp+" PV sur "+entity.maxHp);
        host.append(panel);
      }
    }
  }
  function dispose(){for(const host of Object.values(hosts))host.remove();}
  return Object.freeze({render,dispose});
}
