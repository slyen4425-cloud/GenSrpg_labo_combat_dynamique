import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildHumanSkillDraftV1
} from "../../src/ui/capture-editor-human-v2.js";
import {
  demoPresentationAssets
} from "../../examples/dom-demo/demo-assets.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

function skillFields() {
  return {
    id: "fire-zone-v2",
    name: "Zone de feu",
    description: "Zone persistante.",
    requiredLevel: 1,
    loadoutSlot: "ultimate",
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "aura",
    element: "fire",
    approachMode: "none",
    energyCost: 0,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effects: [],
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    projectileClash: { power: 0 },
    presentation: {
      iconAssetId: null,
      castAssetId: null,
      castDisplayScale: 1,
      travelAssetId: null,
      travelDisplayScale: 1,
      castLayerPlayer: "front",
      castLayerOpponent: "front",
      travelLayerPlayer: "front",
      travelLayerOpponent: "front",
      impactAssetId: null,
      impactDisplayScale: 1,
      zoneAssetId:
        "pack:capture:sprite-fire-zone-loop-01",
      zoneDisplayScale: 2,
      zoneDisplayScaleX: 1.5,
      zoneDisplayScaleY: 0.75,
      socketId: null,
      castAudioAssetId: null,
      impactAudioAssetId: null
    }
  };
}

function fakeElement(rect = {
  left: 0,
  top: 0,
  width: 20,
  height: 20
}) {
  return {
    className: "",
    dataset: {},
    style: {},
    children: [],
    ownerDocument: null,
    append(child) {
      this.children.push(child);
    },
    remove() {
      this.removed = true;
    },
    getBoundingClientRect() {
      return rect;
    }
  };
}

test("fire-zone asset keeps its eight canonical frames and loop metadata", () => {
  const asset = demoPresentationAssets.asset(
    "pack:capture:sprite-fire-zone-loop-01"
  );

  assert.ok(asset);
  assert.equal(asset.frames.length, 8);
  assert.equal(asset.frameMs, 80);
  assert.equal(asset.playbackMode, "loop");
});

test("looping multi-file sprite uses dedicated frame layers instead of WAAPI background-image swapping", () => {
  const arena = fakeElement({
    left: 0,
    top: 0,
    width: 400,
    height: 300
  });
  const source = fakeElement({
    left: 80,
    top: 180,
    width: 40,
    height: 40
  });
  arena.ownerDocument = {
    createElement() {
      const node = fakeElement();
      node.ownerDocument = arena.ownerDocument;
      return node;
    }
  };

  const animations = [];
  const renderer = createDomSkillFxRenderer({
    arena,
    anchors: { local: source },
    targetAnchors: { local: source },
    presentationForSkill() {
      return {
        persistentZone: {
          assetId: "fire-zone-loop",
          frames: ["f1.webp", "f2.webp", "f3.webp"],
          frameMs: 80,
          playbackMode: "loop",
          displayScale: 1
        },
        persistentZoneLayer: "behind"
      };
    },
    animate(_element, keyframes, options) {
      animations.push({ keyframes, options });
      return {
        finished: new Promise(() => {}),
        cancel() {}
      };
    },
    requestFrame() {
      return null;
    },
    cancelFrame() {}
  });

  renderer.syncPersistentZones([
    {
      id: "local:fire-zone-v2:zone",
      skillId: "fire-zone-v2",
      sourceActorId: "local",
      radius: "short"
    }
  ]);

  const node = arena.children[0];
  assert.equal(node.children.length, 3);
  assert.equal(
    node.children[0].className,
    "skill-fx__loop-frame"
  );
  assert.equal(animations.length, 3);
  for (const animation of animations) {
    assert.equal(animation.options.duration, 240);
    assert.equal(animation.options.iterations, Infinity);
    assert.equal(
      animation.keyframes.some(
        (frame) =>
          Object.prototype.hasOwnProperty.call(
            frame,
            "backgroundImage"
          )
      ),
      false,
      "mobile loop must animate opacity layers, not backgroundImage resources"
    );
    assert.equal(
      animation.keyframes.some(
        (frame) =>
          Object.prototype.hasOwnProperty.call(
            frame,
            "opacity"
          )
      ),
      true
    );
  }
});

test("persistent-zone presentation preserves independent width and height scales", () => {
  const draft = buildHumanSkillDraftV1(
    skillFields()
  );
  const aura = draft.presentation.visual.aura;

  assert.equal(aura.displayScale, 2);
  assert.equal(aura.displayScaleX, 1.5);
  assert.equal(aura.displayScaleY, 0.75);
});

test("persistent-zone renderer applies radius with independent X/Y scale", () => {
  const arena = fakeElement({
    left: 0,
    top: 0,
    width: 400,
    height: 300
  });
  const source = fakeElement({
    left: 80,
    top: 180,
    width: 40,
    height: 40
  });
  arena.ownerDocument = {
    createElement() {
      const node = fakeElement();
      node.ownerDocument = arena.ownerDocument;
      return node;
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors: { local: source },
    targetAnchors: { local: source },
    presentationForSkill() {
      return {
        persistentZone: {
          assetId:
            "pack:capture:sprite-fire-zone-loop-01",
          frames: ["f1.webp", "f2.webp"],
          frameMs: 80,
          playbackMode: "loop",
          displayScale: 2,
          displayScaleX: 1.5,
          displayScaleY: 0.75
        },
        persistentZoneLayer: "behind"
      };
    },
    animate() {
      return {
        finished: new Promise(() => {}),
        cancel() {}
      };
    },
    requestFrame() {
      return null;
    },
    cancelFrame() {}
  });

  renderer.syncPersistentZones([
    {
      id: "local:fire-zone-v2:zone",
      skillId: "fire-zone-v2",
      sourceActorId: "local",
      radius: "medium"
    }
  ]);

  assert.equal(
    arena.children[0].style.transform,
    "translate(-50%, -50%) scale(4.35, 2.175)"
  );
});

test("Human Editor uses size wording instead of misleading duration refresh wording for persistent zones", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );
  const start = source.indexOf(
    'zoneReactivation.dataset'
  );
  const end = source.indexOf(
    "zoneBox.append(",
    start
  );
  assert.ok(start >= 0 && end > start);
  const block = source.slice(start, end);

  assert.match(block, /Garder la même taille/);
  assert.match(block, /Agrandir la zone/);
  assert.doesNotMatch(block, /Rafraîchir la durée/);
  assert.doesNotMatch(block, /Renforcer la zone/);
  assert.match(
    block,
    /Toute réactivation renouvelle la durée/
  );
});

test("Human Editor exposes wider global and independent width/height zone scales", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    html,
    /<input[^>]*max="8"[^>]*data-skill-zone-scale>/
  );
  assert.match(
    html,
    /data-skill-zone-scale-x/
  );
  assert.match(
    html,
    /data-skill-zone-scale-y/
  );
});
