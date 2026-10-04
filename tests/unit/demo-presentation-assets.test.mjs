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


test("all five combat arenas resolve only through canonical Core assets", () => {
  const expected = Object.freeze({
    forest: Object.freeze({
      assetId: "core:arena-forest-01",
      path: "/assets/library/core/arenas/forest/arena_forest_01.png"
    }),
    cave: Object.freeze({
      assetId: "core:arena-cave-01",
      path: "/assets/library/core/arenas/cave/arena_cave_01.webp"
    }),
    snow: Object.freeze({
      assetId: "core:arena-snow-01",
      path: "/assets/library/core/arenas/snow/arena_snow_01.webp"
    }),
    city: Object.freeze({
      assetId: "core:arena-city-01",
      path: "/assets/library/core/arenas/city/arena_city_01.webp"
    }),
    lava: Object.freeze({
      assetId: "core:arena-lava-01",
      path: "/assets/library/core/arenas/lava/arena_lava_01.webp"
    })
  });

  for (const [arenaId, expectedArena] of Object.entries(expected)) {
    const presentation = demoPresentationAssets.presentationForArena(arenaId);
    assert.ok(presentation, arenaId + " should have a presentation binding");
    assert.equal(presentation.background?.assetId, expectedArena.assetId);

    const url = new URL(presentation.background?.url);
    assert.ok(
      url.pathname.endsWith(expectedArena.path),
      arenaId + " should resolve its canonical Core arena file"
    );
    assert.equal(
      url.searchParams.get("v"),
      "2026-10-04-v11-cast-status-source-alpha-v1",
      arenaId + " should use the arena refresh cache revision"
    );
  }

  assert.equal(
    demoPresentationAssets.presentationForArena("unknown-arena"),
    null
  );

  const city = demoPresentationAssets.presentationForArena("city");
  assert.equal(city.backgroundPosition, "center bottom");
  assert.equal(city.backgroundSize, "auto 100%");
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


test("combat visual assets resolve from the stable global-assets branch", () => {
  assert.equal(
    demoPresentationAssets.globalLibrary.branch,
    "global-assets"
  );
  assert.match(
    demoPresentationAssets.globalLibrary.baseUrl,
    /GenSrpg_labo_combat_dynamique\/global-assets\/assets\/library\/$/
  );

  for (const assetId of [
    "pack:capture:sprite-impact-blade-01",
    "pack:capture:sprite-impact-electric-01",
    "pack:capture:sprite-impact-nature-01",
    "pack:capture:sprite-impact-physical-01",
    "pack:capture:sprite-impact-water-01",
    "pack:capture:sprite-projectile-earth-01",
    "pack:capture:sprite-projectile-electric-01",
    "pack:capture:sprite-projectile-fire-01",
    "pack:capture:sprite-projectile-ice-01",
    "pack:capture:sprite-projectile-light-01",
    "pack:capture:sprite-projectile-shadow-01",
    "pack:capture:sprite-projectile-thorn-01",
    "pack:capture:sprite-projectile-water-01",
    "pack:capture:sprite-cast-blade-01",
    "pack:capture:sprite-cast-electric-01",
    "pack:capture:sprite-cast-nature-01",
    "pack:capture:sprite-cast-physical-01",
    "pack:capture:sprite-cast-water-01"
  ]) {
    const asset = demoPresentationAssets.asset(assetId);
    assert.ok(asset, `${assetId} should resolve from global library`);
    assert.equal(asset.frames, undefined);
    assert.equal(asset.atlas, undefined);
    assert.equal(asset.frameCount, 8);
    assert.match(
      asset.url ?? "",
      /\/global-assets\/assets\/library\/capture\/sprites\/(?:casts|impacts|projectiles)\/[^/]+\/atlases\/sprite_[^/]+_atlas_01\.webp/
    );
    assert.doesNotMatch(
      asset.url ?? "",
      /\.svg(?:\?|$)/
    );
  }
});

test("diagonal projectile artwork exposes head alignment while the dedicated fireball remains unchanged", () => {
  for (const name of ["fire","water","earth","thorn","electric","ice","light","shadow"]) {
    const asset = demoPresentationAssets.asset("pack:capture:sprite-projectile-" + name + "-01");
    assert.ok(asset.headingRad < -0.35 && asset.headingRad > -0.6, "NE source direction must rotate onto the native travel path");
    assert.ok(asset.coreAnchor.x > 0.6 && asset.coreAnchor.x < 0.8, "principal head is in the right part of the padded phase");
    assert.ok(asset.coreAnchor.y > 0.3 && asset.coreAnchor.y < 0.5, "principal head is above the frame center");
  }
  const fireball = demoPresentationAssets.asset("pack:capture:sprite-fireball-travel-01");
  assert.equal(fireball.headingRad, Math.PI);
  assert.deepEqual(fireball.coreAnchor, { x: 0.29, y: 0.5 });
  assert.equal(fireball.displayScale, 2.8);
});
