import {normalizeCaptureHudLayoutV1,validateCaptureHudGeometryV1,isCaptureHudSkillRoleV1} from '../contracts/capture-hud-layout-v1.js';
import {mountCaptureHudSkillPagesV1} from './capture-hud-skill-pages-v1.js';
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
export function mountCaptureHudLayoutPreviewV1({root,layout,onStatus=()=>{},authoring=false}){
 let normalized=normalizeCaptureHudLayoutV1(layout);
 const arena=root.querySelector('[data-combat-arena]'),win=root.ownerDocument.defaultView;
 if(!arena||!win){
  if(!authoring&&!Object.keys(normalized.profiles).length&&!normalized.groups)return Object.freeze({dispose(){}});
  throw new TypeError('Arène native requise');
 }
 const pages=mountCaptureHudSkillPagesV1({grid:arena.querySelector('[data-combat-skills]'),onChange:previous=>{
  if(frame){win.cancelAnimationFrame(frame);frame=0;}
  if(!apply()){const rejected=last;if(pages.select(previous))apply();report(rejected);}
 }});
 let nodes={};
 const originals=new Map();
 function syncNodes(){
  const next=Object.fromEntries(Object.entries(selectors).map(([key,selector])=>[key,arena.querySelector(selector)]).filter(([,node])=>node));
  for(const node of arena.querySelectorAll('[data-combat-hud-skill-role]')){
   const role=node.dataset.combatHudSkillRole;
   if(isCaptureHudSkillRoleV1(role)&&!Object.hasOwn(next,role))next[role]=node;
  }
  for(const node of originals.keys())if(!Object.values(next).includes(node)){resize?.unobserve(node);originals.delete(node);}
  for(const node of Object.values(next))if(!originals.has(node)){
   originals.set(node,[
    node.style.getPropertyValue('translate'),node.style.getPropertyPriority('translate'),
    node.style.getPropertyValue('scale'),node.style.getPropertyPriority('scale'),
    node.style.getPropertyValue('transform-origin'),node.style.getPropertyPriority('transform-origin')
   ]);
   resize?.observe(node);
  }
  nodes=next;
 }
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
   const elements=[...(node.matches('button,summary,select')?[node]:[]),...node.querySelectorAll('button,summary,select')];
   const targets=elements.filter(el=>!el.hidden&&el.getClientRects().length).map(el=>{
    const rect=el.getBoundingClientRect(),hit=(root.ownerDocument.elementsFromPoint?.(rect.x+rect.width/2,rect.y+rect.height/2)??[root.ownerDocument.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)]).find(el=>el&&!el.closest('[data-hud-author-overlay]'));
    return {...relative(rect,a),hit:!!hit&&(hit===el||el.contains(hit))};
   }).filter(r=>r.width>0&&r.height>0);
   const panels=[...node.querySelectorAll('details[open] > :not(summary)')].map(el=>relative(el.getBoundingClientRect(),a)).filter(r=>r.width>0&&r.height>0);
   const bounds=[relative(r,a),...targets,...panels];
   result[key]={left:Math.min(...bounds.map(b=>b.left)),top:Math.min(...bounds.map(b=>b.top)),
    right:Math.max(...bounds.map(b=>b.right)),bottom:Math.max(...bounds.map(b=>b.bottom)),targets,
    ...(key.startsWith('skill-slot-')&&nodes['command-dock']?.contains(node)?{parentRole:'command-dock'}:{})};
  }
  return result;
 }
 function profileKey(){return (win.matchMedia(desktopQuery).matches?'desktop':'touch')+'-'+(arena.dataset.combatActiveCount==='2'?'2v2':'1v1');}
 function apply(allPages=false){
  frame=0;if(disposed)return false;
  restore();syncNodes();
  const a=arena.getBoundingClientRect();if(a.width<=0||a.height<=0)return false;
  const desktop=win.matchMedia(desktopQuery).matches,profile=profileKey();
  const values=normalized.profiles[profile]??{};
  pages.sync(normalized.groups?.[profile]??[]);
  const options=pages.options();
  if(!options.length&&!Object.keys(values).length){report('');return true;}
  // Compare the native dock against the projected page without treating
  // intentionally folded skills as lost actions. Each view is then checked
  // with its actual controls by the existing geometry owner.
  const topOnly=geometry=>Object.fromEntries(Object.entries(geometry)
   .filter(([role])=>!isCaptureHudSkillRoleV1(role)).map(([role,bounds])=>[role,{...bounds,targets:[]}]));
  let native=null;
  if(options.length){pages.suspend();native=topOnly(measure(a));pages.resume();}
  function applyCurrent(){
   restore();
   const baseline=measure(a);
   if(native){
    const error=validateCaptureHudGeometryV1({baseline:native,proposed:topOnly(baseline),width:a.width,height:a.height,touch:!desktop});
    if(error)return error;
   }
   for(const [role,value] of Object.entries(values)){
    const node=nodes[role];if(!node||!baseline[role])continue;
    node.style.setProperty('translate',a.width*value.dx/100+'px '+a.height*value.dy/100+'px');
    node.style.setProperty('scale',String(value.scale/100));
    node.style.setProperty('transform-origin','center');
   }
   const nav=pages.navigation();
   if(nav){
    const r=nav.getBoundingClientRect();
    const hit=(root.ownerDocument.elementsFromPoint?.(r.x+r.width/2,r.y+r.height/2)??[root.ownerDocument.elementFromPoint(r.x+r.width/2,r.y+r.height/2)]).find(el=>el&&!el.closest('[data-hud-author-overlay]'));
    if(!hit||!(hit===nav||nav.contains(hit))||r.left<a.left-1||r.right>a.right+1||r.top<a.top-1||r.bottom>a.bottom+1)
     return 'Sélecteur de volet inaccessible';
    if(!desktop&&(r.width<43||r.height<43))return 'Sélecteur de volet trop petit';
   }
   return validateCaptureHudGeometryV1({baseline,proposed:measure(a),width:a.width,height:a.height,touch:!desktop});
  }
  const selected=pages.current();
  let error=null;
  if(allPages)for(const option of options){pages.select(option.id);error=applyCurrent();if(error)break;}
  if(selected)pages.select(selected);
  if(!error)error=applyCurrent();
  if(error){restore();pages.suspend();report('Disposition non appliquée — '+error);return false;}
  report('');return true;
 }
 function schedule(){if(!disposed&&!frame)frame=win.requestAnimationFrame(()=>apply());}
 const resize=typeof win.ResizeObserver==='function'?new win.ResizeObserver(schedule):null;
 resize?.observe(arena);syncNodes();
 const mutations=typeof win.MutationObserver==='function'?new win.MutationObserver(records=>{
  if(records.some(record=>record.type==='childList'
    ?record.target.matches?.('[data-combat-skills]')
    :record.oldValue!==record.target.getAttribute(record.attributeName)))schedule();
 }):null;
 mutations?.observe(arena,{subtree:true,childList:true,attributes:true,attributeOldValue:true,attributeFilter:['hidden','open','data-combat-active-count']});
 win.addEventListener('resize',schedule);schedule();
 return Object.freeze({
  profile:profileKey,
  pageOptions:()=>pages.options(),
  currentPage:()=>pages.current(),
  showPage(id){
   const previous=pages.current();if(!pages.select(id))return false;
   if(apply())return true;
   pages.select(previous);apply();return false;
  },
  elements(){syncNodes();return {...nodes};},
  set(value){
   const previous=normalized;
   normalized=normalizeCaptureHudLayoutV1(value);
   if(frame){win.cancelAnimationFrame(frame);frame=0;}
   if(apply(true))return true;
   const rejected=last;normalized=previous;apply();report(rejected);return false;
  },
  dispose(){
  if(disposed)return;disposed=true;if(frame)win.cancelAnimationFrame(frame);
  resize?.disconnect();mutations?.disconnect();win.removeEventListener('resize',schedule);restore();pages.dispose();report('');
 }});
}
