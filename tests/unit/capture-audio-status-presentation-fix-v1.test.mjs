import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  applyCaptureFxStarterProfileV1
} from "../../src/catalogs/capture-fx-starter-profile-catalog-v1.js";
import {
  createCaptureSkillPresentationAssetsV2
} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {
  createDomStatusFxRenderer
} from "../../src/adapters/renderer/dom-status-fx.js";

function statusBinding(skillId, color) {
  return {
    id: "skill:" + skillId,
    version: 3,
    subjectType: "skill",
    subjectId: skillId,
    visual: {},
    audio: {},
    statusVisuals: {
      status: {
        mode: "tint",
        tintColor: color,
        tintOpacity: 0.8,
        sprite: null
      }
    }
  };
}

test("FX starter pack preserves audio already chosen by the creator", () => {
  const applied =
    applyCaptureFxStarterProfileV1({
      profileId:
        "capture:fx-profile:fireball-classic",
      presentation: {
        castAudioAssetId:
          "gensrpg:sound:creator-cast",
        travelAudioAssetId:
          "gensrpg:sound:creator-travel",
        impactAudioAssetId:
          "gensrpg:sound:creator-impact",
        zoneAudioAssetId:
          "gensrpg:sound:creator-zone"
      }
    });

  assert.equal(
    applied.castAudioAssetId,
    "gensrpg:sound:creator-cast"
  );
  assert.equal(
    applied.travelAudioAssetId,
    "gensrpg:sound:creator-travel"
  );
  assert.equal(
    applied.impactAudioAssetId,
    "gensrpg:sound:creator-impact"
  );
  assert.equal(
    applied.zoneAudioAssetId,
    "gensrpg:sound:creator-zone"
  );
});

test("FX starter pack may fill default audio only when creator audio is empty", () => {
  const applied =
    applyCaptureFxStarterProfileV1({
      profileId:
        "capture:fx-profile:fireball-classic",
      presentation: {
        castAudioAssetId: "",
        travelAudioAssetId: ""
      }
    });

  assert.equal(
    applied.castAudioAssetId,
    "gensrpg:sound:effect-135ee2ed"
  );
  assert.equal(
    applied.travelAudioAssetId,
    "gensrpg:sound:genrpg-pack2-a30f1071"
  );
});

test("status presentation resolves by source skill plus status id instead of one global status id", () => {
  const assets =
    createCaptureSkillPresentationAssetsV2({
      skillPresentations: {
        violet: statusBinding(
          "violet",
          "#8e44ad"
        ),
        red: statusBinding(
          "red",
          "#d73920"
        )
      },
      assetForId() {
        return null;
      }
    });

  assert.equal(
    assets.statusPresentationFor(
      "status",
      {
        sourceSkillId: "violet",
        view: "player"
      }
    ).tintColor,
    "#8e44ad"
  );

  assert.equal(
    assets.statusPresentationFor(
      "status",
      {
        sourceSkillId: "red",
        view: "player"
      }
    ).tintColor,
    "#d73920"
  );

  assert.equal(
    assets.statusPresentationFor(
      "status",
      { view: "player" }
    ),
    null,
    "ambiguous global status ids must not silently pick another skill"
  );
});

test("DOM status renderer passes sourceSkillId from the live status instance to presentation resolution", () => {
  const contexts = [];
  const motionChildren = [];
  const document = {
    createElement() {
      return {
        className: "",
        dataset: {},
        style: {},
        append() {},
        remove() {}
      };
    }
  };
  const motion = {
    ownerDocument: document,
    append(node) {
      motionChildren.push(node);
    }
  };
  const image = {
    currentSrc: "blob:creature",
    src: "blob:creature"
  };

  const renderer =
    createDomStatusFxRenderer({
      targetFor() {
        return {
          motion,
          image,
          statusHost: null
        };
      },
      statusPresentationFor(
        statusId,
        context
      ) {
        contexts.push({
          statusId,
          context
        });
        return {
          mode: "tint",
          tintColor: "#8e44ad",
          tintOpacity: 0.8,
          sprite: null
        };
      }
    });

  renderer.sync({
    elapsedMs: 1000,
    fighters: {
      opponent: {
        statusEffects: [
          {
            sourceSkillId: "violet",
            sourceActorId: "player",
            stacks: 1,
            definition: {
              id: "status",
              polarity: "detrimental"
            }
          }
        ]
      }
    }
  });

  assert.equal(
    contexts[0].context.sourceSkillId,
    "violet"
  );
  assert.equal(
    motionChildren[0].style
      .backgroundColor,
    "#8e44ad"
  );
});

test("1v1 and 2v2 wrappers preserve status source skill context", async () => {
  for (const file of [
    "../../src/ui/combat-test-ui.js",
    "../../src/ui/combat-2v2-test-ui.js"
  ]) {
    const source = await readFile(
      new URL(file, import.meta.url),
      "utf8"
    );

    assert.match(
      source,
      /sourceSkillId/
    );
  }
});
