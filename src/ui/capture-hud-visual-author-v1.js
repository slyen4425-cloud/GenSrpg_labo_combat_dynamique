import {CAPTURE_HUD_ROLES_V1,updateCaptureHudLayoutV1} from '../contracts/capture-hud-layout-v1.js';
const names={'desktop-1v1':'PC · 1v1','desktop-2v2':'PC · 2v2','touch-1v1':'Mobile · 1v1','touch-2v2':'Mobile · 2v2'};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Math.round(n)));
const defaultValue=()=>({dx:0,dy:0,scale:100});
export function captureHudPointerValueV1({value,mode,deltaX,deltaY,width,height,elementWidth,parentScale=1}){
 if(mode==='resize')return {...value,scale:clamp(value.scale*(1+deltaX/Math.max(1,elementWidth)),85,125)};
 return {...value,dx:clamp(value.dx+100*deltaX/(width*parentScale),-50,50),
  dy:clamp(value.dy+100*deltaY/(height*parentScale),-50,50)};
}
export function mountCaptureHudVisualAuthorV1({root,toolbar,hudOwner,readLayout,writeLayout,startTest}){
 const arena=root.querySelector('[data-combat-arena]'),doc=root.ownerDocument,win=doc.defaultView;
 if(!arena||!toolbar||!hudOwner)throw new Error('Édition HUD native indisponible');
 const $=s=>toolbar.querySelector(s),status=$('[data-hud-author-status]');
 const overlay=doc.createElement('div');overlay.dataset.hudAuthorOverlay='true';
 const outline=doc.createElement('div');outline.className='hud-author-outline';outline.hidden=true;
 const handle=doc.createElement('div');handle.className='hud-author-handle';handle.hidden=true;
 overlay.append(outline,handle);arena.append(overlay);toolbar.hidden=false;
 let role=null,gesture=null,disposed=false,frame=0,history=[],cleanups=[];
 const listen=(el,event,fn)=>{el.addEventListener(event,fn);cleanups.push(()=>el.removeEventListener(event,fn));};
 const profile=()=>hudOwner.profile();
 const actual=()=>readLayout().profiles[profile()]?.[role]??defaultValue();
 function draw(){
  frame=0;if(disposed)return;
  $('[data-hud-author-profile]').textContent=names[profile()];
  $('[data-hud-author-selection]').textContent=CAPTURE_HUD_ROLES_V1[role]??'Touche un élément';
  $('[data-hud-author-undo]').disabled=!history.length;
  $('[data-hud-author-reset]').disabled=!role;
  $('[data-hud-author-group]').disabled=!role?.startsWith('skill-');
  const node=hudOwner.elements()[role],r=node?.getBoundingClientRect(),a=arena.getBoundingClientRect();
  const valid=r&&r.width>0&&r.height>0&&!node.hidden;
  outline.hidden=handle.hidden=!valid;
  if(valid){Object.assign(outline.style,{left:r.left-a.left+'px',top:r.top-a.top+'px',width:r.width+'px',height:r.height+'px'});
   Object.assign(handle.style,{left:r.right-a.left+'px',top:r.bottom-a.top+'px'});}
 }
 function schedule(){if(!disposed&&!frame)frame=win.requestAnimationFrame(draw);}
 function choose(x,y){
  return Object.entries(hudOwner.elements()).filter(([key,node])=>{
   const r=node.getBoundingClientRect();return Object.hasOwn(CAPTURE_HUD_ROLES_V1,key)&&!node.hidden&&r.width>0&&r.height>0&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
  }).sort(([a,an],[b,bn])=>{
   const ar=an.getBoundingClientRect(),br=bn.getBoundingClientRect();
   return ar.width*ar.height-br.width*br.height;
  })[0]?.[0]??null;
 }
 function apply(candidate){
  if(!hudOwner.set(candidate)){status.textContent='Placement refusé : zone protégée, chevauchement ou commande trop petite.';schedule();return false;}
  writeLayout(candidate);status.textContent='Disposition modifiée';schedule();return true;
 }
 listen(overlay,'pointerdown',event=>{
  if(event.button!==0||gesture)return;
  const resize=event.target===handle;
  if(!resize){
   const picked=choose(event.clientX,event.clientY);
   const selected=hudOwner.elements()[role]?.getBoundingClientRect();
   // After explicitly selecting the dock, dragging anywhere inside it
   // moves the whole group. Clicking outside selects a new element.
   if(!(role==='command-dock'&&selected&&event.clientX>=selected.left&&event.clientX<=selected.right&&event.clientY>=selected.top&&event.clientY<=selected.bottom))role=picked;
  }
  draw();if(!role)return;
  const node=hudOwner.elements()[role],a=arena.getBoundingClientRect(),r=node.getBoundingClientRect();
  const parentScale=role.startsWith('skill-')?(readLayout().profiles[profile()]?.['command-dock']?.scale??100)/100:1;
  gesture={id:event.pointerId,profile:profile(),role,mode:resize?'resize':'move',x:event.clientX,y:event.clientY,
   value:actual(),before:readLayout(),width:a.width,height:a.height,elementWidth:r.width,parentScale,changed:false};
  overlay.setPointerCapture(event.pointerId);event.preventDefault();
 });
 listen(overlay,'pointermove',event=>{
  const g=gesture;if(!g||event.pointerId!==g.id||g.profile!==profile())return;
  const value=captureHudPointerValueV1({...g,deltaX:event.clientX-g.x,deltaY:event.clientY-g.y});
  const old=actual();if(value.dx===old.dx&&value.dy===old.dy&&value.scale===old.scale)return;
  if(apply(updateCaptureHudLayoutV1(readLayout(),g.profile,g.role,value)))g.changed=true;
 });
 function end(event){if(!gesture||event.pointerId!==gesture.id)return;const g=gesture;gesture=null;
  if(g.changed)history.push(g.before);if(overlay.hasPointerCapture(g.id))overlay.releasePointerCapture(g.id);schedule();}
 listen(overlay,'pointerup',end);listen(overlay,'pointercancel',end);listen(overlay,'lostpointercapture',end);
 listen($('[data-hud-author-group]'),'click',()=>{role='command-dock';schedule();});
 listen($('[data-hud-author-undo]'),'click',()=>{if(history.length&&apply(history.at(-1)))history.pop();schedule();});
 listen($('[data-hud-author-reset]'),'click',()=>{if(!role)return;const before=readLayout();if(apply(updateCaptureHudLayoutV1(before,profile(),role,null)))history.push(before);schedule();});
 function dispose(){if(disposed)return;disposed=true;if(frame)win.cancelAnimationFrame(frame);for(const f of cleanups.splice(0))f();observer?.disconnect();overlay.remove();toolbar.hidden=true;}
 listen($('[data-hud-author-test]'),'click',()=>{dispose();startTest();});
 const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(schedule):null;observer?.observe(arena);
 listen(win,'resize',schedule);schedule();
 return Object.freeze({dispose});
}
