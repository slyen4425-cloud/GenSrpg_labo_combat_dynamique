import assert from "node:assert/strict";
import test from "node:test";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";

test("frost bolt pack uses the single global visual library and current cache revision", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.repository, "slyen4425-cloud/GenSrpg_labo_combat_dynamique");
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch, "global-assets");
  assert.equal(GLOBAL_VISUAL_LIBRARY.revision, "2026-10-06-v17-frost-bolt-vfx-pack-v1");

  const expected = [
    ["cast", "sprite_skill_frost_bolt_cast_atlas_01.webp"],
    ["projectile", "sprite_skill_frost_bolt_projectile_atlas_01.webp"],
    ["impact", "sprite_skill_frost_bolt_impact_atlas_01.webp"],
    ["status_aura", "sprite_skill_frost_bolt_status_aura_atlas_01.webp"]
  ];
  for (const [, file] of expected) {
    const url = new URL(globalVisualAssetUrl("capture/sprites/skills/frost_bolt/atlases/" + file));
    assert.match(url.pathname, /\/global-assets\/assets\/library\/capture\/sprites\/skills\/frost_bolt\/atlases\//);
    assert.ok(url.pathname.endsWith("/" + file));
    assert.equal(url.searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
  }
});
