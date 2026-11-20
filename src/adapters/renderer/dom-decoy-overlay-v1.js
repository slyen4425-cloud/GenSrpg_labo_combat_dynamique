// Dédale: the visible bodies are equal projections of the SAME canonical
// creature appearance. The actual actor stays the only combat fighter; only
// its two real CombatStatus decoys can intercept targeted actions.
import {activeStatusEffectsV1} from "../../core/combat/status-effect-runtime-v1.js";

export const DECOY_FORMATION_V1=Object.freeze({
  scale:0.55,spacingPct:56,reshuffleMs:5000,edgePaddingPx:4
});

function unbiasedRandomV1(){
  const crypto=globalThis.crypto;
  if(crypto?.getRandomValues){
    const bytes=new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return bytes[0]/4294967296;
  }
  return Math.random();
}

export function nextDecoyRealSlotV1(previous=null,random=unbiasedRandomV1){
  const sample=Math.min(0.999999,Math.max(0,Number(random())||0));
  return previous===null
    ? Math.floor(sample*3)
    : (previous+1+Math.floor(sample*2))%3;
}

function formationOffsetPct(anchor,config){
  const arena=anchor.closest?.("[data-combat-arena]")??anchor.closest?.(".arena")??null;
  const outer=arena?.getBoundingClientRect?.();
  const own=anchor.getBoundingClientRect?.();
  if(!outer||!own||!own.width||!outer.width)return 0;
  const halfExtent=own.width*(config.spacingPct/100+config.scale/2);
  const left=outer.left+config.edgePaddingPx+halfExtent;
  const right=outer.right-config.edgePaddingPx-halfExtent;
  const center=own.left+own.width/2;
  const desired=left<=right?Math.max(left,Math.min(right,center)):(left+right)/2;
  return 100*(desired-center)/own.width;
}

