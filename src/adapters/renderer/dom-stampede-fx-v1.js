// One visible stampede and ONE opaque-target sensor per native pass/slot.
// Copies share the source creature's existing movement atlas. No ghost owns HP.
import {sweptPointHitsOpaqueMask,visibleModelOpaqueRect} from "./dom-visible-model-contact.js?v=wall-ground-stop-20261101";

export function stampedePassWindowV1(config, travelElapsedMs) {
  const total = config.passes * config.passDurationMs + (config.passes-1)*config.gapMs;
  const elapsed = Number(travelElapsedMs);
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > total) return null;
  const span = config.passDurationMs + config.gapMs;
  const index = Math.min(config.passes-1, Math.floor(elapsed/span));
  const localMs = elapsed-index*span;
  if (localMs > config.passDurationMs) return Object.freeze({index,visible:false,progress:1});
  return Object.freeze({index,visible:true,progress:Math.max(0,Math.min(1,localMs/config.passDurationMs))});
}

export function playDomStampedeFxV1({
  arena, fromSlot, targetSlot, stampede, sourceVisual,
  sourceRect, targetRect, targetSlots, targetCollisionModelFor,
  onContact, animate, requestFrame, cancelFrame, applySpriteVisual
}) {
  const bounds=arena.getBoundingClientRect(),doc=arena.ownerDocument;
  const source=sourceRect(fromSlot),target=targetRect(targetSlot);
  const direction=(target.left+target.width/2)>=(source.left+source.width/2)?1:-1;
  const startX=direction>0?-bounds.width*0.34:bounds.width*1.34;
  const endX=direction>0?bounds.width*1.34:-bounds.width*0.34;
  const total=stampede.passes*stampede.passDurationMs+(stampede.passes-1)*stampede.gapMs;
  const group=doc.createElement("span");
  group.className="skill-fx skill-fx--projectile skill-fx--stampede";
  group.dataset.skillFx="projectile";
  group.dataset.stampede="true";
  Object.assign(group.style,{position:"absolute",left:"0px",top:"0px",
    width:Math.max(50,bounds.height*0.28)+"px",height:Math.max(50,bounds.height*0.76)+"px",
    pointerEvents:"none",zIndex:"5",opacity:"0",transform:"translateX("+startX+"px)"});
  const portraits=[];
  const count=stampede.cloneCount;
  const base=Math.max(28,Math.min(bounds.height*.27,bounds.width*.16));
  const spriteSource=sourceVisual?.url
    ? {...sourceVisual,playbackMode:"loop",frameMs:Math.max(55,Number(sourceVisual.frameMs)||105)}
    : null;
  for(let i=0;i<count;i++){
    const ghost=doc.createElement("span");
    ghost.className="skill-fx skill-fx--stampede-ghost";
    ghost.dataset.ghostIndex=String(i);
    const row=i%3,rank=Math.floor(i/3),size=i===0?1.18:(0.78+((i*7)%5)*0.07);
    Object.assign(ghost.style,{position:"absolute",display:"block",
      width:(base*size)+"px",height:(base*size)+"px",
      left:(rank*base*.29+row*base*.11)+"px",
      top:(row*base*.65+rank*base*.2)+"px",
      opacity:i===0?"0.98":String(0.43+(i%4)*0.09),
      filter:i===0?"drop-shadow(0 0 8px #7444ad)":"drop-shadow(0 0 10px #6550bc) brightness(0.85)",
      pointerEvents:"none",transform:direction>0?"none":"scaleX(-1)"});
    if(spriteSource){
      const playback=applySpriteVisual(ghost,spriteSource,total,animate);
      portraits.push(playback.frameAnimation);
      // Offset only artwork frames, never the gameplay or collision clock.
      ghost.style.animationDelay=-(i*67)+"ms";
    }else{
      ghost.style.borderRadius="50%";
      ghost.style.background="radial-gradient(ellipse,rgba(134,82,195,.65),rgba(40,25,73,0))";
    }
    group.append(ghost);
  }
  arena.append(group);
  // Use a non-transform, non-opacity WAAPI property as the sole frame clock.
  // The temporary presentation explicitly hides itself between passes.
  const animation=animate(group,[{visibility:"visible"},{visibility:"visible"}],{
    duration:total,easing:"linear",fill:"forwards"
  });
  const resolved=new Set(),previousFrames=new Map();
  let previous=null,contactFrameId=null,disposed=false;
  const models=new Map([...new Set([targetSlot,...targetSlots])].map(id=>[
    id,targetCollisionModelFor?.(id)??null
  ]));
  function observe(){
    contactFrameId=null;
    if(disposed)return;
    const window=stampedePassWindowV1(stampede,animation.currentTime??0);
    if(window){
      const x=startX+(endX-startX)*window.progress;
      group.style.opacity=window.visible?"1":"0";
      group.style.transform="translateX("+x+"px)";
      if(window.visible){
        const oldX=previous?.index===window.index?previous.x:startX;
        for(const [slot,model] of models){
          const key=window.index+":"+slot;
          if(resolved.has(key))continue;
          const frame=model?.snapshot?.()??null;
          const rect=visibleModelOpaqueRect(frame);
          const previousFrame=previous?.index===window.index
            ?previousFrames.get(slot)??frame:frame;
          previousFrames.set(slot,frame);
          if(!frame||!rect||!frame.mask)continue;
          // The leading line spans the visible group. All clone sprites are
          // decoration, and one swept opaque-mask contact resolves this pass.
          const ys=[.30,.45,.60,.72].map(t=>rect.top+rect.height*t);
          const contacted=ys.some(y=>sweptPointHitsOpaqueMask({
            mask:frame.mask,previousPoint:{x:bounds.left+oldX,y},
            point:{x:bounds.left+x,y},previousFrame,frame
          }));
          if(!contacted)continue;
          const result=onContact?.({actorId:fromSlot,targetId:slot,
            passIndex:window.index,waveMultiTarget:true});
          if(result?.ok===true)resolved.add(key);
        }
      }
      previous={index:window.index,x};
    }
    if(!disposed)contactFrameId=requestFrame(observe);
  }
  contactFrameId=requestFrame(observe);
  function stop(){
    if(disposed)return;
    disposed=true;
    if(contactFrameId!==null)cancelFrame(contactFrameId);
    for(const frame of portraits)frame?.cancel?.();
    group.remove?.();
  }
  const finished=Promise.resolve(animation.finished).then(
    ()=>{stop();return {status:"arrived"};},
    error=>{stop();if(error?.name==="AbortError")return {status:"cancelled"};throw error;}
  );
  return Object.freeze({node:group,animation,finished,stop,
    frameAnimation:Object.freeze({cancel:stop})});
}
