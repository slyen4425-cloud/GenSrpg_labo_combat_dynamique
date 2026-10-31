// Persistent view of Combat State entities. The DOM owns only geometry and visual
// playback; the Combat Damage Application owns all entity HP and destruction.
const round=n=>Math.round(n*100)/100;
const formatHp=e=>round(e.hp)+" / "+round(e.maxHp)+" PV";

export function createCombatEntityOverlayV1({fighterContainers,teamOf=null,assetForId=()=>null}){
  const hosts={},nodes=new Map();let snapshot=null;
  for(const [actorId,container] of Object.entries(fighterContainers)){
    const host=document.createElement("div");
    host.dataset.combatEntitiesHost=actorId;
    host.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:12;overflow:visible;";
    container.append(host);hosts[actorId]=host;
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
      // A static frame is sufficient until the artist supplies a dedicated
      // wall atlas; keep it mounted, never replay an impact as a new wall.
      const frames=Math.max(1,Math.floor(Number(asset?.frameCount??asset?.resource?.frameCount)||1));
      image.style.cssText="height:100%;max-width:none;width:"+frames*100+"%;object-fit:fill;display:block;";
      sprite.append(image);
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
    for(const entity of state?.combatEntities??[]){
      if(entity.kind!=="barrier"||!(Number(entity.hp)>0)||!hosts[entity.protectedActorId])continue;
      living.add(entity.id);
      const existing=nodes.get(entity.id);
      const item=existing??newNode(entity,hosts[entity.protectedActorId]);
      const side=frontSideFor(entity.protectedActorId);
      item.node.style.left=side==="right"
        ? "calc(110% + "+entity.offsetForwardPx+"px)"
        : "calc(-10% - "+entity.offsetForwardPx+"px)";
      item.node.style.bottom="calc(10% + "+entity.offsetUpPx+"px)";
      item.sprite.style.width=Math.round(70*(entity.visualScale??1))+"px";
      item.sprite.style.height=Math.round(92*(entity.visualScale??1))+"px";
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
  function collisionRectsFor({sourceActorId,targetActorId}){
    if(typeof teamOf==="function"&&teamOf(sourceActorId)===teamOf(targetActorId))return [];
    return (snapshot?.combatEntities??[]).filter(entity=>
      entity.kind==="barrier"&&entity.protectedActorId===targetActorId&&
      entity.ownerActorId!==sourceActorId&&entity.hp>0&&
      entity.interceptKinds?.includes("projectile")&&nodes.has(entity.id))
      .map(entity=>Object.freeze({entityId:entity.id,rect:nodes.get(entity.id).sprite.getBoundingClientRect()}));
  }
  function dispose(){for(const host of Object.values(hosts))host.remove();nodes.clear();snapshot=null;}
  return Object.freeze({render,collisionRectsFor,dispose});
}
