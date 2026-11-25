import {captureHudSkillPagesV1} from '../contracts/capture-hud-layout-v1.js';
// Only project the native buttons. No cloned handlers, skill definitions,
// hidden alternative HUD, or storage. Reconcile on the existing roster render.
export function mountCaptureHudSkillPagesV1({grid,onChange=()=>{}}){
 if(!grid)return Object.freeze({sync(){},options:()=>[],current:()=>null,select:()=>false,suspend(){},resume(){},dispose(){}});
 const nav=grid.ownerDocument.createElement('select');
 nav.dataset.hudSkillPageNav='true';nav.setAttribute('aria-label','Volets de compétences');
 nav.title='Ouvrir un volet de compétences';
 let buttons=[],keys=[],pages=[],active=null,signature='',suspended=false,disposed=false;
 function clear(){
  for(const button of buttons)delete button.dataset.hudPageHidden;
 }
 function project(){
  clear();
  if(!pages.length){nav.remove();return;}
  if(nav.parentElement!==grid)grid.prepend(nav);
  if(suspended){nav.dataset.hudPageSuspended='true';return;}
  delete nav.dataset.hudPageSuspended;
  const page=pages.find(p=>p.id===active)??pages[0];
  active=page.id;nav.value=active;
  const visible=new Set(page.roles);
  buttons.forEach((button,i)=>{if(!visible.has(keys[i]))button.dataset.hudPageHidden='true';});
 }
 function sync(groups){
  if(disposed)return;
  const current=[...grid.children].filter(node=>node.tagName==='BUTTON');
  const nextSignature=JSON.stringify(groups);
  if(nextSignature!==signature||current.length!==buttons.length||current.some((node,i)=>node!==buttons[i])){
   clear();buttons=current;signature=nextSignature;
   const seen=new Set();
   keys=buttons.map(button=>{
    const role=button.dataset.combatHudSkillRole;
    if(role&&!seen.has(role)){seen.add(role);return role;}
    return Symbol(); // unlabelled legacy button: never a persisted layout role
   });
   pages=captureHudSkillPagesV1(keys,groups);
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
 const change=()=>{if(select(nav.value))onChange();};
 nav.addEventListener('change',change);
 return Object.freeze({
  sync,options:()=>pages.map(({id,label,groupId})=>({id,label,groupId})),current:()=>active,select,
  suspend(){suspended=true;project();},resume(){suspended=false;project();},
  dispose(){if(disposed)return;disposed=true;clear();nav.removeEventListener('change',change);nav.remove();}
 });
}
