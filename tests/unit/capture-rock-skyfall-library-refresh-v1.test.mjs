import test from "node:test";
import assert from "node:assert/strict";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";
const files=[
  ["pack:capture:sprite-falling-rock-skyfall-01","capture/sprites/skills/falling_rock_skyfall/atlases/sprite_skill_falling_rock_skyfall_atlas_01.webp",20,70,"travel"],
  ["pack:capture:sprite-rock-impact-upward-01","capture/sprites/skills/rock_impact_upward/atlases/sprite_skill_rock_impact_upward_atlas_01.webp",16,75,"impact"]
];
test("rock skyfall and upward impact resolve through one global-assets visual library",()=>{
  assert.equal(GLOBAL_VISUAL_LIBRARY.repository,"slyen4425-cloud/GenSrpg_labo_combat_dynamique");
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
  assert.equal(GLOBAL_VISUAL_LIBRARY.revision,"2026-10-10-v22-rock-skyfall-impact");
  assert.equal(new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl).searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
  assert.equal(new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl).pathname.endsWith("/global-assets/data/assets/catalog/global-visual-assets.v1.json"),true);
  for(const [id,path,count,frameMs,role] of files){
    assert.match(id,/^pack:capture:sprite-/);
    assert.ok(count>0);
    assert.ok(frameMs>0);
    assert.ok(["travel","impact"].includes(role));
    const u=new URL(globalVisualAssetUrl(path));
    assert.equal(u.pathname.endsWith("/global-assets/assets/library/"+path),true);
    assert.equal(u.searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
  }
});
