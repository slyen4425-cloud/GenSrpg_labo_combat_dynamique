import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildHumanSkillDraftV1
} from "../../src/ui/capture-editor-human-v2.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

function skillFields() {
  return {
    id: "fire-zone-offset",
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
      zoneDisplayScaleX: 1.4,
      zoneDisplayScaleY: 0.8,
      zoneOffsetX: 35,
      zoneOffsetY: -55,
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

test("Human Editor exports persistent-zone X/Y offsets through the existing visual slot", () => {
  const draft = buildHumanSkillDraftV1(
    skillFields()
  );
  const aura = draft.presentation.visual.aura;

  assert.equal(aura.offsetX, 35);
  assert.equal(aura.offsetY, -55);
});

test("persistent-zone renderer applies visual offsets to the authoritative source anchor", () => {
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
          url: "zone.webp",
          frameCount: 1,
          frameMs: 80,
          playbackMode: "loop",
          displayScale: 2,
          displayScaleX: 1.4,
          displayScaleY: 0.8,
          offsetX: 30,
          offsetY: -40
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
      id: "local:fire-zone-offset:zone",
      skillId: "fire-zone-offset",
      sourceActorId: "local",
      radius: "short"
    }
  ]);

  assert.equal(
    arena.children[0].style.left,
    "130px"
  );
  assert.equal(
    arena.children[0].style.top,
    "160px"
  );
  assert.equal(
    arena.children[0].style.transform,
    "translate(-50%, -50%) scale(2.8, 1.6)"
  );
});

test("Human Editor exposes simple horizontal and vertical persistent-zone position controls", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    html,
    /data-skill-zone-offset-x/
  );
  assert.match(
    html,
    /data-skill-zone-offset-y/
  );
  assert.match(
    html,
    /Décalage horizontal de la zone/
  );
  assert.match(
    html,
    /Décalage vertical de la zone/
  );
});
