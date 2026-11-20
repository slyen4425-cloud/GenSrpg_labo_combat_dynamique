// Cavalcade: five equal copies of the creature's *official attack atlas*
// charge from the actual caster toward the enemy. ONE collision report per
// target/pass still belongs to Combat Runtime; the copies never own damage.
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
  arena,fromSlot,targetSlot,stampede,sourceVisual,
  sourceRect,targetRect,targetSlots=[],targetCollisionModelFor,
  onContact,animate,requestFrame,cancelFrame,applySpriteVisual
}){
  const bounds=arena.getBoundingClientRect(),doc=arena.ownerDocument;
  const source=sourceRect(fromSlot),target=targetRect(targetSlot);
  const count=Math.max(1,Number(stampede.cloneCount)||5);
  const horseSize=Math.max(26,Math.min(
    bounds.height*.42,source.width*.7,bounds.width*.21
  ));
  const destinations=[...new Set([targetSlot,...targetSlots])];
  const geometry=stampedeChargeGeometryV1({
    arenaBounds:bounds,sourceBounds:source,targetBounds:target,
    targetBoundsList:destinations.filter(id=>id!==targetSlot).map(id=>targetRect(id)),
    horseSize
  });
  const total=stampede.passes*stampede.passDurationMs+
    (stampede.passes-1)*stampede.gapMs;
  const group=doc.createElement("span");
  group.className="skill-fx skill-fx--projectile skill-fx--stampede";
  group.dataset.skillFx="projectile";
  group.dataset.stampede="true";
  Object.assign(group.style,{
    position:"absolute",left:geometry.fromX+"px",top:geometry.fromY+"px",
    width:horseSize*3+"px",height:horseSize*1.8+"px",
    pointerEvents:"none",zIndex:"5",opacity:"0",
    transform:"translate(-50%, -50%)"
  });

  // View selection happens in the same creature visual controller as ordinary
  // attacks; there is no copied atlas, redrawn ghost or substitute fireball.
  const officialAttack=sourceVisual?.attack?.url?sourceVisual.attack:null;
  const officialMovement=sourceVisual?.movement?.url?sourceVisual.movement:
    sourceVisual?.url?sourceVisual:null;
  const spriteSource=officialAttack??officialMovement;
  group.dataset.stampedePose=officialAttack?"attack":officialMovement?"movement-fallback":"missing";
  const horses=[];
  for(let i=0;i<count;i++){
    const ghost=doc.createElement("span");
    ghost.className="skill-fx skill-fx--stampede-ghost";
    ghost.dataset.ghostIndex=String(i);
    const middle=(count-1)/2;
    const column=i-middle;
    Object.assign(ghost.style,{
      position:"absolute",display:"block",
      width:horseSize+"px",height:horseSize+"px",
      left:(horseSize+column*horseSize*.43)+"px",
      top:(horseSize*.38+(i%2===0?0:horseSize*.12))+"px",
      opacity:"1",pointerEvents:"none",
      transform:geometry.direction>0?"none":"scaleX(-1)",
      transformOrigin:"center center"
    });
    group.append(ghost);
    horses.push({ghost,playback:null,layer:null});
  }
  arena.append(group);
  // The existing WAAPI owner is the ONLY presentation clock. The native
  // action's release and deadline still govern real hits and cost.
  const animation=animate(group,[{visibility:"visible"},{visibility:"visible"}],
    {duration:total,easing:"linear",fill:"forwards"});

  const resolved=new Set(),previousFrames=new Map();
  let previous=null,activePass=null,contactFrameId=null,disposed=false;
  const models=new Map(destinations.map(id=>[
    id,targetCollisionModelFor?.(id)??null
  ]));

  function beginPass(index){
    if(activePass===index)return;
    activePass=index;
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
        // Preserve the author's frame count and order; stretch the complete
        // five-frame attack through each readable native 1.8-second pass.
        playbackMode:"stretch"
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
    group.remove?.();
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
