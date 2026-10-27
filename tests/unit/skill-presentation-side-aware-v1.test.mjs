import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSkillPresentationBinding
} from "../../src/contracts/skill-presentation-binding.js";
import {
  createCaptureSkillPresentationAssetsV2
} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";

function visual({
  assetId,
  attachment,
  trigger,
  offsetX = 0,
  offsetY = 0,
  offsetMode = undefined,
  opponentOffsetX = undefined,
  opponentOffsetY = undefined
}) {
  const value = {
    assetId,
    displayScale: 1,
    attachment,
    anchor: null,
    offsetX,
    offsetY,
    layerByView: {
      player: "front",
      opponent: "front"
    },
    trigger,
    playbackMode: "once",
    rotationDeg: 0,
    opacity: 1
  };
  if (offsetMode !== undefined) {
    value.offsetMode = offsetMode;
  }
  if (opponentOffsetX !== undefined) {
    value.opponentOffsetX =
      opponentOffsetX;
  }
  if (opponentOffsetY !== undefined) {
    value.opponentOffsetY =
      opponentOffsetY;
  }
  return value;
}

function binding(version = 9) {
  return {
    id: "skill:test",
    version,
    subjectType: "skill",
    subjectId: "test",
    visual: {
      cast: visual({
        assetId: "test:cast",
        attachment: "source",
        trigger: "preparation-start",
        offsetX: 24,
        offsetY: -8,
        ...(version >= 9
          ? { offsetMode: "mirror_x" }
          : {})
      }),
      impact: visual({
        assetId: "test:impact",
        attachment: "fixed-target",
        trigger: "impact",
        offsetX: 12,
        offsetY: 6,
        ...(version >= 9
          ? {
              offsetMode: "custom",
              opponentOffsetX: -30,
              opponentOffsetY: 9
            }
          : {})
      }),
      aura: visual({
        assetId: "test:zone",
        attachment: "source",
        trigger: "impact",
        offsetX: 18,
        offsetY: 4,
        ...(version >= 9
          ? { offsetMode: "same" }
          : {})
      })
    },
    audio: {},
    statusVisuals: {},
    feedback: {
      glow: {
        color: "#ffffff",
        strength: 0.5,
        radiusPx: 12
      },
      impactFlash: {
        color: "#ffffff",
        opacity: 0.4,
        durationMs: 100,
        scale: 1.2
      },
      impactBurst: {
        color: "#ffffff",
        count: 2,
        spreadPx: 12,
        sizePx: 4,
        durationMs: 100,
        opacity: 0.8
      },
      aftermathSmoke: {
        color: "#ffffff",
        count: 2,
        spreadPx: 10,
        sizePx: 5,
        risePx: 12,
        durationMs: 200,
        opacity: 0.5
      },
      castBurst: {
        color: "#ffffff",
        count: 2,
        spreadPx: 8,
        sizePx: 4,
        risePx: 10,
        durationMs: 120,
        opacity: 0.7
      }
    }
  };
}

function assetsFor(raw) {
  return createCaptureSkillPresentationAssetsV2({
    skillPresentations: {
      test: raw
    },
    assetForId(assetId) {
      return {
        id: assetId,
        frameCount: 1
      };
    }
  });
}

test("SkillPresentationBinding V9 normalizes same mirror_x and custom offset modes", () => {
  const normalized =
    normalizeSkillPresentationBinding(
      binding(9)
    );

  assert.equal(normalized.version, 9);
  assert.equal(
    normalized.visual.cast.offsetMode,
    "mirror_x"
  );
  assert.equal(
    normalized.visual.impact.offsetMode,
    "custom"
  );
  assert.equal(
    normalized.visual.impact.opponentOffsetX,
    -30
  );
  assert.equal(
    normalized.visual.impact.opponentOffsetY,
    9
  );
  assert.equal(
    normalized.visual.aura.offsetMode,
    "same"
  );

  const bad = binding(9);
  bad.visual.cast.offsetMode = "rotate-world";
  assert.throws(
    () =>
      normalizeSkillPresentationBinding(
        bad
      ),
    /offsetMode/
  );

  const missingCustom = binding(9);
  delete missingCustom.visual.impact
    .opponentOffsetX;
  assert.throws(
    () =>
      normalizeSkillPresentationBinding(
        missingCustom
      ),
    /opponentOffsetX/
  );
});

