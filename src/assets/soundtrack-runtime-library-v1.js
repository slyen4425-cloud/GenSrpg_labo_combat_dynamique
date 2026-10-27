import {SOUNDTRACK_STARTER_BATTLE_IDS_V1} from "./soundtrack-starter-catalog-v1.js";

// Runtime delivery copies for the shared game soundtrack, exactly like the
// published SFX. Masters and any private GitHub URL stay in the private archive.
// URLs are confined to the asset resolver: project JSON contains assetIds only.
const AUDIO_ROOT = new URL("../../assets/runtime/audio/music-v1/",import.meta.url);
const BATTLE_RUNTIME_FILES = Object.freeze([
  "battle-01-cb4ed87d.mp3",
  "battle-02-f9fe0046.mp3",
  "battle-03-4bac5c69.mp3",
  "battle-04-26cfab69.mp3",
  "battle-05-63c05b82.mp3",
  "battle-06-58ce63ad.mp3"
]);
const BY_ID=new Map(SOUNDTRACK_STARTER_BATTLE_IDS_V1.map((id,i)=>[id,BATTLE_RUNTIME_FILES[i]]));

// No downloader UI is exposed. Browser-delivered audio cannot be made
// technically non-copyable; this resolver makes no DRM/security claims.
export function soundtrackRuntimeAssetV1(assetId) {
  if(typeof assetId!=="string")return null;
  const filename=BY_ID.get(assetId);
  if(!filename)return null;
  return Object.freeze({assetId,url:new URL(filename,AUDIO_ROOT).href});
}
export const SOUNDTRACK_RUNTIME_BATTLE_FILES_V1=BATTLE_RUNTIME_FILES;
