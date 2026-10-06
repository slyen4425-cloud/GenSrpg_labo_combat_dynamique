import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
