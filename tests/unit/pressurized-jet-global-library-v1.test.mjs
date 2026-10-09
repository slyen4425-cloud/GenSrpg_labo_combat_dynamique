import assert from "node:assert/strict";
import test from "node:test";

import {
  GLOBAL_VISUAL_LIBRARY,
  globalVisualAssetUrl
} from "../../src/assets/global-visual-library.js";

const EXPECTED = Object.freeze([
  Object.freeze([
    "pack:capture:sprite-pressurized-jet-cast-01",
    "capture/sprites/skills/pressurized_jet/atlases/sprite_skill_pressurized_jet_cast_atlas_01.webp"
  ]),
  Object.freeze([
    "pack:capture:sprite-pressurized-jet-beam-start-01",
    "capture/sprites/skills/pressurized_jet/atlases/sprite_skill_pressurized_jet_beam_start_atlas_01.webp"
  ]),
  Object.freeze([
    "pack:capture:sprite-pressurized-jet-beam-body-01",
    "capture/sprites/skills/pressurized_jet/atlases/sprite_skill_pressurized_jet_beam_body_atlas_01.webp"
  ]),
  Object.freeze([
    "pack:capture:sprite-pressurized-jet-impact-01",
    "capture/sprites/skills/pressurized_jet/atlases/sprite_skill_pressurized_jet_impact_atlas_01.webp"
  ])
]);

test("Jet pressurisé V1 resolves only through the canonical global visual library", () => {
  assert.equal(
    GLOBAL_VISUAL_LIBRARY.repository,
    "slyen4425-cloud/GenSrpg_labo_combat_dynamique"
  );
  assert.equal(
    GLOBAL_VISUAL_LIBRARY.branch,
    "global-assets"
  );
  assert.equal(
    GLOBAL_VISUAL_LIBRARY.revision,
    "2026-10-09-v20-water-healing-bubble"
  );

  for (const [assetId, relativePath] of EXPECTED) {
    assert.match(
      assetId,
      /^pack:capture:sprite-pressurized-jet-/
    );

    const url =
      new URL(globalVisualAssetUrl(relativePath));

    assert.match(
      url.pathname,
      /\/global-assets\/assets\/library\/capture\/sprites\/skills\/pressurized_jet\/atlases\//
    );
    assert.ok(
      url.pathname.endsWith("/" + relativePath)
    );
    assert.equal(
      url.searchParams.get("v"),
      GLOBAL_VISUAL_LIBRARY.revision
    );
  }
});

test("Jet pressurisé keeps cast, beam body and impact as presentation-only asset ids", () => {
  const ids = EXPECTED.map(([assetId]) => assetId);

  assert.ok(
    ids.includes(
      "pack:capture:sprite-pressurized-jet-cast-01"
    )
  );
  assert.ok(
    ids.includes(
      "pack:capture:sprite-pressurized-jet-beam-body-01"
    )
  );
  assert.ok(
    ids.includes(
      "pack:capture:sprite-pressurized-jet-impact-01"
    )
  );

  for (const [, relativePath] of EXPECTED) {
    assert.ok(relativePath.endsWith(".webp"));
    assert.doesNotMatch(
      relativePath,
      /damage|energy|cooldown|resistance|penetration/i
    );
  }
});
