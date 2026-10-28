import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const catalogPath = new URL("../../data/assets/catalog/global-visual-assets.v1.json", import.meta.url);

test("legacy Fireball has the actual left-facing native direction and eight real atlas frames", async () => {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const assets = catalog.assets.filter(a => a.id === "pack:capture:sprite-fireball-travel-01");
  assert.equal(assets.length, 1, "one canonical media ID");
  const resource = assets[0].resource;
  assert.match(resource.file, /fireball.*travel.*atlas.*\.png$/);
  assert.equal(resource.headingRad, Math.PI, "real atlas faces LEFT, unlike the six right-facing assets");
  assert.equal(resource.format, "sprite-strip");
  assert.equal(resource.frameCount, 8, "image is eight frames, not one panoramic projectile");
  assert.ok(resource.frameMs > 0);
  assert.equal(resource.playbackMode, "loop");
});
