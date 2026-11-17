// Combat is the sole owner of universe-specific CaptureDatabase persistence.
// The preview page composes this adapter but never reads browser storage.
// Storage, route, and ID checks remain testable without global monkey-patches.
import {createCaptureUniverseDatabaseStoreV1} from '../contracts/capture-universe-database-store-v1.js';

export function createCaptureUniverseEditorBrowserV1({search='',storage=globalThis.localStorage}={}){
 const universeId=new URLSearchParams(search).get('universe');
 if(universeId===null)
  return Object.freeze({universeId:null,universeStore:null,universeSnapshot:null});
 if(!storage)throw new Error('Bibliothèque Combat indisponible, aucun projet global ouvert');
 const universeStore=createCaptureUniverseDatabaseStoreV1({storage});
 const universeSnapshot=universeStore.load(universeId);
 if(universeSnapshot===null)
  throw new Error('Bibliothèque de l’univers absente : aucun catalogue historique ouvert');
 return Object.freeze({universeId,universeStore,universeSnapshot});
}
