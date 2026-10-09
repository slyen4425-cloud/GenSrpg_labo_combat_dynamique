import test from "node:test";
import assert from "node:assert/strict";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";

test("new water-healing bubble library release refreshes the canonical global catalog URL", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch,"global-assets");
  assert.equal(GLOBAL_VISUAL_LIBRARY.revision,"2026-10-09-v20-water-healing-bubble");
  assert.match(GLOBAL_VISUAL_LIBRARY.catalogUrl,/global-visual-assets\\.v1\\.json\\?v=2026-10-09-v20-water-healing-bubble/);
  const url=globalVisualAssetUrl("capture/sprites/skills/water_healing_bubble/atlases/sprite_heal_water_bubble_atlas_20f_384.webp");
  assert.match(url,/global-assets\\/assets\\/library\\/capture\\/sprites\\/skills\\/water_healing_bubble\\/atlases\\//);
  assert.equal(new URL(url).searchParams.get("v"),GLOBAL_VISUAL_LIBRARY.revision);
});
