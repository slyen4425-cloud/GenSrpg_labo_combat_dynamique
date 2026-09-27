import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CREATURE_PRESENTATION_BINDING_VERSION,
  normalizeCreaturePresentationBindingV1
} from "../../src/contracts/creature-presentation-binding-v1.js";

function validBinding() {
  return {
    id: "creature:braiseau",
    version: 1,
    subjectType: "creature",
    subjectId: "crea-braiseau",
    profileId: "biped",
    visual: {
      front: {
        assetId: "capture:creature-braiseau-front"
      },
      back: {
        assetId: "capture:creature-braiseau-back"
      },
      icon: {
        assetId: "capture:creature-braiseau-icon"
      }
    },
    sockets: [
      {
        id: "mouth",
        label: "Bouche",
        front: { x: 0.52, y: 0.22 },
        back: { x: 0.48, y: 0.24 }
      },
      {
        id: "right-hand",
        label: "Main droite",
        front: { x: 0.62, y: 0.44 }
      }
    ],
    audio: {
      attack: {
        assetId: "core:audio-creature-attack-01",
        volume: 0.9
      },
      hit: {
        assetId: "core:audio-creature-hit-01"
      },
      ko: {
        assetId: "core:audio-creature-ko-01"
      }
    }
  };
}

test("CreaturePresentationBindingV1 normalizes full creature presentation data", () => {
  const value = normalizeCreaturePresentationBindingV1(validBinding());

  assert.equal(CREATURE_PRESENTATION_BINDING_VERSION, 1);
  assert.equal(value.subjectType, "creature");
  assert.equal(value.profileId, "biped");
  assert.equal(
    value.visual.front.assetId,
    "capture:creature-braiseau-front"
  );
  assert.equal(value.sockets[0].id, "mouth");
  assert.deepEqual(value.sockets[0].front, {
    x: 0.52,
    y: 0.22
  });
  assert.deepEqual(value.sockets[1].back, null);
  assert.equal(value.audio.attack.volume, 0.9);
  assert.equal(value.audio.hit.volume, 1);

  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.visual), true);
  assert.equal(Object.isFrozen(value.sockets), true);
  assert.equal(Object.isFrozen(value.sockets[0]), true);
  assert.equal(Object.isFrozen(value.sockets[0].front), true);
  assert.equal(Object.isFrozen(value.audio), true);
});

test("CreaturePresentationBindingV1 preserves the single-image minimum", () => {
  const input = validBinding();
  delete input.visual.back;
  delete input.visual.icon;
  input.sockets = [];
  input.audio = {};

  const value = normalizeCreaturePresentationBindingV1(input);

  assert.equal(
    value.visual.front.assetId,
    "capture:creature-braiseau-front"
  );
  assert.equal(value.visual.back, null);
  assert.equal(value.visual.icon, null);
  assert.deepEqual(value.sockets, []);
});

test("CreaturePresentationBindingV1 requires a front image asset", () => {
  const input = validBinding();
  delete input.visual.front;

  assert.throws(
    () => normalizeCreaturePresentationBindingV1(input),
    /visual\.front/i
  );
});

test("CreaturePresentationBindingV1 rejects physical paths and URLs as asset IDs", () => {
  for (const badAssetId of [
    "./assets/braiseau.png",
    "/assets/braiseau.png",
    "https://example.com/braiseau.png"
  ]) {
    const input = validBinding();
    input.visual.front.assetId = badAssetId;

    assert.throws(
      () => normalizeCreaturePresentationBindingV1(input),
      /assetId/i
    );
  }
});

test("CreaturePresentationBindingV1 requires unique socket IDs", () => {
  const input = validBinding();
  input.sockets.push({
    id: "mouth",
    label: "Duplicate",
    front: { x: 0.1, y: 0.1 }
  });

  assert.throws(
    () => normalizeCreaturePresentationBindingV1(input),
    /socket.*duplicate/i
  );
});

test("CreaturePresentationBindingV1 validates normalized socket coordinates", () => {
  const input = validBinding();
  input.sockets[0].front.x = 1.1;

  assert.throws(
    () => normalizeCreaturePresentationBindingV1(input),
    /sockets\[0\]\.front\.x/i
  );

  const negative = validBinding();
  negative.sockets[0].back.y = -0.01;

  assert.throws(
    () => normalizeCreaturePresentationBindingV1(negative),
    /sockets\[0\]\.back\.y/i
  );
});

test("CreaturePresentationBindingV1 rejects unknown audio roles", () => {
  const input = validBinding();
  input.audio.cast = {
    assetId: "core:audio-cast-01"
  };

  assert.throws(
    () => normalizeCreaturePresentationBindingV1(input),
    /audio.*unknown field/i
  );
});

test("CreaturePresentationBindingV1 rejects unknown semantic fields", () => {
  const input = validBinding();
  input.socketAutoDetect = true;

  assert.throws(
    () => normalizeCreaturePresentationBindingV1(input),
    /unknown field/i
  );
});

test("CreaturePresentationBindingV1 stays independent from renderer, UI, storage and GenSrpG", async () => {
  const source = await readFile(
    new URL(
      "../../src/contracts/creature-presentation-binding-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "document.",
    "window.",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "fetch(",
    "XMLHttpRequest",
    "Zombicide-40k",
    "captureFix",
    "combat-runtime",
    "renderer/"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      `contract source must not contain ${forbidden}`
    );
  }
});
