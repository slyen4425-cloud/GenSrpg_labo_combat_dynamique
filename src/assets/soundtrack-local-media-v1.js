import {normalizeSoundtrackCatalogV1} from "../contracts/soundtrack-project-v1.js";

// User-approved local MP3s are temporary object URLs, never fetched from
// GenSrpG_audio_prive, persisted inside game JSON, or copied to public assets.
// Distinct from the creator's one-shot SFX importer.
export function createSoundtrackLocalMediaV1({
  catalog,
  createObjectURL = file => URL.createObjectURL(file),
  revokeObjectURL = url => URL.revokeObjectURL(url)
}) {
  const assets=normalizeSoundtrackCatalogV1(catalog).assets.filter(a=>a.kind==="music"||a.kind==="ambience");
  if(typeof createObjectURL!=="function"||typeof revokeObjectURL!=="function") {
    throw new TypeError("object URL lifecycle functions required");
  }
  const byFilename=new Map();
  for(const asset of assets) {
    const filename=(asset.title+".mp3").toLowerCase();
    if(byFilename.has(filename))throw new TypeError("duplicate soundtrack filename "+filename);
    byFilename.set(filename,asset);
  }
  const local=new Map();
  let disposed=false;

  function assertOpen(){if(disposed)throw new Error("local soundtrack media disposed");}
  function status(){
    const ids=[...local.keys()];
    return Object.freeze({
      ready:ids.length,
      total:assets.length,
      ids:Object.freeze(ids),
      missing:Object.freeze(assets.filter(a=>!local.has(a.assetId)).map(a=>a.title+".mp3"))
    });
  }
  function importFiles(files){
    assertOpen();
    const selected=Array.from(files??[]);
    if(!selected.length)return status();
    const incoming=new Map();
    // Validate every file BEFORE allocating object URLs or modifying current media.
    for(const file of selected){
      const filename=String(file?.name??"").toLowerCase();
      const asset=byFilename.get(filename);
      if(!asset)throw new TypeError("piste inconnue : "+String(file?.name??""));
      if(!Number.isFinite(file?.size)||file.size<=0)throw new TypeError("fichier audio vide : "+filename);
      const mime=String(file?.type??"").toLowerCase();
      if(mime && !["audio/mpeg","audio/mp3","audio/x-mpeg"].includes(mime))
        throw new TypeError("MP3 attendu : "+filename);
      if(incoming.has(asset.assetId))throw new TypeError("piste fournie en double : "+filename);
      incoming.set(asset.assetId,file);
    }
    const created=new Map();
    try {
      for(const [id,file] of incoming){
        const url=createObjectURL(file);
        if(typeof url!=="string"||!url.startsWith("blob:"))throw new TypeError("invalid local media URL");
        created.set(id,url);
      }
    } catch(error) {
      for(const url of created.values())revokeObjectURL(url);
      throw error;
    }
    for(const [id,url] of created){
      const previous=local.get(id);
      local.set(id,url);
      if(previous)revokeObjectURL(previous);
    }
    return status();
  }
  function runtimeAsset(assetId){
    assertOpen();
    const url=local.get(assetId);
    return url?Object.freeze({assetId,url}):null;
  }
  function dispose(){
    if(disposed)return;
    disposed=true;
    for(const url of local.values())revokeObjectURL(url);
    local.clear();
  }
  return Object.freeze({importFiles,runtimeAsset,status,dispose});
}
