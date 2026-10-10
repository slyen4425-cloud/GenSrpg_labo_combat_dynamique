// HUD-only projection of Combat State energy, never a recharge clock.
export function projectCombatEnergyOrbsV1({energy,maxEnergy}) {
  const max=Number.isFinite(Number(maxEnergy))?Math.max(0,Number(maxEnergy)):0;
  const current=Number.isFinite(Number(energy))?Math.max(0,Math.min(max,Number(energy))):0;
  const count=max===0?1:Math.min(12,Math.ceil(max));
  const unit=max/count;
  return Object.freeze(Array.from({length:count},(_,index)=>{
    if(max===0)return 0;
    return Math.round(Math.max(0,Math.min(1,(current-index*unit)/unit))*1000)/1000;
  }));
}
function formatNumber(value){
  return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:2}).format(value);
}
export function createCombatEnergyOrbsRendererV1({host}){
  if(!host||typeof host.replaceChildren!=="function"||typeof host.ownerDocument?.createElement!=="function"){
    throw new TypeError("Energy orb renderer needs a DOM host");
  }
  host.setAttribute("role","img");
  let nodes=[];
  return Object.freeze({
    render({energy,maxEnergy}){
      const fills=projectCombatEnergyOrbsV1({energy,maxEnergy});
      if(nodes.length!==fills.length){
        nodes=fills.map(()=>{
          const orb=host.ownerDocument.createElement("span");
          orb.className="hud__energy-orb";
          orb.setAttribute("aria-hidden","true");
          return orb;
        });
        host.replaceChildren(...nodes);
      }
      for(let i=0;i<fills.length;i++){
        nodes[i].style.setProperty("--energy-orb-fill",(Math.round(fills[i]*1000)/10)+"%");
        nodes[i].setAttribute("data-filled",fills[i]===1?"true":"false");
      }
      const max=Number.isFinite(Number(maxEnergy))?Math.max(0,Number(maxEnergy)):0;
      const current=Number.isFinite(Number(energy))?Math.max(0,Math.min(max,Number(energy))):0;
      host.setAttribute("aria-label","Énergie : "+formatNumber(current)+" sur "+formatNumber(max));
    }
  });
}
