const ROOT=new URL("../../assets/library/capture/sprites/skills/burrow_terrain/",import.meta.url);
const BUILTIN=Object.freeze({
  "burrow:start":Object.freeze({stage:"start",frameCount:20,frameMs:70,playbackMode:"once"}),
  "burrow:travel":Object.freeze({stage:"travel",frameCount:20,frameMs:60,playbackMode:"loop"}),
  "burrow:impact":Object.freeze({stage:"impact",frameCount:20,frameMs:70,playbackMode:"once"})
});
export const BURROW_STAGE_DEFAULT_IDS_V1=Object.freeze({
  start:"burrow:start",travel:"burrow:travel",impact:"burrow:impact"
});
export function builtInBurrowSpriteAssetV1(assetId){
  const item=BUILTIN[assetId];
  if(!item)return null;
  return Object.freeze({
    assetId,
    url:new URL(item.stage+"/sprite_burrow_"+item.stage+"_atlas.webp",ROOT).href,
    frameCount:item.frameCount,
    frameMs:item.frameMs,
    playbackMode:item.playbackMode
  });
}
export function defaultBurrowSpritesV1(){
  return Object.freeze(Object.fromEntries(Object.entries(BURROW_STAGE_DEFAULT_IDS_V1).map(([stage,id])=>[
    stage,Object.freeze({...builtInBurrowSpriteAssetV1(id),scale:1,offsetX:0,offsetY:0})
  ])));
}
