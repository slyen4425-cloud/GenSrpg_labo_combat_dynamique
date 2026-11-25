import {captureHudSkillPagesV1} from '../contracts/capture-hud-layout-v1.js';
// Only project the native buttons. No cloned handlers, skill definitions,
// hidden alternative HUD, or storage. Reconcile on the existing roster render.
export function mountCaptureHudSkillPagesV1({grid,onChange=()=>{}}){
 if(!grid)return Object.freeze({sync(){},navigation:()=>null,options:()=>[],current:()=>null,select:()=>false,suspend(){},resume(){},dispose(){}});
 const nav=grid.ownerDocument.createElement('select');
 nav.dataset.hudSkillPageNav='true';nav.setAttribute('aria-label','Volets de compétences');
 nav.title='Ouvrir un volet de compétences';
 let buttons=[],keys=[],pages=[],active=null,signature='',suspended=false,disposed=false,config=null,groupsConfig=[],empty=[];
 function clear(){
  for(const button of buttons)delete button.dataset.hudPageHidden;
 }
 function project(){
  clear();
  if(!pages.length){nav.remove();projectEmpty(keys.length);return;}
  if(nav.parentElement!==grid)grid.prepend(nav);
  if(suspended){nav.dataset.hudPageSuspended='true';projectEmpty(keys.length);return;}
  delete nav.dataset.hudPageSuspended;
  const page=pages.find(p=>p.id===active)??pages[0];
  active=page.id;nav.value=active;
  const visible=new Set(page.roles);
  buttons.forEach((button,i)=>{if(!visible.has(keys[i]))button.dataset.hudPageHidden='true';});
  projectEmpty(page.roles.length);
 }
 function projectEmpty(used){
  const gridConfig=suspended?null:(groupsConfig.find(g=>g.foldable&&active?.startsWith(g.id+':'))?.grid??config);
  const count=gridConfig?Math.max(0,gridConfig.slots-used):0;
  // Keep the same nodes while measuring or switching pages. Creating/removing
  // nodes on every suspend/resume would feed the owner's MutationObserver.
  const pool=Math.max(config?.slots??0,...groupsConfig.map(g=>g.grid?.slots??0));
  while(empty.length>pool)empty.pop().remove();
  while(empty.length<pool){
   const cell=grid.ownerDocument.createElement('span');
   cell.dataset.hudEmptySkill='true';cell.setAttribute('aria-hidden','true');cell.textContent='+';
   empty.push(cell);
  }
  // The native renderer can replaceChildren on roster changes.
  empty.forEach((cell,index)=>{
   if(index>=count)cell.dataset.hudPageHidden='true';else delete cell.dataset.hudPageHidden;
   if(cell.parentElement!==grid)grid.append(cell);
  });
  if(gridConfig)grid.dataset.hudGridColumns=String(gridConfig.columns);else delete grid.dataset.hudGridColumns;
  if(gridConfig)grid.style.setProperty('--hud-authored-columns',String(gridConfig.columns));else grid.style.removeProperty('--hud-authored-columns');
 }
 function sync(groups,gridConfig=null){
  if(disposed)return;
  const current=[...grid.children].filter(node=>node.tagName==='BUTTON');
  const nextSignature=JSON.stringify([groups,gridConfig]);config=gridConfig;groupsConfig=groups;
  if(nextSignature!==signature||current.length!==buttons.length||current.some((node,i)=>node!==buttons[i])){
   clear();buttons=current;signature=nextSignature;
   const seen=new Set();
   keys=buttons.map(button=>{
    const role=button.dataset.combatHudSkillRole;
    if(role&&!seen.has(role)){seen.add(role);return role;}
    return Symbol(); // unlabelled legacy button: never a persisted layout role
   });
   pages=captureHudSkillPagesV1(keys,groups,config);
   active=pages.some(page=>page.id===active)?active:pages[0]?.id??null;
   nav.replaceChildren(...pages.map(page=>{
    const option=grid.ownerDocument.createElement('option');option.value=page.id;option.textContent=page.label;return option;
   }));
  }
  suspended=false;project();
 }
 function select(id){
  if(!pages.some(page=>page.id===id))return false;
  active=id;suspended=false;project();return true;
 }
 const change=()=>{const previous=active;if(select(nav.value))onChange(previous);};
 nav.addEventListener('change',change);
 return Object.freeze({
  sync,navigation:()=>pages.length&&!suspended?nav:null,options:()=>pages.map(({id,label,groupId})=>({id,label,groupId})),current:()=>active,select,
  suspend(){suspended=true;project();},resume(){suspended=false;project();},
  dispose(){if(disposed)return;disposed=true;clear();nav.removeEventListener('change',change);nav.remove();config=null;groupsConfig=[];projectEmpty(0);}
 });
}
