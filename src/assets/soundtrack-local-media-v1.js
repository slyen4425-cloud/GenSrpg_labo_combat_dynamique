import {normalizeSoundtrackCatalogV1} from "../contracts/soundtrack-project-v1.js";

// User-approved local MP3s are temporary object URLs, never fetched from
// GenSrpG_audio_prive, persisted inside game JSON, or copied to public assets.
// Distinct from the creator's one-shot SFX importer.
export function createSoundtrackLocalMediaV1({
  catalog,
  allowCustom = false,
  createId = () => globalThis.crypto.randomUUID(),
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
  const customAssets=[];
  let disposed=false;

  function assertOpen(){if(disposed)throw new Error("local soundtrack media disposed");}
  function status(){
    const ids=[...local.keys()];
    return Object.freeze({
      ready:ids.length,
      total:assets.length+customAssets.length,
      ids:Object.freeze(ids),
      missing:Object.freeze(assets.filter(a=>!local.has(a.assetId)).map(a=>a.title+".mp3"))
    });
  }
  function importFiles(files){
    assertOpen();
    const selected=Array.from(files??[]);
    if(!selected.length)return status();
    const incoming=new Map();
    const newAssets=[];
    const newNames=new Set();
    // Validate every file BEFORE allocating object URLs or modifying current media.
    for(const file of selected){
      const filename=String(file?.name??"").toLowerCase();
      let asset=byFilename.get(filename)||
        customAssets.find(a=>(a.title+".mp3").toLowerCase()===filename);
      if(!Number.isFinite(file?.size)||file.size<=0)throw new TypeError("fichier audio vide : "+filename);
      const mime=String(file?.type??"").toLowerCase();
      if(mime && !["audio/mpeg","audio/mp3","audio/x-mpeg"].includes(mime))
        throw new TypeError("MP3 attendu : "+filename);
      if(!asset){
        if(!allowCustom)throw new TypeError("piste inconnue : "+String(file?.name??""));
        if(!filename.endsWith(".mp3"))throw new TypeError("MP3 attendu : "+filename);
        if(newNames.has(filename))throw new TypeError("piste fournie en double : "+filename);
        newNames.add(filename);
        const uuid=String(createId());
        if(!/^[a-zA-Z0-9_-]{6,100}$/.test(uuid))
          throw new TypeError("identifiant de musique auto-généré invalide");
        asset=Object.freeze({assetId:"user:music:"+uuid,kind:"music",origin:"user",
          title:String(file.name).replace(/\.mp3$/i,"")});
        if(assets.some(a=>a.assetId===asset.assetId)||
          customAssets.some(a=>a.assetId===asset.assetId)||
          newAssets.some(a=>a.assetId===asset.assetId))
          throw new TypeError("identifiant de musique déjà utilisé");
        newAssets.push(asset);
      }
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
    customAssets.push(...newAssets);
    return Object.freeze({...status(),imported:Object.freeze([...incoming.keys()]),
      newAssets:Object.freeze([...newAssets])});
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
  return Object.freeze({importFiles,runtimeAsset,status,dispose,
    customAssets:()=>Object.freeze([...customAssets])});
}
