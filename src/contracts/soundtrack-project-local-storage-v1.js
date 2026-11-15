import {normalizeSoundtrackProjectV1} from './soundtrack-project-v1.js';

// A single persisted authoring PROJECT, never a media cache or second player.
// Scoped by projectId so other games (Survie, Dungeon) cannot overwrite Capture.
export const SOUNDTRACK_PROJECT_STORE_PREFIX_V1='gensrpg.soundtrack.project.v1:';
const projectKey=id=>{
 if(typeof id!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,159}$/.test(id))
  throw new TypeError('Invalid soundtrack project ID');
 return SOUNDTRACK_PROJECT_STORE_PREFIX_V1+id;
};
export function saveOfficialSoundtrackProjectV1(storage,project,catalog){
 if(typeof storage?.setItem!=='function')throw new Error('Stockage audio indisponible');
 const valid=normalizeSoundtrackProjectV1(project,catalog);
 // Session-only MP3s cannot be replayed from a JSON reference after reload.
 const official=new Set(catalog.assets.filter(a=>a.origin==='app').map(a=>a.assetId));
 for(const scene of Object.values(valid.scenes))
  for(const channel of ['music','ambience'])
   for(const id of scene[channel]?.tracks??[])
    if(!official.has(id))
     throw new Error('Média personnel temporaire : importer le MP3 à nouveau ou utiliser une piste officielle avant de sauvegarder');
 storage.setItem(projectKey(valid.projectId),JSON.stringify(valid));
 return valid;
}
export function readOfficialSoundtrackProjectV1(storage,projectId,catalog){
 if(typeof storage?.getItem!=='function')throw new Error('Stockage audio indisponible');
 const raw=storage.getItem(projectKey(projectId));
 if(raw===null)return null;
 const project=normalizeSoundtrackProjectV1(JSON.parse(raw),catalog);
 if(project.projectId!==projectId)
  throw new TypeError('Soundtrack project identity mismatch');
 return project;
}
