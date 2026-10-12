import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8");
const css = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.css", import.meta.url), "utf8");

test("Cast, Projectile, Impact and Zone authoring is visibly prioritized and open without exposing expert FX", () => {
  assert.match(html, /<details[^>]*data-skill-fx-advanced[^>]*\bopen\b[^>]*>/);
  for (const label of ["CAST", "PROJECTILE / RAYON", "IMPACT", "ZONE / AURA"]) {
    assert.ok(html.includes(`class="skill-fx-stage-heading"`), "stage titles use a shared visible treatment");
    assert.ok(html.includes(`>${label}</h3>`), `missing clearly identified ${label} stage`);
  }
  assert.match(css, /\.skill-fx-stage-heading\s*\{/);
  assert.match(css, /\[data-skill-fx-advanced\]\s*>\s*summary/);
});

test("glow, trail and smoke experts stay in a separate collapsed details below authored sprites", () => {
  const author = html.indexOf('data-skill-fx-advanced');
  const expert = html.indexOf('data-skill-fx-expert');
  const glow = html.indexOf('data-skill-fx-glow-strength');
  const smoke = html.indexOf('data-skill-aftermath-smoke-count');
  const impact = html.indexOf('data-skill-impact-fx');
  assert.ok(0 < author && author < impact && impact < expert && expert < glow && glow < smoke);
  assert.match(html, /<details[^>]*data-skill-fx-expert(?![^>]*\bopen\b)[^>]*>/);
  assert.match(css, /\[data-skill-fx-expert\]/);
  assert.match(html, /data-skill-fx-quick-profile/);
  assert.match(html, /data-skill-fx-quick-apply/);
});

test("author selectors remain single-owner even after regrouping", () => {
  for (const marker of [
    "data-skill-cast-fx", "data-skill-cast-scale", "data-skill-travel-fx",
    "data-skill-travel-scale", "data-skill-impact-fx", "data-skill-impact-scale",
    "data-skill-zone-fx", "data-skill-fx-glow-strength", "data-skill-aftermath-smoke-count",
    "data-skill-fx-advanced", "data-skill-fx-expert"
  ]) {
    assert.equal((html.match(new RegExp("\\b" + marker + "\\b", "g")) ?? []).length, 1, marker);
  }
});
