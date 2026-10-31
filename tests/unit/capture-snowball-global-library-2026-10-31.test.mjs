import test from "node:test";
import assert from "node:assert/strict";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
const roles=["cast","projectile","impact"];
test("The published editor reads the sole global-assets repository and new snowball cache revision",()=>{
 assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
 assert.equal(GLOBAL_VISUAL_LIBRARY.repository,"slyen4425-cloud/GenSrpg_labo_combat_dynamique");
 const version=GLOBAL_VISUAL_LIBRARY.revision.match(/^2026-\d\d-\d\d-v(\d+)-[a-z0-9-]+$/);
 assert.ok(version && Number(version[1])>=46,"Snowball media requires catalog revision v46 or newer");
 const catalog=new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl);
 assert.ok(catalog.pathname.endsWith("/global-assets/data/assets/catalog/global-visual-assets.v1.json"));
 assert.equal(catalog.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
 for(const role of roles){
  const url=globalVisualAssetUrl("capture/sprites/skills/boule_de_neige/"+role+"/boule_de_neige_"+role+"_atlas_12f.webp");
  assert.ok(url.startsWith("https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/global-assets/"));
  assert.equal(new URL(url).searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
 }
});
