import {
  normalizeSoundtrackCatalogV1,normalizeSoundtrackProjectV1
} from "../../contracts/soundtrack-project-v1.js";
import {createSoundtrackSessionV1} from "../../core/audio/soundtrack-session-v1.js";
import {createDomSoundtrackOutputV1} from "./dom-soundtrack-output-v1.js";

// Preview-only bridge, not a second music engine: SoundtrackSession is owner.
// Existing DomCombatAudio retains all skill and creature sound effects.
export function createCombatSoundtrackPreviewBridgeV1({
  project,catalog,resolveAudioAsset,
  output=null,
  clock={setTimeout:(fn,delay)=>setTimeout(fn,delay),clearTimeout:(id)=>clearTimeout(id)},
  random=Math.random,onAudioError=()=>{}
}) {
  const assets=normalizeSoundtrackCatalogV1(catalog);
  const manifest=normalizeSoundtrackProjectV1(project,assets);
  if(typeof resolveAudioAsset!=="function")throw new TypeError("resolveAudioAsset required");
  if(typeof onAudioError!=="function")throw new TypeError("onAudioError required");
  if(output!==null && typeof output.play!=="function")throw new TypeError("invalid audio output");
  let disposed=false;
  let session=null;
  const playbackOutput=output??createDomSoundtrackOutputV1({
    resolveAssetUrl:id=>resolveAudioAsset(id)?.url??"",
    onError:onAudioError
  });
  function stop(){
    session?.dispose();
    session=null;
  }
  function transitionTo(sceneId="capture:combat:normal"){
    if(disposed)throw new Error("soundtrack preview bridge disposed");
    const scene=manifest.scenes[sceneId];
    if(!scene){
      // An absent scene is fully optional: old battles remain silent.
      stop();
      return Object.freeze({status:"silent",sceneId:null});
    }
    const tracks=[...(scene.music?.tracks??[]),...(scene.ambience?.tracks??[])];
    if(!tracks.length){
      stop();
      return Object.freeze({status:"silent",sceneId});
    }
    for(const id of tracks){
      const asset=resolveAudioAsset(id);
      if(typeof asset?.url!=="string" || !/^(https?:\/\/|blob:)/i.test(asset.url)){
        stop();
        return Object.freeze({status:"unavailable",sceneId,assetId:id});
      }
    }
    try{
      if(!session)session=createSoundtrackSessionV1({
        catalog:assets,project:manifest,output:playbackOutput,clock,random
      });
      const state=session.transitionTo(sceneId);
      return Object.freeze({status:"playing",sceneId:state.sceneId,
        music:state.music,ambience:state.ambience});
    }catch(error){
      stop();
      onAudioError(error);
      return Object.freeze({status:"unavailable",sceneId,error:error?.message??String(error)});
    }
  }
  return Object.freeze({
    transitionTo,
    dispose(){if(disposed)return;disposed=true;stop();}
  });
}
