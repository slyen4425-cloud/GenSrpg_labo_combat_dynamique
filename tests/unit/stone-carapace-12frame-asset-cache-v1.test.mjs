import test from "node:test";
import assert from "node:assert/strict";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";

test("stone carapace aura 12-frame asset ships via same global-assets owner with fresh revision", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch, "global-assets");
  assert.equal(GLOBAL_VISUAL_LIBRARY.repository, "slyen4425-cloud/GenSrpg_labo_combat_dynamique");
  assert.match(GLOBAL_VISUAL_LIBRARY.revision, /^2026-10-10-v[0-9]+-/);
  const atlas = globalVisualAssetUrl("capture/sprites/skills/stone_carapace/atlases/sprite_skill_stone_carapace_aura_atlas_01.webp");
  assert.match(atlas, /\/global-assets\/assets\/library\/capture\/sprites\/skills\/stone_carapace\/atlases\/sprite_skill_stone_carapace_aura_atlas_01\.webp\?/);
  assert.equal(new URL(atlas).searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
  assert.equal(new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl).searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
});
