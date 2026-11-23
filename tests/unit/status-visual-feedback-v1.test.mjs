import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeSkillPresentationBinding
} from "../../src/contracts/skill-presentation-binding.js";
import {
  createCaptureSkillPresentationAssetsV2
} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {
  createDomStatusFxRenderer
} from "../../src/adapters/renderer/dom-status-fx.js";

function fakeNode() {
  return {
    className: "",
    dataset: {},
    style: {
      setProperty(name, value) { this[name] = value; },
      removeProperty(name) { delete this[name]; }
    },
    children: [],
    append(child) { this.children.push(child); },
    remove() { this.removed = true; }
  };
}

test("SkillPresentationBinding V3 keeps status visuals separate from StatusEffectV1", () => {
  const binding = normalizeSkillPresentationBinding({
    id: "skill:poison-shot",
    version: 3,
    subjectType: "skill",
    subjectId: "poison-shot",
    visual: {},
    audio: {},
    statusVisuals: {
      poison: {
        mode: "both",
        tintColor: "#39b54a",
        tintOpacity: 0.35,
        sprite: {
          assetId: "pack:capture:sprite-poison-aura-01",
          displayScale: 1.2,
          opacity: 0.8
        }
      }
    }
  });

  assert.equal(binding.version, 3);
  assert.equal(binding.statusVisuals.poison.mode, "both");
  assert.equal(binding.statusVisuals.poison.tintColor, "#39b54a");
  assert.equal(binding.statusVisuals.poison.sprite.assetId, "pack:capture:sprite-poison-aura-01");
});

test("presentation adapter exposes one resolved status presentation registry", () => {
  const assets = createCaptureSkillPresentationAssetsV2({
    skillPresentations: {
      poisonShot: {
        id: "skill:poison-shot",
        version: 3,
        subjectType: "skill",
        subjectId: "poisonShot",
        visual: {},
        audio: {},
        statusVisuals: {
          poison: {
            mode: "sprite",
            tintColor: "#39b54a",
            tintOpacity: 0.3,
            sprite: {
              assetId: "pack:capture:sprite-poison-aura-01",
              displayScale: 1.4,
              opacity: 0.7
            }
          }
        }
      }
    },
    assetForId(assetId) {
      return {
        assetId,
        url: "https://example.test/" + assetId + ".webp"
      };
    }
  });

  const visual = assets.statusPresentationFor("poison");
  assert.equal(visual.mode, "sprite");
  assert.equal(visual.sprite.assetId, "pack:capture:sprite-poison-aura-01");
  assert.match(visual.sprite.url, /poison-aura/);
});

test("DOM status renderer applies tint and sprite while active and removes them when status disappears", () => {
  const motion = fakeNode();
  const image = fakeNode();
  image.src = "https://example.test/creature.webp";
  motion.ownerDocument = {
    createElement() {
      const node = fakeNode();
      node.ownerDocument = motion.ownerDocument;
      return node;
    }
  };

  const renderer = createDomStatusFxRenderer({
    targetFor(actorId) {
      assert.equal(actorId, "enemy");
      return { motion, image };
    },
    statusPresentationFor(statusId) {
      assert.equal(statusId, "poison");
      return {
        mode: "both",
        tintColor: "#39b54a",
        tintOpacity: 0.35,
        sprite: {
          assetId: "pack:capture:sprite-poison-aura-01",
          url: "https://example.test/poison.webp",
          displayScale: 1.2,
          opacity: 0.8
        }
      };
    }
  });

  renderer.sync({
    fighters: {
      enemy: {
        statusEffects: [{
          definition: {
            id: "poison",
            polarity: "detrimental"
          }
        }]
      }
    }
  });

  assert.equal(motion.children.length, 2);
  assert.ok(motion.children.some((node) => node.dataset.statusFx === "tint"));
  assert.ok(motion.children.some((node) => node.dataset.statusFx === "sprite"));

  renderer.sync({
    fighters: {
      enemy: { statusEffects: [] }
    }
  });

  assert.equal(motion.children.every((node) => node.removed === true), true);
  renderer.dispose();
});

test("human editor contains status visual controls and does not add visual fields to StatusEffectV1", async () => {
  const source = await readFile(
    new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url),
    "utf8"
  );
  const statusContract = await readFile(
    new URL("../../src/contracts/status-effect-v1.js", import.meta.url),
    "utf8"
  );

  for (const marker of [
    "data-skill-status-visual-mode",
    "data-skill-status-tint-color",
    "data-skill-status-visual-asset",
    "data-skill-status-visual-scale"
  ]) {
    assert.match(source, new RegExp(marker));
  }

  assert.doesNotMatch(statusContract, /tintColor|spriteAsset|statusVisual/i);
});


