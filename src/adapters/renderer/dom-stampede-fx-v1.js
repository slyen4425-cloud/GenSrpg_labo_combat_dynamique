// Cavalcade: the genuine Animation Core actor physically charges alongside
// N-1 visual herd copies. No cloned shadows, no projected fake "caster".
// ONE collision report per enemy/pass remains owned by Combat Runtime.
import {sweptPointHitsOpaqueMask,visibleModelOpaqueRect} from "./dom-visible-model-contact.js?v=wall-ground-stop-20261101";

export function stampedePassWindowV1(config,travelElapsedMs){
  const total=config.passes*config.passDurationMs+(config.passes-1)*config.gapMs;
  const elapsed=Number(travelElapsedMs);
  if(!Number.isFinite(elapsed)||elapsed<0||elapsed>total)return null;
  const span=config.passDurationMs+config.gapMs;
  const index=Math.min(config.passes-1,Math.floor(elapsed/span));
  const localMs=elapsed-index*span;
  if(localMs>config.passDurationMs)return Object.freeze({index,visible:false,progress:1});
  return Object.freeze({index,visible:true,progress:Math.max(0,Math.min(1,localMs/config.passDurationMs))});
}

export function stampedeChargeGeometryV1({
  arenaBounds,sourceBounds,targetBounds,targetBoundsList=[],horseSize
}){
  const fromX=sourceBounds.left+sourceBounds.width/2-arenaBounds.left;
  const fromY=sourceBounds.top+sourceBounds.height*.54-arenaBounds.top;
  const destinations=[targetBounds,...targetBoundsList].filter(Boolean);
  const first=targetBounds.left+targetBounds.width/2-arenaBounds.left;
  const direction=first>=fromX?1:-1;
  const targetCenters=destinations.map(rect=>rect.left+rect.width/2-arenaBounds.left);
  const endX=(direction>0?Math.max(...targetCenters):Math.min(...targetCenters))+
    direction*horseSize*.32;
  const targetY=targetBounds.top+targetBounds.height*.55-arenaBounds.top;
  return Object.freeze({fromX,fromY,endX,targetY,direction});
}

