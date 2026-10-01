import test from "node:test";
import assert from "node:assert/strict";

import {
  demoPresentationAssets
} from "../../examples/dom-demo/demo-assets.js";

test("fire-zone persistent sprite resolves as an eight-frame looping sequence", () => {
  const asset = demoPresentationAssets.asset(
    "pack:capture:sprite-fire-zone-loop-01"
  );

  assert.ok(asset);
  assert.equal(
    asset.assetId,
    "pack:capture:sprite-fire-zone-loop-01"
  );
  assert.ok(Array.isArray(asset.frames));
  assert.equal(asset.frames.length, 8);
  assert.equal(asset.frameMs, 80);
  assert.equal(asset.playbackMode, "loop");

  assert.ok(
    asset.frames[0].includes(
      "fire_zone_loop/frames/sprite_skill_fire_zone_loop_01_01.webp"
    )
  );
  assert.ok(
    asset.frames[7].includes(
      "fire_zone_loop/frames/sprite_skill_fire_zone_loop_01_08.webp"
    )
  );
});