test("1v1 and 2v2 true paths sync status renderer from Runtime state", async () => {
  for (const relative of [
    "src/ui/combat-test-ui.js",
    "src/ui/combat-2v2-test-ui.js"
  ]) {
    const source = await readFile(
      new URL("../../" + relative, import.meta.url),
      "utf8"
    );

    assert.match(
      source,
      /createDomStatusFxRenderer/
    );
    assert.match(
      source,
      /statusPresentationFor/
    );
    assert.match(
      source,
      /statusFx\?\.sync\(state\)/
    );
  }

  const demo = await readFile(
    new URL(
      "../../src/ui/demo-app.js",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(
    demo,
    /getStatusPresentationTargetFor/
  );
});


test("Vipfer Mue tranchante reuses its approved sprite as a hold-last status for the full defense buff", async () => {
  const {normalizeCaptureSkillTransferV1} =
    await import("../../src/contracts/capture-skill-transfer-v1.js");
  const {buildHumanSkillDraftV1,humanSkillEditorFieldsFromDraftV1} =
    await import("../../src/ui/capture-editor-human-v2.js");
  const raw=JSON.parse(await readFile(new URL(
    "../../data/capture/showcase/vipfer-mue-tranchante.capture-skill-transfer-v1.json",
    import.meta.url),"utf8"));
  const draft=normalizeCaptureSkillTransferV1(raw).draft;
  const defense=draft.definition.effects.find(effect=>
    effect.kind==="apply_status"&&effect.status?.kind==="stat_modifier");
  const reflect=draft.definition.effects.find(effect=>
    effect.kind==="apply_status"&&effect.status?.kind==="damage_reflection");
  assert.equal(defense.status.durationMs,8000);
  assert.equal(defense.status.deltaPoints,200);
  assert.equal(reflect.status.contactDamage,25);
  assert.equal(reflect.status.consumeOnContact,true);
  const visual=draft.presentation.statusVisuals[defense.status.id];
  assert.equal(visual.mode,"sprite");
  assert.equal(visual.sprite.assetId,draft.presentation.visual.cast.assetId);
  assert.equal(visual.sprite.playbackMode,"hold-last");
  // Each creature author can change this in the EXISTING status editor.
  const fromEditor=humanSkillEditorFieldsFromDraftV1(draft);
  assert.equal(fromEditor.presentation.statusVisuals[defense.status.id].sprite.playbackMode,"hold-last");
  const saved=buildHumanSkillDraftV1(fromEditor);
  assert.equal(saved.presentation.statusVisuals[defense.status.id].sprite.playbackMode,"hold-last");

  const assets=createCaptureSkillPresentationAssetsV2({
    skillPresentations:{[draft.id]:draft.presentation},
    assetForId(assetId){return {assetId,url:"https://example.test/mue.webp",
      frameCount:6,frameMs:120};}
  });
  const motion=fakeNode(),image=fakeNode();
  image.src="https://example.test/vipfer.webp";
  motion.ownerDocument={createElement(){
    const node=fakeNode();node.ownerDocument=motion.ownerDocument;return node;
  }};
  const renderer=createDomStatusFxRenderer({
    targetFor:()=>({motion,image}),
    statusPresentationFor:assets.statusPresentationFor
  });
  const instance={definition:defense.status,sourceSkillId:draft.id,appliedAtMs:0,expiresAtMs:8000,stacks:1};
  const state=statusEffects=>({elapsedMs:2000,fighters:{vipfer:{statusEffects}}});
  renderer.sync(state([instance]));
  const sprite=motion.children.find(node=>node.dataset.statusFx==="sprite");
  assert.ok(sprite,"native status renderer must mount the approved Mue FX");
  assert.equal(sprite.dataset.assetId,visual.sprite.assetId);
  assert.equal(sprite.style.animationFillMode,"forwards");
  assert.equal(sprite.style.animationIterationCount,"1");
  renderer.sync({...state([instance]),elapsedMs:7000});
  assert.equal(sprite.removed,undefined,"FX stays while defense remains active, even after riposte");
  renderer.sync({...state([]),elapsedMs:8000});
  assert.equal(sprite.removed,true,"native expiration removes Mue's FX without a second timer");
  renderer.dispose();
});
