import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeCreaturePresentationBindingV1
} from "../../src/contracts/creature-presentation-binding-v1.js";
import {
  CREATURE_PRESENTATION_BINDING_V2_VERSION,
  normalizeCreaturePresentationBindingV2
} from "../../src/contracts/creature-presentation-binding-v2.js";
import {
  adaptCreaturePresentationToVisualActorV1
} from "../../src/adapters/renderer/creature-presentation-to-visual-actor-v1.js";
import {
  createDomActorRenderer
} from "../../src/adapters/renderer/dom-actor-renderer.js";

function bindingV2() {
  return {
    id: "creature:loup",
    version: 2,
    subjectType: "creature",
    subjectId: "crea-loup",
    profileId: "quadruped",
    displayScale: 1.45,
    visual: {
      front: {
        assetId: "pack:capture:creature-loup-front"
      },
      back: {
        assetId: "pack:capture:creature-loup-back"
      },
      icon: {
        assetId: "pack:capture:creature-loup-icon"
      }
    },
    sockets: [],
    audio: {}
  };
}

test("CreaturePresentationBindingV2 owns explicit creature displayScale", () => {
  const value = normalizeCreaturePresentationBindingV2(bindingV2());

  assert.equal(CREATURE_PRESENTATION_BINDING_V2_VERSION, 2);
  assert.equal(value.version, 2);
  assert.equal(value.displayScale, 1.45);
  assert.equal(value.profileId, "quadruped");
  assert.equal(Object.isFrozen(value), true);
});

test("CreaturePresentationBindingV2 defaults displayScale to one and rejects invalid scale", () => {
  const defaulted = bindingV2();
  delete defaulted.displayScale;
  assert.equal(
    normalizeCreaturePresentationBindingV2(defaulted).displayScale,
    1
  );

  for (const displayScale of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const input = bindingV2();
    input.displayScale = displayScale;

    assert.throws(
      () => normalizeCreaturePresentationBindingV2(input),
      /displayScale/i
    );
  }
});

test("CreaturePresentationBindingV1 remains unchanged and does not silently accept V2 scale", () => {
  const input = bindingV2();
  input.version = 1;

  assert.throws(
    () => normalizeCreaturePresentationBindingV1(input),
    /displayScale.*unknown field/i
  );
});

test("binding V2 scale reaches the real VisualActor and DOM renderer transform", () => {
  const binding = normalizeCreaturePresentationBindingV2(bindingV2());
  const actor = adaptCreaturePresentationToVisualActorV1({
    binding,
    actorId: "local-1",
    view: "player",
    resolvedAsset: "https://assets.example/loup-back.webp",
    position: { x: 0, y: 0 }
  });

  assert.equal(actor.scale, 1.45);
  assert.equal(actor.profile, "quadruped");
  assert.equal(actor.creatureId, "crea-loup");

  const element = { style: {} };
  createDomActorRenderer({
    element,
    actor,
    animate() {
      return {
        finished: Promise.resolve(),
        cancel() {}
      };
    }
  });

  assert.match(
    element.style.transform,
    /scale\(1\.45, 1\.45\)/
  );
});

test("presentation to VisualActor adapter stays pure and requires resolved assets externally", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL(
      "../../src/adapters/renderer/creature-presentation-to-visual-actor-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  for (const forbidden of [
    "fetch(",
    "document.",
    "window.",
    "localStorage",
    "GenSrpG_audio_prive",
    "Zombicide-40k"
  ]) {
    assert.equal(source.includes(forbidden), false);
  }
});
