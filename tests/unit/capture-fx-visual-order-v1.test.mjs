import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const html = readFileSync(
  fileURLToPath(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url)),
  "utf8"
);

test("FX editor begins with one icon, one combat form, then projectile trajectory", () => {
  const visualStart = html.indexOf("<h2>Effets visuels</h2>");
  const visualEnd = html.indexOf("<h2>Audio de la capacité</h2>", visualStart);
  assert.ok(visualStart > 0 && visualEnd > visualStart, "visual FX card exists");
  const selected = [
    "data-skill-icon",
    "data-skill-form",
    "data-skill-trajectory-mode"
  ];
  const positions = selected.map(attribute => {
    const matches = [...html.matchAll(new RegExp("<select\\s+" + attribute + "(?:\\s|>)", "g"))];
    assert.equal(matches.length, 1, attribute + " must remain one canonical control");
    assert.ok(matches[0].index > visualStart && matches[0].index < visualEnd,
      attribute + " must belong to the visual FX card");
    return matches[0].index;
  });
  assert.ok(positions[0] < positions[1] && positions[1] < positions[2],
    "icon -> form -> trajectory is the authoring order");
  const beam = html.indexOf('data-skill-beam-stage-editor', visualStart);
  const fx = html.indexOf('data-skill-fx-unified-flow', visualStart);
  const advanced = html.indexOf('data-skill-fx-advanced', visualStart);
  assert.ok(positions[2] < beam && positions[2] < fx && positions[2] < advanced,
    "choices are visible before visual presets, beam phases and advanced settings");
  assert.ok(html.indexOf('data-skill-icon', advanced) === -1,
    "icon must not be locked inside the advanced sprite editor");
});

test("FX reorder keeps existing beam and specialized controls", () => {
  for (const attribute of [
    "data-skill-fx-starter-profile",
    "data-skill-fx-quick-profile",
    "data-skill-cast-fx",
    "data-skill-travel-fx",
    "data-skill-impact-fx",
    "data-skill-zone-fx",
    "data-skill-beam-start-fx",
    "data-skill-skyfall-settings",
    "data-skill-wave-settings"
  ]) {
    assert.ok(html.includes(attribute), attribute + " is still present");
  }
  for (const stage of ["start", "body", "impact"]) {
    assert.ok(html.includes('data-beam-stage="' + stage + '"'),
      "beam phase " + stage + " must survive");
  }
});
