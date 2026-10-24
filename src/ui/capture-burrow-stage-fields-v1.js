// Editor-only projection: SkillPresentationBinding V13 remains the owner.
export const BURROW_STAGE_ORDER_V1=Object.freeze(["start","travel","impact"]);
export const BURROW_DEFAULT_ASSETS_V1=Object.freeze({start:"burrow:start",travel:"burrow:travel",impact:"burrow:impact"});
export function burrowEditorFieldsFromVisualV1(visual={}){
  const raw=visual?.burrowTerrain,config={};
  for(const stage of BURROW_STAGE_ORDER_V1){
    const entry=raw?.[stage];
    config[stage]={
      assetId:raw===undefined?BURROW_DEFAULT_ASSETS_V1[stage]:(entry?.assetId??""),
      scale:entry?.scale??1,offsetX:entry?.offsetX??0,offsetY:entry?.offsetY??0,
      frameMs:entry?.frameMs??(stage==="travel"?60:70)
    };
  }
  return {burrowTerrainConfig:config};
}
function select(root,query){
  const n=root.querySelector(query);
  if(!n)throw new Error("Missing burrow editor field "+query);
  return n;
}
export function writeBurrowStageFieldsV1(root,fields={}){
  const config=fields.burrowTerrainConfig??burrowEditorFieldsFromVisualV1().burrowTerrainConfig;
  for(const stage of BURROW_STAGE_ORDER_V1){
    const entry=config[stage]??{};
    for(const [key,value]of [
      ["asset",entry.assetId??BURROW_DEFAULT_ASSETS_V1[stage]],
      ["scale",entry.scale??1],["x",entry.offsetX??0],["y",entry.offsetY??0],
      ["frame-ms",entry.frameMs??(stage==="travel"?60:70)]
    ]){
      const control=select(root,"[data-burrow-"+stage+"-"+key+"]");
      if(key==="asset"&&value&&!Array.from(control.options??[]).some(o=>o.value===String(value))){
        const option=root.ownerDocument.createElement("option");
        option.value=String(value);option.textContent=String(value)+" (personnalisé)";
        control.append(option);
      }
      control.value=String(value);
    }
  }
  updateBurrowStageVisibilityV1(root);
}
export function readBurrowStageFieldsV1(root){
  const config={};
  for(const stage of BURROW_STAGE_ORDER_V1){
    const assetId=select(root,"[data-burrow-"+stage+"-asset]").value.trim();
    const num=key=>Number(select(root,"[data-burrow-"+stage+"-"+key+"]").value);
    config[stage]={assetId,scale:num("scale"),offsetX:num("x"),offsetY:num("y"),frameMs:num("frame-ms")};
  }
  return {burrowTerrainConfig:config};
}
export function burrowBindingFromFieldsV1(fields={}){
  const configs=fields.burrowTerrainConfig??burrowEditorFieldsFromVisualV1().burrowTerrainConfig;
  return Object.fromEntries(BURROW_STAGE_ORDER_V1.map(stage=>{
    const input=configs[stage];
    if(!input||!input.assetId)return [stage,null];
    return [stage,{assetId:String(input.assetId),scale:Number(input.scale),offsetX:Number(input.offsetX),offsetY:Number(input.offsetY),frameMs:Number(input.frameMs)}];
  }));
}
export function updateBurrowStageVisibilityV1(root){
  const n=root.querySelector("[data-burrow-stage-fields]");
  if(n)n.hidden=select(root,"[data-skill-approach]").value!=="burrow";
}

/**
 * One catalog, three stage selectors. Built-in assets remain available, and
 * every compatible GenSrpG or user-imported FX sprite can be selected for any
 * underground phase. IDs are stored by the existing V13 skill binding;
 * this function never copies media or changes combat mechanics.
 */
export function populateBurrowStageAssetChoicesV1(root, assets = []) {
  const compatible = [...new Map(
    (Array.isArray(assets) ? assets : [])
      .filter(asset => {
        const tags = Array.isArray(asset?.tags) ? asset.tags : [];
        return typeof asset?.id === "string" &&
          (asset.assetType === "sprite" || asset.assetType === "fx") &&
          asset.mediaType === "image" &&
          asset.category !== "creature" &&
          !tags.includes("creature") &&
          asset.compatibility?.uses?.includes("editor") &&
          (Boolean(asset.resource?.file) ||
            Boolean(asset.resource?.runtimeUrl));
      })
      .map(asset => [asset.id, asset])
  ).values()].sort((a, b) =>
    String(a.label || a.id).localeCompare(
      String(b.label || b.id), "fr", { sensitivity: "base" }
    )
  );
  const labels = {
    start: "Départ — creusement · 20 frames",
    travel: "Trajet — sillon · 20 frames",
    impact: "Arrivée — émergence · 20 frames"
  };
  for (const stage of BURROW_STAGE_ORDER_V1) {
    const control = select(root, "[data-burrow-" + stage + "-asset]");
    const currentId = String(control.value ?? "");
    control.textContent = "";
    const add = (id, label) => {
      const option = root.ownerDocument.createElement("option");
      option.value = id;
      option.textContent = label;
      control.append(option);
    };
    add("", "Aucun");
    add(BURROW_DEFAULT_ASSETS_V1[stage], labels[stage]);
    for (const user of [false, true]) {
      const group = user ? "Mes assets" : "Bibliothèque GenSrpG";
      for (const asset of compatible) {
        if ((asset.source?.scope === "user") !== user) continue;
        if (asset.id === BURROW_DEFAULT_ASSETS_V1[stage]) continue;
        add(asset.id, group + " · " + (asset.label || asset.id));
      }
    }
    // Preserve old saves even if the referenced asset is unavailable today:
    // visual resolution, not this picker, remains responsible for validation.
    if (currentId &&
        !Array.from(control.options ?? []).some(opt => opt.value === currentId)) {
      add(currentId, currentId + " (hors bibliothèque)");
    }
    control.value = currentId;
  }
}
