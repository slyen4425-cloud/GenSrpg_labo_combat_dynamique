import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../../", import.meta.url);
const catalog = JSON.parse(
  readFileSync(
    new URL("data/assets/catalog/global-visual-assets.v1.json", root),
    "utf8"
  )
);

const EXPECTED = Object.freeze([
  ["pack:capture:sprite-cast-blade-01", "capture/sprites/casts/blade/atlases/sprite_cast_blade_atlas_01.webp", 8, 60],
  ["pack:capture:sprite-cast-electric-01", "capture/sprites/casts/electric/atlases/sprite_cast_electric_atlas_01.webp", 8, 60],
  ["pack:capture:sprite-cast-nature-01", "capture/sprites/casts/nature/atlases/sprite_cast_nature_atlas_01.webp", 8, 60],
  ["pack:capture:sprite-cast-physical-01", "capture/sprites/casts/physical/atlases/sprite_cast_physical_atlas_01.webp", 8, 60],
  ["pack:capture:sprite-cast-water-01", "capture/sprites/casts/water/atlases/sprite_cast_water_atlas_01.webp", 8, 60],
  ["pack:capture:sprite-impact-blade-01", "capture/sprites/impacts/blade/atlases/sprite_impact_blade_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-impact-electric-01", "capture/sprites/impacts/electric/atlases/sprite_impact_electric_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-impact-nature-01", "capture/sprites/impacts/nature/atlases/sprite_impact_nature_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-impact-physical-01", "capture/sprites/impacts/physical/atlases/sprite_impact_physical_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-impact-water-01", "capture/sprites/impacts/water/atlases/sprite_impact_water_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-projectile-earth-01", "capture/sprites/projectiles/earth/atlases/sprite_projectile_earth_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-projectile-electric-01", "capture/sprites/projectiles/electric/atlases/sprite_projectile_electric_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-projectile-fire-01", "capture/sprites/projectiles/fire/atlases/sprite_projectile_fire_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-projectile-ice-01", "capture/sprites/projectiles/ice/atlases/sprite_projectile_ice_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-projectile-light-01", "capture/sprites/projectiles/light/atlases/sprite_projectile_light_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-projectile-shadow-01", "capture/sprites/projectiles/shadow/atlases/sprite_projectile_shadow_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-projectile-thorn-01", "capture/sprites/projectiles/thorn/atlases/sprite_projectile_thorn_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-projectile-water-01", "capture/sprites/projectiles/water/atlases/sprite_projectile_water_atlas_01.webp", 8, 45],
  ["pack:capture:sprite-status-healing-aura-01", "capture/sprites/status/healing_aura/atlases/sprite_status_healing_aura_atlas_01.webp", 8, 80],
  ["pack:capture:sprite-status-energy-shield-01", "capture/sprites/status/energy_shield/atlases/sprite_status_energy_shield_atlas_01.webp", 8, 80],
  ["pack:capture:sprite-status-carapace-01", "capture/sprites/status/carapace/atlases/sprite_status_carapace_atlas_01.webp", 8, 80],
  ["pack:capture:sprite-status-poison-01", "capture/sprites/status/poison/atlases/sprite_status_poison_atlas_01.webp", 8, 80],
  ["pack:capture:sprite-status-regeneration-01", "capture/sprites/status/regeneration/atlases/sprite_status_regeneration_atlas_01.webp", 8, 80],
  ["pack:capture:sprite-status-purification-01", "capture/sprites/status/purification/atlases/sprite_status_purification_atlas_01.webp", 8, 80],
  ["pack:capture:sprite-status-curse-01", "capture/sprites/status/curse/atlases/sprite_status_curse_atlas_01.webp", 8, 80]
]);

test("illustrated Capture sprites are real WebP files and canonical catalog entries", () => {
  const byId = new Map(catalog.assets.map((asset) => [asset.id, asset]));

  for (const [id, relativeFile, frameCount, frameMs] of EXPECTED) {
    const asset = byId.get(id);
    assert.ok(asset, id + " must exist in the canonical catalog");
    assert.equal(asset.resource?.file, relativeFile, id + " must point at its canonical WebP strip");
    assert.equal(asset.resource?.format, "sprite-strip");
    assert.equal(asset.resource?.mime, "image/webp");
    assert.equal(asset.resource?.frameCount, frameCount);
    assert.equal(asset.resource?.frameMs, frameMs);
    assert.doesNotMatch(relativeFile, /\.svg$/i);

    const fileUrl = new URL("assets/library/" + relativeFile, root);
    const bytes = readFileSync(fileUrl);
    assert.ok(bytes.length > 4096, id + " must be a non-trivial media file");
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
    assert.ok(statSync(fileURLToPath(fileUrl)).isFile());
  }
});

test("illustrated sprite catalog contains exactly the expected repaired families", () => {
  assert.equal(EXPECTED.length, 25);
  assert.equal(
    EXPECTED.filter(([id]) => id.includes(":sprite-cast-")).length,
    5
  );
  assert.equal(
    EXPECTED.filter(([id]) => id.includes(":sprite-impact-")).length,
    5
  );
  assert.equal(
    EXPECTED.filter(([id]) => id.includes(":sprite-projectile-")).length,
    8
  );
  assert.equal(
    EXPECTED.filter(([id]) => id.includes(":sprite-status-")).length,
    7
  );
});
