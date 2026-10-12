import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8");
const css = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.css", import.meta.url), "utf8");
const visuals = html.slice(html.indexOf('<details data-skill-fx-advanced'));

test("personal Cast, Projectile, Impact, layers and Zone each have a labeled touch-accessible accordion", () => {
  assert.match(html, /<details data-skill-fx-advanced open>/);
  for (const phase of ["cast", "projectile", "layers", "impact", "zone"]) {
    const pattern = new RegExp('<details class="skill-fx-phase" data-skill-fx-phase="' + phase + '">\\s*<summary>[^<]+</summary>');
    assert.match(visuals, pattern, phase + " section must be directly reachable");
  }
  assert.match(css, /\.skill-fx-phase\s*>\s*summary/);
  assert.match(css, /touch-action:\s*manipulation/);
});

test("the optional Glow/trail/smoke numeric parameters are folded while one-click presets remain", () => {
  assert.match(visuals, /<details class="skill-fx-expert" data-skill-fx-expert>/);
  assert.doesNotMatch(visuals, /<details class="skill-fx-expert" data-skill-fx-expert open>/);
  assert.match(visuals, /data-skill-fx-expert[\s\S]*?data-skill-fx-glow-strength/);
  assert.match(visuals, /data-skill-fx-expert[\s\S]*?data-skill-projectile-trail-count/);
  assert.match(visuals, /data-skill-fx-expert[\s\S]*?data-skill-aftermath-smoke-count/);
  assert.match(html, /data-skill-fx-quick-profile/);
  assert.match(html, /data-skill-fx-quick-apply/);
});

test("critical authoring and export selectors stay unique", () => {
  for (const attr of [
    "data-skill-icon", "data-skill-socket", "data-skill-cast-fx", "data-skill-cast-scale",
    "data-skill-travel-fx", "data-skill-travel-far-scale", "data-skill-trajectory-mode",
    "data-skill-impact-fx", "data-skill-impact-duration", "data-skill-zone-fx",
    "data-skill-fx-glow-strength", "data-skill-projectile-trail-count", "data-skill-aftermath-smoke-count"
  ]) {
    const matches = html.match(new RegExp("\\b" + attr + "(?=[\\s=>])", "g")) ?? [];
    assert.equal(matches.length, 1, attr + " must not be duplicated or lost");
  }
});
