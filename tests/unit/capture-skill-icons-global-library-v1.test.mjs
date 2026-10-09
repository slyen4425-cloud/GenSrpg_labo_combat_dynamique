import assert from "node:assert/strict";
import test from "node:test";
import { GLOBAL_VISUAL_LIBRARY, globalVisualAssetUrl } from "../../src/assets/global-visual-library.js";

const expected=[
  [
    "pack:capture:icon-skill-blinding-ash-01",
    "capture/icons/skills/icon_skill_blinding_ash_01.webp"
  ],
  [
    "pack:capture:icon-skill-water-drop-01",
    "capture/icons/skills/icon_skill_water_drop_01.webp"
  ],
  [
    "pack:capture:icon-skill-marine-bite-01",
    "capture/icons/skills/icon_skill_marine_bite_01.webp"
  ],
  [
    "pack:capture:icon-skill-earth-carapace-01",
    "capture/icons/skills/icon_skill_earth_carapace_01.webp"
  ],
  [
    "pack:capture:icon-skill-lightning-strike-01",
    "capture/icons/skills/icon_skill_lightning_strike_01.webp"
  ],
  [
    "pack:capture:icon-skill-frost-bolt-01",
    "capture/icons/skills/icon_skill_frost_bolt_01.webp"
  ]
];

test("Capture skill icons V1 use the single global visual library", () => {
  assert.equal(GLOBAL_VISUAL_LIBRARY.repository, "slyen4425-cloud/GenSrpg_labo_combat_dynamique");
  assert.equal(GLOBAL_VISUAL_LIBRARY.branch, "global-assets");
  assert.equal(GLOBAL_VISUAL_LIBRARY.revision, "2026-10-09-v20-water-healing-bubble");

  for (const [assetId, relativePath] of expected) {
    assert.match(assetId, /^pack:capture:icon-skill-/);
    const url = new URL(globalVisualAssetUrl(relativePath));
    assert.match(url.pathname, /\/global-assets\/assets\/library\/capture\/icons\/skills\//);
    assert.ok(url.pathname.endsWith("/" + relativePath));
    assert.equal(url.searchParams.get("v"), GLOBAL_VISUAL_LIBRARY.revision);
  }
});

test("Capture skill icons V1 are presentation-only paths", () => {
  for (const [, relativePath] of expected) {
    assert.ok(relativePath.startsWith("capture/icons/skills/"));
    assert.ok(relativePath.endsWith(".webp"));
  }
});
