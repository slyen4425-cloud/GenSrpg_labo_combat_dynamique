// Presentation-only IDs of approved GenSRPG UI icon pack, 9 Nov 2026.
// Actual media are owned exclusively by the existing global-assets catalog.
const IDS=Object.freeze({
 health:"core:ui-stat-health-01",physical:"core:ui-stat-physical-01",
 defense:"core:ui-stat-defense-01",speed:"core:ui-stat-speed-01",
 fire:"core:ui-element-fire-01",water:"core:ui-element-water-01",
 electric:"core:ui-element-electric-01",glace:"core:ui-element-glace-01",
 poison:"core:ui-element-poison-01",earth:"core:ui-element-earth-01",
 air:"core:ui-element-air-01",nature:"core:ui-element-nature-01",
 acier:"core:ui-element-acier-01",light:"core:ui-element-light-01",
 shadow:"core:ui-element-shadow-01",esprit:"core:ui-element-esprit-01"
});
const ALIAS=Object.freeze({hp:"health",vie:"health",attaque:"physical",attack:"physical",
 vent:"air",ice:"glace",steel:"acier",spirit:"esprit",spiritual:"esprit",
 electricity:"electric"});
export function captureUiStatIconAssetIdV1(id){
 if(typeof id!=="string")return null;
 return IDS[ALIAS[id]??id]??null;
}
export function captureUiPublishedStatIconV1(catalogOrAssets,id){
 const assetId=captureUiStatIconAssetIdV1(id);
 if(!assetId)return null;
 const assets=Array.isArray(catalogOrAssets)?catalogOrAssets:
   Array.isArray(catalogOrAssets?.assets)?catalogOrAssets.assets:[];
 const a=assets.find(x=>x?.id===assetId);
 const file=a?.resource?.file;
 if(a?.assetType!=="icon"||a.mediaType!=="image"||
    typeof file!=="string"||
    !/^core\/icons\/ui\/(?:stat|element)\/icon_ui_[a-z0-9_]+_128\.webp$/.test(file)||
    Number(a.resource?.frameCount??1)!==1)return null;
 return Object.freeze({assetId,file});
}
// Discover true damage channels by reading authored nested effects, never by
// interpreting text or manufacturing gameplay damage.
export function captureSkillDamageChannelsV1(definition){
 const found=new Set();
 const add=v=>{const c=ALIAS[v]??v;if(IDS[c])found.add(c)};
 const visit=e=>{
   if(!e||typeof e!=="object")return;
   if(e.kind==="damage")add(e.channel??definition?.element??"physical");
   if(e.kind==="apply_status"&&e.status?.kind==="damage_over_time")
     add(e.status.channel??definition?.element);
   if(e.kind==="apply_marker"){
     if(e.marker?.periodic?.kind==="damage")add(e.marker.periodic.channel??definition?.element);
     for(const x of e.marker?.onStackThreshold?.effects??[])visit(x);
     for(const x of e.marker?.onStackAdded?.effects??[])visit(x);
   }
   if(e.kind==="persistent_zone")visit(e.tickEffect);
   if(e.kind==="scheduled_effect"||e.kind==="consume_marker")
     for(const x of e.effects??[])visit(x);
 };
 if(Number(definition?.effect?.damage)>0)add(definition.element??"physical");
 for(const e of definition?.effects??[])visit(e);
 for(const e of definition?.channeling?.effects??[])visit(e);
 for(const e of definition?.contactHold?.effects??[])visit(e);
 return Object.freeze([...found]);
}
