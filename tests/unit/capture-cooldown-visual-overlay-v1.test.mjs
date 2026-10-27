import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const uiUrl = new URL(
  "../../src/ui/combat-2v2-test-ui.js",
  import.meta.url
);
const cssUrl = new URL(
  "../../examples/dom-demo/demo.css",
  import.meta.url
);

test("Capture cooldown icon exposes a radial progress presentation shell", async () => {
  const ui = await readFile(uiUrl, "utf8");

  for (const marker of [
    "action-option__icon-shell",
    "action-option__icon--base",
    "action-option__icon--color",
    "action-option__cooldown-dial",
    "action-option__cooldown-needle",
    "dataset.cooldownActive",
    "--cooldown-progress"
  ]) {
    assert.equal(
      ui.includes(marker),
      true,
      marker + " must be projected by the combat preview"
    );
  }

  assert.match(
    ui,
    /1\s*-\s*remainingCooldownMs\s*\/\s*totalCooldownMs/
  );
});

test("Capture cooldown icon progressively reveals color and rotates one needle", async () => {
  const css = await readFile(cssUrl, "utf8");

  assert.match(css, /\.action-option__icon-shell/);
  assert.match(
    css,
    /\.action-option__icon--color[\s\S]*?conic-gradient/
  );
  assert.match(
    css,
    /\.action-option__cooldown-needle[\s\S]*?rotate\(calc\(var\(--cooldown-progress\)\s*\*\s*1turn\)\)/
  );
  assert.match(
    css,
    /\[data-cooldown-active="true"\][\s\S]*?grayscale/
  );
});

test("cooldown visual overlay remains presentation-only", async () => {
  const ui = await readFile(uiUrl, "utf8");

  assert.equal(
    ui.includes("withSkillCooldown"),
    false,
    "UI must not own cooldown state"
  );
  assert.equal(
    ui.includes("skillCooldowns"),
    false,
    "UI must not mutate or mirror Combat State cooldown maps"
  );
});


test("compact skill metadata hiding never hides the cooldown icon shell", async () => {
  const css = await readFile(cssUrl, "utf8");

  assert.doesNotMatch(
    css,
    /\.action-option--skill\s+span\s*,\s*\.action-option--skill\s+small\s*\{[\s\S]*?display:\s*none/,
    "generic span hiding would also hide action-option__icon-shell"
  );
  assert.match(
    css,
    /\.action-option--skill\s*>\s*span:not\(\.action-option__icon-shell\)\s*,\s*\.action-option--skill\s*>\s*small/
  );
});
