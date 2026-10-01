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
  assert.ok(Array.isArray(asset.frames));
  assert.equal(asset.frames.length, 16);

  assert.match(
    asset.frames[0],
    /fire_zone_loop\/frames\/sprite_skill_fire_zone_loop_01_01\.webp/
  );
  assert.match(
    asset.frames[15],
    /fire_zone_loop\/frames\/sprite_skill_fire_zone_loop_01_16\.webp/
  );
});
