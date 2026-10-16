import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { captureReactionRechargeClockV1 } from "../../src/ui/capture-reaction-recharge-clock-v1.js";
import { captureEditorAssetMatchesRoleV1 } from "../../src/ui/capture-editor-human-v2.js";

const read = p => readFileSync(new URL("../../" + p, import.meta.url), "utf8");

test("reaction icon chooser accepts EVERY editor icon, not just the two new presets", () => {
  for (const id of [
    "pack:capture:icon-reaction-dodge-01",
    "pack:capture:icon-reaction-defense-01",
    "core:icon-skill-fireball-01",
    "user:custom:combat-icon"
  ]) {
    assert.equal(captureEditorAssetMatchesRoleV1({
      id, assetType:"icon", compatibility:{uses:["combat","editor"]}
    }, "icon"), true);
  }
  const source = read("src/ui/capture-editor-human-v2.js");
  assert.match(source, /const reactionIcons\s*=\s*select\.matches\?\.\("\[data-creature-reaction-icon\]"\)/);
  assert.match(source, /const libraryGroups = reactionIcons \? \[\] : \[/);
  assert.match(source, /select\.dataset\.availableIcons = String\(unique\.length\)/);
});

test("native recharge fraction recovers color clockwise even with other charges", () => {
  assert.deepEqual(captureReactionRechargeClockV1({charges:0,rechargeMs:30000,nextRechargeMs:30000}),
    {active:true,exhausted:true,progress:0});
  assert.deepEqual(captureReactionRechargeClockV1({charges:1,rechargeMs:30000,nextRechargeMs:15000}),
    {active:true,exhausted:false,progress:0.5});
  assert.deepEqual(captureReactionRechargeClockV1({charges:2,rechargeMs:30000,nextRechargeMs:0}),
    {active:false,exhausted:false,progress:1});
  assert.throws(() => captureReactionRechargeClockV1({charges:-1,rechargeMs:30000,nextRechargeMs:0}), RangeError);
});

test("same skill-artwork clock and no duplicate Dodge/Defense gameplay button", () => {
  const html = read("examples/dom-demo/capture-editor-v2.html");
  const css = read("examples/dom-demo/capture-editor-v2.css");
  const combat = read("src/ui/combat-2v2-test-ui.js");
  assert.equal((html.match(/\sdata-combat-dodge(?:\s|>)/g) || []).length, 1);
  assert.match(html, /data-combat-reaction-icon-color/);
  assert.match(html, /action-option__cooldown-dial/);
  assert.match(html, /action-option__cooldown-needle/);
  assert.match(css, /combat-dodge-action\[data-cooldown-active="true"\]/);
  assert.match(combat, /captureReactionRechargeClockV1\(availability\)/);
  assert.match(combat, /--cooldown-progress/);
});
