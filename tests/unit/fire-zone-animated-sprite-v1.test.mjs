import test from "node:test";
import assert from "node:assert/strict";

import {
  demoPresentationAssets
} from "../../examples/dom-demo/demo-assets.js";

test("fire-zone persistent sprite resolves as an sixteen-frame looping sequence", () => {
  const asset = demoPresentationAssets.asset(
    "pack:capture:sprite-fire-zone-loop-01"
  );

  assert.ok(asset);
  assert.equal(
    asset.assetId,
    "pack:capture:sprite-fire-zone-loop-01"
  );
  assert.equal(asset.frameCount, 16);
  assert.equal(asset.frameMs, 80);
  assert.equal(asset.playbackMode, "loop");
  assert.match(
    asset.url,
    /fire_zone_loop\/atlases\/sprite_skill_fire_zone_loop_01_atlas\.webp/
  );
});
