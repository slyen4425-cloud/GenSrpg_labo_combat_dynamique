// Presentation projection only: two selectable silhouettes backed by canonical
// CombatStatus instances. HP, collision outcomes and retaliation remain in Combat Rules.
import {activeStatusEffectsV1} from "../../core/combat/status-effect-runtime-v1.js";

export function createDomDecoyOverlayV1({fighterContainers,appearanceFor,onChoose,applySpriteVisual}) {
  if(!fighterContainers || typeof appearanceFor!=="function" || typeof onChoose!=="function" || typeof applySpriteVisual!=="function")
    throw new TypeError("decoy overlay requires live combat slots, a sprite source and a choice callback");
  const active=new Map();
  let disposed=false;
  function cleanup(key){
    const entry=active.get(key);
    if(!entry)return;
    entry.frameAnimation?.cancel?.();
    entry.node.remove();
    active.delete(key);
  }
  function render(state){
    if(disposed)return;
    const seen=new Set();
    for(const [actorId,anchor] of Object.entries(fighterContainers)){
      if(!(Number(state?.fighters?.[actorId]?.hp)>0))continue;
      const illusions=activeStatusEffectsV1(state,actorId,state.elapsedMs)
        .filter(status=>status.definition.kind==="decoy");
      for(const [index,status] of illusions.entries()){
        const decoyId=status.definition.id;
        const key=actorId+"::"+decoyId;
        seen.add(key);
        if(active.has(key))continue;
        const doc=anchor.ownerDocument;
        const node=doc.createElement("button");
        node.type="button";
        node.className="combat-decoy";
        node.dataset.combatDecoy=decoyId;
        node.dataset.decoyOwner=actorId;
        node.setAttribute("aria-label","Leurre spectral de "+actorId+" — choisir cette silhouette");
        const side=index%2===0?-1:1;
        Object.assign(node.style,{
          position:"absolute",width:"80%",height:"88%",top:"4%",
          left:side<0?"-72%":"92%",padding:"0",border:"0",
          background:"transparent",cursor:"crosshair",zIndex:"7",
          opacity:"0.86",filter:"drop-shadow(0 0 9px rgba(117,66,205,.85))",
          pointerEvents:"auto"
        });
        const image=doc.createElement("span");
        image.className="combat-decoy__sprite";
        Object.assign(image.style,{position:"absolute",inset:"0",display:"block",
          pointerEvents:"none",width:"100%",height:"100%"});
        let frameAnimation=null;
        const visual=appearanceFor(actorId);
        if(visual?.url){
          const playback=applySpriteVisual(image,{
            ...visual,playbackMode:"loop",frameMs:Math.max(60,Number(visual.frameMs)||120)
          },Number(status.definition.durationMs)||20000);
          frameAnimation=playback.frameAnimation;
        }else{
          // Single-image fallback keeps the selector functional without a
          // duplicate asset library or fabricated combat body.
          const real=anchor.querySelector?.("[data-demo-motion] img")??null;
          if(real?.src){
            image.style.backgroundImage="url("+JSON.stringify(real.src)+")";
            image.style.backgroundSize="contain";
            image.style.backgroundRepeat="no-repeat";
            image.style.backgroundPosition="center";
          }else{
            image.style.background="radial-gradient(ellipse,rgba(120,65,204,.7),transparent 70%)";
          }
        }
        node.append(image);
        const choose=event=>{
          event.stopPropagation?.();
          event.preventDefault?.();
          onChoose({actorId,decoyId});
        };
        node.addEventListener("click",choose);
        anchor.append(node);
        active.set(key,{node,frameAnimation});
      }
    }
    for(const key of [...active.keys()])if(!seen.has(key))cleanup(key);
  }
  function dispose(){
    disposed=true;
    for(const key of [...active.keys()])cleanup(key);
  }
  return Object.freeze({render,dispose,count:()=>active.size});
}