export function playDomStampedeFxV1({
  arena,fromSlot,targetSlot,stampede,sourceVisual,sourceMotion=null,
  sourceRect,targetRect,targetSlots=[],targetCollisionModelFor,
  onContact,animate,requestFrame,cancelFrame,applySpriteVisual
}){
  const bounds=arena.getBoundingClientRect(),doc=arena.ownerDocument;
  const source=sourceRect(fromSlot),target=targetRect(targetSlot);
  const count=Math.max(2,Number(stampede.cloneCount)||5);
  const nativeCaster=sourceMotion?.append&&sourceMotion?.getBoundingClientRect
    ? sourceMotion : null;
  const nativeCasterIndex=Math.floor(count/2);
  // The active actor may scale its *model* independently of its motion
  // slot. Use the real displayed model bounds when available: measuring the
  // slot alone made all five charging horses visibly smaller than Raiiven.
  // For older templates or a temporarily hidden standing image, use the
  // exact authored scale already stored on the canonical fighter container.
  const sourceFighter=sourceMotion?.closest?.(".fighter")??null;
  const realImageBounds=sourceMotion?.querySelector?.("[data-demo-image]")?.getBoundingClientRect?.()??null;
  const authoredScale=Number(sourceFighter?.style?.getPropertyValue?.("--creature-display-scale"));
  const fallbackScale=Number.isFinite(authoredScale)&&authoredScale>0?authoredScale:1;
  const displayedWidth=Number(realImageBounds?.width);
  const horseSize=Math.max(26,Number.isFinite(displayedWidth)&&displayedWidth>0
    ? displayedWidth : (Number(source.width)||26)*fallbackScale);
  const destinations=[...new Set([targetSlot,...targetSlots])];
  const geometry=stampedeChargeGeometryV1({
    arenaBounds:bounds,sourceBounds:source,targetBounds:target,
    targetBoundsList:destinations.filter(id=>id!==targetSlot).map(id=>targetRect(id)),
    horseSize
  });
  const total=stampede.passes*stampede.passDurationMs+
    (stampede.passes-1)*stampede.gapMs;
  const group=doc.createElement("span");
  // Do NOT reuse .skill-fx--projectile: that class paints the orange fireball.
  group.className="skill-fx skill-fx--stampede";
  group.dataset.skillFx="projectile";
  group.dataset.stampede="true";
  Object.assign(group.style,{
    position:"absolute",left:geometry.fromX+"px",top:geometry.fromY+"px",
    width:horseSize*2.9+"px",height:horseSize*1.65+"px",
    pointerEvents:"none",zIndex:"5",opacity:"0",
    transform:"translate(-50%, -50%)"
  });

  // View selection happens in the same creature visual controller as ordinary
  // attacks; there is no copied atlas, redrawn ghost or substitute fireball.
  const officialMovement=sourceVisual?.movement?.url?sourceVisual.movement:
    sourceVisual?.url?sourceVisual:null;
  const officialAttack=sourceVisual?.attack?.url?sourceVisual.attack:null;
  const spriteSource=officialMovement??officialAttack;
  group.dataset.stampedePose=officialMovement?"movement":officialAttack?"attack-fallback":"missing";
  const sourceShadow=sourceFighter?.querySelector?.(".fighter__shadow")??null;
  const previousSource={
    translate:sourceMotion?.style?.translate??"",
    opacity:sourceMotion?.style?.opacity??"",
    shadowOpacity:sourceShadow?.style?.opacity??"",
    casterActive:sourceMotion?.dataset?.stampedeCasterActive??null
  };
  const baseMotionBounds=nativeCaster?.getBoundingClientRect?.()??null;
  const baseMotionCenter=baseMotionBounds?{
    x:baseMotionBounds.left+baseMotionBounds.width/2-bounds.left,
    y:baseMotionBounds.top+baseMotionBounds.height/2-bounds.top
  }:null;
  const lane=i=>({
    x:horseSize*(1.45+(i-(count-1)/2)*.34+((i*3)%4)*.04),
    y:horseSize*(.26+((i*7)%5)*.11)
  });
  const groupWidth=horseSize*2.9,groupHeight=horseSize*1.65;
  // The one actual actor occupies the central lane, so there are only N-1
  // created ghost bodies. The original fighter is never duplicated.
  const casterLayer=nativeCaster?doc.createElement("span"):null;
  if(casterLayer){
    casterLayer.className="skill-fx--stampede-caster";
    Object.assign(casterLayer.style,{
      position:"absolute",inset:"0",width:"100%",height:"100%",
      display:"block",pointerEvents:"none",zIndex:"8",opacity:"0"
    });
    nativeCaster.append(casterLayer);
    nativeCaster.dataset.stampedeCasterActive="true";
  }
  const horses=[];
  for(let i=0;i<count;i++){
    if(nativeCaster&&i===nativeCasterIndex)continue;
    const ghost=doc.createElement("span");
    ghost.className="skill-fx skill-fx--stampede-ghost";
    ghost.dataset.ghostIndex=String(i);
    // Slightly staggered lanes; the REAL caster takes the central lane.
    const {x:horizontal,y:vertical}=lane(i);
    ghost.dataset.stampedeRole="visual-copy";
    Object.assign(ghost.style,{
      position:"absolute",display:"block",
      width:horseSize+"px",height:horseSize+"px",
      left:horizontal+"px",
      top:vertical+"px",
      opacity:"1",pointerEvents:"none",
      transform:geometry.direction>0?"none":"scaleX(-1)",
      transformOrigin:"center center"
    });
    // Intentionally NO shadow clones for Cavalcade: their silhouettes were
    // covering the arena floor with large distracting dark patches.
    group.append(ghost);
    horses.push({ghost,playback:null,layer:null});
  }
  arena.append(group);
  group.dataset.stampedeNativeCaster=nativeCaster?"true":"unavailable";
  // Conceal only the source ground shadow while its actor leaves the floor's
  // home position. Existing shadow is restored afterwards, never replicated.
  if(nativeCaster){
    nativeCaster.style.opacity="1";
    if(sourceShadow?.style)sourceShadow.style.opacity="0";
  }
  // The existing WAAPI owner is the ONLY presentation clock. The native
  // action's release and deadline still govern real hits and cost.
  const animation=animate(group,[{visibility:"visible"},{visibility:"visible"}],
    {duration:total,easing:"linear",fill:"forwards"});

  const resolved=new Set(),previousFrames=new Map();
  let previous=null,activePass=null,contactFrameId=null,disposed=false;
  let casterPlayback=null,casterSprite=null;
  const models=new Map(destinations.map(id=>[
    id,targetCollisionModelFor?.(id)??null
  ]));

  function beginPass(index){
    if(activePass===index)return;
    activePass=index;
    casterPlayback?.cancel?.();
    casterSprite?.remove?.();
    casterSprite=null;
    if(casterLayer&&spriteSource?.url){
      const sprite=doc.createElement("span");
      sprite.className="skill-fx--stampede-caster-sprite";
      Object.assign(sprite.style,{
        position:"absolute",inset:"0",width:"100%",height:"100%",pointerEvents:"none"
      });
      casterLayer.append(sprite);
      const playback=applySpriteVisual(sprite,{
        ...spriteSource,playbackMode:"loop"
      },stampede.passDurationMs,animate);
      casterPlayback=playback.frameAnimation;
      casterSprite=sprite;
    }
    for(const {ghost,playback,layer} of horses){
      playback?.cancel?.();
      layer?.remove?.();
      if(!spriteSource?.url)continue;
      const sprite=doc.createElement("span");
      sprite.className="skill-fx--stampede-attack-pose";
      Object.assign(sprite.style,{
        position:"absolute",inset:"0",display:"block",
        width:"100%",height:"100%",pointerEvents:"none"
      });
      ghost.append(sprite);
      const result=applySpriteVisual(sprite,{
        ...spriteSource,
        // Keep the source creature's author-approved movement frame count
        // and timing, looping its stride throughout each charge pass.
        playbackMode:"loop"
      },stampede.passDurationMs,animate);
      const horse=horses.find(entry=>entry.ghost===ghost);
      horse.playback=result.frameAnimation;
      horse.layer=sprite;
    }
  }

  function observe(){
    contactFrameId=null;
    if(disposed)return;
    const window=stampedePassWindowV1(stampede,animation.currentTime??0);
    if(window){
      const x=geometry.fromX+(geometry.endX-geometry.fromX)*window.progress;
      const y=geometry.fromY+(geometry.targetY-geometry.fromY)*window.progress;
      group.style.opacity=window.visible&&spriteSource?.url?"1":"0";
      group.style.left=x+"px";
      group.style.top=y+"px";
      if(nativeCaster&&baseMotionCenter){
        const central=lane(nativeCasterIndex);
        const destX=x-groupWidth/2+central.x+horseSize/2;
        const destY=y-groupHeight/2+central.y+horseSize/2;
        nativeCaster.style.translate=(destX-baseMotionCenter.x)+"px "+
          (destY-baseMotionCenter.y)+"px";
        casterLayer.style.opacity=window.visible&&spriteSource?.url?"1":"0";
      }
      if(window.visible){
        beginPass(window.index);
        const oldX=previous?.index===window.index?previous.x:geometry.fromX;
        for(const [slot,model] of models){
          const key=window.index+":"+slot;
          if(resolved.has(key))continue;
          const frame=model?.snapshot?.()??null;
          const rect=visibleModelOpaqueRect(frame);
          const previousFrame=previous?.index===window.index
            ?previousFrames.get(slot)??frame:frame;
          previousFrames.set(slot,frame);
          if(!frame||!rect||!frame.mask)continue;
          // The charge front advances exactly with the visible herd. The
          // official opaque enemy model, not a decoration, authorizes contact.
          const ys=[.30,.45,.60,.72].map(t=>rect.top+rect.height*t);
          const front=geometry.direction*horseSize*.2;
          const contacted=ys.some(y=>sweptPointHitsOpaqueMask({
            mask:frame.mask,
            previousPoint:{x:bounds.left+oldX+front,y},
            point:{x:bounds.left+x+front,y},
            previousFrame,frame
          }));
          if(!contacted)continue;
          const result=onContact?.({
            actorId:fromSlot,targetId:slot,passIndex:window.index,
            waveMultiTarget:true
          });
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
    for(const horse of horses){
      horse.playback?.cancel?.();
      horse.layer?.remove?.();
    }
    casterPlayback?.cancel?.();
    casterSprite?.remove?.();
    casterLayer?.remove?.();
    group.remove?.();
    if(nativeCaster){
      nativeCaster.style.translate=previousSource.translate;
      nativeCaster.style.opacity=previousSource.opacity;
      if(previousSource.casterActive===null)delete nativeCaster.dataset.stampedeCasterActive;
      else nativeCaster.dataset.stampedeCasterActive=previousSource.casterActive;
    }
    if(sourceShadow?.style)sourceShadow.style.opacity=previousSource.shadowOpacity;
  }
  const finished=Promise.resolve(animation.finished).then(
    ()=>{stop();return {status:"arrived"};},
    error=>{stop();if(error?.name==="AbortError")return {status:"cancelled"};throw error;}
  );
  return Object.freeze({
    node:group,animation,finished,stop,
    frameAnimation:Object.freeze({cancel:stop})
  });
}
