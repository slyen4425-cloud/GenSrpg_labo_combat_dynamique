import test from "node:test";
import assert from "node:assert/strict";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";

test("Gorilla charge 12-frame asset uses the sole current Capture catalog and fresh revision", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.repository, "slyen4425-cloud/GenSrpg_labo_combat_dynamique");
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch, "global-assets");
  const match = GLOBAL_VISUAL_LIBRARY.revision.match(/^\d{4}-\d{2}-\d{2}-v(\d+)-[a-z0-9-]+$/);
  assert.ok(match && Number(match[1]) >= 51, "Gorilla charged animation requires catalog revision v51+");
  const catalog = new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl);
  assert.ok(catalog.pathname.endsWith("/global-assets/data/assets/catalog/global-visual-assets.v1.json"));
  assert.equal(catalog.searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
  const sprite = "capture/creatures/gorille_des_glaces/animations/attack/player/atlases/gorille_des_glaces_charge_player_12_atlas.webp";
  const url = new URL(globalVisualAssetUrl(sprite));
  assert.ok(url.pathname.endsWith("/global-assets/assets/library/" + sprite));
  assert.equal(url.searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
});
