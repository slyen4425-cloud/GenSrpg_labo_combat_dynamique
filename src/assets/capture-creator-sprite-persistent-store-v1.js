// Persistent player-owned Capture sprite bytes. ONLY local authority for
// personal media. No Blob URLs or session data are serialized; the existing
// CreatorVisualAssetSession is the sole runtime AssetDefinition owner.
// Scope is the selected universe or an explicit local editor preview.
//
// Durable transaction: commit before success. No implicit overwrite, delete,
// migration of legacy assets, cross-origin access or network publication.
const DB_NAME='gensrpg-capture-player-sprites-v1';
const STORE_NAME='assets';
const DB_VERSION=1;
const VALID_ROLES=new Set(['creature','icon','cast','travel','impact','zone','status','dodge','movement','attack']);
const VALID_MIMES=new Set(['image/png','image/webp','image/jpeg']);
export const MAX_CREATOR_SPRITE_BYTES_V1=24*1024*1024;
export const CAPTURE_CREATOR_SPRITE_STORE_NAME_V1=DB_NAME;

function scopeText(value){
 const s=String(value??'');
 if(!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/.test(s))
  throw new TypeError('Identifiant d’univers requis pour sauvegarder le sprite.');
 return s;
}
function assetText(value){
 const s=String(value??'');
 if(!/^user:[a-zA-Z0-9][a-zA-Z0-9._:-]{0,125}$/.test(s))
  throw new TypeError('Le sprite doit utiliser son identifiant personnel user: généré.');
 return s;
}
const keyFor=(scopeId,assetId)=>scopeText(scopeId)+'\u001f'+assetText(assetId);
function hex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
function assertImageSignature(array,mime){
 const b=new Uint8Array(array,0,Math.min(array.byteLength,16));
 const png=b.length>=8&&b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&
   b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10;
 const webp=b.length>=12&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&
   String.fromCharCode(...b.slice(8,12))==='WEBP';
 const jpeg=b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255;
 if(!({ 'image/png':png,'image/webp':webp,'image/jpeg':jpeg }[mime]))
  throw new Error('Fichier image illisible ou signature de format incompatible.');
}
export function validateCaptureCreatorSpriteMetadataV1({
 scopeId,assetId,label,role,mime,frameCount=1,frameMs=100,bytes
}={}){
 scopeText(scopeId);assetText(assetId);
 if(!VALID_ROLES.has(role))throw new TypeError('Rôle de sprite inconnu.');
 if(!VALID_MIMES.has(mime))throw new TypeError('Format de sprite interdit.');
 if(typeof label!=='string'||!label.trim()||label.length>150)
  throw new TypeError('Nom de sprite invalide.');
 if(!Number.isSafeInteger(bytes)||bytes<1||bytes>MAX_CREATOR_SPRITE_BYTES_V1)
  throw new RangeError('Sprite supérieur à la limite de 24 Mio ou vide.');
 if(!Number.isInteger(frameCount)||frameCount<1||frameCount>32)
  throw new RangeError('1 à 32 frames par sprite.');
 if(!Number.isInteger(frameMs)||frameMs<30||frameMs>1000)
  throw new RangeError('Durée de frame : 30 à 1000 ms.');
 if((role==='creature'||role==='icon')&&frameCount!==1)
  throw new Error('Une image de modèle/icône reste fixe.');
 return Object.freeze({scopeId,assetId,label:label.trim(),role,mime,frameCount,frameMs,bytes});
}
async function inspectFile(file,mime,cryptoProvider){
 if(!(file instanceof Blob))throw new TypeError('Blob image requis.');
 const array=await file.arrayBuffer();
 assertImageSignature(array,mime);
 if(!cryptoProvider?.subtle?.digest)throw new Error('SHA-256 navigateur indisponible : sauvegarde annulée.');
 const digest=new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',array));
 return hex(digest);
}
export function createCaptureCreatorSpriteStoreV1({
 indexedDBFactory=globalThis.indexedDB,
 cryptoProvider=globalThis.crypto
}={}){
 if(!indexedDBFactory?.open)throw new Error('IndexedDB requis pour sauvegarder les sprites.');
 let active=null;
 async function open(){
  if(active)return active;
  active=new Promise((resolve,reject)=>{
   const req=indexedDBFactory.open(DB_NAME,DB_VERSION);
   req.onupgradeneeded=()=>{
    const db=req.result;
    if(!db.objectStoreNames.contains(STORE_NAME)){
     const table=db.createObjectStore(STORE_NAME,{keyPath:'key'});
     table.createIndex('byScope','scopeId',{unique:false});
    }
   };
   req.onsuccess=()=>{
    const db=req.result;
    db.onversionchange=()=>{db.close();active=null;};
    resolve(db);
   };
   req.onerror=()=>{active=null;reject(req.error??new Error('Base de sprites inaccessible.'))};
   req.onblocked=()=>{active=null;reject(new Error('Autre onglet : fermer les anciens éditeurs pour ouvrir les sprites.'))};
  });
  return active;
 }
 async function readOne(key){
  const db=await open();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE_NAME,'readonly');
   let value;
   const req=tx.objectStore(STORE_NAME).get(key);
   req.onsuccess=()=>{value=req.result??null;};
   tx.oncomplete=()=>resolve(value);
   tx.onerror=()=>reject(tx.error??new Error('Lecture du sprite impossible.'));
   tx.onabort=()=>reject(tx.error??new Error('Lecture du sprite annulée.'));
  });
 }
 async function verified(row){
  if(!row)return null;
  const m=validateCaptureCreatorSpriteMetadataV1(row);
  if(row.key!==keyFor(m.scopeId,m.assetId)||!(row.blob instanceof Blob)||
     row.blob.size!==m.bytes||row.blob.type!==m.mime)
   throw Error('Sauvegarde de sprite incohérente, fichier original conservé.');
  const hash=await inspectFile(row.blob,m.mime,cryptoProvider);
  if(!/^[a-f0-9]{64}$/.test(row.sha256)||hash!==row.sha256)
   throw Error('Vérification SHA-256 du sprite échouée : ne pas remplacer le fichier.');
  return Object.freeze({...m,id:m.assetId,blob:row.blob,sha256:row.sha256,
   originalName:row.originalName??'',savedAt:row.savedAt});
 }
 async function put({scopeId,assetId,label,role,file,frameCount=1,frameMs=100}={}){
  const mime=file?.type,bytes=file?.size;
  const meta=validateCaptureCreatorSpriteMetadataV1({
   scopeId,assetId,label,role,mime,frameCount,frameMs,bytes
  });
  const hash=await inspectFile(file,mime,cryptoProvider);
  const key=keyFor(scopeId,assetId);
  const row={...meta,key,sha256:hash,blob:file,
   originalName:String(file.name??'').slice(0,180),
   savedAt:new Date().toISOString()};
  const db=await open();
  const stored=await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE_NAME,'readwrite');
   const store=tx.objectStore(STORE_NAME);
   let output=row,failure=null;
   const req=store.get(key);
   req.onsuccess=()=>{
    if(req.result){
     if(req.result.sha256!==hash||req.result.role!==role||
        req.result.frameCount!==frameCount||req.result.frameMs!==frameMs){
       failure=new Error('Identifiant de sprite déjà sauvegardé avec un contenu différent. Nouvelle importation requise.');
       tx.abort();
     }else{output=req.result;}
    }else{store.add(row);}
   };
   req.onerror=()=>{failure=req.error;};
   tx.oncomplete=()=>resolve(output);
   tx.onerror=()=>reject(failure??tx.error??new Error('Sauvegarde du sprite impossible.'));
   tx.onabort=()=>reject(failure??tx.error??new Error('Sauvegarde annulée : espace insuffisant ou conflit.'));
  });
  return Object.freeze({
   scopeId:stored.scopeId,id:stored.assetId,sha256:stored.sha256,
   bytes:stored.bytes,savedAt:stored.savedAt
  });
 }
 async function get(scopeId,assetId){
  return verified(await readOne(keyFor(scopeId,assetId)));
 }
 async function list(scopeId){
  const valid=scopeText(scopeId);
  const db=await open();
  const rows=await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE_NAME,'readonly');
   let value;
   const req=tx.objectStore(STORE_NAME).index('byScope').getAll(valid);
   req.onsuccess=()=>{value=req.result??[]};
   tx.oncomplete=()=>resolve(value);
   tx.onerror=()=>reject(tx.error??new Error('Liste de sprites inaccessible.'));
   tx.onabort=()=>reject(tx.error??new Error('Lecture des sprites annulée.'));
  });
  const results=[];
  for(const row of rows)results.push(await verified(row));
  return Object.freeze(results.sort((a,b)=>a.id.localeCompare(b.id)));
 }
 function close(){
  if(!active)return;
  active.then(db=>db.close()).catch(()=>{});
  active=null;
 }
 return Object.freeze({put,get,list,close});
}
