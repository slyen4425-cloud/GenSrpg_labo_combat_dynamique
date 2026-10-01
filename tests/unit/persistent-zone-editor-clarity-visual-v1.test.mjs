import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildHumanSkillDraftV1
} from "../../src/ui/capture-editor-human-v2.js";
import {
  createCaptureSkillPresentationAssetsV2
} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

function baseSkillFields() {
  return {
    id: "aura-fire",
    name: "Aura de feu",
    description: "Zone de feu persistante.",
    requiredLevel: 1,
    loadoutSlot: "standard",
    usageScopes: ["capture", "combat"],
    category: "offensive",
    form: "aura",
    element: "fire",
    approachMode: "none",
    energyCost: 2,
    preparationMs: 0,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effects: [
      {
        kind: "persistent_zone",
        targetScope: "all_enemies",
        zoneId: "fire-aura",
        radius: "short",
        durationSeconds: 8,
        tickSeconds: 2,
        reactivation: "reinforce",
        maxActivations: 3,
        radiusGrowthSteps: 1,
        tickDamage: 4,
        channel: null
      }
    ],
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
      zoneAssetId: "pack:capture:sprite-fire-aura-01",
      zoneDisplayScale: 1.8,
      socketId: null,
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
    remove() {
      this.removed = true;
    },
    getBoundingClientRect() {
      return rect;
    }
  };
}

test("persistent-zone editor uses clear interval labels and an explicit inherited element choice", async () => {
  const source = await readFile(
    new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /Intervalle entre les dégâts \(secondes\)/);
  assert.match(source, /Dégâts à chaque intervalle/);
  assert.match(source, /Élément des dégâts/);
  assert.match(source, /Même élément que la capacité/);
  assert.doesNotMatch(source, /Dégâts toutes les \(secondes\)/);
});

test("human skill presentation stores a looping persistent-zone visual separately from cast travel and impact", () => {
  const draft = buildHumanSkillDraftV1(baseSkillFields());

  assert.equal(
    draft.presentation.visual.aura.assetId,
    "pack:capture:sprite-fire-aura-01"
  );
  assert.equal(draft.presentation.visual.aura.displayScale, 1.8);
  assert.equal(draft.presentation.visual.aura.playbackMode, "loop");
  assert.equal(draft.presentation.visual.aura.attachment, "source");
});

test("presentation assets expose the persistent-zone visual to the renderer", () => {
  const draft = buildHumanSkillDraftV1(baseSkillFields());
  const assets = createCaptureSkillPresentationAssetsV2({
    skillPresentations: {
      "aura-fire": draft.presentation
    },
    assetForId(assetId) {
      return {
        assetId,
        url: "https://assets.example/fire-aura.png",
        frameCount: 1
      };
    }
  });

  const presentation = assets.presentationForSkill("aura-fire");
  assert.equal(
    presentation.persistentZone.assetId,
    "pack:capture:sprite-fire-aura-01"
  );
  assert.equal(presentation.persistentZone.displayScale, 1.8);
});

test("DOM persistent-zone FX follows CombatState zones, grows with radius, and disappears when state expires", () => {
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
    anchors: {
      local: source
    },
    presentationForSkill() {
      return {
        persistentZone: {
          assetId: "pack:capture:sprite-fire-aura-01",
          url: "https://assets.example/fire-aura.png",
          frameCount: 1,
          displayScale: 2,
          playbackMode: "loop"
        }
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
      id: "local:aura-fire:fire-aura",
      skillId: "aura-fire",
      sourceActorId: "local",
      radius: "short"
    }
  ]);

  assert.equal(renderer.activeCount, 1);
  assert.equal(arena.children.length, 1);
  const node = arena.children[0];
  assert.equal(node.dataset.skillFx, "persistent-zone");
  assert.equal(node.dataset.zoneRadius, "short");
  const shortTransform = node.style.transform;

  renderer.syncPersistentZones([
    {
      id: "local:aura-fire:fire-aura",
      skillId: "aura-fire",
      sourceActorId: "local",
      radius: "long"
    }
  ]);

  assert.equal(renderer.activeCount, 1);
  assert.equal(node.dataset.zoneRadius, "long");
  assert.notEqual(node.style.transform, shortTransform);

  renderer.syncPersistentZones([]);

  assert.equal(renderer.activeCount, 0);
  assert.equal(node.removed, true);
});

test("combat preview syncs persistent-zone visuals from the existing runtime state path", async () => {
  const source = await readFile(
    new URL("../../src/ui/combat-2v2-test-ui.js", import.meta.url),
    "utf8"
  );

  assert.match(
    source,
    /syncPersistentZones\(\s*state\.persistentZones \?\? \[\]\s*\)/
  );
  assert.doesNotMatch(source, /setInterval\([^\n]*persistent/i);
});
