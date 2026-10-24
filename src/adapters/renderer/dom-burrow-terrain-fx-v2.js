import {
  planBurrowTerrainFxV2
} from "../../core/fx/burrow-terrain-fx-v2.js";
import {applySpriteVisual} from "./dom-skill-fx.js";

// Ground-only visuals: real-world anchor points are provided by Demo UI.
// All elapsed times originate from the already-running burrow attack plan.
// No DOM contact watcher, combat mutation, or independently timed hit.
export function playDomBurrowTerrainFxV2({arena,from,to,travelMs,sprites=null}) {
  if (!arena?.ownerDocument ||
      typeof arena.append !== "function") {
    throw new TypeError("burrow arena requires a DOM element");
  }
  const fx = planBurrowTerrainFxV2({from,to,travelMs});
  const nodes = [], animations = [];
  let cancelled = false;

  function element(kind, x, y, width, height) {
    const node = arena.ownerDocument.createElement("span");
    node.className = "burrow-terrain-fx burrow-terrain-fx--" + kind;
    node.dataset.burrowFx = kind;
    node.setAttribute?.("aria-hidden","true");
    Object.assign(node.style, {
      position:"absolute",
      pointerEvents:"none",
      left:x+"px",top:y+"px",
      width:width+"px",height:height+"px",
      zIndex:"6",
      opacity:"0",
      borderRadius:"50%"
    });
    arena.append(node);
    nodes.push(node);
    return node;
  }
  function play(node, frames, duration, delay=0, easing="ease-out") {
    if (typeof node.animate !== "function") {
      throw new TypeError("Burrow terrain FX requires Web Animations API");
    }
    animations.push(node.animate(frames,{
      duration:Math.max(1,duration),delay:Math.max(0,delay),
      easing,fill:"both"
    }));
  }
  function hole(at,kind) {
    const n=element(kind,
      at.x-fx.holeWidthPx/2,at.y-fx.holeHeightPx/2,
      fx.holeWidthPx,fx.holeHeightPx);
    n.style.background =
      "radial-gradient(ellipse at center, rgba(23,16,15,.94) 0%, rgba(58,39,25,.95) 46%, rgba(122,82,44,.92) 60%, rgba(180,133,73,.42) 77%, transparent 93%)";
    n.style.boxShadow="0 2px 5px rgba(23,15,12,.28)";
    return n;
  }

  // Optional author-picked sprite renderer replaces the entire procedural
  // fallback. Every frame is fetched from the approved 20-frame atlas and
  // remains locked to this one Burrow V1 approach duration.
  if(sprites!==null){
    function spriteStage(stage,point,atMs,durationMs){
      const visual=sprites[stage];
      if(!visual||!visual.url)return;
      const size=(stage==="travel"?145:125)*(Number(visual.scale)||1);
      const center={
        x:point.x+(Number(visual.offsetX)||0),
        y:point.y+(Number(visual.offsetY)||0)
      };
      const node=element("sprite-"+stage,center.x-size/2,center.y-size/2,size,size);
      node.className+=" skill-fx";
      node.style.borderRadius="0";
      node.style.zIndex="7";
      node.style.backgroundColor="transparent";
      const count=Math.max(1,Number(visual.frameCount)||20);
      const frameDuration=Math.max(1,Number(visual.frameMs)||70);
      const spriteDuration=Math.max(1,Math.min(durationMs,count*frameDuration));
      applySpriteVisual(node,{
        ...visual,
        playbackMode:stage==="travel"?"loop":"stretch"
      },spriteDuration);
      if(stage==="travel"){
        const dx=fx.to.x-fx.from.x,dy=fx.to.y-fx.from.y;
        const angle=Math.atan2(dy,dx)*180/Math.PI;
        play(node,[
          {transform:"translate(0px,0px) rotate("+angle+"deg) scale(.86)",opacity:0},
          {transform:"translate("+(dx*.09)+"px,"+(dy*.09)+"px) rotate("+angle+"deg) scale(1)",opacity:1,offset:.12},
          {transform:"translate("+(dx*.89)+"px,"+(dy*.89)+"px) rotate("+angle+"deg) scale(1)",opacity:1,offset:.86},
          {transform:"translate("+dx+"px,"+dy+"px) rotate("+angle+"deg) scale(.8)",opacity:0}
        ],durationMs,atMs,"linear");
      }else{
        play(node,[
          {opacity:0,transform:"scale(.45)"},
          {opacity:1,transform:"scale(1)",offset:.18},
          {opacity:1,transform:"scale(1.03)",offset:.77},
          {opacity:0,transform:"scale(1.08)"}
        ],durationMs,atMs);
      }
    }
    spriteStage("start",fx.from,0,Math.max(1,fx.phases.diveMs));
    if(fx.trailLengthPx>2&&fx.phases.hiddenMs>0){
      spriteStage("travel",fx.from,fx.trailAtMs,Math.max(1,fx.trailMs));
    }
    spriteStage("impact",fx.to,fx.emergeAtMs,Math.max(1,fx.emergeMs));
    return Object.freeze({
      status:"playing",plan:fx,
      cancel(){
        if(cancelled)return;
        cancelled=true;
        for(const a of animations)a.cancel?.();
        for(const n of nodes)n.remove?.();
        nodes.length=0;animations.length=0;
      }
    });
  }

  // Entry: a dark cavity opens exactly under the fighter as it sinks.
  const entry=hole(fx.from,"entry");
  play(entry,[
    {opacity:0,transform:"scale(.25,.4)"},
    {opacity:1,transform:"scale(1,1)",offset:.42},
    {opacity:.9,transform:"scale(1.02,1) ",offset:.72},
    {opacity:0,transform:"scale(.75,.7)"}
  ],Math.max(1,fx.trailAtMs+Math.min(160,fx.trailMs)));

  // Digging sprays loose soil immediately as the creature drops below terrain.
  // Same deterministic particles as emergence; no additional media or clock.
  for (const [i,d] of fx.debris.slice(0,6).entries()) {
    const rock=element("entry-debris",fx.from.x-d.sizePx/2,
      fx.from.y-d.sizePx/2,d.sizePx*.8,d.sizePx*.8);
    rock.style.background=i%2
      ? "linear-gradient(140deg,#d3a575,#83552b)"
      : "linear-gradient(140deg,#ad804e,#5b3c24)";
    play(rock,[
      {transform:"translate(0px,0px) scale(.4)",opacity:0},
      {transform:"translate("+(d.x*.6)+"px,"+(d.y*.7-6)+"px) scale(1)",opacity:1,offset:.48},
      {transform:"translate("+(d.x*.9)+"px,"+(d.y+10)+"px) scale(.6)",opacity:0}
    ],Math.max(1,fx.phases.diveMs+125),i*9);
  }

  // Trench: the rough disturbed-soil band advances toward the target,
  // independent of how far apart the combatants are on a 1v1/2v2 arena.
  if(fx.trailLengthPx>2 && fx.phases.hiddenMs>0){
    const trench=element("trench",fx.from.x,fx.from.y-fx.trailWidthPx/2,
      fx.trailLengthPx,fx.trailWidthPx);
    trench.style.borderRadius="24% 76% 62% 38% / 58% 52% 48% 42%";
    trench.style.transformOrigin="0 50%";
    trench.style.background=[
      "repeating-linear-gradient(98deg,rgba(164,112,56,.25) 0px,rgba(53,37,20,.45) 8px,transparent 15px,rgba(117,77,38,.3) 22px)",
      "radial-gradient(ellipse,rgba(62,43,26,.93) 0%,rgba(130,86,48,.83) 34%,rgba(201,147,87,.45) 59%,transparent 76%)"
    ].join(",");
    const angle="rotate("+fx.trailAngleDeg+"deg) ";
    play(trench,[
      {transform:angle+"scaleX(.001)",opacity:0},
      {transform:angle+"scaleX(.08)",opacity:.92,offset:.13},
      {transform:angle+"scaleX(1)",opacity:1,offset:.83},
      {transform:angle+"scaleX(1)",opacity:0}
    ],fx.trailMs+Math.max(1,fx.emergeMs*.55),fx.trailAtMs,"linear");
    // Dust crest rides ahead of the trench, not the creature's hidden sprite.
    const crest=element("crest",fx.from.x-19,fx.from.y-22,38,27);
    crest.style.background=
      "radial-gradient(ellipse,rgba(219,165,96,.82),rgba(137,92,50,.44) 58%,transparent 76%)";
    play(crest,[
      {transform:"translate(0px,0px) scale(.32)",opacity:0},
      {transform:"translate("+fx.trailLengthPx*.48*Math.cos(fx.trailAngleDeg*Math.PI/180)+"px,"+fx.trailLengthPx*.48*Math.sin(fx.trailAngleDeg*Math.PI/180)+"px) scale(1)",opacity:.88,offset:.53},
      {transform:"translate("+(fx.to.x-fx.from.x)+"px,"+(fx.to.y-fx.from.y)+"px) scale(.75)",opacity:0}
    ],fx.trailMs,fx.trailAtMs,"ease-in-out");
  }

  // Exit: impact follows Runtime. An emergence ring and falling earth chips
  // appear for the same travel window, never triggering damage themselves.
  const exit=hole(fx.to,"emergence");
  play(exit,[
    {opacity:0,transform:"scale(.2,.5)"},
    {opacity:1,transform:"scale(1.15,1)",offset:.37},
    {opacity:.8,transform:"scale(1,.88)",offset:.69},
    {opacity:0,transform:"scale(.45,.55)"}
  ],fx.emergeMs+140,fx.emergeAtMs);

  fx.debris.forEach((d,i)=>{
    const rock=element("debris",fx.to.x-d.sizePx/2,
      fx.to.y-d.sizePx/2,d.sizePx,d.sizePx);
    rock.style.borderRadius=i%3===0?"30% 55% 28% 47%":"48% 32% 61% 44%";
    rock.style.background=i%2
      ?"linear-gradient(145deg,#c69b69,#815330)"
      :"linear-gradient(140deg,#a47b50,#493322)";
    play(rock,[
      {transform:"translate(0px,0px) scale(.45)",opacity:0},
      {transform:"translate("+(d.x*.43)+"px,"+(d.y*.45-9)+"px) scale(1.2)",opacity:1,offset:.45},
      {transform:"translate("+d.x+"px,"+(d.y+18)+"px) scale(.65)",opacity:0}
    ],Math.max(1,fx.emergeMs+175),fx.emergeAtMs+i*7);
  });

  return Object.freeze({
    status:"playing",
    plan:fx,
    cancel(){
      if(cancelled)return;
      cancelled=true;
      for(const a of animations)a.cancel?.();
      for(const n of nodes)n.remove?.();
      nodes.length=0;
      animations.length=0;
    }
  });
}
