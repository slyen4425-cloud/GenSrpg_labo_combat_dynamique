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
    id: "fireball",
    name: "Boule de feu",
    description: "Projectile de feu.",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "projectile",
    element: "fire",
    approachMode: "none",
    energyCost: 3,
    preparationMs: 100,
    travelMs: 300,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: ["medium", "long"],
    targetRelations: ["enemy"],
    damage: 4,
    heal: 0,
    stunMs: 0,
    interruptsPreparation: false,
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    projectileClash: {
      mode: "none",
      group: null,
      interactsWith: []
    },
    presentation: {
      iconAssetId: "core:icon-skill-fireball-01",
      castAssetId: null,
      travelAssetId: "pack:capture:sprite-projectile-fire-01",
      impactAssetId: null,
      socketId: "mouth",
      castLayerPlayer: "behind",
      castLayerOpponent: "front",
      travelLayerPlayer: "behind",
      travelLayerOpponent: "front",
      castAudioAssetId: null,
      impactAudioAssetId: null
    }
  };
}

function fakeElement(rect = { left: 0, top: 0, width: 20, height: 20 }) {
  return {
    className: "",
    dataset: {},
    style: {},
    children: [],
    ownerDocument: null,
    append(child) {
      this.children.push(child);
    },
    remove() {},
    getBoundingClientRect() {
      return rect;
    }
  };
}

test("human skill presentation V2 preserves configured projectile layers by view", () => {
  const draft = buildHumanSkillDraftV1(skillFields());

  assert.equal(
    draft.presentation.version,
    2
  );
  assert.deepEqual(
    draft.presentation.visual.travel.layerByView,
    {
      player: "behind",
      opponent: "front"
    }
  );
});

test("projectile renderer applies the existing behind layer class", () => {
  const arena = fakeElement({
    left: 0,
    top: 0,
    width: 300,
    height: 200
  });
  const source = fakeElement({
    left: 20,
    top: 80,
    width: 20,
    height: 20
  });
  const target = fakeElement({
    left: 240,
    top: 80,
    width: 30,
    height: 30
  });

  arena.ownerDocument = {
    createElement() {
      const node = fakeElement({
        left: 20,
        top: 80,
        width: 16,
        height: 16
      });
      node.ownerDocument = arena.ownerDocument;
      return node;
    }
  };

  const animation = {
    finished: new Promise(() => {}),
    cancel() {}
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors: {
      local: source,
      enemy: target
    },
    targetAnchors: {
      local: source,
      enemy: target
    },
    presentationForSkill() {
      return {
        travel: {
          assetId: "pack:capture:sprite-projectile-fire-01",
          url: "https://assets.example/projectile.png",
          displayScale: 1
        },
        travelLayer: "behind"
      };
    },
    animate() {
      return animation;
    },
    requestFrame() {
      return null;
    },
    cancelFrame() {}
  });

  renderer.play({
    type: "projectile",
    skillId: "fireball",
    element: "fire",
    fromSlot: "local",
    targetSlot: "enemy",
    durationMs: 300
  });

  const projectile = arena.children.at(-1);
  assert.ok(projectile);
  assert.match(
    projectile.className,
    /skill-fx--layer-behind/
  );

  renderer.dispose();
});

test("Capture editor exposes player/opponent projectile depth controls", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    html,
    /data-skill-travel-layer-player/
  );
  assert.match(
    html,
    /data-skill-travel-layer-opponent/
  );
  assert.match(
    html,
    /data-skill-cast-layer-player/
  );
  assert.match(
    html,
    /data-skill-cast-layer-opponent/
  );
  assert.match(html, /Derrière la créature/);
});

test("native skill presentation adapter resolves exported bindings for the renderer", async () => {
  const module = await import(
    "../../src/adapters/renderer/capture-skill-presentation-assets-v1.js"
  );

  assert.equal(
    typeof module.createCaptureSkillPresentationAssetsV1,
    "function"
  );

  const assets =
    module.createCaptureSkillPresentationAssetsV1({
      skillPresentations: {
        fireball: {
          id: "skill:fireball",
          version: 1,
          subjectType: "skill",
          subjectId: "fireball",
          visual: {
            travel: {
              assetId: "pack:capture:sprite-projectile-fire-01",
              displayScale: 1,
              attachment: "trajectory",
              anchor: "mouth",
              offsetX: 0,
              offsetY: 0,
              layer: "behind",
              trigger: "travel-start",
              playbackMode: "once",
              rotationDeg: 0,
              opacity: 1
            }
          },
          audio: {}
        }
      },
      assetForId(assetId) {
        return {
          assetId,
          url: "https://assets.example/projectile.png"
        };
      }
    });

  const presentation =
    assets.presentationForSkill("fireball");

  assert.equal(presentation.travelLayer, "behind");
  assert.equal(
    presentation.travel.assetId,
    "pack:capture:sprite-projectile-fire-01"
  );
  assert.equal(
    presentation.travel.url,
    "https://assets.example/projectile.png"
  );
});
