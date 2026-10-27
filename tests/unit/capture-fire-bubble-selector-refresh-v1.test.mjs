import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  captureEditorAssetMatchesRoleV1
} from "../../src/ui/capture-editor-human-v2.js";
import {
  GLOBAL_VISUAL_LIBRARY,
  globalVisualAssetUrl
} from "../../src/assets/global-visual-library.js";

// This fixture represents the authoritative global-assets catalog entry.
// The binary/atlas remains owned by the separate global-assets branch.
const fireBubble = Object.freeze({
  id: "pack:capture:sprite-fire-bubble-expansion-01",
  label: "Bulle de feu expansive",
  assetType: "sprite",
  mediaType: "image",
  category: "skill",
  tags: ["skill", "fire", "expanding", "sphere", "ground", "aerial", "zone", "animated", "capture", "hd"],
  compatibility: { uses: ["combat", "capture", "editor"] }
});

test("expanding skill wave is selectable in the real travel/projectile asset role", () => {
  assert.equal(captureEditorAssetMatchesRoleV1(fireBubble, "travel"), true);
  assert.equal(captureEditorAssetMatchesRoleV1(fireBubble, "creature"), false);
  assert.equal(captureEditorAssetMatchesRoleV1(fireBubble, "icon"), false);

  // Preserve historic projectile visibility and avoid broadening to arbitrary skill FX.
  const conventionalTravel = { ...fireBubble, category: "travel", tags: ["fire", "projectile"] };
  const ordinarySkill = { ...fireBubble, category: "skill", tags: ["fire", "impact"] };
  const creature = { ...fireBubble, category: "creature", tags: ["creature", "expanding"] };
  assert.equal(captureEditorAssetMatchesRoleV1(conventionalTravel, "travel"), true);
  assert.equal(captureEditorAssetMatchesRoleV1(ordinarySkill, "travel"), false);
  assert.equal(captureEditorAssetMatchesRoleV1(creature, "travel"), false);
});

test("published visual catalog revision is shared by current asset URLs and keeps historical fire-bubble URLs", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch, "global-assets");
  assert.match(GLOBAL_VISUAL_LIBRARY.revision, /^\d{4}-\d{2}-\d{2}-v\d+-[a-z0-9-]+$/);
  const catalogUrl = new URL(GLOBAL_VISUAL_LIBRARY.catalogUrl);
  assert.equal(catalogUrl.searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
  const atlasUrl = new URL(globalVisualAssetUrl("capture/sprites/skills/fire_bubble_expansion/atlases/sprite_skill_fire_bubble_expansion_atlas_01.webp"));
  assert.ok(atlasUrl.pathname.includes("/global-assets/assets/library/capture/sprites/skills/fire_bubble_expansion/atlases/"));
  assert.equal(atlasUrl.searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
});

test("native skill editor connects its projectile selector to the travel role without a second library", async () => {
  const html = await readFile(
    new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8"
  );
  assert.match(html, /data-skill-travel-fx data-asset-role="travel"/);
  assert.match(html, /<option value="expanding_wave">Onde sphérique expansive/);
});
