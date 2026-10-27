import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeCaptureGameOptionsV1,
  buildCaptureDodgeReactionSkillV1
} from "../../src/contracts/capture-game-options-v1.js";
import {
  normalizeCaptureBattleSetupEditorDraftV1
} from "../../src/contracts/capture-battle-setup-editor-draft-v1.js";

function battleSetup(extra = {}) {
  return {
    schema: "capture-battle-setup-editor-draft-v1",
    id: "dodge-options-test",
    localActorId: "player",
    arenaId: null,
    skillSpeedMultiplier: 1,
    teams: [
      {
        id: "players",
        slots: [
          {
            actorId: "player",
            creatureId: "wolf",
            displayName: "Wolf",
            controllerId: "human-local",
            roster: null
          }
        ]
      },
      {
        id: "enemies",
        slots: [
          {
            actorId: "opponent",
            creatureId: "dragon",
            displayName: "Dragon",
            controllerId: "ai-enemy",
            roster: null
          }
        ]
      }
    ],
    ...extra
  };
}

test("CaptureGameOptionsV1 normalizes dodge enabled charges and recharge", () => {
  assert.deepEqual(
    normalizeCaptureGameOptionsV1({
      dodge: {
        enabled: true,
        maxCharges: 3,
        rechargeMs: 2500
      }
    }),
    {
      dodge: {
        enabled: true,
        maxCharges: 3,
        rechargeMs: 2500
      }
    }
  );

  assert.throws(
    () =>
      normalizeCaptureGameOptionsV1({
        dodge: {
          enabled: true,
          maxCharges: 0,
          rechargeMs: 1000
        }
      }),
    /maxCharges/
  );
});

test("legacy battle setup remains valid without gameOptions", () => {
  const normalized =
    normalizeCaptureBattleSetupEditorDraftV1(
      battleSetup()
    );

  assert.equal(
    "gameOptions" in normalized,
    false
  );
});

test("battle setup preserves explicit gameOptions dodge config", () => {
  const normalized =
    normalizeCaptureBattleSetupEditorDraftV1(
      battleSetup({
        gameOptions: {
          dodge: {
            enabled: true,
            maxCharges: 2,
            rechargeMs: 1500
          }
        }
      })
    );

  assert.deepEqual(
    normalized.gameOptions,
    {
      dodge: {
        enabled: true,
        maxCharges: 2,
        rechargeMs: 1500
      }
    }
  );
});

test("Capture dodge game action builds a zero-cost reaction and does not own recharge through skill cooldown", () => {
  const dodge = buildCaptureDodgeReactionSkillV1({
    dodge: {
      enabled: true,
      maxCharges: 2,
      rechargeMs: 1500
    }
  });

  assert.equal(dodge.id, "capture-game-dodge");
  assert.equal(dodge.energyCost, 0);
  assert.equal(dodge.cooldownMs, 0);
  assert.equal(dodge.maxUsesPerCombat, null);
  assert.deepEqual(
    dodge.reaction.evadeForms,
    ["contact", "projectile", "beam", "area", "aura"]
  );
  assert.deepEqual(
    dodge.reaction.evadeApproaches,
    ["ground", "aerial", "teleport", "burrow"]
  );

  assert.equal(
    buildCaptureDodgeReactionSkillV1({
      dodge: {
        enabled: false,
        maxCharges: 2,
        rechargeMs: 1500
      }
    }),
    null
  );
});
