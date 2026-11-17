// The native Combat Lab is the SOLE owner of a Capture project's database.
// Caller supplies a generated universe ID. Neither the GenSRPG Shell nor
// Adventure duplicates or normalizes creatures, skills or combat rules.
import {normalizeCaptureDatabaseV1} from './capture-database-v1.js';
export const CAPTURE_UNIVERSE_DATABASE_PREFIX_V1='gensrpg.combat.capture.universe.database.v1:';
const ID=/^unv_[a-z0-9-]{8,80}$/;
const SCHEMA='gensrpg.combat.capture.universe.database.v1';
const idOf=value=>{
 if(typeof value!=='string'||!ID.test(value))
  throw new TypeError('Identifiant de projet Capture non généré par le Core');
 return value;
};
// Blank means zero authored creatures/skills, not a cloned Monster InvoC.
// Rules/statistics are supplied by the existing native editor presets and
// remain editable by the game's author; this owner validates their schemas.
export function createBlankCaptureUniverseDatabaseV1({
 statRegistry,progressionRules,metadata={}
}={}){
 return normalizeCaptureDatabaseV1({
  schema:'capture-database-v1',version:1,statRegistry,progressionRules,
  creatures:[],skills:[],metadata
 });
}

export function createCaptureUniverseDatabaseStoreV1({storage}={}){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')
  throw new TypeError('Stockage du projet Combat requis');
 const key=id=>CAPTURE_UNIVERSE_DATABASE_PREFIX_V1+idOf(id);
 function load(id){
  const raw=storage.getItem(key(id));
  if(raw===null)return null;
  let value;
  try{value=JSON.parse(raw)}catch{throw new Error('Projet Combat corrompu : fichier conservé');}
  if(!value||typeof value!=='object'||Array.isArray(value)||
   Object.keys(value).sort().join(',')!=='database,projectId,revision,schema,version'||
   value.schema!==SCHEMA||value.version!==1||value.projectId!==id||
   !Number.isSafeInteger(value.revision)||value.revision<1)
   throw new Error('Projet Combat incompatible : aucune réinitialisation');
  try{return Object.freeze({projectId:id,revision:value.revision,
   database:normalizeCaptureDatabaseV1(value.database)})}
  catch(e){throw new Error('Base Combat du projet invalide : '+e.message)}
 }
 function create(id,database){
  const ref=key(id);
  if(storage.getItem(ref)!==null)
   throw new Error('Projet Combat déjà présent : interdiction de remplacer');
  const normalized=normalizeCaptureDatabaseV1(database);
  // Single authoritative write; never touch other projects or binary assets.
  storage.setItem(ref,JSON.stringify({schema:SCHEMA,version:1,
   projectId:id,revision:1,database:normalized}));
  return load(id);
 }
 function save(id,database,{expectedRevision}={}){
  const before=load(id);
  if(!before)throw new Error('Projet Combat introuvable : aucun nouveau projet implicite');
  if(!Number.isSafeInteger(expectedRevision)||before.revision!==expectedRevision)
   throw new Error('Conflit de révision : conserver les deux versions et recharger');
  const normalized=normalizeCaptureDatabaseV1(database);
  storage.setItem(key(id),JSON.stringify({schema:SCHEMA,version:1,
   projectId:id,revision:expectedRevision+1,database:normalized}));
  return load(id);
 }
 function copy({fromId,toId,confirmed=false}={}){
  if(confirmed!==true||fromId===toId)
   throw new Error('Copie indépendante de bibliothèque : confirmation obligatoire');
  const source=load(fromId);
  if(!source)throw new Error('Bibliothèque source Combat absente');
  // Same normalized portable data and existing asset references; NO duplicated
  // library/engine or private media bytes.
  return create(toId,source.database);
 }
 return Object.freeze({load,create,save,copy});
}
