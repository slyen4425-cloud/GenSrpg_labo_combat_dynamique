import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Capture FX has one ordered style -> intensity -> personalization journey, with legacy controls intact", async () => {
  const html = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8");
  const start = html.indexOf('data-skill-fx-unified-flow');
  const importer = html.indexOf('data-creator-visual-importer data-skill-visual-importer');
  assert.ok(start > 0 && importer > start, "one merged visible FX workflow precedes the personal asset importer");
  const flow = html.slice(start, importer);
  const ordered = [
    'data-skill-fx-starter>',
    'data-skill-fx-starter-profile',
    'data-skill-fx-starter-apply',
    'data-skill-fx-quick>',
    'data-skill-fx-quick-profile',
    'data-skill-fx-quick-apply',
    'data-skill-fx-personalize',
    'data-skill-fx-glow-preset',
    'data-skill-fx-particle-preset'
  ];
  let cursor = 0;
  for (const term of ordered) {
    const index = flow.indexOf(term, cursor);
    assert.ok(index >= cursor, term + " absent or out of beginner workflow order");
    cursor = index + term.length;
  }
  assert.match(flow, /1\.\s*Choisir un style/);
  assert.match(flow, /2\.\s*Choisir l.intensité/);
  assert.match(flow, /3\.\s*Personnaliser/);
  assert.match(flow, /<details[^>]*data-skill-fx-personalize/);
  assert.doesNotMatch(flow, /Mode simple — Pack FX GenSrpG|Réglages faciles — Choisis l.intensité/);
  for (const marker of [
    'data-skill-fx-starter-profile', 'data-skill-fx-starter-apply',
    'data-skill-fx-quick-profile', 'data-skill-fx-quick-apply',
    'data-skill-fx-glow-preset', 'data-skill-fx-particle-preset',
    'data-skill-fx-advanced', 'data-skill-visual-importer'
  ]) {
    assert.equal((html.match(new RegExp(marker + '(?=[\\s>])', 'g')) ?? []).length, 1, "must keep one existing control: " + marker);
  }
  assert.ok(html.indexOf('data-skill-fx-advanced') > importer,
    "all detailed sprite/audio/FX settings remain present after personal assets");
});
