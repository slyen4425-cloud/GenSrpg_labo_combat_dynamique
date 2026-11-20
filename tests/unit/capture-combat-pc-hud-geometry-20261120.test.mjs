import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const cssPath = "examples/dom-demo/capture-editor-v2.css";
const start = "/* PC-only combat legibility.";
const end = "/* Canonical skill recolor controls:";

async function readSections() {
  const css = await readFile(cssPath, "utf8");
  const from = css.indexOf(start);
  const to = css.indexOf(end, from);
  assert.ok(from > 0 && to > from, "canonical PC layout section exists");
  return { before: css.slice(0, from), pc: css.slice(from, to) };
}

test("PC 1v1 and 2v2: dodge and skill stack share one authoritative width", async () => {
  const { pc } = await readSections();
  assert.match(pc, /--combat-pc-command-width:\s*min\(22rem,\s*39%\)/,
    "desktop 1v1 dock is slightly more compact than the former 23rem/41%");
  assert.match(pc, /\[data-combat-active-count="2"\]\s*\{\s*--combat-pc-command-width:\s*min\(19rem,\s*34%\)/,
    "desktop 2v2 keeps its original compact dock geometry");
  assert.match(pc, /\.coop-command-stack\s*\{\s*width:\s*var\(--combat-pc-command-width\)/,
    "canonical width must be consumed by the actual command stack");
  assert.match(pc, /\[data-combat-active-count="2"\]\s*\.coop-command-stack\s*\{\s*width:\s*var\(--combat-pc-command-width\)/,
    "specific 2v2 rule must not override the shared PC width");
  assert.match(pc, /\.combat-dodge-action--arena\s*\{\s*right:\s*calc\(var\(--combat-pc-command-width\)\s*\+\s*1rem\)/,
    "dodge offset must be derived from dock width and its right inset");
  assert.match(pc, /\[data-combat-active-count="2"\]\s*\.combat-dodge-action--arena\s*\{\s*right:\s*calc\(var\(--combat-pc-command-width\)\s*\+\s*1rem\)/,
    "2v2 higher-specificity dodge must use the same source");
});

test("all five skills remain a full-width grid; phone selectors unchanged", async () => {
  const { before, pc } = await readSections();
  assert.match(before, /grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/,
    "five native skill columns remain present");
  assert.match(before, /\.combat-primary-actions\s*\{\s*display:\s*block;/,
    "dodge must stay outside the skill grid");
  assert.match(before, /right:\s*calc\(min\(15rem,\s*35%\)\s*\+\s*0\.65rem\)/,
    "approved phone 1v1 position stays as authored");
  assert.match(before, /right:\s*calc\(min\(19rem,\s*34%\)\s*\+\s*\.58rem\)/,
    "approved phone 2v2 position stays as authored");
  assert.match(pc, /@media\s*\(min-width:\s*1100px\)\s*and\s*\(min-height:\s*680px\)\s*and\s*\(pointer:\s*fine\)/,
    "PC edits must be scoped away from Android touch screens");
});
