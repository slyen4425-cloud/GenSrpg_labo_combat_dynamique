import {CAPTURE_HUD_PROFILES_V1,CAPTURE_HUD_ROLES_V1,captureHudRoleLabelV1,normalizeCaptureHudLayoutV1,
 updateCaptureHudLayoutV1,resetCaptureHudProfileV1} from '../contracts/capture-hud-layout-v1.js';
const titles={'desktop-1v1':'PC — 1 contre 1','desktop-2v2':'PC — 2 contre 2',
 'touch-1v1':'Mobile paysage — 1 contre 1','touch-2v2':'Mobile paysage — 2 contre 2'};
export function mountCaptureHudLayoutEditorV1({host,initialLayout,onChange,listen}){
 if(!host)return null;
 const $=selector=>host.querySelector(selector),doc=host.ownerDocument;
 const profile=$('[data-hud-layout-profile]'),role=$('[data-hud-layout-role]');
 const dx=$('[data-hud-layout-x]'),dy=$('[data-hud-layout-y]'),scale=$('[data-hud-layout-scale]');
 const status=$('[data-hud-layout-status]');
 let layout=normalizeCaptureHudLayoutV1(initialLayout);
 for(const key of CAPTURE_HUD_PROFILES_V1){const o=doc.createElement('option');o.value=key;o.textContent=titles[key];profile.append(o);}
 function refreshRoles(){
  const previous=role.value,keys=[...new Set([...Object.keys(CAPTURE_HUD_ROLES_V1),...Object.keys(layout.profiles[profile.value]??{}),...(layout.groups?.[profile.value]??[]).flatMap(g=>g.roles)])];
  role.replaceChildren(...keys.map(key=>{const o=doc.createElement('option');o.value=key;o.textContent=captureHudRoleLabelV1(key);return o;}));
  if(keys.includes(previous))role.value=previous;
 }
 refreshRoles();
 function refresh(){
  const value=layout.profiles[profile.value]?.[role.value]??{dx:0,dy:0,scale:100};
  dx.value=String(value.dx);dy.value=String(value.dy);scale.value=String(value.scale);
  status.textContent='Décalage '+value.dx+' % / '+value.dy+' % · Taille '+value.scale+' %.';
 }
 function commit(value){
  layout=value;refreshRoles();refresh();onChange?.(layout);
 }
 function edit(){
  try{commit(updateCaptureHudLayoutV1(layout,profile.value,role.value,{
   dx:Number(dx.value),dy:Number(dy.value),scale:Number(scale.value)
  }));}catch(error){status.textContent=error.message;}
 }
 listen(profile,'change',()=>{refreshRoles();refresh();});listen(role,'change',refresh);
 for(const element of [dx,dy,scale])listen(element,'change',edit);
 listen($('[data-hud-layout-reset-role]'),'click',()=>commit(updateCaptureHudLayoutV1(layout,profile.value,role.value,null)));
 listen($('[data-hud-layout-reset-profile]'),'click',()=>commit(resetCaptureHudProfileV1(layout,profile.value)));
 refresh();
 return Object.freeze({set(value){layout=normalizeCaptureHudLayoutV1(value);refreshRoles();refresh();}});
}
