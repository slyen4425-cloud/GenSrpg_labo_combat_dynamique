import test from "node:test";
import assert from "node:assert/strict";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";

test("Gorille charge opponent 12f uses unique global-assets catalog and a new cache revision", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.repository, "slyen4425-cloud/GenSrpg_labo_combat_dynamique");
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch, "global-assets");
  const version = GLOBAL_VISUAL_LIBRARY.revision.match(/^2026-11-03-v(\d+)-[a-z0-9-]+$/);
  assert.ok(version && Number(version[1]) >= 52, "opponent 12f requires new catalogue revision v52+");
  const catalogUrl = new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl);
  assert.ok(catalogUrl.pathname.endsWith("/global-assets/data/assets/catalog/global-visual-assets.v1.json"));
  assert.equal(catalogUrl.searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
  const atlas = "capture/creatures/gorille_des_glaces/animations/attack/opponent/atlases/gorille_des_glaces_charge_opponent_12_atlas.webp";
  const assetUrl = new URL(globalVisualAssetUrl(atlas));
  assert.ok(assetUrl.pathname.endsWith("/global-assets/assets/library/" + atlas));
  assert.equal(assetUrl.searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
});