test("legacy V8 keeps identical offsets on player and opponent views", () => {
  const assets = assetsFor(binding(8));

  const player =
    assets.presentationForSkill(
      "test",
      {
        sourceView: "player",
        targetView: "opponent",
        fxType: "cast"
      }
    );
  const opponent =
    assets.presentationForSkill(
      "test",
      {
        sourceView: "opponent",
        targetView: "player",
        fxType: "cast"
      }
    );

  assert.equal(player.cast.offsetX, 24);
  assert.equal(player.cast.offsetY, -8);
  assert.equal(opponent.cast.offsetX, 24);
  assert.equal(opponent.cast.offsetY, -8);
});

test("V9 mirror_x flips only horizontal offset for opponent", () => {
  const assets = assetsFor(binding(9));

  const player =
    assets.presentationForSkill(
      "test",
      {
        sourceView: "player",
        targetView: "opponent",
        fxType: "cast"
      }
    );
  const opponent =
    assets.presentationForSkill(
      "test",
      {
        sourceView: "opponent",
        targetView: "player",
        fxType: "cast"
      }
    );

  assert.equal(player.cast.offsetX, 24);
  assert.equal(player.cast.offsetY, -8);
  assert.equal(opponent.cast.offsetX, -24);
  assert.equal(opponent.cast.offsetY, -8);
});

test("V9 custom opponent offset overrides mirror for impact and its feedback anchor", () => {
  const assets = assetsFor(binding(9));

  const playerTarget =
    assets.presentationForSkill(
      "test",
      {
        sourceView: "opponent",
        targetView: "player",
        fxType: "impact"
      }
    );
  const opponentTarget =
    assets.presentationForSkill(
      "test",
      {
        sourceView: "player",
        targetView: "opponent",
        fxType: "impact"
      }
    );

  assert.equal(
    playerTarget.impact.offsetX,
    12
  );
  assert.equal(
    playerTarget.impact.offsetY,
    6
  );
  assert.deepEqual(
    playerTarget.impactFeedbackOffset,
    { x: 12, y: 6 }
  );

  assert.equal(
    opponentTarget.impact.offsetX,
    -30
  );
  assert.equal(
    opponentTarget.impact.offsetY,
    9
  );
  assert.deepEqual(
    opponentTarget.impactFeedbackOffset,
    { x: -30, y: 9 }
  );
});

test("V9 same mode keeps zone offset unchanged on both sides", () => {
  const assets = assetsFor(binding(9));

  const player =
    assets.presentationForSkill(
      "test",
      {
        sourceView: "player",
        fxType: "zone"
      }
    );
  const opponent =
    assets.presentationForSkill(
      "test",
      {
        sourceView: "opponent",
        fxType: "zone"
      }
    );

  assert.equal(
    player.persistentZone.offsetX,
    18
  );
  assert.equal(
    opponent.persistentZone.offsetX,
    18
  );
  assert.equal(
    opponent.persistentZone.offsetY,
    4
  );
});


test("beam end uses target-view impact offsets while mouth cast uses source-view offsets", () => {
  const assets = assetsFor(binding(9));
  const playerToOpponent = assets.presentationForSkill("test", {
    sourceView:"player",targetView:"opponent",fxType:"beam"
  });
  assert.equal(playerToOpponent.cast.offsetX,24);
  assert.deepEqual(playerToOpponent.impactFeedbackOffset,{x:-30,y:9},
    "beam end must join the exact eventual impact on the opponent");
  const opponentToPlayer = assets.presentationForSkill("test", {
    sourceView:"opponent",targetView:"player",fxType:"beam"
  });
  assert.equal(opponentToPlayer.cast.offsetX,-24);
  assert.deepEqual(opponentToPlayer.impactFeedbackOffset,{x:12,y:6},
    "beam end must join the exact eventual impact on the player");
});
