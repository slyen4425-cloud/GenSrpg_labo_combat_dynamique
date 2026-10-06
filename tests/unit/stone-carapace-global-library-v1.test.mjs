import assert from "node:assert/strict";
import test from "node:test";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";

test("stone carapace pack uses the single global visual library and current cache revision", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch, "global-assets");
  assert.equal(GLOBAL_VISUAL_LIBRARY.revision, "2026-10-06-v16-stone-carapace-vfx-pack-v1");

  for (const role of ["cast", "aura"]) {
    const asset = globalVisualAssetUrl(
      `capture/sprites/skills/stone_carapace/atlases/sprite_skill_stone_carapace_${role}_atlas_01.webp`
    );
    const url = new URL(asset);
    assert.match(
      url.pathname,
      new RegExp(
        `global-assets/assets/library/capture/sprites/skills/stone_carapace/atlases/sprite_skill_stone_carapace_${role}_atlas_01\\.webp$`
      )
    );
    assert.equal(url.searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
  }
});
