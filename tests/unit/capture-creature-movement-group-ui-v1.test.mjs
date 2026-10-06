import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(
  "examples/dom-demo/capture-editor-v2.html",
  "utf8"
);

function group(marker) {
  const start = html.indexOf(marker);
  assert.ok(
    start >= 0,
    "missing " + marker
  );
  const end = html.indexOf(
    "</fieldset>",
    start
  );
  assert.ok(
    end > start,
    "missing fieldset end for " + marker
  );
  return html.slice(start, end);
}

test("Creature editor groups movement controls without changing their canonical selectors", () => {
  const movement =
    group("data-creature-movement-group");

  for (const selector of [
    "data-creature-profile",
    "data-creature-mobility-preset",
    "data-creature-approach-time-modifier"
  ]) {
    assert.equal(
      movement.includes(selector),
      true,
      "Movement group missing " + selector
    );
    assert.equal(
      html.split(selector).length - 1,
      1,
      selector + " must remain unique"
    );
  }
});

test("Creature editor separates size and placement from movement", () => {
  const placement =
    group("data-creature-placement-group");

  for (const selector of [
    "data-creature-display-scale",
    "data-creature-custom-views",
    "data-creature-view-settings"
  ]) {
    assert.equal(
      placement.includes(selector),
      true,
      "Placement group missing " + selector
    );
  }

  assert.equal(
    placement.includes(
      "data-creature-mobility-preset"
    ),
    false
  );
});
