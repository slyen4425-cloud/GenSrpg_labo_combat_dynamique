import test from "node:test";
import assert from "node:assert/strict";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";
import { createGlobalPresentationAssetResolverV1 } from "../../src/assets/global-presentation-asset-resolver-v1.js";

// Verified against the actual canonical global-assets catalog at
// d8ad7ec060efe767b9f62c06314c1ac4f578e4e5 (media PR #26).
const projectile = Object.freeze({
  id: "pack:capture:sprite-steel-wing-projectile-01",
  label: "Aile acier — Projectile",
  assetType: "sprite",
  category: "travel",
  resource: {
    file: "capture/sprites/skills/steel_wing_projectile/atlases/sprite_skill_steel_wing_projectile_projectile_atlas_01.webp",
    format: "sprite-strip",
    mime: "image/webp",
    frameCount: 20,
    frameMs: 65,
    playbackMode: "once"
  }
});

test("steel wing replacement refreshes existing canonical media without changing gameplay or paths", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.repository, "slyen4425-cloud/GenSrpg_labo_combat_dynamique");
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch, "global-assets");
  assert.ok(GLOBAL_VISUAL_LIBRARY.revision.length > 0);
  const catalogURL = new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl);
  assert.ok(catalogURL.pathname.endsWith("/global-assets/data/assets/catalog/global-visual-assets.v1.json"));
  assert.equal(catalogURL.searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
  const resolve = createGlobalPresentationAssetResolverV1({
    assetCatalog: { assets: [projectile] },
    assetUrlForFile: globalVisualAssetUrl
  });
  const asset = resolve(projectile.id);
  assert.ok(asset);
  assert.equal(asset.assetId, projectile.id);
  assert.equal(asset.frameCount, 20);
  assert.equal(asset.frameMs, 65);
  assert.equal(asset.playbackMode, "once");
  const resourceURL = new URL(asset.url);
  assert.ok(resourceURL.pathname.endsWith("/global-assets/assets/library/" + projectile.resource.file));
  assert.equal(resourceURL.searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
  assert.equal(resolve("pack:capture:sprite-steel-wing-impact-01"), null);
});
