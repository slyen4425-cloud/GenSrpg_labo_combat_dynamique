import {CAPTURE_STANDARD_SKILL_SLOT_IDS,CAPTURE_ULTIMATE_SKILL_SLOT_ID} from './capture-active-skill-loadout-v1.js';
export const CAPTURE_HUD_SKILL_ROLES_V1=Object.freeze(Object.fromEntries(
 [...CAPTURE_STANDARD_SKILL_SLOT_IDS,CAPTURE_ULTIMATE_SKILL_SLOT_ID].map((id,i)=>[
  'skill-'+id,id===CAPTURE_ULTIMATE_SKILL_SLOT_ID?'Compétence ultime':'Compétence '+(i+1)
 ])));
export function captureHudSkillRoleV1(slots,skillId){
 const slot=Array.isArray(slots)?slots.find(s=>s?.skillId===skillId):null;
 const role=slot?'skill-'+slot.id:null;
 return isCaptureHudSkillRoleV1(role)?role:null;
}
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
 'dodge':'Esquive / défense',
 ...CAPTURE_HUD_SKILL_ROLES_V1
});
// Accept future *real* canonical numbered slots without minting skills or changing progression.
export function isCaptureHudSkillRoleV1(role){
 return typeof role==='string'&&(role==='skill-slot-ultimate'||/^skill-slot-[1-9][0-9]{0,2}$/.test(role));
}
export function captureHudRoleLabelV1(role){
 return Object.hasOwn(CAPTURE_HUD_ROLES_V1,role)?CAPTURE_HUD_ROLES_V1[role]:
  isCaptureHudSkillRoleV1(role)?'Compétence '+role.slice('skill-slot-'.length):null;
}
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
 exact(raw,['schema','profiles','groups'],'Disposition HUD');
 if(raw.schema!==CAPTURE_HUD_LAYOUT_SCHEMA_V1)throw new RangeError('Version disposition HUD inconnue');
 exact(raw.profiles,CAPTURE_HUD_PROFILES_V1,'Profils HUD');
 const profiles={};
 for(const [profile,roles] of Object.entries(raw.profiles)){
  if(!plain(roles)||Object.keys(roles).some(role=>!captureHudRoleLabelV1(role)))throw new TypeError('Rôles HUD invalides');
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
 const groups={};
 exact(raw.groups??{},CAPTURE_HUD_PROFILES_V1,'Groupes HUD');
 for(const [profile,entries] of Object.entries(raw.groups??{})){
  if(!Array.isArray(entries)||entries.length>12)throw new RangeError('12 groupes maximum par profil');
  const ids=new Set(),members=new Set();
  const checked=entries.map(entry=>{
   exact(entry,['id','label','roles','foldable'],'Groupe HUD');
   const {id,label,roles,foldable}=entry;
   if(typeof id!=='string'||!/^hud-group-[1-9][0-9]{0,2}$/.test(id)||ids.has(id))throw new RangeError('Identifiant de groupe invalide ou dupliqué');
   ids.add(id);
   if(typeof label!=='string'||!label.trim()||label.trim().length>40)throw new RangeError('Nom du groupe : 1 à 40 caractères');
   if(typeof foldable!=='boolean'||!Array.isArray(roles)||!roles.length||roles.length>100)throw new TypeError('Composition du groupe invalide');
   if(roles.includes('command-dock')&&roles.some(isCaptureHudSkillRoleV1))throw new RangeError('Le bloc de commandes contient déjà ses compétences');
   for(const role of roles){
    if(!captureHudRoleLabelV1(role)||members.has(role)||foldable&&!isCaptureHudSkillRoleV1(role))throw new RangeError('Élément invalide, déjà groupé ou non repliable : '+role);
    members.add(role);
   }
   return Object.freeze({id,label:label.trim(),roles:Object.freeze([...roles]),foldable});
  });
  if(checked.length)groups[profile]=Object.freeze(checked);
 }
 return Object.freeze({schema:CAPTURE_HUD_LAYOUT_SCHEMA_V1,profiles:Object.freeze(profiles),
  ...(Object.keys(groups).length?{groups:Object.freeze(groups)}:{})});
}
export function updateCaptureHudLayoutV1(raw,profile,role,value){
 const layout=normalizeCaptureHudLayoutV1(raw);
 if(!CAPTURE_HUD_PROFILES_V1.includes(profile)||!captureHudRoleLabelV1(role))
  throw new RangeError('Profil ou rôle HUD inconnu');
 const roles={...layout.profiles[profile]};
 if(value===null)delete roles[role];else roles[role]=value;
 return normalizeCaptureHudLayoutV1({...layout,profiles:{...layout.profiles,[profile]:roles}});
}
export function resetCaptureHudProfileV1(raw,profile){
 const layout=normalizeCaptureHudLayoutV1(raw);
 if(!CAPTURE_HUD_PROFILES_V1.includes(profile))throw new RangeError('Profil HUD inconnu');
 const profiles={...layout.profiles};delete profiles[profile];
 const groups={...layout.groups};delete groups[profile];
 return normalizeCaptureHudLayoutV1({...layout,profiles,groups});
}
// One layout transaction; no extra storage or manual ID input.
export function editCaptureHudGroupV1(raw,profile,id,value){
 const layout=normalizeCaptureHudLayoutV1(raw);
 if(!CAPTURE_HUD_PROFILES_V1.includes(profile))throw new RangeError('Profil HUD inconnu');
 const entries=[...(layout.groups?.[profile]??[])];
 if(id===null){
  if(value===null)throw new RangeError('Groupe inconnu');
  let index=1;while(entries.some(group=>group.id==='hud-group-'+index))index++;
  entries.push({...value,id:'hud-group-'+index});
 }else{
  const index=entries.findIndex(group=>group.id===id);
  if(index<0)throw new RangeError('Groupe inconnu');
  if(value===null)entries.splice(index,1);else entries[index]={...value,id};
 }
 return normalizeCaptureHudLayoutV1({...layout,groups:{...layout.groups,[profile]:entries}});
}
// A viewport page is only a presentation of *supplied* native controls.
// With no configured panel and at most five controls, preserve the historic row.
// A selector occupies two columns, leaving three touch-sized skill cells.
export function captureHudSkillPagesV1(roles,groups=[]){
 const folded=groups.filter(group=>group.foldable&&group.roles.some(role=>roles.includes(role)));
 if(!folded.length&&roles.length<=5)return [];
 const assigned=new Set(folded.flatMap(group=>group.roles));
 const buckets=[{id:'main',label:'Principal',roles:roles.filter(role=>!assigned.has(role))},
  ...folded.map(group=>({id:group.id,label:group.label,roles:roles.filter(role=>group.roles.includes(role))}))];
 return buckets.flatMap(bucket=>{
  const count=Math.max(1,Math.ceil(bucket.roles.length/3));
  return Array.from({length:count},(_,index)=>({
   id:bucket.id+':'+index,groupId:bucket.id,
   label:bucket.label+(count>1?' '+(index+1)+'/'+count:''),
   roles:bucket.roles.slice(index*3,index*3+3)
  }));
 });
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
  const a=before.targets??[],b=after.targets??[];
  if(a.length!==b.length)return 'Commandes masquées : '+role;
  for(let i=0;i<a.length;i++){
   if(a[i].hit===true&&b[i].hit===false)return 'Commande recouverte : '+role;
   if(touch&&(b[i].width+1<Math.min(44,a[i].width)||b[i].height+1<Math.min(44,a[i].height)))
    return 'Commande tactile trop petite : '+role;
  }
 }
 for(let i=0;i<roles.length;i++)for(let j=i+1;j<roles.length;j++){
  const a=roles[i],b=roles[j];
  // The dock intentionally contains its own slots; compare sibling buttons.
  if(baseline[a].parentRole===b||baseline[b].parentRole===a)continue;
  if(overlap(proposed[a],proposed[b])>overlap(baseline[a],baseline[b])+4)
   return 'Chevauchement : '+a+' / '+b;
 }
 return null;
}
