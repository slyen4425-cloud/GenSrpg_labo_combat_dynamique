import assert from "node:assert/strict";
import test from "node:test";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";

test("ash smoke pack bumps the single global visual library cache revision", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.repository, "slyen4425-cloud/GenSrpg_labo_combat_dynamique");
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch, "global-assets");
  assert.equal(GLOBAL_VISUAL_LIBRARY.revision, "2026-10-06-v15-ash-smoke-vfx-pack-v1");
  assert.match(GLOBAL_VISUAL_LIBRARY.catalogUrl, /global-assets\/data\/assets\/catalog\/global-visual-assets\.v1\.json/);
  assert.equal(new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl).searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);

  const asset = globalVisualAssetUrl("capture/sprites/skills/ash_smoke/atlases/sprite_skill_ash_smoke_cast_atlas_01.webp");
  const url = new URL(asset);
  assert.match(url.pathname, /global-assets\/assets\/library\/capture\/sprites\/skills\/ash_smoke\/atlases\/sprite_skill_ash_smoke_cast_atlas_01\.webp$/);
  assert.equal(url.searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
});
