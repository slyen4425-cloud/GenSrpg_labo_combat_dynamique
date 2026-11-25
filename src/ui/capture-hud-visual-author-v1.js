import {CAPTURE_HUD_ROLES_V1,captureHudRoleLabelV1,isCaptureHudSkillRoleV1,editCaptureHudGroupV1,updateCaptureHudLayoutV1,captureHudBoxFromRectsV1,captureHudBoxGestureV1} from '../contracts/capture-hud-layout-v1.js';
const names={'desktop-1v1':'PC · 1v1','desktop-2v2':'PC · 2v2','touch-1v1':'Mobile · 1v1','touch-2v2':'Mobile · 2v2'};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Math.round(n)));
const defaultValue=()=>({dx:0,dy:0,scale:100});
export function captureHudPointerValueV1({value,mode,deltaX,deltaY,width,height,elementWidth,parentScale=1}){
 if(mode==='resize')return {...value,scale:clamp(value.scale*(1+deltaX/Math.max(1,elementWidth)),85,125)};
 return {...value,dx:clamp(value.dx+100*deltaX/(width*parentScale),-50,50),
  dy:clamp(value.dy+100*deltaY/(height*parentScale),-50,50)};
}
// Shared gesture: each native role keeps its own canonical geometry.
export function captureHudGroupPointerValuesV1({members,mode,deltaX,deltaY,width,height,elementWidth}){
 if(mode==='resize'){
  const ratio=Math.max(...members.map(m=>85/m.value.scale),Math.min(...members.map(m=>125/m.value.scale),1+deltaX/Math.max(1,elementWidth)));
  return members.map(m=>({role:m.role,value:{...m.value,scale:clamp(m.value.scale*ratio,85,125)}}));
 }
 const x=Math.max(...members.map(m=>(-50-m.value.dx)*m.parentScale),Math.min(...members.map(m=>(50-m.value.dx)*m.parentScale),100*deltaX/width));
 const y=Math.max(...members.map(m=>(-50-m.value.dy)*m.parentScale),Math.min(...members.map(m=>(50-m.value.dy)*m.parentScale),100*deltaY/height));
 return members.map(m=>({role:m.role,value:{...m.value,dx:clamp(m.value.dx+x/m.parentScale,-50,50),dy:clamp(m.value.dy+y/m.parentScale,-50,50)}}));
}
export function mountCaptureHudVisualAuthorV1({root,toolbar,hudOwner,readLayout,writeLayout,startTest}){
 const arena=root.querySelector('[data-combat-arena]'),doc=root.ownerDocument,win=doc.defaultView;
 if(!arena||!toolbar||!hudOwner)throw new Error('Édition HUD native indisponible');
 const $=s=>toolbar.querySelector(s),status=$('[data-hud-author-status]');
 const overlay=doc.createElement('div');overlay.dataset.hudAuthorOverlay='true';
 const outline=doc.createElement('div');outline.className='hud-author-outline';outline.hidden=true;
 const handles=['nw','n','ne','w','e','sw','s','se'].map(edge=>{
  const node=doc.createElement('div');node.className='hud-author-handle';node.dataset.hudResizeEdge=edge;node.hidden=true;return node;
 });
 overlay.append(outline,...handles);arena.append(overlay);toolbar.hidden=false;
 let role=null,groupId=null,gesture=null,disposed=false,frame=0,history=[],cleanups=[];
 const listen=(el,event,fn,options)=>{el.addEventListener(event,fn,options);cleanups.push(()=>el.removeEventListener(event,fn,options));};
 // The pointer overlay alone cannot stop keyboard activation of native
 // buttons or actor controls. Intercept activation only inside this mounted
 // combat root while authoring; never alter native geometry or gameplay.
 const blockNativeActivation=event=>{
  if(overlay.contains(event.target))return;
  if(event.type==='keydown'&&event.key!=='Enter'&&event.key!==' ')return;
  event.preventDefault();event.stopPropagation();
 };
 listen(root,'click',blockNativeActivation,true);
 listen(root,'keydown',blockNativeActivation,true);
 const profile=()=>hudOwner.profile();
 const actual=key=>readLayout().profiles[profile()]?.[key]??defaultValue();
 const groups=()=>readLayout().groups?.[profile()]??[];
 const selectedGroup=()=>groups().find(group=>group.id===groupId);
 const selectedRoles=()=>selectedGroup()?.roles??(role?[role]:[]);
 const parentScale=key=>isCaptureHudSkillRoleV1(key)||key==='local-reserves'?(actual('command-dock').scale??100)/100:1;
 const groupEditor=$('[data-hud-author-group-editor]'),groupSelect=$('[data-hud-author-group-select]');
 const pageSelect=$('[data-hud-author-page-select]');
 const groupName=$('[data-hud-author-group-name]'),groupFold=$('[data-hud-author-group-foldable]'),groupRoles=$('[data-hud-author-group-roles]');
 let pageSignature='',draftProfile=null;
 function option(value,label){const o=doc.createElement('option');o.value=value;o.textContent=label;return o;}
 function refreshPages(){
  const options=hudOwner.pageOptions?.()??[],signature=JSON.stringify(options);
  if(signature!==pageSignature){pageSignature=signature;pageSelect.replaceChildren(...options.map(p=>option(p.id,p.label)));}
  pageSelect.hidden=!options.length;pageSelect.value=hudOwner.currentPage?.()??'';
 }
 function loadGroupDraft(){
  const group=groups().find(g=>g.id===groupSelect.value),taken=new Set(groups().filter(g=>g.id!==group?.id).flatMap(g=>g.roles));
  groupName.value=group?.label??'';groupFold.checked=group?.foldable??false;
  const keys=[...new Set([...Object.keys(CAPTURE_HUD_ROLES_V1),...Object.keys(hudOwner.elements()),...(group?.roles??[])])].filter(captureHudRoleLabelV1);
  groupRoles.replaceChildren(...keys.map(key=>{
   const label=doc.createElement('label'),input=doc.createElement('input');
   input.type='checkbox';input.value=key;input.checked=group?.roles.includes(key)??false;input.disabled=taken.has(key);
   label.append(input,doc.createTextNode(captureHudRoleLabelV1(key)));return label;
  }));
  $('[data-hud-author-group-remove]').disabled=!group;
  $('[data-hud-author-group-move]').disabled=!group;
 }
 function refreshGroups(id=groupSelect.value){
  draftProfile=profile();
  groupSelect.replaceChildren(option('','Nouveau groupe / volet'),...groups().map(g=>option(g.id,g.label)));
  groupSelect.value=groups().some(g=>g.id===id)?id:'';
  loadGroupDraft();
 }
 function selectionBounds(){
  const nodes=hudOwner.elements(),rects=selectedRoles().map(key=>nodes[key]).filter(node=>node&&!node.hidden)
   .map(node=>node.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);
  if(!rects.length)return null;
  const left=Math.min(...rects.map(r=>r.left)),top=Math.min(...rects.map(r=>r.top)),
   right=Math.max(...rects.map(r=>r.right)),bottom=Math.max(...rects.map(r=>r.bottom));
  return {left,top,right,bottom,width:right-left,height:bottom-top};
 }
 function draw(){
  frame=0;if(disposed)return;
  $('[data-hud-author-profile]').textContent=names[profile()];
  if(groupId&&!selectedGroup())groupId=null;
  $('[data-hud-author-selection]').textContent=selectedGroup()?.label??captureHudRoleLabelV1(role)??'Touche un élément';
  refreshPages();if(groupEditor.open&&draftProfile!==profile())refreshGroups();
  $('[data-hud-author-undo]').disabled=!history.length;
  $('[data-hud-author-reset]').disabled=!selectedRoles().length;
  $('[data-hud-author-group]').disabled=role==='command-dock';
  const grid=actual('command-dock').grid??{columns:5,slots:5};
  $('[data-hud-author-grid-count]').textContent=grid.slots+' cases · '+grid.columns+' colonnes';
  for(const key of ['local','opponent'])$('[data-hud-author-portraits-'+key+']').setAttribute('aria-pressed',String(!!actual(key+'-reserves').portraits));
  const r=selectionBounds(),a=arena.getBoundingClientRect();
  const valid=!!r;
  outline.hidden=!valid;
  for(const handle of handles){
   const edge=handle.dataset.hudResizeEdge;
   handle.hidden=!valid||(!(role==='command-dock'&&!groupId)&&edge!=='se');
   if(!handle.hidden)Object.assign(handle.style,{
    left:(edge.includes('w')?r.left:edge.includes('e')?r.right:(r.left+r.right)/2)-a.left+'px',
    top:(edge.includes('n')?r.top:edge.includes('s')?r.bottom:(r.top+r.bottom)/2)-a.top+'px'
   });
  }
  if(valid)Object.assign(outline.style,{left:r.left-a.left+'px',top:r.top-a.top+'px',width:r.width+'px',height:r.height+'px'});
 }
 function schedule(){if(!disposed&&!frame)frame=win.requestAnimationFrame(draw);}
 function choose(x,y){
  return Object.entries(hudOwner.elements()).filter(([key,node])=>{
   const r=node.getBoundingClientRect();return !!captureHudRoleLabelV1(key)&&!node.hidden&&r.width>0&&r.height>0&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
  }).sort(([a,an],[b,bn])=>{
   const ar=an.getBoundingClientRect(),br=bn.getBoundingClientRect();
   return ar.width*ar.height-br.width*br.height;
  })[0]?.[0]??null;
 }
 function apply(candidate){
  if(!hudOwner.set(candidate)){status.textContent=hudOwner.lastError?.()||'Placement refusé : zone protégée, chevauchement ou commande trop petite.';schedule();return false;}
  writeLayout(candidate);status.textContent='Disposition modifiée';schedule();return true;
 }
 listen(overlay,'pointerdown',event=>{
  if(event.button!==0||gesture)return;
  const edge=event.target.dataset.hudResizeEdge,resize=!!edge;
  if(!resize){
   const picked=choose(event.clientX,event.clientY),selected=selectionBounds();
   if(!((selectedGroup()||role==='command-dock')&&selected&&event.clientX>=selected.left&&event.clientX<=selected.right&&event.clientY>=selected.top&&event.clientY<=selected.bottom)){
    groupId=null;role=picked;
   }
  }
  draw();const r=selectionBounds();if(!r)return;
  const a=arena.getBoundingClientRect();
  const members=selectedRoles().map(key=>({role:key,value:actual(key),parentScale:parentScale(key)}));
  gesture={id:event.pointerId,profile:profile(),members,mode:resize?'resize':'move',x:event.clientX,y:event.clientY,
   before:readLayout(),width:a.width,height:a.height,elementWidth:r.width,changed:false,
   ...(role==='command-dock'&&!groupId?{box:captureHudBoxFromRectsV1(r,a),edge:edge??'move'}:{})};
  overlay.setPointerCapture(event.pointerId);event.preventDefault();
 });
 listen(overlay,'pointermove',event=>{
  const g=gesture;if(!g||event.pointerId!==g.id||g.profile!==profile())return;
  const args={...g,deltaX:event.clientX-g.x,deltaY:event.clientY-g.y};
  if(g.box){
   const box=captureHudBoxGestureV1(args);
   if(JSON.stringify(box)===JSON.stringify(actual('command-dock').box??g.box))return;
   if(apply(updateCaptureHudLayoutV1(readLayout(),g.profile,'command-dock',{box,...(actual('command-dock').grid?{grid:actual('command-dock').grid}:{})})))g.changed=true;
   return;
  }
  // Groups containing a real region must not accidentally feed its rectangle to
  // the legacy offset operation. The full region-tree gesture replaces this next.
  if(g.members.some(member=>member.value.box))return;
  const edits=g.members.length===1?[{role:g.members[0].role,value:captureHudPointerValueV1({...args,...g.members[0]})}]:captureHudGroupPointerValuesV1(args);
  if(edits.every(({role,value})=>{const old=actual(role);return old.dx===value.dx&&old.dy===value.dy&&old.scale===value.scale;}))return;
  const candidate=edits.reduce((layout,{role,value})=>updateCaptureHudLayoutV1(layout,g.profile,role,value),readLayout());
  if(apply(candidate))g.changed=true;
 });
 function end(event){if(!gesture||event.pointerId!==gesture.id)return;const g=gesture;gesture=null;
  if(g.changed)history.push(g.before);if(overlay.hasPointerCapture(g.id))overlay.releasePointerCapture(g.id);schedule();}
 listen(overlay,'pointerup',end);listen(overlay,'pointercancel',end);listen(overlay,'lostpointercapture',end);
 listen($('[data-hud-author-group]'),'click',()=>{groupId=null;role='command-dock';schedule();});
 function togglePortraits(key){
  const before=readLayout(),value=actual(key),next={...value,portraits:!value.portraits};
  if(apply(updateCaptureHudLayoutV1(before,profile(),key,next))){history.push(before);groupId=null;role=key;schedule();}
 }
 for(const key of ['local','opponent'])listen($('[data-hud-author-portraits-'+key+']'),'click',()=>togglePortraits(key+'-reserves'));
 function changeGrid(field,delta){
  const before=readLayout(),node=hudOwner.elements()['command-dock'];
  if(!node)return;
  const value=actual('command-dock'),grid={...(value.grid??{columns:5,slots:5})};
  grid[field]=clamp(grid[field]+delta,1,field==='columns'?12:48);
  const box=value.box??captureHudBoxFromRectsV1(node.getBoundingClientRect(),arena.getBoundingClientRect());
  const candidate=updateCaptureHudLayoutV1(before,profile(),'command-dock',{box,grid});
  if(apply(candidate)){history.push(before);groupId=null;role='command-dock';schedule();}
 }
 for(const [selector,field,delta] of [
  ['[data-hud-author-add-slot]','slots',1],['[data-hud-author-remove-slot]','slots',-1],
  ['[data-hud-author-add-column]','columns',1],['[data-hud-author-remove-column]','columns',-1]
 ])listen($(selector),'click',()=>changeGrid(field,delta));
 listen(pageSelect,'change',()=>{if(!hudOwner.showPage(pageSelect.value))status.textContent='Volet indisponible dans cette disposition';schedule();});
 listen(groupEditor,'toggle',()=>{if(groupEditor.open)refreshGroups();});
 listen(groupSelect,'change',loadGroupDraft);
 listen($('[data-hud-author-group-save]'),'click',()=>{
  try{
   const before=readLayout(),id=groupSelect.value||null;
   const value={label:groupName.value,foldable:groupFold.checked,roles:[...groupRoles.querySelectorAll('input:checked')].map(el=>el.value)};
   const candidate=editCaptureHudGroupV1(before,profile(),id,value);
   const nextId=id??candidate.groups[profile()].at(-1).id;
   if(apply(candidate)){history.push(before);refreshGroups(nextId);status.textContent='Groupe enregistré dans la disposition';}
  }catch(error){status.textContent=error.message;}
 });
 listen($('[data-hud-author-group-remove]'),'click',()=>{
  if(!groupSelect.value)return;
  const before=readLayout();
  if(apply(editCaptureHudGroupV1(before,profile(),groupSelect.value,null))){history.push(before);groupId=null;refreshGroups('');}
 });
 listen($('[data-hud-author-group-move]'),'click',()=>{
  const group=groups().find(g=>g.id===groupSelect.value);if(!group)return;
  if(group.foldable){const page=hudOwner.pageOptions().find(p=>p.groupId===group.id);if(page&&!hudOwner.showPage(page.id))return;}
  groupId=group.id;role=null;groupEditor.open=false;schedule();
 });
 listen($('[data-hud-author-undo]'),'click',()=>{if(history.length&&apply(history.at(-1))){history.pop();if(groupEditor.open)refreshGroups();}schedule();});
 listen($('[data-hud-author-reset]'),'click',()=>{
  const roles=selectedRoles();if(!roles.length)return;const before=readLayout();
  const candidate=roles.reduce((layout,key)=>updateCaptureHudLayoutV1(layout,profile(),key,null),before);
  if(apply(candidate))history.push(before);schedule();
 });
 function dispose(){if(disposed)return;disposed=true;if(frame)win.cancelAnimationFrame(frame);for(const f of cleanups.splice(0))f();observer?.disconnect();overlay.remove();toolbar.hidden=true;}
 listen($('[data-hud-author-test]'),'click',()=>{dispose();startTest();});
 refreshGroups();
 const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(schedule):null;observer?.observe(arena);
 listen(win,'resize',schedule);schedule();
 return Object.freeze({dispose});
}
