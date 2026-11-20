// Dédale: ONE native animated creature, plus exactly one visible copy for
// each native decoy status. Never draw a third "real" picture over the actor.
// Combat Session remains sole owner of real and decoy target identities.
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

function targetSurface(anchor,actorId,onChoose,decoyId){
  const button=anchor.ownerDocument.createElement("button");
  button.type="button";
  button.dataset.decoyOwner=actorId;
  Object.assign(button.style,{
    position:"absolute",top:"0",width:"100%",height:"auto",aspectRatio:"1",
    padding:"0",margin:"0",border:"0",borderRadius:"0",
    background:"transparent",outline:"none",cursor:"crosshair",
    zIndex:"8",pointerEvents:"auto",overflow:"visible"
  });
  button.addEventListener("click",event=>{
    event.stopPropagation?.();
    event.preventDefault?.();
    onChoose({actorId,decoyId});
  });
  anchor.append(button);
  return button;
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
    for(const fake of entry.sprites){
      fake.frameAnimation?.cancel?.();
      fake.button.remove();
      fake.shadow?.remove?.();
    }
    entry.realTarget?.remove?.();
    if(entry.motion){
      entry.motion.style.translate=entry.previous.translate;
      entry.motion.style.scale=entry.previous.scale;
    }
    if(entry.shadow){
      entry.shadow.style.left=entry.previous.shadowLeft;
      entry.shadow.style.translate=entry.previous.shadowTranslate;
    }
    delete entry.anchor.dataset.combatDecoyIllusionActive;
    active.delete(actorId);
  }

  function place(entry){
    const cfg=entry.config,total=entry.decoyIds.length+1;
    const center=formationOffsetPct(entry.anchor,cfg,total);
    const occupied=Array.from({length:total},(_,i)=>i)
      .filter(index=>index!==entry.realIndex);
    const offset=index=>center+(index-(total-1)/2)*cfg.spacingPct;

    // The ACTUAL character and its own canonical shadow follow the randomly
    // chosen real slot; they remain fully visible, never projected a second time.
    const realOffset=offset(entry.realIndex);
    if(entry.motion)entry.motion.style.translate=realOffset+"% 0%";
    if(entry.shadow){
      entry.shadow.style.left="calc(var(--creature-shadow-left, 50%) + "+realOffset+"%)";
    }
    entry.realTarget.style.left=realOffset+"%";

    for(let i=0;i<entry.sprites.length;i++){
      const fake=entry.sprites[i];
      const pct=offset(occupied[i]);
      fake.button.style.left=pct+"%";
      if(fake.shadow){
        fake.shadow.style.left="calc(var(--creature-shadow-left, 50%) + "+pct+"%)";
        fake.shadow.style.scale=String(cfg.scale);
      }
      // Clone the Animation Core's body transform, not a second manually
      // guessed scale. This includes author scale, transform origin and pose.
      if(fake.visual&&entry.motion){
        fake.visual.style.transform=entry.motion.style.transform??"";
        fake.visual.style.transformOrigin=entry.motion.style.transformOrigin??"50% 50%";
      }
    }
  }

  function create(actorId,anchor,statuses,atMs){
    const motion=anchor.querySelector?.("[data-demo-motion]")??null;
    const shadow=anchor.querySelector?.(".fighter__shadow")??null;
    const previous={
      translate:motion?.style.translate??"",scale:motion?.style.scale??"",
      shadowLeft:shadow?.style.left??"",
      shadowTranslate:shadow?.style.translate??""
    };
    const authored=formationFor(actorId,statuses)??{};
    const cfg=Object.freeze({...config,...authored});
    const entry={
      anchor,motion,shadow,previous,config:cfg,
      decoyIds:statuses.map(s=>s.definition.id),
      signature:statuses.map(s=>s.definition.id+"@"+s.appliedAtMs).join("|"),
      realIndex:nextDecoyRealSlotV1(null,random,statuses.length+1),
      lastShuffleAt:atMs,realTarget:null,sprites:[]
    };
    const visual=appearanceFor(actorId);
    const duration=Math.max(1,Math.max(...statuses.map(x=>x.definition.durationMs||20000)));
    const realImage=motion?.querySelector?.("[data-demo-image]")??motion?.querySelector?.("img")??null;
    anchor.dataset.combatDecoyIllusionActive="true";

    for(const status of statuses){
      const id=status.definition.id;
      const button=targetSurface(anchor,actorId,onChoose,id);
      button.className="combat-decoy";
      button.dataset.combatDecoy=id;
      // Exactly N visual copies. The real character is NOT drawn here.
      button.style.transform="scale("+cfg.scale+")";
      button.style.transformOrigin="center center";
      const sprite=anchor.ownerDocument.createElement("span");
      sprite.className="combat-decoy__sprite";
      Object.assign(sprite.style,{
        position:"absolute",inset:"0",width:"100%",height:"100%",
        display:"grid",placeItems:"center",pointerEvents:"none",
        transform:motion?.style.transform??"",
        transformOrigin:motion?.style.transformOrigin??"50% 50%"
      });
      let frameAnimation=null;
      if(realImage?.src){
        const image=realImage.cloneNode?.(false)??anchor.ownerDocument.createElement("img");
        image.src=realImage.src;
        image.className=realImage.className||"fighter__image";
        if(image.id)image.removeAttribute?.("id");
        image.removeAttribute?.("data-demo-image");
        image.style.opacity="1";
        image.style.visibility="visible";
        image.dataset.decoyPose="standing";
        image.style.width="100%";
        image.style.height="100%";
        image.style.objectFit="contain";
        sprite.append(image);
      }else if(visual?.url){
        const playback=applySpriteVisual(sprite,{...visual,playbackMode:"loop"},duration);
        frameAnimation=playback.frameAnimation;
      }
      button.append(sprite);
      let copy=null;
      if(shadow?.cloneNode){
        copy=shadow.cloneNode(true);
        if(copy.id)copy.removeAttribute?.("id");
        copy.dataset.combatDecoyShadow="true";
        copy.style.opacity=shadow.style.opacity||"1";
        copy.style.pointerEvents="none";
        // Keep this shadow beside the ORIGINAL native shadow, not inside the
        // visual button, so silhouette alpha/contact is identically grounded.
        anchor.append(copy);
      }
      entry.sprites.push({button,shadow:copy,visual:sprite,frameAnimation,id});
    }

    // Transparent hit surface on the existing real body: no 3rd clone image,
    // no 3rd clone shadow, no ambiguity over the actual Combat fighter.
    entry.realTarget=targetSurface(anchor,actorId,onChoose,null);
    entry.realTarget.className="combat-decoy-real-target";
    entry.realTarget.dataset.combatDecoyReal="true";
    entry.realTarget.style.opacity="0";
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
    count:()=>[...active.values()].reduce((n,e)=>n+e.decoyIds.length,0)
  });
}
