import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  readHumanGameOptionsV1
} from "../../src/ui/capture-editor-human-v2.js";

function root() {
  const fields = new Map([
    ["[data-game-dodge-enabled]", { checked: true, value: "" }],
    ["[data-game-dodge-charges]", { checked: false, value: "2" }],
    ["[data-game-dodge-recharge-seconds]", { checked: false, value: "30" }],
    ["[data-game-dodge-active-seconds]", { checked: false, value: "0.25" }]
  ]);
  return {
    querySelector(selector) {
      return fields.get(selector) ?? null;
    }
  };
}

test("Human Editor exposes 30s recharge and 0.25s dodge active window defaults", async () => {
  const html = await readFile(
    "examples/dom-demo/capture-editor-v2.html",
    "utf8"
  );
  assert.match(
    html,
    /value="30" data-game-dodge-recharge-seconds/
  );
  assert.match(
    html,
    /value="0\.25" data-game-dodge-active-seconds/
  );
});

test("Human Editor exports the dodge active window in milliseconds", () => {
  assert.deepEqual(
    readHumanGameOptionsV1(root()),
    {
      recallCooldownMs: 45000,
      dodge: {
        enabled: true,
        maxCharges: 2,
        rechargeMs: 30000,
        activeWindowMs: 250
      }
    }
  );
});

test("combat UI arms the Runtime reaction window instead of owning a dodge timer", async () => {
  const source = await readFile(
    "src/ui/combat-2v2-test-ui.js",
    "utf8"
  );
  assert.equal(
    source.includes("activateRechargeableReaction"),
    true
  );
  for (const forbidden of [
    "setTimeout(() => dodge",
    "dodgeActiveTimer",
    "dodgeWindowTimer"
  ]) {
    assert.equal(source.includes(forbidden), false);
  }
});
