// Dédale: the visible bodies are equal projections of the SAME canonical
// creature appearance. The actual actor stays the only combat fighter; only
// its two real CombatStatus decoys can intercept targeted actions.
import {activeStatusEffectsV1} from "../../core/combat/status-effect-runtime-v1.js";

export const DECOY_FORMATION_V1=Object.freeze({
  scale:1,spacingPct:56,reshuffleMs:5000,edgePaddingPx:4
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

export function nextDecoyRealSlotV1(previous=null,random=unbiasedRandomV1,count=3){
  const slots=Math.max(2,Math.trunc(Number(count)||3));
  const sample=Math.min(0.999999,Math.max(0,Number(random())||0));
  return previous===null
    ? Math.floor(sample*slots)
    : (previous+1+Math.floor(sample*(slots-1)))%slots;
}

function formationOffsetPct(anchor,config,total=3){
  const arena=anchor.closest?.("[data-combat-arena]")??anchor.closest?.(".arena")??null;
  const outer=arena?.getBoundingClientRect?.();
  const own=anchor.getBoundingClientRect?.();
  if(!outer||!own||!own.width||!outer.width)return 0;
  const halfExtent=own.width*((total-1)/2*config.spacingPct/100+config.scale/2);
  const left=outer.left+config.edgePaddingPx+halfExtent;
  const right=outer.right-config.edgePaddingPx-halfExtent;
  const center=own.left+own.width/2;
  const desired=left<=right?Math.max(left,Math.min(right,center)):(left+right)/2;
  return 100*(desired-center)/own.width;
}

export function createDomDecoyOverlayV1({
  fighterContainers,appearanceFor,onChoose,applySpriteVisual,
  formationFor=()=>null,random=unbiasedRandomV1,config=DECOY_FORMATION_V1
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
    delete entry.anchor.dataset.combatDecoyIllusionActive;
    active.delete(actorId);
  }

  function place(entry){
    const cfg=entry.config,total=entry.decoyIds.length+1;
    const center=formationOffsetPct(entry.anchor,cfg,total);
    const occupied=Array.from({length:total},(_,i)=>i).filter(index=>index!==entry.realIndex);
    const targets=[...entry.decoyIds.map((id,i)=>({id,index:occupied[i]})),
      {id:null,index:entry.realIndex}];
    for(const [n,where] of targets.entries()){
      const sprite=entry.sprites[n];
      sprite.decoyId=where.id;
      const button=sprite.button;
      button.style.left=(center+(where.index-(total-1)/2)*cfg.spacingPct)+"%";
      if(where.id===null){
        delete button.dataset.combatDecoy;
        button.dataset.combatDecoyReal="true";
        button.setAttribute("aria-label","Cibler une silhouette");
      }else{
        delete button.dataset.combatDecoyReal;
        button.dataset.combatDecoy=where.id;
        button.setAttribute("aria-label","Cibler une silhouette");
      }
    }
    // Move the actual visual collision model under its true projected slot.
    // Its pixels are hidden only while the three identical selectors render.
    if(entry.motion){
      entry.motion.style.translate=(center+(entry.realIndex-(total-1)/2)*cfg.spacingPct)+"% 0%";
      entry.motion.style.scale="1";
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
      config:Object.freeze({...config,...(formationFor(actorId,statuses)??{})}),
      realIndex:nextDecoyRealSlotV1(null,random,statuses.length+1),
      lastShuffleAt:atMs,sprites:[]
    };
    const visual=appearanceFor(actorId);
    const duration=Math.max(1,Math.max(...statuses.map(x=>x.definition.durationMs||20000)));
    const realImage=motion?.querySelector?.("img")??anchor.querySelector?.("[data-demo-image]");
    anchor.dataset.combatDecoyIllusionActive="true";
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
        transform:"scale("+entry.config.scale+")",transformOrigin:"center center",
        aspectRatio:"1",overflow:"visible"
      });
      const image=anchor.ownerDocument.createElement("span");
      image.className="combat-decoy__sprite";
      Object.assign(image.style,{position:"absolute",inset:"0",width:"100%",
        height:"100%",display:"block",pointerEvents:"none",
        // The actual Animation Renderer scales the original body using this
        // canonical per-creature property; the static illusion must too.
        transform:"scale(var(--creature-display-scale, 1))",
        transformOrigin:"center center"});
      let frameAnimation=null;
      // While Dédale is active, ALL THREE remain in the same official
      // standing pose. A looping gallop in place reveals an unnecessary FX
      // and does not match the user's true creature model.
      if(realImage?.src){
        image.dataset.decoyPose="standing";
        image.style.backgroundImage="url("+JSON.stringify(realImage.src)+")";
        image.style.backgroundSize="contain";
        image.style.backgroundPosition="center";
        image.style.backgroundRepeat="no-repeat";
      }else if(visual?.url){
        // Asset-unavailable fallback is identical across the trio, never a
        // special purple ghost with a different model or brightness.
        const playback=applySpriteVisual(image,{
          ...visual,playbackMode:"loop"
        },duration);
        frameAnimation=playback.frameAnimation;
      }
      // Clone the same existing shadow geometry and alpha silhouette.
      // It inherits the canonical lighting vars from the fighter, never
      // invents a second cast-shadow system or a tell for the real horse.
      const copy=shadow?.cloneNode?.(true)??anchor.ownerDocument.createElement("span");
      copy.className=shadow?.className??"fighter__shadow";
      if(copy.id)copy.removeAttribute?.("id");
      copy.style.opacity="1";
      copy.style.pointerEvents="none";
      copy.dataset.combatDecoyShadow="true";
      button.append(copy,image);
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
      if(state.elapsedMs-entry.lastShuffleAt>=entry.config.reshuffleMs){
        entry.realIndex=nextDecoyRealSlotV1(entry.realIndex,random,entry.decoyIds.length+1);
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
