import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createCaptureRuntimePresentationAssetsV1
} from "../../src/adapters/presentation/capture-runtime-presentation-assets-v1.js";
import {
  demoPresentationAssets
} from "../../examples/dom-demo/demo-assets.js";

async function transfer(name) {
  return JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/showcase/" +
          name +
          ".capture-skill-transfer-v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
}

test("configured Fireball presentation overrides legacy demo binding and preserves configured layers and scale", async () => {
  const fireball = await transfer("fireball");
  const assets =
    createCaptureRuntimePresentationAssetsV1({
      baseAssets: demoPresentationAssets,
      skillPresentations: {
        fireball: fireball.draft.presentation
      }
    });

  const presentation =
    assets.presentationForSkill(
      "fireball",
      { view: "player" }
    );

  assert.equal(
    presentation.icon.assetId,
    "core:icon-skill-fireball-01"
  );
  assert.equal(
    presentation.cast.assetId,
    "pack:capture:sprite-fireball-cast-01"
  );
  assert.equal(
    presentation.cast.displayScale,
    2
  );
  assert.equal(
    presentation.castAnchor,
    "mouth"
  );
  assert.equal(
    presentation.castLayer,
    "behind"
  );
  assert.equal(
    presentation.travel.assetId,
    "pack:capture:sprite-fireball-travel-01"
  );
  assert.equal(
    presentation.travelSourceAnchor,
    "mouth"
  );
  assert.equal(
    presentation.impact.assetId,
    "pack:capture:sprite-fireball-impact-01"
  );
});

test("configured status visual resolves the authored sprite presentation", async () => {
  const cendre =
    await transfer("cap_fire_special_1");
  const assets =
    createCaptureRuntimePresentationAssetsV1({
      baseAssets: demoPresentationAssets,
      skillPresentations: {
        cap_fire_special_1:
          cendre.draft.presentation
      }
    });

  const status =
    assets.statusPresentationFor(
      "cap_fire_special_1:1"
    );

  assert.equal(status.mode, "sprite");
  assert.equal(status.tintColor, "#e84b32");
  assert.equal(status.tintOpacity, 0.35);
  assert.equal(
    status.sprite.assetId,
    "pack:capture:sprite-teleportation-2"
  );
  assert.equal(status.sprite.displayScale, 3);
  assert.equal(status.sprite.opacity, 0.85);
});

test("configured aura is projected to the persistent-zone renderer contract", async () => {
  const ultimate =
    await transfer("cap_fire_atk_6");
  const assets =
    createCaptureRuntimePresentationAssetsV1({
      baseAssets: demoPresentationAssets,
      skillPresentations: {
        cap_fire_atk_6:
          ultimate.draft.presentation
      }
    });

  const presentation =
    assets.presentationForSkill(
      "cap_fire_atk_6",
      { view: "player" }
    );

  assert.equal(
    presentation.icon.assetId,
    "core:icon-skill-fire-breath-01"
  );
  assert.equal(
    presentation.persistentZone.assetId,
    "pack:capture:sprite-fire-zone-loop-01"
  );
  assert.equal(
    presentation.persistentZone.displayScale,
    3.5
  );
  assert.equal(
    presentation.persistentZone.displayScaleX,
    2.3
  );
  assert.equal(
    presentation.persistentZone.offsetY,
    -50
  );
  assert.equal(
    presentation.persistentZoneLayer,
    "behind"
  );
});

test("unconfigured skill keeps the explicit demo fallback", () => {
  const assets =
    createCaptureRuntimePresentationAssetsV1({
      baseAssets: demoPresentationAssets,
      skillPresentations: {}
    });

  const claw =
    assets.presentationForSkill(
      "claw",
      { view: "player" }
    );

  assert.equal(
    claw.icon.assetId,
    "core:icon-skill-claw-01"
  );
  assert.equal(
    claw.impact.assetId,
    "pack:capture:sprite-claw-impact-01"
  );
});

test("demo global asset resolver exposes all showcase skill icons referenced by configured Loup skills", () => {
  for (const assetId of [
    "core:icon-skill-fireball-01",
    "core:icon-skill-poison-cloud-01",
    "core:icon-skill-fire-rain-01",
    "core:icon-skill-fire-breath-01"
  ]) {
    const asset =
      demoPresentationAssets.asset(assetId);
    assert.ok(asset, assetId);
    assert.equal(asset.assetId, assetId);
    assert.match(asset.url, /^https:\/\//);
  }
});