export function createDomDecoyOverlayV1({
  fighterContainers,appearanceFor,onChoose,applySpriteVisual,
  random=unbiasedRandomV1,config=DECOY_FORMATION_V1
}){
  if(!fighterContainers||typeof appearanceFor!=="function"||
      typeof onChoose!=="function"||typeof applySpriteVisual!=="function")
    throw new TypeError("decoy overlay requires combat slots, appearance and choice callback");
  const active=new Map();
  let disposed=false;

  function cleanup(actorId){
    const entry=active.get(actorId);
    if(!entry)return;
    for(const sprite of entry.sprites){
      sprite.frameAnimation?.cancel?.();
      sprite.button.remove();
    }
    if(entry.motion){
      entry.motion.style.opacity=entry.previous.opacity;
      entry.motion.style.translate=entry.previous.translate;
      entry.motion.style.scale=entry.previous.scale;
    }
    if(entry.shadow)entry.shadow.style.opacity=entry.previous.shadowOpacity;
    active.delete(actorId);
  }

  function place(entry){
    const center=formationOffsetPct(entry.anchor,config);
    const occupied=[0,1,2].filter(index=>index!==entry.realIndex);
    const targets=[...entry.decoyIds.map((id,i)=>({id,index:occupied[i]})),
      {id:null,index:entry.realIndex}];
    for(const [n,where] of targets.entries()){
      const sprite=entry.sprites[n];
      sprite.decoyId=where.id;
      const button=sprite.button;
      button.style.left=(center+(where.index-1)*config.spacingPct)+"%";
      if(where.id===null){
        delete button.dataset.combatDecoy;
        button.dataset.combatDecoyReal="true";
        button.setAttribute("aria-label","Choisir le véritable combattant");
      }else{
        delete button.dataset.combatDecoyReal;
        button.dataset.combatDecoy=where.id;
        button.setAttribute("aria-label","Choisir une silhouette");
      }
    }
    // Move the actual visual collision model under its true projected slot.
    // Its pixels are hidden only while the three identical selectors render.
    if(entry.motion){
      entry.motion.style.translate=(center+(entry.realIndex-1)*config.spacingPct)+"% 0%";
      entry.motion.style.scale=String(config.scale);
      entry.motion.style.opacity="0";
    }
    if(entry.shadow)entry.shadow.style.opacity="0";
  }

  function create(actorId,anchor,statuses,atMs){
    const motion=anchor.querySelector?.("[data-demo-motion]")??null;
    const shadow=anchor.querySelector?.(".fighter__shadow")??null;
    const previous={
      opacity:motion?.style.opacity??"",translate:motion?.style.translate??"",
      scale:motion?.style.scale??"",shadowOpacity:shadow?.style.opacity??""
    };
    const entry={
      anchor,motion,shadow,previous,decoyIds:statuses.map(s=>s.definition.id),
      signature:statuses.map(s=>s.definition.id+"@"+s.appliedAtMs).join("|"),
      realIndex:nextDecoyRealSlotV1(null,random),
      lastShuffleAt:atMs,sprites:[]
    };
    const visual=appearanceFor(actorId);
    const duration=Math.max(1,Math.max(...statuses.map(x=>x.definition.durationMs||20000)));
    const realImage=motion?.querySelector?.("img")??anchor.querySelector?.("[data-demo-image]");
    for(let i=0;i<statuses.length+1;i++){
      const button=anchor.ownerDocument.createElement("button");
      button.type="button";
      button.className="combat-decoy";
      button.dataset.decoyOwner=actorId;
      Object.assign(button.style,{
        position:"absolute",top:"0%",width:"100%",height:"100%",
        padding:"0",margin:"0",border:"0",borderRadius:"0",
        background:"transparent",outline:"none",cursor:"crosshair",
        zIndex:"8",opacity:"1",pointerEvents:"auto",
        transform:"scale("+config.scale+")",transformOrigin:"center center",
        aspectRatio:"1",overflow:"visible"
      });
      const image=anchor.ownerDocument.createElement("span");
      image.className="combat-decoy__sprite";
      Object.assign(image.style,{position:"absolute",inset:"0",width:"100%",
        height:"100%",display:"block",pointerEvents:"none"});
      let frameAnimation=null;
      if(visual?.url){
        const playback=applySpriteVisual(image,{
          ...visual,playbackMode:"loop"
        },duration);
        frameAnimation=playback.frameAnimation;
      }else if(realImage?.src){
        image.style.backgroundImage="url("+JSON.stringify(realImage.src)+")";
        image.style.backgroundSize="contain";
        image.style.backgroundPosition="center";
        image.style.backgroundRepeat="no-repeat";
      }
      button.append(image);
      const sprite={button,frameAnimation,decoyId:null};
      button.addEventListener("click",event=>{
        event.stopPropagation?.();
        event.preventDefault?.();
        onChoose({actorId,decoyId:sprite.decoyId});
      });
      anchor.append(button);
      entry.sprites.push(sprite);
    }
    active.set(actorId,entry);
    place(entry);
    return entry;
  }

  function render(state){
    if(disposed)return;
    const seen=new Set();
    for(const [actorId,anchor] of Object.entries(fighterContainers)){
      if(!(Number(state?.fighters?.[actorId]?.hp)>0))continue;
      const statuses=activeStatusEffectsV1(state,actorId,state.elapsedMs)
        .filter(s=>s.definition.kind==="decoy");
      if(statuses.length===0)continue;
      seen.add(actorId);
      const signature=statuses.map(s=>s.definition.id+"@"+s.appliedAtMs).join("|");
      let entry=active.get(actorId);
      if(entry?.signature!==signature){
        cleanup(actorId);
        entry=create(actorId,anchor,statuses,state.elapsedMs);
      }
      if(state.elapsedMs-entry.lastShuffleAt>=config.reshuffleMs){
        entry.realIndex=nextDecoyRealSlotV1(entry.realIndex,random);
        entry.lastShuffleAt=state.elapsedMs;
      }
      place(entry);
    }
    for(const actorId of [...active.keys()])if(!seen.has(actorId))cleanup(actorId);
  }
  function dispose(){
    disposed=true;
    for(const actorId of [...active.keys()])cleanup(actorId);
  }
  return Object.freeze({
    render,dispose,
    count:()=>[...active.values()].reduce((n,entry)=>n+entry.decoyIds.length,0)
  });
}
