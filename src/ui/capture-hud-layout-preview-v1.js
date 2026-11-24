import {normalizeCaptureHudLayoutV1,validateCaptureHudGeometryV1} from '../contracts/capture-hud-layout-v1.js';
// Stable role selectors point to the ONE native HUD, never species IDs.
const selectors=Object.freeze({
 'local-status':'.squad-card--local-full',
 'opponent-status':'.squad-card--opponent',
 'opponent-secondary-status':'.squad-card--opponent-b',
 'opponent-reserves':'[data-combat-enemy-reserves]',
 'opponent-skills':'[data-combat-enemy-skills]',
 'command-dock':'.coop-command-stack',
 'dodge':'[data-combat-dodge]',
 'protected-status':'[data-combat-live-status]'
});
const desktopQuery='(min-width: 1100px) and (min-height: 650px) and (pointer: fine)';
export function mountCaptureHudLayoutPreviewV1({root,layout,onStatus=()=>{}}){
 const normalized=normalizeCaptureHudLayoutV1(layout);
 if(!Object.keys(normalized.profiles).length)return Object.freeze({dispose(){}});
 const arena=root.querySelector('[data-combat-arena]'),win=root.ownerDocument.defaultView;
 if(!arena||!win)throw new TypeError('Arène native requise');
 const nodes=Object.fromEntries(Object.entries(selectors).map(([key,selector])=>[key,arena.querySelector(selector)]).filter(([,node])=>node));
 const originals=new Map(Object.values(nodes).map(node=>[node,[
  node.style.getPropertyValue('translate'),node.style.getPropertyPriority('translate'),
  node.style.getPropertyValue('scale'),node.style.getPropertyPriority('scale'),
  node.style.getPropertyValue('transform-origin'),node.style.getPropertyPriority('transform-origin')
 ]]));
 let frame=0,disposed=false,last='';
 function restore(){
  for(const [node,v] of originals)for(const [i,key] of ['translate','scale','transform-origin'].entries()){
   if(v[2*i])node.style.setProperty(key,v[2*i],v[2*i+1]);else node.style.removeProperty(key);
  }
 }
 function report(message){if(message!==last){last=message;onStatus(message);}}
 const relative=(r,a)=>({left:r.left-a.left,top:r.top-a.top,right:r.right-a.left,bottom:r.bottom-a.top,width:r.width,height:r.height});
 function measure(a){
  const result={};
  for(const [key,node] of Object.entries(nodes)){
   const r=node.getBoundingClientRect();if(node.hidden||r.width<=0||r.height<=0)continue;
   const elements=[...(node.matches('button,summary')?[node]:[]),...node.querySelectorAll('button,summary')];
   const targets=elements.filter(el=>!el.hidden&&el.getClientRects().length).map(el=>relative(el.getBoundingClientRect(),a)).filter(r=>r.width>0&&r.height>0);
   const bounds=[relative(r,a),...targets];
   result[key]={left:Math.min(...bounds.map(b=>b.left)),top:Math.min(...bounds.map(b=>b.top)),
    right:Math.max(...bounds.map(b=>b.right)),bottom:Math.max(...bounds.map(b=>b.bottom)),targets};
  }
  return result;
 }
 function apply(){
  frame=0;if(disposed)return;
  restore();
  const a=arena.getBoundingClientRect();if(a.width<=0||a.height<=0)return;
  const desktop=win.matchMedia(desktopQuery).matches;
  const profile=(desktop?'desktop':'touch')+'-'+(arena.dataset.combatActiveCount==='2'?'2v2':'1v1');
  const values=normalized.profiles[profile];
  if(!values){report('');return;}
  const baseline=measure(a);
  for(const [role,value] of Object.entries(values)){
   const node=nodes[role];if(!node||!baseline[role])continue;
   node.style.setProperty('translate',a.width*value.dx/100+'px '+a.height*value.dy/100+'px');
   node.style.setProperty('scale',String(value.scale/100));
   node.style.setProperty('transform-origin','center');
  }
  const error=validateCaptureHudGeometryV1({baseline,proposed:measure(a),width:a.width,height:a.height,touch:!desktop});
  if(error){restore();report('Disposition non appliquée — '+error);}
  else report('');
 }
 function schedule(){if(!disposed&&!frame)frame=win.requestAnimationFrame(apply);}
 const resize=typeof win.ResizeObserver==='function'?new win.ResizeObserver(schedule):null;
 resize?.observe(arena);for(const node of Object.values(nodes))resize?.observe(node);
 const mutations=typeof win.MutationObserver==='function'?new win.MutationObserver(schedule):null;
 mutations?.observe(arena,{subtree:true,attributes:true,attributeFilter:['hidden','open','data-combat-active-count']});
 win.addEventListener('resize',schedule);schedule();
 return Object.freeze({dispose(){
  if(disposed)return;disposed=true;if(frame)win.cancelAnimationFrame(frame);
  resize?.disconnect();mutations?.disconnect();win.removeEventListener('resize',schedule);restore();report('');
 }});
}
