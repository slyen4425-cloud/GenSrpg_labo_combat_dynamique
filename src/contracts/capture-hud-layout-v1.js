// Optional authored presentation data only. No skill, fighter or runtime rule.
export const CAPTURE_HUD_LAYOUT_SCHEMA_V1='capture-hud-layout-v1';
export const CAPTURE_HUD_PROFILES_V1=Object.freeze(['desktop-1v1','desktop-2v2','touch-1v1','touch-2v2']);
export const CAPTURE_HUD_ROLES_V1=Object.freeze({
 'local-status':'PV et statut du joueur',
 'opponent-status':'PV et statut adverses',
 'opponent-secondary-status':'PV du deuxième adversaire',
 'opponent-reserves':'Réserves adverses',
 'opponent-skills':'Capacités adverses',
 'command-dock':'Capacités, énergie et rappel',
 'dodge':'Esquive / défense'
});
const plain=(v)=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,keys,label)=>{
 if(!plain(v)||Object.keys(v).some(k=>!keys.includes(k)))throw new TypeError(label+' invalide');
};
function integer(v,min,max,label){
 if(!Number.isSafeInteger(v)||v<min||v>max)throw new RangeError(label+' hors limites');
 return v;
}
export function normalizeCaptureHudLayoutV1(raw){
 if(raw===undefined||raw===null)raw={schema:CAPTURE_HUD_LAYOUT_SCHEMA_V1,profiles:{}};
 exact(raw,['schema','profiles'],'Disposition HUD');
 if(raw.schema!==CAPTURE_HUD_LAYOUT_SCHEMA_V1)throw new RangeError('Version disposition HUD inconnue');
 exact(raw.profiles,CAPTURE_HUD_PROFILES_V1,'Profils HUD');
 const profiles={};
 for(const [profile,roles] of Object.entries(raw.profiles)){
  exact(roles,Object.keys(CAPTURE_HUD_ROLES_V1),'Rôles HUD');
  const normalized={};
  for(const [role,value] of Object.entries(roles)){
   exact(value,['dx','dy','scale'],'Réglage HUD');
   const dx=integer(value.dx,-50,50,'Décalage horizontal');
   const dy=integer(value.dy,-50,50,'Décalage vertical');
   const scale=integer(value.scale,85,125,'Taille');
   if(dx!==0||dy!==0||scale!==100)normalized[role]=Object.freeze({dx,dy,scale});
  }
  if(Object.keys(normalized).length)profiles[profile]=Object.freeze(normalized);
 }
 return Object.freeze({schema:CAPTURE_HUD_LAYOUT_SCHEMA_V1,profiles:Object.freeze(profiles)});
}
export function updateCaptureHudLayoutV1(raw,profile,role,value){
 const layout=normalizeCaptureHudLayoutV1(raw);
 if(!CAPTURE_HUD_PROFILES_V1.includes(profile)||!Object.hasOwn(CAPTURE_HUD_ROLES_V1,role))
  throw new RangeError('Profil ou rôle HUD inconnu');
 const roles={...layout.profiles[profile]};
 if(value===null)delete roles[role];else roles[role]=value;
 return normalizeCaptureHudLayoutV1({...layout,profiles:{...layout.profiles,[profile]:roles}});
}
export function resetCaptureHudProfileV1(raw,profile){
 const layout=normalizeCaptureHudLayoutV1(raw);
 if(!CAPTURE_HUD_PROFILES_V1.includes(profile))throw new RangeError('Profil HUD inconnu');
 const profiles={...layout.profiles};delete profiles[profile];
 return normalizeCaptureHudLayoutV1({...layout,profiles});
}
const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
 Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
const outside=(r,w,h)=>Math.max(0,-r.left)+Math.max(0,-r.top)+Math.max(0,r.right-w)+Math.max(0,r.bottom-h);
// Compare actual baseline geometry to proposed geometry. Historical/default
// layouts are never rewritten; custom placement cannot worsen collisions.
export function validateCaptureHudGeometryV1({baseline,proposed,width,height,touch=false}){
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0)return 'Arène non visible';
 const roles=Object.keys(baseline);
 const center={left:width*.33,right:width*.67,top:height*.26,bottom:height*.65};
 for(const role of roles){
  const before=baseline[role],after=proposed[role];
  if(!after)return 'Contrôle masqué : '+role;
  if(outside(after,width,height)>outside(before,width,height)+1)return 'Hors arène : '+role;
  if(overlap(after,center)>overlap(before,center)+4)return 'Zone centrale protégée : '+role;
  if(touch){
   const a=before.targets??[],b=after.targets??[];
   if(a.length!==b.length)return 'Commandes tactiles modifiées : '+role;
   for(let i=0;i<a.length;i++){
    if(b[i].width+1<Math.min(44,a[i].width)||b[i].height+1<Math.min(44,a[i].height))
     return 'Commande tactile trop petite : '+role;
   }
  }
 }
 for(let i=0;i<roles.length;i++)for(let j=i+1;j<roles.length;j++){
  const a=roles[i],b=roles[j];
  if(overlap(proposed[a],proposed[b])>overlap(baseline[a],baseline[b])+4)
   return 'Chevauchement : '+a+' / '+b;
 }
 return null;
}
