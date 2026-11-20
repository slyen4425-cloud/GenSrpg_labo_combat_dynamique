// Small, untrusted NETWORK ANNOUNCEMENT for a room. No image bytes,
// Blob URL, public Storage URL, player save, gameplay or identity authority.
// The room's real Supabase membership and storage RLS must authorize delivery.
import {validateCaptureCreatorSpriteMetadataV1,MAX_CREATOR_SPRITE_BYTES_V1}
 from './capture-creator-sprite-persistent-store-v1.js';

export const CAPTURE_CREATOR_SPRITE_ROOM_MANIFEST_V1='gensrpg.capture.room-sprites.v1';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DIGEST=/^[a-f0-9]{64}$/;
export const ROOM_SPRITES_MAX_ENTRIES_V1=48;
export const ROOM_SPRITES_MAX_BYTES_V1=96*1024*1024;
const VALID_FIELDS=['assetId','bytes','frameCount','frameMs','mime','role','sha256'];
const keysAre=(obj,keys)=>Object.keys(obj).sort().join(',')===keys.slice().sort().join(',');
function assertUuid(value,name){
 if(typeof value!=='string'||!UUID.test(value))throw new TypeError(name+' UUID requis.');
 return value.toLowerCase();
}
function assetFromRecord(row){
 const m=validateCaptureCreatorSpriteMetadataV1({
  ...row,assetId:row.assetId??row.id
 });
 if(typeof row.sha256!=='string'||!DIGEST.test(row.sha256))
  throw new TypeError('Empreinte SHA-256 manquante.');
 return Object.freeze({
  assetId:m.assetId,role:m.role,mime:m.mime,bytes:m.bytes,
  frameCount:m.frameCount,frameMs:m.frameMs,sha256:row.sha256
 });
}
export function createCaptureCreatorSpriteRoomManifestV1({
 roomId,authorUserId,records,confirmed=false
}={}){
 if(confirmed!==true)throw new Error('Partage des sprites : confirmation explicite requise.');
 assertUuid(roomId,'Salon');assertUuid(authorUserId,'Joueur');
 if(!Array.isArray(records)||records.length>ROOM_SPRITES_MAX_ENTRIES_V1)
  throw new RangeError('48 sprites maximum pour un salon.');
 const assets=records.map(assetFromRecord);
 if(new Set(assets.map(a=>a.assetId)).size!==assets.length)
  throw new Error('Un sprite ne peut pas figurer plusieurs fois dans le manifeste.');
 if(assets.reduce((sum,x)=>sum+x.bytes,0)>ROOM_SPRITES_MAX_BYTES_V1)
  throw new RangeError('Le partage dépasse 96 Mio : sélectionner moins de sprites.');
 return Object.freeze({
  schema:CAPTURE_CREATOR_SPRITE_ROOM_MANIFEST_V1,
  version:1,
  roomId:roomId.toLowerCase(),
  authorUserId:authorUserId.toLowerCase(),
  assets:Object.freeze(assets)
 });
}
export function validateCaptureCreatorSpriteRoomManifestV1(
 manifest,{expectedRoomId,expectedAuthorUserId}={}
){
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest)||
  !keysAre(manifest,['schema','version','roomId','authorUserId','assets'])||
  manifest.schema!==CAPTURE_CREATOR_SPRITE_ROOM_MANIFEST_V1||
  manifest.version!==1||!Array.isArray(manifest.assets))
  throw new Error('Annonce de sprites du salon inconnue ou malformée.');
 const roomId=assertUuid(manifest.roomId,'Salon');
 const userId=assertUuid(manifest.authorUserId,'Joueur');
 if(roomId!==assertUuid(expectedRoomId,'Salon attendu')||
  userId!==assertUuid(expectedAuthorUserId,'Joueur attendu'))
  throw new Error('Annonce de sprites émise pour un autre salon ou joueur.');
 if(manifest.assets.length>ROOM_SPRITES_MAX_ENTRIES_V1)
  throw new Error('Trop de sprites annoncés.');
 const clean=manifest.assets.map(item=>{
  if(!item||typeof item!=='object'||Array.isArray(item)||
   !keysAre(item,VALID_FIELDS))
   throw new Error('Métadonnées de sprite inconnues.');
  const row=assetFromRecord({...item,scopeId:'validated-room',label:item.assetId});
  if(!keysAre(row,VALID_FIELDS)||row.bytes>MAX_CREATOR_SPRITE_BYTES_V1)
   throw new Error('Métadonnées non conformes.');
  return row;
 });
 if(new Set(clean.map(x=>x.assetId)).size!==clean.length)
  throw new Error('Sprite dupliqué dans le salon.');
 if(clean.reduce((sum,x)=>sum+x.bytes,0)>ROOM_SPRITES_MAX_BYTES_V1)
  throw new Error('Annonce supérieure au budget du salon.');
 return Object.freeze({...manifest,assets:Object.freeze(clean)});
}
