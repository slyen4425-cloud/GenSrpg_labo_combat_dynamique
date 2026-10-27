import test from "node:test";
import assert from "node:assert/strict";

import {
  demoPresentationAssets
} from "../../examples/dom-demo/demo-assets.js";

test("canonical fire-zone sprite resolves the new sixteen-frame replacement", () => {
  const asset = demoPresentationAssets.asset(
    "pack:capture:sprite-fire-zone-loop-01"
  );

  assert.ok(asset);
  assert.equal(asset.assetId, "pack:capture:sprite-fire-zone-loop-01");
  assert.equal(asset.playbackMode, "loop");
  assert.equal(asset.frameMs, 80);
  assert.equal(asset.frameCount, 16);
  assert.equal(
    Object.prototype.hasOwnProperty.call(asset, "frames"),
    false
  );
  assert.match(
    asset.url,
    /fire_zone_loop\/atlases\/sprite_skill_fire_zone_loop_01_atlas\.webp/
  );
});
