import {normalizeCaptureHudLayoutV1,validateCaptureHudGeometryV1,isCaptureHudSkillRoleV1,captureHudPageRegionV1,resolveCaptureHudRoleBoxV1} from '../contracts/capture-hud-layout-v1.js';
import {mountCaptureHudSkillPagesV1} from './capture-hud-skill-pages-v1.js';
// Stable role selectors point to the ONE native HUD, never species IDs.
const selectors=Object.freeze({
 'local-status':'.squad-card--local-full',
 'opponent-status':'.squad-card--opponent',
 'opponent-secondary-status':'.squad-card--opponent-b',
 'ally-status':'.squad-card--command-ally',
 'energy':'.hud__energy',
 'opponent-reserves':'[data-combat-enemy-reserves]',
 'local-reserves':'[data-combat-team-menu]',
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
 const originals=new Map(),portraitOriginals=new Map(),boxOriginals=new Map();
 const styleKeys=['translate','scale','transform-origin','position','left','top','right','bottom','width','height','min-width','min-height','max-width','max-height','box-sizing','margin','aspect-ratio'];
 function syncNodes(){
  const next=Object.fromEntries(Object.entries(selectors).map(([key,selector])=>[key,arena.querySelector(selector)]).filter(([,node])=>node));
  for(const node of arena.querySelectorAll('[data-combat-hud-skill-role]')){
   const role=node.dataset.combatHudSkillRole;
   if(isCaptureHudSkillRoleV1(role)&&!Object.hasOwn(next,role))next[role]=node;
  }
  for(const node of originals.keys())if(!Object.values(next).includes(node)){resize?.unobserve(node);originals.delete(node);portraitOriginals.delete(node);boxOriginals.delete(node);}
  for(const node of Object.values(next))if(!originals.has(node)){
   if(node.matches('[data-combat-team-menu],[data-combat-enemy-reserves]'))portraitOriginals.set(node,node.getAttribute('data-hud-reserve-portraits'));
   boxOriginals.set(node,node.getAttribute('data-hud-box'));
   originals.set(node,styleKeys.flatMap(key=>[node.style.getPropertyValue(key),node.style.getPropertyPriority(key)]));
   resize?.observe(node);
  }
  nodes=next;
 }
 let frame=0,disposed=false,last='';
 function restore(){
  for(const [node,v] of originals)for(const [i,key] of styleKeys.entries()){
   if(v[2*i])node.style.setProperty(key,v[2*i],v[2*i+1]);else node.style.removeProperty(key);
  }
  for(const [node,value] of boxOriginals){if(value===null)node.removeAttribute('data-hud-box');else node.setAttribute('data-hud-box',value);}
  for(const [node,value] of portraitOriginals){if(value===null)node.removeAttribute('data-hud-reserve-portraits');else node.setAttribute('data-hud-reserve-portraits',value);}
 }
 function report(message){if(message!==last){last=message;onStatus(message);}}
 const relative=(r,a)=>({left:r.left-a.left,top:r.top-a.top,right:r.right-a.left,bottom:r.bottom-a.top,width:r.width,height:r.height});
 function measure(a,independent=[]){
  const result={};
  for(const [key,node] of Object.entries(nodes)){
   const r=node.getBoundingClientRect();if(node.hidden||r.width<=0||r.height<=0)continue;
   const elements=[...(node.matches('button,summary,select')?[node]:[]),...node.querySelectorAll('button,summary,select')];
   const belongs=el=>!independent.some(role=>role!==key&&nodes[role]&&node.contains(nodes[role])&&nodes[role].contains(el));
   const targets=elements.filter(el=>belongs(el)&&!el.hidden&&el.getClientRects().length).map(el=>{
    const rect=el.getBoundingClientRect(),hit=(root.ownerDocument.elementsFromPoint?.(rect.x+rect.width/2,rect.y+rect.height/2)??[root.ownerDocument.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)]).find(el=>el&&!el.closest('[data-hud-author-overlay],[data-hud-author-toolbar]'));
    return {...relative(rect,a),hit:!!hit&&(hit===el||el.contains(hit))};
   }).filter(r=>r.width>0&&r.height>0);
   const panels=[...node.querySelectorAll('details[open] > :not(summary)')].filter(belongs).map(el=>relative(el.getBoundingClientRect(),a)).filter(r=>r.width>0&&r.height>0);
   const bounds=[relative(r,a),...targets,...panels];
   result[key]={left:Math.min(...bounds.map(b=>b.left)),top:Math.min(...bounds.map(b=>b.top)),
    right:Math.max(...bounds.map(b=>b.right)),bottom:Math.max(...bounds.map(b=>b.bottom)),targets,
    ...(key!=='command-dock'&&nodes['command-dock']?.contains(node)?{parentRole:'command-dock'}:{})};
  }
  return result;
 }
 function profileKey(){return (win.matchMedia(desktopQuery).matches?'desktop':'touch')+'-'+(arena.dataset.combatActiveCount==='2'?'2v2':'1v1');}
 function apply(allPages=false){
  frame=0;if(disposed)return false;
  restore();syncNodes();
  const a=arena.getBoundingClientRect();if(a.width<=0||a.height<=0)return false;
  const desktop=win.matchMedia(desktopQuery).matches,profile=profileKey();
  const baseValues=normalized.profiles[profile]??{};
  const groups=normalized.groups?.[profile]??[];
  pages.sync(groups,baseValues['command-dock']?.grid??null);
  const options=pages.options();
  if(!options.length&&!Object.keys(baseValues).length){report('');return true;}
  // Compare the native dock against the projected page without treating
  // intentionally folded skills as lost actions. Each view is then checked
  // with its actual controls by the existing geometry owner.
  const topOnly=geometry=>Object.fromEntries(Object.entries(geometry)
   .filter(([role])=>!isCaptureHudSkillRoleV1(role)).map(([role,bounds])=>[role,{...bounds,targets:[]}]));
  let native=null;
  if(options.length){pages.suspend();native=topOnly(measure(a));pages.resume();}
  function applyCurrent(){
   restore();
   const values={...baseValues};
   const region=captureHudPageRegionV1(normalized,profile,pages.current());
   if(Object.keys(region).length)values['command-dock']=region;
   const independent=Object.entries(values).filter(([role,v])=>role!=='command-dock'&&v.box).map(([role])=>role);
   const baseline=measure(a,independent);
   if(native&&!values['command-dock']?.box&&!independent.length){
    const error=validateCaptureHudGeometryV1({baseline:native,proposed:topOnly(baseline),width:a.width,height:a.height,touch:!desktop});
    if(error)return error;
   }
   const ordered=Object.entries(values).sort(([a],[b])=>a==='command-dock'?-1:b==='command-dock'?1:0);
   for(const [role,value] of ordered){
    const node=nodes[role];if(!node||!baseline[role])continue;
    if(value.portraits)node.dataset.hudReservePortraits='true';
    let resolved;
    try{resolved=resolveCaptureHudRoleBoxV1(value,node.getBoundingClientRect(),a);}catch(error){return error.message+' : '+role;}
    if(resolved){
     const {x,y,w,h}=resolved;
     // Existing nodes retain their DOM ownership/listeners, including roster
     // and skill controls. Convert arena coordinates to their actual offset parent.
     const styles={position:'absolute',right:'auto',bottom:'auto',
      width:a.width*w/1000+'px',height:a.height*h/1000+'px','min-width':'0','min-height':'0','max-width':'none','max-height':'none',
      'box-sizing':'border-box',translate:'none',scale:'none',margin:'0','aspect-ratio':'auto'};
     for(const [key,val] of Object.entries(styles))node.style.setProperty(key,val);
     const parent=node.offsetParent??arena,p=parent.getBoundingClientRect();
     node.style.setProperty('left',a.left+a.width*x/1000-p.left-(parent.clientLeft??0)+(parent.scrollLeft??0)+'px');
     node.style.setProperty('top',a.top+a.height*y/1000-p.top-(parent.clientTop??0)+(parent.scrollTop??0)+'px');
     node.dataset.hudBox=role;
    }
   }
   const dock=nodes['command-dock'],grid=arena.querySelector('[data-combat-skills]');
   if(values['command-dock']?.box&&dock&&grid){
    const box=dock.getBoundingClientRect(),content=grid.getBoundingClientRect();
    // Reject if the actual grid or its contents cannot fit the authored rectangle.
    if(content.left<box.left-1||content.right>box.right+1||content.top<box.top-1||content.bottom>box.bottom+1||
       grid.scrollHeight>grid.clientHeight+2||grid.scrollWidth>grid.clientWidth+2)return 'Agrandis le volet pour accueillir ses cases';
    if(!desktop&&[...grid.querySelectorAll('[data-hud-empty-skill]:not([data-hud-page-hidden])')].some(cell=>cell.getBoundingClientRect().width<43))return 'Cases tactiles trop étroites';
   }
   const nav=pages.navigation();
   if(nav){
    const r=nav.getBoundingClientRect();
    const hit=(root.ownerDocument.elementsFromPoint?.(r.x+r.width/2,r.y+r.height/2)??[root.ownerDocument.elementFromPoint(r.x+r.width/2,r.y+r.height/2)]).find(el=>el&&!el.closest('[data-hud-author-overlay],[data-hud-author-toolbar]'));
    if(!hit||!(hit===nav||nav.contains(hit))||r.left<a.left-1||r.right>a.right+1||r.top<a.top-1||r.bottom>a.bottom+1)
     return 'Sélecteur de volet inaccessible';
    if(!desktop&&(r.width<43||r.height<43))return 'Sélecteur de volet trop petit';
   }
   return validateCaptureHudGeometryV1({baseline,proposed:measure(a,independent),width:a.width,height:a.height,touch:!desktop,authoredRegions:ordered.filter(([,value])=>value.box).map(([role])=>role)});
  }
  const selected=pages.current();
  let error=null;
  if(allPages)for(const option of options){pages.select(option.id);error=applyCurrent();if(error)break;}
  if(selected)pages.select(selected);
  if(!error)error=applyCurrent();
  if(error){restore();pages.sync([],null);pages.suspend();report('Disposition non appliquée — '+error);return false;}
  report('');return true;
 }
 function schedule(){if(!disposed&&!frame)frame=win.requestAnimationFrame(()=>apply());}
 const resize=typeof win.ResizeObserver==='function'?new win.ResizeObserver(schedule):null;
 resize?.observe(arena);syncNodes();
 const mutations=typeof win.MutationObserver==='function'?new win.MutationObserver(records=>{
  if(records.some(record=>record.type==='childList'
    ?record.target.matches?.('[data-combat-skills]')&&[...record.addedNodes,...record.removedNodes].some(node=>node.tagName==='BUTTON')
    :record.oldValue!==record.target.getAttribute(record.attributeName)))schedule();
 }):null;
 mutations?.observe(arena,{subtree:true,childList:true,attributes:true,attributeOldValue:true,attributeFilter:['hidden','open','data-combat-active-count']});
 win.addEventListener('resize',schedule);schedule();
 return Object.freeze({
  profile:profileKey,
  lastError:()=>last,
  pageOptions:()=>pages.options(),
  currentPage:()=>pages.current(),
  showPage(id){
   const previous=pages.current();if(!pages.select(id))return false;
   if(apply())return true;
   const rejected=last;apply();if(previous&&pages.select(previous))apply();report(rejected);return false;
  },
  elements(){syncNodes();return {...nodes};},
  set(value){
   const previous=normalized,previousPage=pages.current();
   normalized=normalizeCaptureHudLayoutV1(value);
   if(frame){win.cancelAnimationFrame(frame);frame=0;}
   if(apply(true))return true;
   const rejected=last;normalized=previous;apply();if(previousPage&&pages.select(previousPage))apply();report(rejected);return false;
  },
  dispose(){
  if(disposed)return;disposed=true;if(frame)win.cancelAnimationFrame(frame);
  resize?.disconnect();mutations?.disconnect();win.removeEventListener('resize',schedule);restore();pages.dispose();report('');
 }});
}
