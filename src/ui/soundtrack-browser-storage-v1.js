// Dedicated optional browser-only adapter for the official SoundtrackProject.
// The Combat preview runtime never reads or writes application storage.
import {readOfficialSoundtrackProjectV1,saveOfficialSoundtrackProjectV1}
 from '../contracts/soundtrack-project-local-storage-v1.js';
export function createSoundtrackBrowserStorageV1(windowRef=globalThis.window){
 const getStorage=()=>{
   if(!windowRef?.localStorage)throw new Error('Stockage local du compositeur indisponible');
   return windowRef.localStorage;
 };
 return Object.freeze({
   read:(id,catalog)=>readOfficialSoundtrackProjectV1(getStorage(),id,catalog),
   save:(project,catalog)=>saveOfficialSoundtrackProjectV1(getStorage(),project,catalog)
 });
}
