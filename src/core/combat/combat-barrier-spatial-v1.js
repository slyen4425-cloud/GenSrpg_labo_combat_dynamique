// Pure continuous swept sensor against the actual visible barrier bounds.
// Only the native Combat Damage authority changes combat HP.
export function sweptSegmentRectContactV1({from,to,rect}){
  const x0=Number(from?.x),y0=Number(from?.y),x1=Number(to?.x),y1=Number(to?.y);
  const left=Number(rect?.left),top=Number(rect?.top),width=Number(rect?.width),height=Number(rect?.height);
  if([x0,y0,x1,y1,left,top,width,height].some(v=>!Number.isFinite(v))||width<=0||height<=0)return null;
  const dx=x1-x0,dy=y1-y0;let enter=0,exit=1;
  for(const [p,q] of [[-dx,x0-left],[dx,left+width-x0],[-dy,y0-top],[dy,top+height-y0]]){
    if(p===0){if(q<0)return null;continue;}
    const t=q/p;if(p<0)enter=Math.max(enter,t);else exit=Math.min(exit,t);
    if(enter>exit)return null;
  }
  const round=n=>Math.round(n*1000)/1000;
  return Object.freeze({x:round(x0+enter*dx),y:round(y0+enter*dy)});
}


// The only pure segment-vs-visible-wall geometry query, shared by all visual
// attack forms. Choose the first obstacle crossed, not array/DOM order.
export function nearestBarrierSegmentContactV1({from,to,barriers=[]}){
  if(!Array.isArray(barriers)||!from||!to)return null;
  const distance=Math.hypot(Number(to.x)-Number(from.x),Number(to.y)-Number(from.y));
  if(!Number.isFinite(distance)||distance<=0)return null;
  let nearest=null,first=Infinity;
  for(const entry of barriers){
    if(typeof entry?.entityId!=="string"||!entry.entityId)continue;
    const point=sweptSegmentRectContactV1({from,to,rect:entry.rect});
    if(!point)continue;
    const travelled=Math.hypot(point.x-Number(from.x),point.y-Number(from.y));
    if(travelled<first){first=travelled;nearest=Object.freeze({entityId:entry.entityId,point});}
  }
  return nearest;
}
