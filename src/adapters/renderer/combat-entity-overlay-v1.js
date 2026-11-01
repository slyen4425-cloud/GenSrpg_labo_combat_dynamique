// Persistent view of Combat State entities. The DOM owns only geometry and visual
// playback; the Combat Damage Application owns all entity HP and destruction.
const round=n=>Math.round(n*100)/100;
const formatHp=e=>round(e.hp)+" / "+round(e.maxHp)+" PV";

export function createCombatEntityOverlayV1({fighterContainers,arenaHost=null,teamOf=null,assetForId=()=>null}){
  const hosts={},nodes=new Map();let snapshot=null;
  for(const [actorId,container] of Object.entries(fighterContainers)){
    const host=document.createElement("div");
    host.dataset.combatEntitiesHost=actorId;
    host.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:12;overflow:visible;";
    container.append(host);hosts[actorId]=host;
  }
  // The arena host is presentation-only. The entity placement and HP remain
  // immutable Combat State data, shared across 1v1 and 2v2.
  let arenaOverlay=null;
  if(arenaHost){
    arenaOverlay=document.createElement("div");
    arenaOverlay.dataset.combatEntitiesArenaHost="true";
    arenaOverlay.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:3;overflow:visible;";
    // The wall paints after layer-3 enemies, before layer-4 player models.
    arenaOverlay.style.zIndex="3";
    arenaHost.append(arenaOverlay);
  }
  function newNode(entity,host){
    const node=document.createElement("div");node.dataset.combatEntityId=entity.id;
    node.dataset.combatEntityKind="barrier";
    node.style.cssText="position:absolute;bottom:10%;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:3px;transform:translateX(-50%);";
    const sprite=document.createElement("div");sprite.dataset.combatEntitySprite="true";
    sprite.style.cssText="position:relative;width:70px;height:92px;overflow:hidden;box-sizing:border-box;border:2px solid rgba(181,244,255,.96);border-radius:38% 38% 12% 12%;background:linear-gradient(110deg,rgba(234,254,255,.9),rgba(57,167,224,.83) 38%,rgba(12,81,140,.94) 82%);clip-path:polygon(15% 5%,36% 0%,52% 10%,76% 0%,95% 20%,100% 100%,0 100%,0 30%);filter:drop-shadow(0 0 9px rgba(120,224,255,.8));";
    const asset=entity.spriteAssetId?assetForId(entity.spriteAssetId):null;
    const url=asset?.url??asset?.runtimeUrl??asset?.resource?.runtimeUrl??null;
    if(typeof url==="string"&&url.length>0){
      const image=document.createElement("img");image.dataset.combatEntityImage="true";
      image.alt="";image.decoding="async";image.src=url;
      const frames=Math.max(1,Math.floor(Number(asset?.frameCount??asset?.resource?.frameCount)||1));
      const rawFrameMs=Number(asset?.frameMs??asset?.resource?.frameMs);
      const frameMs=Number.isFinite(rawFrameMs)&&rawFrameMs>0?rawFrameMs:100;
      image.style.cssText="height:100%;max-width:none;width:"+frames*100+"%;object-fit:fill;display:block;";
      // The fully built wall is transparent art, not a clip-shaped placeholder.
      // Keep sprite bounds unchanged: the same DOM rectangle owns collision evidence.
      sprite.style.background="transparent";
      sprite.style.border="none";
      sprite.style.borderRadius="0";
      sprite.style.clipPath="none";
      // All global sprite-strip tiles are 512x512. The 70x92 outer box
      // remains the collision/hit-feedback rectangle (unchanged contract);
      // center a SQUARE visual viewport inside it so raw wall art is not
      // stretched into a tall castle-like wall.
      const visualViewport=document.createElement("div");
      visualViewport.dataset.combatEntityVisualViewport="true";
      visualViewport.style.cssText="position:absolute;left:0;top:50%;width:100%;aspect-ratio:1/1;transform:translateY(-50%);overflow:hidden;";
      visualViewport.append(image);
      sprite.append(visualViewport);
      if(frames>1){
        // Construction is a ONE-SHOT visual. Native Combat State/Damage owns
        // wall HP and removal; re-renders for damage must not restart the sprite.
        // For a 12-frame horizontal strip, the last offset is 11/12 of the
        // image width. Never scroll past the final intact wall to a blank frame.
        const lastFramePercent=(frames-1)*100/frames;
        const finalTransform="translateX(-"+lastFramePercent+"%)";
        if(typeof image.animate==="function"){
          image.animate(
            [{transform:"translateX(0%)"},{transform:finalTransform}],
            {duration:(frames-1)*frameMs,easing:"steps("+(frames-1)+", end)",iterations:1,fill:"forwards"}
          );
        }else{
          // Browsers without WAAPI still show a complete wall for its lifetime.
          image.style.transform=finalTransform;
        }
      }
    }
    const label=document.createElement("div");label.dataset.combatEntityHp="true";
    label.style.cssText="border:1px solid #a1e8fb;border-radius:8px;background:rgba(14,62,101,.92);color:white;padding:3px 6px;text-align:center;font-weight:700;font-size:11px;white-space:nowrap;";
    node.append(sprite,label);host.append(node);
    nodes.set(entity.id,{node,sprite,label,hp:entity.hp,actorId:entity.protectedActorId});
    return nodes.get(entity.id);
  }
  function frontSideFor(actorId){
    const self=fighterContainers[actorId]?.getBoundingClientRect?.();
    if(!self)return "right";
    const selfCenter=self.left+self.width/2;
    const others=Object.entries(fighterContainers).filter(([id])=>id!==actorId&&
      (typeof teamOf!=="function"||teamOf(id)!==teamOf(actorId)));
    if(others.length===0)return "right";
    const avg=others.reduce((sum,[,host])=>{const r=host.getBoundingClientRect();return sum+r.left+r.width/2;},0)/others.length;
    return avg>=selfCenter?"right":"left";
  }
  function render(state){
    snapshot=state;const living=new Set();
    if(arenaHost&&arenaOverlay){
      const hasArenaWall=(state?.combatEntities??[]).some(entity=>
        entity.kind==="barrier"&&entity.placementMode==="arena"&&Number(entity.hp)>0);
      if(hasArenaWall)arenaHost.dataset.combatEntityArenaActive="true";
      else delete arenaHost.dataset.combatEntityArenaActive;
    }
    for(const entity of state?.combatEntities??[]){
      if(entity.kind!=="barrier"||!(Number(entity.hp)>0)||!hosts[entity.protectedActorId])continue;
      living.add(entity.id);
      const existing=nodes.get(entity.id);
      const arenaMode=entity.placementMode==="arena";
      if(arenaMode&&!arenaOverlay)throw new Error("arenaHost is required for arena wall placement");
      const parent=arenaMode?arenaOverlay:hosts[entity.protectedActorId];
      const item=existing??newNode(entity,parent);
      if(item.node.parentNode!==parent)parent.append(item.node);
      if(arenaMode){
        item.node.style.left=entity.arenaXPct+"%";
        item.node.style.top=entity.arenaYPct+"%";
        item.node.style.bottom="auto";
        item.node.style.transform="translate(-50%, -50%)";
      }else{
        const facing=frontSideFor(entity.protectedActorId);
        const side=entity.placementMode==="behind"
          ? (facing==="right"?"left":"right")
          : facing;
        item.node.style.left=side==="right"
          ? "calc(110% + "+entity.offsetForwardPx+"px)"
          : "calc(-10% - "+entity.offsetForwardPx+"px)";
        // Center the persistent wall sprite in the actual attack lane,
        // relative to the fighter's visible container. The former 10%-from-
        // bottom anchor put the entire wall too HIGH: a projectile travelling
        // through the fighter's center could slip under its real rectangle.
        // Transform centers the wall + PV label; scale remains fully native.
        item.node.style.top="calc(50% - "+entity.offsetUpPx+"px)";
        item.node.style.bottom="auto";
        item.node.style.transform="translate(-50%, -50%)";
      }
      // Layout dimensions = visual dimensions = the single collision rectangle.
      const scale=entity.visualScale??1;
      item.sprite.style.width=Math.round(70*scale*(entity.visualScaleX??1))+"px";
      item.sprite.style.height=Math.round(92*scale*(entity.visualScaleY??1))+"px";
      const viewport=item.sprite.querySelector("[data-combat-entity-visual-viewport]");
      if(viewport){
        // Square source art stays square at X=Y=1, but can stretch independently.
        viewport.style.aspectRatio="auto";
        viewport.style.height=Math.round(70*scale*(entity.visualScaleY??1))+"px";
      }
      item.label.textContent="🧊 Mur "+formatHp(entity);
      item.node.setAttribute("role","status");
      item.node.setAttribute("aria-label","Mur destructible, "+entity.hp+" PV sur "+entity.maxHp);
      if(existing&&entity.hp<existing.hp&&typeof item.sprite.animate==="function"){
        item.sprite.animate([{opacity:1,filter:"brightness(1)"},{opacity:.55,filter:"brightness(2.5)"},{opacity:1,filter:"brightness(1)"}],{duration:240,iterations:1});
      }
      item.hp=entity.hp;
    }
    for(const [id,item] of [...nodes])if(!living.has(id)){
      item.node.remove();nodes.delete(id);
    }
  }
  // Only the actual visible sprite rectangle can request an early projectile
  // collision. No gameplay action is decided by this visual-only sensor.
  function collisionRectsFor({sourceActorId,targetActorId,kind="projectile"}){
    if(typeof teamOf==="function"&&teamOf(sourceActorId)===teamOf(targetActorId))return [];
    return (snapshot?.combatEntities??[]).filter(entity=>
      entity.kind==="barrier"&&entity.protectedActorId===targetActorId&&
      entity.ownerActorId!==sourceActorId&&entity.hp>0&&
      entity.interceptKinds?.includes(kind)&&nodes.has(entity.id))
      .map(entity=>Object.freeze({entityId:entity.id,rect:nodes.get(entity.id).sprite.getBoundingClientRect()}));
  }
  function dispose(){for(const host of Object.values(hosts))host.remove();arenaOverlay?.remove();if(arenaHost)delete arenaHost.dataset.combatEntityArenaActive;nodes.clear();snapshot=null;}
  return Object.freeze({render,collisionRectsFor,dispose});
}
