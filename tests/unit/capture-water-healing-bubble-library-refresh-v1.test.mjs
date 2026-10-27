import test from "node:test";
import assert from "node:assert/strict";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";

test("water healing bubble catalog revision and resolved atlas URL", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch, "global-assets");
  assert.match(GLOBAL_VISUAL_LIBRARY.revision, /^20\d{2}-\d{2}-\d{2}-v\d+-/);
  assert.equal(new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl).searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
  const url = globalVisualAssetUrl("capture/sprites/skills/water_healing_bubble/atlases/sprite_heal_water_bubble_atlas_20f_384.webp");
  assert.ok(url.includes("/global-assets/assets/library/capture/sprites/skills/water_healing_bubble/atlases/"));
  assert.equal(new URL(url).searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
});
