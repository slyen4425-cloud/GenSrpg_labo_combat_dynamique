import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CREATURE_PRESENTATION_BINDING_V2_VERSION,
  normalizeCreaturePresentationBindingV2,
  upgradeCreaturePresentationBindingV1ToV2
} from "../../src/contracts/creature-presentation-binding-v2.js";
import {
  normalizeCreaturePresentationBindingV1
} from "../../src/contracts/creature-presentation-binding-v1.js";
import {
  adaptCreaturePresentationBindingV2ToVisualActor
} from "../../src/adapters/input/capture/creature-presentation-to-visual-actor-v2.js";

function v1Binding() {
  return {
    id: "creature:loup",
    version: 1,
    subjectType: "creature",
    subjectId: "crea-loup",
    profileId: "quadruped",
    visual: {
      front: {
        assetId: "capture:creature-loup-front"
      },
      back: {
        assetId: "capture:creature-loup-back"
      },
      icon: {
        assetId: "capture:creature-loup-icon"
      }
    },
    sockets: [
      {
        id: "mouth",
        label: "Bouche",
        front: { x: 0.5, y: 0.2 },
        back: { x: 0.5, y: 0.2 }
      }
    ],
    audio: {}
  };
}

function v2Binding() {
  return {
    ...v1Binding(),
    version: 2,
    displayScale: 1.35
  };
}

test("CreaturePresentationBindingV2 owns persistent displayScale", () => {
  const value =
    normalizeCreaturePresentationBindingV2(
      v2Binding()
    );

  assert.equal(
    CREATURE_PRESENTATION_BINDING_V2_VERSION,
    2
  );
  assert.equal(value.version, 2);
  assert.equal(value.displayScale, 1.35);
  assert.equal(value.profileId, "quadruped");
  assert.equal(
    value.visual.front.assetId,
    "capture:creature-loup-front"
  );
  assert.equal(Object.isFrozen(value), true);
});

test("CreaturePresentationBindingV2 requires a strictly positive finite displayScale", () => {
  for (const displayScale of [
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY
  ]) {
    assert.throws(
      () =>
        normalizeCreaturePresentationBindingV2({
          ...v2Binding(),
          displayScale
        }),
      /displayScale/i
    );
  }

  const missing = v2Binding();
  delete missing.displayScale;

  assert.throws(
    () =>
      normalizeCreaturePresentationBindingV2(
        missing
      ),
    /displayScale/i
  );
});

test("CreaturePresentationBindingV1 remains unchanged and rejects displayScale", () => {
  assert.throws(
    () =>
      normalizeCreaturePresentationBindingV1({
        ...v1Binding(),
        displayScale: 1.2
      }),
    /unknown field/i
  );
});

test("explicit V1 to V2 upgrade uses displayScale 1 unless caller supplies another value", () => {
  const defaultUpgrade =
    upgradeCreaturePresentationBindingV1ToV2(
      v1Binding()
    );
  assert.equal(defaultUpgrade.version, 2);
  assert.equal(defaultUpgrade.displayScale, 1);

  const custom =
    upgradeCreaturePresentationBindingV1ToV2(
      v1Binding(),
      { displayScale: 1.6 }
    );
  assert.equal(custom.displayScale, 1.6);
});

test("presentation V2 adapter delegates scale and profile to VisualActor", () => {
  const actor =
    adaptCreaturePresentationBindingV2ToVisualActor({
      binding: v2Binding(),
      visualActor: {
        id: "actor-player",
        creatureId: "crea-loup",
        profile: "wrong-profile",
        asset: "https://example.invalid/loup.webp",
        view: "player",
        facing: "right",
        position: { x: 10, y: -5 },
        scale: 9
      }
    });

  assert.equal(actor.creatureId, "crea-loup");
  assert.equal(actor.profile, "quadruped");
  assert.equal(actor.scale, 1.35);
  assert.equal(
    actor.asset,
    "https://example.invalid/loup.webp"
  );
  assert.deepEqual(actor.position, {
    x: 10,
    y: -5
  });
});

test("presentation V2 adapter refuses creature identity mismatch", () => {
  assert.throws(
    () =>
      adaptCreaturePresentationBindingV2ToVisualActor({
        binding: v2Binding(),
        visualActor: {
          id: "actor-player",
          creatureId: "crea-other",
          profile: "quadruped",
          asset: "https://example.invalid/loup.webp",
          view: "player"
        }
      }),
    /creatureId.*subjectId/i
  );
});

test("presentation V2 contract and adapter do not resolve physical assets", async () => {
  for (const relative of [
    "../../src/contracts/creature-presentation-binding-v2.js",
    "../../src/adapters/input/capture/creature-presentation-to-visual-actor-v2.js"
  ]) {
    const source = await readFile(
      new URL(relative, import.meta.url),
      "utf8"
    );

    for (const forbidden of [
      "fetch(",
      "globalVisualAssetUrl",
      "resolveAsset",
      "document.",
      "window.",
      "Zombicide-40k"
    ]) {
      assert.equal(
        source.includes(forbidden),
        false,
        `${relative} must not contain ${forbidden}`
      );
    }
  }
});
