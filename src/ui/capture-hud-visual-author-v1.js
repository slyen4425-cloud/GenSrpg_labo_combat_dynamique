import {CAPTURE_HUD_ROLES_V1,captureHudRoleLabelV1,isCaptureHudSkillRoleV1,editCaptureHudGroupV1,updateCaptureHudLayoutV1,captureHudBoxFromRectsV1,captureHudBoxGestureV1,captureHudGroupBoxesV1} from '../contracts/capture-hud-layout-v1.js';
const names={'desktop-1v1':'PC · 1v1','desktop-2v2':'PC · 2v2','touch-1v1':'Mobile · 1v1','touch-2v2':'Mobile · 2v2'};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Math.round(n)));
const defaultValue=()=>({dx:0,dy:0,scale:100});
export function mountCaptureHudVisualAuthorV1({root,toolbar,hudOwner,readLayout:readSavedLayout,writeLayout,startTest}){
 const arena=root.querySelector('[data-combat-arena]'),doc=root.ownerDocument,win=doc.defaultView;
 if(!arena||!toolbar||!hudOwner)throw new Error('Édition HUD native indisponible');
 const $=s=>toolbar.querySelector(s),status=$('[data-hud-author-status]');
 const grip=$('[data-hud-author-drag]'),collapse=$('[data-hud-author-collapse]'),reserveHelp=$('[data-hud-author-reserve-help]');
 const overlay=doc.createElement('div');overlay.dataset.hudAuthorOverlay='true';
 const outline=doc.createElement('div');outline.className='hud-author-outline';outline.hidden=true;
 const handles=['nw','n','ne','w','e','sw','s','se'].map(edge=>{
  const node=doc.createElement('div');node.className='hud-author-handle';node.dataset.hudResizeEdge=edge;node.hidden=true;return node;
 });
 overlay.append(outline,...handles);arena.append(overlay);arena.dataset.hudAuthoring='true';toolbar.hidden=false;
 let role=null,groupId=null,gesture=null,disposed=false,frame=0,history=[],cleanups=[];
 const listen=(el,event,fn,options)=>{el.addEventListener(event,fn,options);cleanups.push(()=>el.removeEventListener(event,fn,options));};
 // Editing chrome has its own transient position, never a saved combat role.
 let toolbarDrag=null,toolbarPosition=null;
 const toolbarStyles=['left','top','transform','--hud-author-popup-space'];
 const toolbarOriginal=toolbarStyles.map(key=>[key,toolbar.style.getPropertyValue(key),toolbar.style.getPropertyPriority(key)]);
 function toolbarBounds(){return (toolbar.offsetParent??toolbar.parentElement).getBoundingClientRect();}
 function positionToolbar(x,y){
  const bounds=toolbarBounds(),r=toolbar.getBoundingClientRect(),margin=4;
  const maxX=Math.max(margin,bounds.width-r.width-margin),maxY=Math.max(margin,bounds.height-r.height-margin);
  let left=Math.max(margin,Math.min(x,maxX)),top=Math.max(margin,Math.min(y,maxY));
  // The native Back button has a higher layer. Keep it and the drag grip
  // independently reachable; never allow an accidental exit over the grip.
  const back=toolbar.parentElement.querySelector('[data-preview-back-editor]');
  const b=back?.getBoundingClientRect(),g=grip.getBoundingClientRect();
  if(b&&b.width>0&&b.height>0){
   const gx=g.left-r.left,gy=g.top-r.top,bl=b.left-bounds.left,bt=b.top-bounds.top,
    br=b.right-bounds.left,bb=b.bottom-bounds.top;
   if(left+gx<br+margin&&left+gx+g.width>bl-margin&&top+gy<bb+margin&&top+gy+g.height>bt-margin){
    const right=br+margin-gx,below=bb+margin-gy;
    if(right<=maxX)left=Math.max(left,right);
    else if(below<=maxY)top=Math.max(top,below);
   }
  }
  toolbarPosition={x:left,y:top};
  toolbar.style.left=toolbarPosition.x+'px';toolbar.style.top=toolbarPosition.y+'px';toolbar.style.transform='none';
  fitGroupPopup();
 }
 function fitGroupPopup(){
  const bounds=toolbarBounds(),r=toolbar.getBoundingClientRect();
  const above=Math.max(0,r.top-bounds.top-4),below=Math.max(0,bounds.bottom-r.bottom-4);
  toolbar.dataset.hudToolbarPopupAbove=String(above>below);
  toolbar.style.setProperty('--hud-author-popup-space',Math.max(40,Math.floor(Math.max(above,below)))+'px');
 }
 function keepToolbarReachable(){
  if(toolbarPosition)positionToolbar(toolbarPosition.x,toolbarPosition.y);else fitGroupPopup();
 }
 listen(grip,'pointerdown',event=>{
  if(event.button!==0||toolbarDrag)return;
  const bounds=toolbarBounds(),r=toolbar.getBoundingClientRect();
  toolbarDrag={id:event.pointerId,x:event.clientX,y:event.clientY,left:r.left-bounds.left,top:r.top-bounds.top};
  grip.setPointerCapture(event.pointerId);event.preventDefault();
 });
 listen(grip,'pointermove',event=>{
  const g=toolbarDrag;if(!g||g.id!==event.pointerId)return;
  positionToolbar(g.left+event.clientX-g.x,g.top+event.clientY-g.y);
 });
 function endToolbarDrag(event){
  if(toolbarDrag?.id!==event.pointerId)return;toolbarDrag=null;
  if(grip.hasPointerCapture(event.pointerId))grip.releasePointerCapture(event.pointerId);
 }
 for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(grip,event,endToolbarDrag);
 listen(grip,'keydown',event=>{
  const delta={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]}[event.key];
  if(!delta)return;event.preventDefault();
  const r=toolbar.getBoundingClientRect(),bounds=toolbarBounds();
  positionToolbar(r.left-bounds.left+delta[0],r.top-bounds.top+delta[1]);
 });
 listen(collapse,'click',()=>{
  const collapsed=toolbar.dataset.hudToolbarCollapsed!=='true';
  toolbar.dataset.hudToolbarCollapsed=String(collapsed);
  collapse.setAttribute('aria-expanded',String(!collapsed));collapse.textContent=collapsed?'Développer':'Réduire';
  if(collapsed)$('[data-hud-author-group-editor]').open=false;
  keepToolbarReachable();
 });
 // The pointer overlay alone cannot stop keyboard activation of native
 // buttons or actor controls. Intercept activation only inside this mounted
 // combat root while authoring; never alter native geometry or gameplay.
 const blockNativeActivation=event=>{
  if(overlay.contains(event.target)||toolbar.contains(event.target))return;
  if(event.type==='keydown'&&event.key!=='Enter'&&event.key!==' ')return;
  event.preventDefault();event.stopPropagation();
 };
 listen(root,'click',blockNativeActivation,true);
 listen(root,'keydown',blockNativeActivation,true);
 // One transactional draft of the same layout: no second persisted store.
 let draft=readSavedLayout();const readLayout=()=>draft;
 const profile=()=>hudOwner.profile();
 const actual=key=>readLayout().profiles[profile()]?.[key]??defaultValue();
 const groups=()=>readLayout().groups?.[profile()]??[];
 const selectedGroup=()=>groups().find(group=>group.id===groupId);
 const selectedRoles=()=>selectedGroup()?.foldable?['command-dock']:(selectedGroup()?.roles??(role?[role]:[]));
 const visibleRegionGroup=()=>groups().find(group=>group.foldable&&hudOwner.currentPage()?.startsWith(group.id+':'));
 const regionGroup=()=>selectedGroup()?.foldable?selectedGroup():role==='command-dock'?visibleRegionGroup():null;
 const regionValue=()=>visibleRegionGroup()??actual('command-dock');
 function writeRegion(layout,key,value){
  // The displayed page owns its geometry, regardless of how it was selected.
  const group=visibleRegionGroup();
  return group?editCaptureHudGroupV1(layout,key,group.id,{...group,...value}):updateCaptureHudLayoutV1(layout,key,'command-dock',value);
 }

 const groupEditor=$('[data-hud-author-group-editor]'),groupSelect=$('[data-hud-author-group-select]');
 const pageSelect=$('[data-hud-author-page-select]');
 const groupName=$('[data-hud-author-group-name]'),groupFold=$('[data-hud-author-group-foldable]'),groupRoles=$('[data-hud-author-group-roles]');
 let pageSignature='',draftProfile=null,groupSignature='',paletteSignature='';
 const palette=$('[data-hud-author-palette]');
 function option(value,label){const o=doc.createElement('option');o.value=value;o.textContent=label;return o;}
 function refreshPages(){
  const options=hudOwner.pageOptions?.()??[],signature=JSON.stringify(options);
  if(signature!==pageSignature){pageSignature=signature;pageSelect.replaceChildren(...options.map(p=>option(p.id,p.label)));}
  pageSelect.hidden=!options.length;pageSelect.value=hudOwner.currentPage?.()??'';
 }
 function loadGroupDraft(){
  const group=groups().find(g=>g.id===groupSelect.value),taken=new Set(groups().filter(g=>g.id!==group?.id).flatMap(g=>g.roles));
  groupName.value=group?.label??('Volet '+(groups().length+1));groupFold.checked=group?.foldable??true;
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
  draftProfile=profile();groupSignature=JSON.stringify(groups());
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
  const keys=Object.keys(hudOwner.elements()).filter(captureHudRoleLabelV1),signature=keys.join('|');
  if(paletteSignature!==signature){paletteSignature=signature;palette.replaceChildren(option('','Choisir un élément'),...keys.map(key=>option(key,captureHudRoleLabelV1(key))));}
  palette.value=role??'';
  $('[data-hud-author-undo]').disabled=!history.length;
  $('[data-hud-author-reset]').disabled=!selectedRoles().length;
  $('[data-hud-author-group]').disabled=role==='command-dock';
  const grid=regionValue().grid??actual('command-dock').grid??{columns:5,slots:5};
  $('[data-hud-author-grid-count]').textContent=grid.slots+' cases · '+grid.columns+' colonnes';
  for(const key of ['local','opponent']){
   const button=$('[data-hud-author-portraits-'+key+']'),enabled=!!actual(key+'-reserves').portraits;
   button.setAttribute('aria-pressed',String(enabled));
   button.textContent=(enabled?'Masquer':'Afficher')+' portraits '+(key==='local'?'alliés':'adverses');
  }
  if(role==='local-reserves'||role==='opponent-reserves'){
   const node=hudOwner.elements()[role],count=node?.querySelectorAll('.hud-reserve-portrait:not([hidden])').length??0;
   reserveHelp.textContent=count
    ? count+' portrait'+(count>1?'s':'')+' disponible'+(count>1?'s':'')+' · Déplace le bloc de réserve dans l’arène.'
    : 'Aucun portrait de réserve disponible. Ajoute une créature en réserve aux équipes du test (avec une icône).';
  }else reserveHelp.textContent='Portraits : un emplacement par créature en réserve. + Case compétence ne crée pas de portrait.';
  keepToolbarReachable();
  const r=selectionBounds(),a=arena.getBoundingClientRect();
  const valid=!!r;
  outline.hidden=!valid;
  for(const handle of handles){
   const edge=handle.dataset.hudResizeEdge;
   handle.hidden=!valid;
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
  const valid=hudOwner.setDraft(candidate);draft=candidate;
  status.textContent=valid?'Brouillon modifié':hudOwner.lastError();
  toolbar.dataset.hudDraftInvalid=String(!valid);schedule();return true;
 }
 function accept(){
  if(!hudOwner.set(draft)){status.textContent=hudOwner.lastError()||'Disposition invalide';toolbar.dataset.hudDraftInvalid='true';schedule();return false;}
  writeLayout(draft);toolbar.dataset.hudDraftInvalid='false';status.textContent='Disposition appliquée au catalogue';return true;
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
  const nodes=hudOwner.elements();
  const members=selectedRoles().flatMap(key=>{
   const rect=nodes[key]?.getBoundingClientRect();return rect?.width&&rect.height?[{role:key,value:actual(key),rect:captureHudBoxFromRectsV1(rect,a)}]:[];
  });
  if(!members.length)return;
  gesture={id:event.pointerId,profile:profile(),members,x:event.clientX,y:event.clientY,
   before:readLayout(),width:a.width,height:a.height,changed:false,
   box:captureHudBoxFromRectsV1(r,a),edge:edge??'move',region:role==='command-dock'||!!regionGroup()};
  overlay.setPointerCapture(event.pointerId);event.preventDefault();
 });
 listen(overlay,'pointermove',event=>{
  const g=gesture;if(!g||event.pointerId!==g.id||g.profile!==profile())return;
  const args={...g,deltaX:event.clientX-g.x,deltaY:event.clientY-g.y};
  if(g.region){
   const box=captureHudBoxGestureV1(args);
   if(JSON.stringify(box)===JSON.stringify(regionValue().box??g.box))return;
   const grid=regionValue().grid;
   if(apply(writeRegion(readLayout(),g.profile,{box,...(grid?{grid}:{})})))g.changed=true;
   return;
  }
  const edits=captureHudGroupBoxesV1(args);
  if(edits.every(({role,value})=>JSON.stringify(value)===JSON.stringify(actual(role))))return;
  const candidate=edits.reduce((layout,{role,value})=>updateCaptureHudLayoutV1(layout,g.profile,role,value),readLayout());
  if(apply(candidate))g.changed=true;
 });
 function end(event){if(!gesture||event.pointerId!==gesture.id)return;const g=gesture;gesture=null;
  if(g.changed)history.push(g.before);if(overlay.hasPointerCapture(g.id))overlay.releasePointerCapture(g.id);schedule();}
 listen(overlay,'pointerup',end);listen(overlay,'pointercancel',end);listen(overlay,'lostpointercapture',end);
 listen($('[data-hud-author-group]'),'click',()=>{groupId=null;role='command-dock';hudOwner.showPage('main:0');schedule();});
 listen(palette,'change',()=>{groupId=null;role=palette.value||null;schedule();});
 function togglePortraits(key){
  const before=readLayout(),value=actual(key),next={...value,portraits:!value.portraits};
  if(apply(updateCaptureHudLayoutV1(before,profile(),key,next))){history.push(before);groupId=null;role=key;schedule();}
 }
 for(const key of ['local','opponent'])listen($('[data-hud-author-portraits-'+key+']'),'click',()=>togglePortraits(key+'-reserves'));
 function changeGrid(field,delta){
  const before=readLayout(),node=hudOwner.elements()['command-dock'];
  if(!node)return;
  const value=regionValue(),grid={...(value.grid??actual('command-dock').grid??{columns:5,slots:5})};
  const old={...grid};grid[field]=clamp(grid[field]+delta,1,field==='columns'?12:48);
  if(grid[field]===old[field])return;
  const a=arena.getBoundingClientRect(),box=value.box??captureHudBoxFromRectsV1(node.getBoundingClientRect(),a);
  const nextRows=Math.ceil(grid.slots/grid.columns),oldRows=Math.ceil(old.slots/old.columns);
  // First keep the authored rectangle. If an added row needs more room,
  // attempt a bounded upward expansion with the bottom edge fixed.
  const candidates=[box];
  if(nextRows>oldRows){const extra=Math.ceil((nextRows-oldRows)*48/a.height*1000);const grow=Math.min(box.y,extra);if(grow>0)candidates.push({...box,y:box.y-grow,h:box.h+grow});}
  // Grow first when a new row is needed; the draft is deliberately allowed
  // to show a temporary overlap while its author moves other regions.
  const region=candidates.at(-1);if(apply(writeRegion(before,profile(),{box:region,grid}))){history.push(before);groupId=visibleRegionGroup()?.id??null;role=groupId?null:'command-dock';schedule();return;}
  status.textContent='Agrandis le volet avec ses poignées, puis ajoute la case ou la colonne.';
 }
 for(const [selector,field,delta] of [
  ['[data-hud-author-add-slot]','slots',1],['[data-hud-author-remove-slot]','slots',-1],
  ['[data-hud-author-add-column]','columns',1],['[data-hud-author-remove-column]','columns',-1]
 ])listen($(selector),'click',()=>changeGrid(field,delta));
 listen(pageSelect,'change',()=>{if(!hudOwner.showPage(pageSelect.value))status.textContent='Volet indisponible dans cette disposition';else{const group=groups().find(g=>pageSelect.value.startsWith(g.id+':'));groupId=group?.id??null;role=group?null:'command-dock';}schedule();});
 // A queued details toggle must not wipe a form already being edited.
 listen(groupEditor,'toggle',()=>{if(groupEditor.open&&(draftProfile!==profile()||groupSignature!==JSON.stringify(groups())))refreshGroups();});
 listen(groupSelect,'change',loadGroupDraft);
 listen($('[data-hud-author-group-save]'),'click',()=>{
  try{
   const before=readLayout(),id=groupSelect.value||null;
   const existing=groups().find(g=>g.id===id);
   const value={label:groupName.value,foldable:groupFold.checked,roles:[...groupRoles.querySelectorAll('input:checked')].map(el=>el.value),
    ...(groupFold.checked&&existing?.box?{box:existing.box,...(existing.grid?{grid:existing.grid}:{})}:{})};
   const candidate=editCaptureHudGroupV1(before,profile(),id,value);
   const nextId=id??candidate.groups[profile()].at(-1).id;
   if(apply(candidate)){history.push(before);refreshGroups(nextId);if(toolbar.dataset.hudDraftInvalid!=='true')status.textContent='Groupe enregistré dans la disposition';}
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
  const group=regionGroup();
  const candidate=group?editCaptureHudGroupV1(before,profile(),group.id,{label:group.label,roles:group.roles,foldable:true}):roles.reduce((layout,key)=>updateCaptureHudLayoutV1(layout,profile(),key,null),before);
  if(apply(candidate))history.push(before);schedule();
 });
 function dispose(){if(disposed)return;disposed=true;if(frame)win.cancelAnimationFrame(frame);
  if(toolbarDrag&&grip.hasPointerCapture(toolbarDrag.id))grip.releasePointerCapture(toolbarDrag.id);
  for(const f of cleanups.splice(0))f();observer?.disconnect();overlay.remove();delete arena.dataset.hudAuthoring;delete toolbar.dataset.hudDraftInvalid;
  delete toolbar.dataset.hudToolbarCollapsed;delete toolbar.dataset.hudToolbarPopupAbove;
  collapse.setAttribute('aria-expanded','true');collapse.textContent='Réduire';
  for(const [key,value,priority] of toolbarOriginal){if(value)toolbar.style.setProperty(key,value,priority);else toolbar.style.removeProperty(key);}
  toolbar.hidden=true;
 }
 listen($('[data-hud-author-apply]'),'click',accept);
 listen($('[data-hud-author-test]'),'click',()=>{if(accept()){dispose();startTest();}});
 refreshGroups();
 const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(schedule):null;observer?.observe(arena);
 listen(win,'resize',schedule);schedule();
 return Object.freeze({dispose});
}
