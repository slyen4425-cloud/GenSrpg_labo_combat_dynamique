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
 'ally-status':'PV de l’allié',
 'energy':'Énergie',
 'opponent-reserves':'Réserves adverses',
 'local-reserves':'Réserves alliées',
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
// Coordinates in thousandths of arena dimensions, independent of device pixels.
export const CAPTURE_HUD_BOX_UNITS_V1=1000;
export function normalizeCaptureHudBoxV1(raw){
 exact(raw,['x','y','w','h'],'Rectangle HUD');
 const x=integer(raw.x,0,999,'Position X'),y=integer(raw.y,0,999,'Position Y');
 const w=integer(raw.w,10,1000,'Largeur'),h=integer(raw.h,10,1000,'Hauteur');
 if(x+w>1000||y+h>1000)throw new RangeError('Région hors arène');
 return Object.freeze({x,y,w,h});
}
export function normalizeCaptureHudGridV1(raw){
 exact(raw,['columns','slots'],'Grille HUD');
 return Object.freeze({columns:integer(raw.columns,1,12,'Colonnes'),slots:integer(raw.slots,1,48,'Cases')});
}
export function captureHudBoxFromRectsV1(rect,arena){
 const unit=CAPTURE_HUD_BOX_UNITS_V1;
 const bound=(v,min,max)=>Math.max(min,Math.min(max,Math.round(v)));
 const w=bound(unit*rect.width/arena.width,10,unit),h=bound(unit*rect.height/arena.height,10,unit);
 return normalizeCaptureHudBoxV1({x:bound(unit*(rect.left-arena.left)/arena.width,0,unit-w),
  y:bound(unit*(rect.top-arena.top)/arena.height,0,unit-h),w,h});
}
export function captureHudBoxGestureV1({box,edge,deltaX,deltaY,width,height}){
 const {x,y,w,h}=normalizeCaptureHudBoxV1(box);
 if(!(width>0&&height>0))throw new RangeError('Arène non visible');
 const dx=Math.round(1000*deltaX/width),dy=Math.round(1000*deltaY/height);
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 if(edge==='move')return normalizeCaptureHudBoxV1({x:clamp(x+dx,0,1000-w),y:clamp(y+dy,0,1000-h),w,h});
 if(!['n','s','e','w','ne','nw','se','sw'].includes(edge))throw new RangeError('Poignée inconnue');
 const left=edge.includes('w')?clamp(x+dx,0,x+w-10):x;
 const top=edge.includes('n')?clamp(y+dy,0,y+h-10):y;
 const right=edge.includes('e')?clamp(x+w+dx,x+10,1000):x+w;
 const bottom=edge.includes('s')?clamp(y+h+dy,y+10,1000):y+h;
 return normalizeCaptureHudBoxV1({x:left,y:top,w:right-left,h:bottom-top});
}
// Map every member into the resized group rectangle, preserving relative
// geometry; the result still uses the same individual region records.
export function captureHudGroupBoxesV1({members,box,edge,deltaX,deltaY,width,height}){
 const next=captureHudBoxGestureV1({box,edge,deltaX,deltaY,width,height});
 return members.map(({role,value,rect})=>{
  const source=normalizeCaptureHudBoxV1(rect);
  const w=Math.max(10,Math.round(source.w*next.w/box.w)),h=Math.max(10,Math.round(source.h*next.h/box.h));
  const x=Math.max(0,Math.min(1000-w,Math.round(next.x+(source.x-box.x)*next.w/box.w)));
  const y=Math.max(0,Math.min(1000-h,Math.round(next.y+(source.y-box.y)*next.h/box.h)));
  return {role,value:{box:normalizeCaptureHudBoxV1({x,y,w,h}),...(value.grid?{grid:value.grid}:{}),...(value.portraits?{portraits:true}:{})}};
 });
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
   if(value?.box!==undefined){
    // A real region replaces the previous transform for this role. Never both.
    exact(value,['box','grid','portraits'],'Région HUD');
    if(value.grid!==undefined&&role!=='command-dock')throw new RangeError('Grille non prise en charge : '+role);
    if(value.portraits!==undefined&&(!['local-reserves','opponent-reserves'].includes(role)||typeof value.portraits!=='boolean'))throw new TypeError('Portraits de réserve invalides');
    normalized[role]=Object.freeze({box:normalizeCaptureHudBoxV1(value.box),...(value.grid?{grid:normalizeCaptureHudGridV1(value.grid)}:{}),...(value.portraits?{portraits:true}:{})});
    continue;
   }
   exact(value,['dx','dy','scale','portraits'],'Réglage HUD');
   if(value.portraits!==undefined&&(!['local-reserves','opponent-reserves'].includes(role)||typeof value.portraits!=='boolean'))throw new TypeError('Portraits de réserve invalides');
   const dx=integer(value.dx,-50,50,'Décalage horizontal');
   const dy=integer(value.dy,-50,50,'Décalage vertical');
   const scale=integer(value.scale,85,125,'Taille');
   if(dx!==0||dy!==0||scale!==100||value.portraits)normalized[role]=Object.freeze({dx,dy,scale,...(value.portraits?{portraits:true}:{})});
  }
  if(Object.keys(normalized).length)profiles[profile]=Object.freeze(normalized);
 }
 const groups={};
 exact(raw.groups??{},CAPTURE_HUD_PROFILES_V1,'Groupes HUD');
 for(const [profile,entries] of Object.entries(raw.groups??{})){
  if(!Array.isArray(entries)||entries.length>12)throw new RangeError('12 groupes maximum par profil');
  const ids=new Set(),members=new Set();
  const checked=entries.map(entry=>{
   exact(entry,['id','label','roles','foldable','box','grid'],'Groupe HUD');
   const {id,label,roles,foldable}=entry;
   if(typeof id!=='string'||!/^hud-group-[1-9][0-9]{0,2}$/.test(id)||ids.has(id))throw new RangeError('Identifiant de groupe invalide ou dupliqué');
   ids.add(id);
   if(typeof label!=='string'||!label.trim()||label.trim().length>40)throw new RangeError('Nom du groupe : 1 à 40 caractères');
   if(typeof foldable!=='boolean'||!Array.isArray(roles)||(!foldable&&!roles.length)||roles.length>100)throw new TypeError('Composition du groupe invalide');
   if(roles.includes('command-dock')&&roles.some(isCaptureHudSkillRoleV1))throw new RangeError('Le bloc de commandes contient déjà ses compétences');
   for(const role of roles){
    if(!captureHudRoleLabelV1(role)||members.has(role)||foldable&&!isCaptureHudSkillRoleV1(role))throw new RangeError('Élément invalide, déjà groupé ou non repliable : '+role);
    members.add(role);
   }
   if(!foldable&&(entry.box||entry.grid))throw new RangeError('Seul un volet possède sa région');
   if(entry.grid&&!entry.box)throw new RangeError('Une grille de volet nécessite un rectangle');
   return Object.freeze({id,label:label.trim(),roles:Object.freeze([...roles]),foldable,
    ...(entry.box?{box:normalizeCaptureHudBoxV1(entry.box)}:{}),
    ...(entry.grid?{grid:normalizeCaptureHudGridV1(entry.grid)}:{})});
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
export function captureHudSkillPagesV1(roles,groups=[],grid=null){
 const folded=groups.filter(group=>group.foldable&&(group.roles.length===0||group.grid||group.roles.some(role=>roles.includes(role))));
 const capacity=grid?normalizeCaptureHudGridV1(grid).slots:3;
 if(!folded.length&&roles.length<=(grid?capacity:5))return [];
 const assigned=new Set(folded.flatMap(group=>group.roles));
 const buckets=[{id:'main',label:'Principal',roles:roles.filter(role=>!assigned.has(role))},
  ...folded.map(group=>({id:group.id,label:group.label,roles:roles.filter(role=>group.roles.includes(role)),capacity:group.grid?.slots}))];
 return buckets.flatMap(bucket=>{
  const pageCapacity=bucket.capacity??capacity;
  const count=Math.max(1,Math.ceil(bucket.roles.length/pageCapacity));
  return Array.from({length:count},(_,index)=>({
   id:bucket.id+':'+index,groupId:bucket.id,
   label:bucket.label+(count>1?' '+(index+1)+'/'+count:''),
   roles:bucket.roles.slice(index*pageCapacity,index*pageCapacity+pageCapacity)
  }));
 });
}
// The visible page has exactly one resolved dock region. A named page can
// inherit the default or replace it, never apply two transforms/boxes.
export function captureHudPageRegionV1(layout,profile,pageId){
 const dock=layout.profiles[profile]?.['command-dock']??{};
 const group=layout.groups?.[profile]?.find(g=>g.foldable&&pageId?.startsWith(g.id+':'));
 return group?.box?{box:group.box,...(group.grid??dock.grid?{grid:group.grid??dock.grid}:{})}:dock;
}
const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
 Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
const outside=(r,w,h)=>Math.max(0,-r.left)+Math.max(0,-r.top)+Math.max(0,r.right-w)+Math.max(0,r.bottom-h);
// Compare actual baseline geometry to proposed geometry. Historical/default
// layouts are never rewritten; custom placement cannot worsen collisions.
export function validateCaptureHudGeometryV1({baseline,proposed,width,height,touch=false,authoredRegions=[]}){
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0)return 'Arène non visible';
 const roles=Object.keys(baseline);
 const center={left:width*.33,right:width*.67,top:height*.26,bottom:height*.65};
 for(const role of roles){
  const before=baseline[role],after=proposed[role];
  if(!after)return 'Contrôle masqué : '+role;
  if(outside(after,width,height)>outside(before,width,height)+1)return 'Hors arène : '+role;
  // An explicitly sized region is allowed to occupy part of the arena; its
  // actual controls still must remain reachable and cannot cover other controls.
  if(!authoredRegions.includes(role)&&!authoredRegions.includes(after.parentRole)&&overlap(after,center)>overlap(before,center)+4)return 'Zone centrale protégée : '+role;
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
