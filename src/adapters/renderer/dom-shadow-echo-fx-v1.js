// Single reusable shadow orb for copied spells: it changes trajectory, not art.
// This module never resolves contact, damage, healing or tactical effects.
function middle(rect,arena){
  return {x:Number(rect.left)-Number(arena.left)+Number(rect.width)/2,
    y:Number(rect.top)-Number(arena.top)+Number(rect.height)/2};
}
export function playDomShadowEchoFxV1({arena,sourceRect,targetRect,type,durationMs,animate}) {
  if(!arena?.ownerDocument || typeof animate!=="function")throw new TypeError("shadow echo requires arena and animator");
  const bounds=arena.getBoundingClientRect();
  const source=middle(sourceRect,bounds);
  const target=middle(targetRect??sourceRect,bounds);
  const travelling=["projectile","beam"].includes(type);
  const start=travelling?source:(type==="cast"?source:target);
  const end=travelling?target:start;
  const node=arena.ownerDocument.createElement("span");
  node.className="skill-fx skill-fx--shadow-echo skill-fx--shadow-echo-"+type;
  node.dataset.skillFx=type;
  node.dataset.shadowEcho="true";
  Object.assign(node.style,{position:"absolute",left:"0px",top:"0px",width:"56px",height:"56px",
    borderRadius:"50%",pointerEvents:"none",zIndex:"8",
    background:"radial-gradient(circle at 40% 35%,rgba(204,165,255,.9),rgba(92,42,150,.85) 34%,rgba(29,13,56,.7) 60%,transparent 75%)",
    filter:"drop-shadow(0 0 14px rgba(106,48,209,.8))"});
  arena.append(node);
  const from=`translate(${start.x}px,${start.y}px) translate(-50%,-50%) scale(0.65)`;
  const to=`translate(${end.x}px,${end.y}px) translate(-50%,-50%) scale(${travelling?1.2:1.5})`;
  const animation=animate(node,[
    {transform:from,opacity:type==="impact"?0.45:0.9},
    {transform:to,opacity:travelling?0.95:0}
  ],{duration:Math.max(100,Number(durationMs)||420),easing:"ease-out",fill:"forwards"});
  const stop=()=>{animation.cancel?.();node.remove?.();};
  const finished=Promise.resolve(animation.finished).then(
    ()=>{node.remove?.();return {status:"finished"};},
    err=>{node.remove?.();return err?.name==="AbortError"?{status:"cancelled"}:Promise.reject(err);}
  );
  return Object.freeze({node,animation,finished,stop});
}
