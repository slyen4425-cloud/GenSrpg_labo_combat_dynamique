import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  readHumanGameOptionsV1
} from "../../src/ui/capture-editor-human-v2.js";

test("Capture editor exposes Game Options dodge controls and combat dodge button", async () => {
  const html = await readFile(
    "examples/dom-demo/capture-editor-v2.html",
    "utf8"
  );

  for (const marker of [
    "Options de jeu",
    "data-game-dodge-enabled",
    "data-game-dodge-charges",
    "data-game-dodge-recharge-seconds",
    "data-combat-dodge",
    "data-combat-dodge-charges",
    "data-combat-dodge-recharge"
  ]) {
    assert.equal(
      html.includes(marker),
      true,
      "missing " + marker
    );
  }
});

test("2v2 combat UI delegates dodge to Runtime rechargeable reaction APIs", async () => {
  const source = await readFile(
    "src/ui/combat-2v2-test-ui.js",
    "utf8"
  );

  for (const marker of [
    "buildCaptureDodgeReactionSkillV1",
    "previewRechargeableReaction",
    "reactWithRechargeableAction",
    "rechargeableActionAvailability"
  ]) {
    assert.equal(
      source.includes(marker),
      true,
      "missing runtime dodge delegation " +
        marker
    );
  }

  for (const forbidden of [
    "setTimeout(() => dodge",
    "dodgeCharges -=",
    "dodgeCooldownTimer"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false,
      "UI must not own dodge gameplay: " +
        forbidden
    );
  }
});


function gameOptionsRoot({
  enabled = true,
  charges = "2",
  rechargeSeconds = "1.5"
} = {}) {
  const fields = new Map([
    [
      "[data-game-dodge-enabled]",
      { checked: enabled, value: "" }
    ],
    [
      "[data-game-dodge-charges]",
      { checked: false, value: charges }
    ],
    [
      "[data-game-dodge-recharge-seconds]",
      {
        checked: false,
        value: rechargeSeconds
      }
    ]
  ]);

  return {
    querySelector(selector) {
      return fields.get(selector) ?? null;
    }
  };
}

test("Human Editor reads valid dodge Game Options without a helper ReferenceError", () => {
  assert.deepEqual(
    readHumanGameOptionsV1(
      gameOptionsRoot()
    ),
    {
      dodge: {
        enabled: true,
        maxCharges: 2,
        rechargeMs: 1500
      }
    }
  );
});

test("Human Editor delegates negative dodge recharge validation to CaptureGameOptionsV1", () => {
  assert.throws(
    () =>
      readHumanGameOptionsV1(
        gameOptionsRoot({
          rechargeSeconds: "-1"
        })
      ),
    /CaptureGameOptionsV1\.dodge\.rechargeMs must be a non-negative finite number/
  );
});
