import test from "node:test";
import assert from "node:assert/strict";

import {
  createGlobalPresentationAssetResolverV1
} from "../../src/assets/global-presentation-asset-resolver-v1.js";
import {
  globalVisualAssetUrl
} from "../../src/assets/global-visual-library.js";
import {
  createCaptureSkillPresentationAssetsV2
} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

const IDS = Object.freeze({
  cast: "pack:capture:sprite-pressurized-jet-cast-01",
  start: "pack:capture:sprite-pressurized-jet-beam-start-01",
  body: "pack:capture:sprite-pressurized-jet-beam-body-01",
  impact: "pack:capture:sprite-pressurized-jet-impact-01"
});

const CATALOG = Object.freeze({
  assets: Object.freeze([
    Object.freeze({
      id: IDS.cast,
      resource: Object.freeze({
        file:
          "capture/sprites/skills/pressurized_jet/atlases/" +
          "sprite_skill_pressurized_jet_cast_atlas_01.webp",
        frameCount: 20,
        frameMs: 60,
        playbackMode: "once"
      })
    }),
    Object.freeze({
      id: IDS.start,
      resource: Object.freeze({
        file:
          "capture/sprites/skills/pressurized_jet/atlases/" +
          "sprite_skill_pressurized_jet_beam_start_atlas_01.webp",
        frameCount: 12,
        frameMs: 45,
        playbackMode: "once"
      })
    }),
    Object.freeze({
      id: IDS.body,
      resource: Object.freeze({
        file:
          "capture/sprites/skills/pressurized_jet/atlases/" +
          "sprite_skill_pressurized_jet_beam_body_atlas_01.webp",
        frameCount: 12,
        frameMs: 45,
        playbackMode: "loop",
        headingRad: 0
      })
    }),
    Object.freeze({
      id: IDS.impact,
      resource: Object.freeze({
        file:
          "capture/sprites/skills/pressurized_jet/atlases/" +
          "sprite_skill_pressurized_jet_impact_atlas_01.webp",
        frameCount: 12,
        frameMs: 45,
        playbackMode: "once"
      })
    })
  ])
});

const resolveAsset =
  createGlobalPresentationAssetResolverV1({
    assetCatalog: CATALOG,
    assetUrlForFile: globalVisualAssetUrl
  });

function slot(assetId, {
  attachment,
  trigger,
  playbackMode = "once",
  anchor = null
}) {
  return {
    assetId,
    displayScale: 1,
    displayScaleX: 1,
    displayScaleY: 1,
    attachment,
    anchor,
    offsetX: 0,
    offsetY: 0,
    trigger,
    playbackMode,
    rotationDeg: 0,
    opacity: 1,
    layerByView: {
      player: "front",
      opponent: "front"
    },
    offsetMode: "same"
  };
}

function binding() {
  return {
    id: "skill:test-pressurized-jet",
    version: 9,
    subjectType: "skill",
    subjectId: "test-pressurized-jet",
    visual: {
      cast: slot(IDS.cast, {
        attachment: "source",
        trigger: "preparation-start",
        anchor: "mouth"
      }),
      travel: slot(IDS.body, {
        attachment: "trajectory",
        trigger: "travel-start",
        playbackMode: "loop",
        anchor: "mouth"
      }),
      impact: {
        ...slot(IDS.impact, {
          attachment: "fixed-target",
          trigger: "impact"
        }),
        durationMs: 540
      }
    },
    audio: {},
    statusVisuals: {},
    feedback: {
      glow: null,
      impactFlash: null,
      cameraShake: null,
      projectileTrail: null,
      impactBurst: null,
      aftermathSmoke: null,
      castBurst: null
    }
  };
}

function element() {
  return {
    className: "",
    dataset: {},
    style: {},
    children: [],
    append(...children) {
      this.children.push(...children);
    },
    remove() {}
  };
}

test("canonical global presentation resolver maps all four Jet pressurisé assets", () => {
  const expected = [
    [IDS.cast, 20, "once", /pressurized_jet_cast_atlas_01\.webp/],
    [IDS.start, 12, "once", /pressurized_jet_beam_start_atlas_01\.webp/],
    [IDS.body, 12, "loop", /pressurized_jet_beam_body_atlas_01\.webp/],
    [IDS.impact, 12, "once", /pressurized_jet_impact_atlas_01\.webp/]
  ];

  for (
    const [id, frameCount, playbackMode, urlPattern]
    of expected
  ) {
    const asset = resolveAsset(id);
    assert.ok(asset, id);
    assert.equal(asset.assetId, id);
    assert.equal(asset.frameCount, frameCount);
    assert.equal(asset.playbackMode, playbackMode);
    assert.match(asset.url, urlPattern);
    assert.match(
      asset.url,
      /\/global-assets\/assets\/library\/capture\/sprites\/skills\/pressurized_jet\/atlases\//
    );
  }

  assert.equal(
    resolveAsset(IDS.body).headingRad,
    0
  );
  assert.equal(
    resolveAsset("pack:capture:missing"),
    null
  );
});

test("real V9 binding resolves Jet pressurisé body then renders one continuous beam", async () => {
  const presentationAssets =
    createCaptureSkillPresentationAssetsV2({
      skillPresentations: {
        "test-pressurized-jet": binding()
      },
      assetForId: resolveAsset
    });

  const presentation =
    presentationAssets.presentationForSkill(
      "test-pressurized-jet",
      {
        sourceView: "player",
        fxType: "beam"
      }
    );

  assert.equal(presentation.cast.assetId, IDS.cast);
  assert.equal(presentation.travel.assetId, IDS.body);
  assert.equal(presentation.travel.frameCount, 12);
  assert.equal(presentation.travel.playbackMode, "loop");
  assert.equal(presentation.impact.assetId, IDS.impact);

  const appended = [];
  const arena = {
    ownerDocument: {
      createElement() {
        return element();
      }
    },
    append(node) {
      appended.push(node);
    },
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: 600,
        height: 320
      };
    }
  };

  const anchors = {
    player: {
      getBoundingClientRect() {
        return {
          left: 60,
          top: 140,
          width: 40,
          height: 40
        };
      }
    },
    opponent: {
      getBoundingClientRect() {
        return {
          left: 440,
          top: 140,
          width: 40,
          height: 40
        };
      }
    }
  };

  const renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    presentationForSkill(skillId, context) {
      return presentationAssets.presentationForSkill(
        skillId,
        context
      );
    },
    animate() {
      return {
        finished: Promise.resolve(),
        cancel() {}
      };
    }
  });

  const handle = renderer.play({
    type: "beam",
    skillId: "test-pressurized-jet",
    element: "water",
    fromSlot: "player",
    targetSlot: "opponent",
    durationMs: 700
  });

  assert.equal(handle.status, "running");
  assert.equal(appended.length, 1);
  assert.equal(appended[0].dataset.skillFx, "beam");
  assert.equal(appended[0].dataset.assetId, IDS.body);
  assert.equal(appended[0].style.width, "380px");
  assert.equal(appended[0].children.length, 1);
  assert.match(
    appended[0].children[0].style.backgroundImage,
    /pressurized_jet_beam_body_atlas_01\.webp/
  );
  assert.equal(
    appended[0].children[0].style.backgroundSize,
    "1200% 100%"
  );

  assert.deepEqual(
    await handle.finished,
    { status: "arrived" }
  );
  assert.equal(renderer.activeCount, 0);
});
