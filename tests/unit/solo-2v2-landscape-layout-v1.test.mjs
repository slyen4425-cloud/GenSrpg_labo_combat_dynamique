import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.css", import.meta.url),"utf8");
const html = readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url),"utf8");
const ui = readFileSync(new URL("../../src/ui/combat-2v2-test-ui.js", import.meta.url),"utf8");

test("2v2 far opponents are smaller and deeper in the real landscape arena, without 1v1 overrides", () => {
  const section = css.slice(css.indexOf("/* Capture landscape 2v2 depth V2"));
  assert.match(section,/--arena-coop-far-primary-y:\s*2[4-9]%/);
  assert.match(section,/--arena-coop-far-secondary-y:\s*2[4-9]%/);
  assert.match(section,/\.arena--coop-2v2 \.fighter--opponent\s*\{[^}]*width:\s*min\(2[0-6]dvh/s);
  assert.match(section,/\.arena--coop-2v2 \.fighter--opponent-b\s*\{[^}]*width:\s*min\(2[0-6]dvh/s);
  assert.doesNotMatch(section,/\.arena--coop-2v2 \.fighter--opponent\s*\{[^}]*transform\s*:/s,
    "opponent placement must use real slot geometry, not a hidden transform");
});

test("solo HUD is one wide low dock, with the compact ally alongside commands, not stacked over them", () => {
  assert.match(css,/\[data-local-control-mode="solo-dual"\] \.coop-command-stack\s*\{[^}]*grid-template-columns\s*:/s);
  assert.match(css,/\[data-local-control-mode="solo-dual"\] \.squad-card--command-ally\s*\{[^}]*min-height\s*:/s);
  assert.match(css,/\[data-local-control-mode="solo-dual"\] \.coop-controls\s*\{[^}]*min-width\s*:/s);
  assert.match(css,/\[data-local-control-mode="solo-dual"\] \.combat-dodge-action--arena\s*\{[^}]*right\s*:/s);
  assert.match(html,/class="skill-bar__grid" data-combat-skills/);
  assert.match(html,/data-combat-roster-command="switch"/);
  assert.match(html,/data-combat-dodge/);
});

test("the UI layout contract leaves actor authority, AI/solo choice and 1v1 intact", () => {
  assert.match(ui,/root\.dataset\.localControlMode = localControl\.mode/);
  assert.match(ui,/const controlledActorId = \(\) => localControl\.actorId/);
  assert.match(html,/<option value="ai" selected>IA alliée/);
  assert.match(html,/<option value="solo">Solo/);
  const solo = css.slice(css.indexOf("/* Solo landscape HUD V1"));
  assert.doesNotMatch(solo,/\[data-local-control-mode="human-ai"\]/,
    "the solo dock must not rewrite the historical AI mode");
  assert.doesNotMatch(solo,/\.arena:not\(/, "1v1 must remain unchanged");
});
