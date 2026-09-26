import assert from "node:assert/strict";
import test from "node:test";

import { demoPresentationAssets } from "../../examples/dom-demo/demo-assets.js";

const EXPECTED_SKILL_ICONS = Object.freeze({
  fireball: Object.freeze({
    assetId: "pack:capture:icon-skill-fireball-01",
    file: "assets/library/capture/icons/skills/icon_skill_fireball_01.webp"
  }),
  claw: Object.freeze({
    assetId: "core:icon-skill-claw-01",
    file: "assets/library/core/icons/skills/icon_skill_claw_01.webp"
  }),
  "aerial-dive": Object.freeze({
    assetId: "core:icon-skill-aerial-dive-01",
    file: "assets/library/core/icons/skills/icon_skill_aerial_dive_01.webp"
  }),
  "teleport-strike": Object.freeze({
    assetId: "core:icon-skill-teleport-strike-01",
    file: "assets/library/core/icons/skills/icon_skill_teleport_strike_01.webp"
  })
});

test("demo skill bindings expose an icon for every active offensive skill", () => {
  for (const [skillId, expected] of Object.entries(EXPECTED_SKILL_ICONS)) {
    const presentation = demoPresentationAssets.presentationForSkill(skillId);

    assert.ok(presentation, `${skillId} should have a presentation binding`);
    assert.equal(presentation.icon?.assetId, expected.assetId);
    assert.ok(
      presentation.icon?.url.endsWith(expected.file),
      `${skillId} should resolve its canonical library icon`
    );
  }
});

test("temporary skill sprite bindings resolve typed library sequences", () => {
  const claw = demoPresentationAssets.presentationForSkill("claw");
  assert.equal(
    claw.impact?.assetId,
    "pack:capture:sprite-claw-impact-01"
  );
  assert.equal(claw.impact?.frames.length, 8);
  assert.equal(claw.impact?.displayScale, 2.2);
  assert.match(claw.impact?.frames[0], /_01\.png$/);
  assert.match(claw.impact?.frames[7], /_08\.svg$/);
  assert.equal(claw.cast, null);
  assert.equal(claw.travel, null);

  const aerial =
    demoPresentationAssets.presentationForSkill("aerial-dive");
  assert.equal(
    aerial.cast?.assetId,
    "pack:capture:sprite-teleportation-1"
  );
  assert.equal(aerial.cast?.frames.length, 8);
  assert.equal(aerial.cast?.displayScale, 3);
  assert.equal(aerial.cast?.playbackMode, "loop");
  assert.equal(
    aerial.impact?.assetId,
    "pack:capture:sprite-claw-impact-01"
  );

  const teleport =
    demoPresentationAssets.presentationForSkill("teleport-strike");
  assert.equal(
    teleport.phaseFx["teleport-vanish"]?.assetId,
    "pack:capture:sprite-teleportation-2"
  );
  assert.equal(
    teleport.phaseFx["teleport-return-vanish"]?.assetId,
    "pack:capture:sprite-teleportation-2"
  );
  assert.equal(
    teleport.phaseFx["teleport-vanish"]?.frames.length,
    8
  );
  assert.equal(
    teleport.phaseFx["teleport-vanish"]?.displayScale,
    2.1
  );
});


test("forest arena resolves through presentation assets only", () => {
  const presentation = demoPresentationAssets.presentationForArena("forest");

  assert.ok(presentation);
  assert.equal(
    presentation.background?.assetId,
    "core:arena-forest-01"
  );
  assert.ok(
    presentation.background?.url.endsWith(
      "assets/library/core/arenas/forest/arena_forest_01.png"
    )
  );
  assert.equal(
    demoPresentationAssets.presentationForArena("unknown-arena"),
    null
  );
});


test("fireball cast layer is data-driven by source view", () => {
  assert.equal(
    demoPresentationAssets.presentationForSkill(
      "fireball",
      { sourceView: "player" }
    ).castLayer,
    "behind"
  );
  assert.equal(
    demoPresentationAssets.presentationForSkill(
      "fireball",
      { sourceView: "opponent" }
    ).castLayer,
    "front"
  );
});


test("demo audio bindings resolve runtime URLs by stable asset id", () => {
  const fireball = demoPresentationAssets.presentationForSkill("fireball");
  const claw = demoPresentationAssets.presentationForSkill("claw");
  const aerial = demoPresentationAssets.presentationForSkill("aerial-dive");
  const teleport =
    demoPresentationAssets.presentationForSkill("teleport-strike");

  assert.equal(
    fireball.castSound?.assetId,
    "gensrpg:sound:fire-cast-01"
  );
  assert.match(fireball.castSound?.url, /fire_cast\.mp3$/);

  assert.equal(
    claw.impactSound?.assetId,
    "gensrpg:sound:melee-impact-01"
  );
  assert.match(claw.impactSound?.url, /melee_impact\.mp3$/);

  assert.equal(
    aerial.castSound?.assetId,
    "gensrpg:sound:teleport-01"
  );
  assert.match(aerial.castSound?.url, /teleport\.mp3$/);

  assert.equal(
    teleport.phaseSound["teleport-vanish"]?.assetId,
    "gensrpg:sound:teleport-01"
  );
  assert.equal(
    teleport.phaseSound["teleport-return-vanish"]?.assetId,
    "gensrpg:sound:teleport-01"
  );

  assert.equal(
    demoPresentationAssets.audioAsset(
      "gensrpg:sound:fire-cast-01"
    )?.mediaType,
    "audio"
  );
});


test("every active offensive demo skill exposes a provisional impact sound", () => {
  for (const skillId of [
    "fireball",
    "claw",
    "aerial-dive",
    "teleport-strike"
  ]) {
    const presentation =
      demoPresentationAssets.presentationForSkill(skillId);
    assert.equal(
      presentation.impactSound?.assetId,
      "gensrpg:sound:melee-impact-01",
      `${skillId} should expose a target impact sound`
    );
    assert.match(
      presentation.impactSound?.url,
      /melee_impact\.mp3$/
    );
  }
});
