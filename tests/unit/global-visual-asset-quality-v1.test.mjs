import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const PLACEHOLDER_IDS = Object.freeze([
  "pack:capture:sprite-cast-blade-01",
  "pack:capture:sprite-cast-electric-01",
  "pack:capture:sprite-cast-nature-01",
  "pack:capture:sprite-cast-physical-01",
  "pack:capture:sprite-cast-water-01",
  "pack:capture:sprite-impact-blade-01",
  "pack:capture:sprite-impact-electric-01",
  "pack:capture:sprite-impact-nature-01",
  "pack:capture:sprite-impact-physical-01",
  "pack:capture:sprite-impact-water-01",
  "pack:capture:sprite-projectile-earth-01",
  "pack:capture:sprite-projectile-electric-01",
  "pack:capture:sprite-projectile-fire-01",
  "pack:capture:sprite-projectile-ice-01",
  "pack:capture:sprite-projectile-light-01",
  "pack:capture:sprite-projectile-shadow-01",
  "pack:capture:sprite-projectile-thorn-01",
  "pack:capture:sprite-projectile-water-01"
]);

const REQUIRED_VALIDATED_IDS = Object.freeze([
  "pack:capture:sprite-fireball-travel-01",
  "pack:capture:sprite-teleportation-1",
  "pack:capture:sprite-teleportation-2",
  "pack:capture:sprite-fire-zone-loop-01"
]);

async function catalog() {
  return JSON.parse(
    await readFile(
      new URL(
        "../../data/assets/catalog/global-visual-assets.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
}

test("global visual catalog does not publish provisional symbolic SVG suites as final assets", async () => {
  const value = await catalog();
  const ids = new Set(
    value.assets.map((asset) => asset.id)
  );

  for (const assetId of PLACEHOLDER_IDS) {
    assert.equal(
      ids.has(assetId),
      false,
      assetId + " is a provisional symbolic suite and must not be selectable"
    );
  }
});

test("visual repair preserves validated runtime visual assets", async () => {
  const value = await catalog();
  const ids = new Set(
    value.assets.map((asset) => asset.id)
  );

  for (const assetId of REQUIRED_VALIDATED_IDS) {
    assert.equal(
      ids.has(assetId),
      true,
      assetId + " must remain published"
    );
  }
});

test("global visual catalog counters match the published asset records", async () => {
  const value = await catalog();
  const byType = (type) =>
    value.assets.filter(
      (asset) => asset.assetType === type
    ).length;

  assert.equal(value.counts.assets, value.assets.length);
  assert.equal(value.counts.icons, byType("icon"));
  assert.equal(value.counts.sprites, byType("sprite"));
  assert.equal(value.counts.fx, byType("fx"));
  assert.equal(value.counts.portraits, byType("portrait"));
  assert.equal(value.counts.backgrounds, byType("background"));
});
