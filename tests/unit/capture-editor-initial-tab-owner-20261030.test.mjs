import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const entry=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.js",import.meta.url),"utf8");
const owner=readFileSync(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");

test("RED: official editor entry passes its own URL-selected tab to the single UI owner",()=>{
 assert.match(entry,/URLSearchParams\(/,
  "GenSrpg may request ?tab=skills/combat; only the Lab entry may decode it");
 assert.match(entry,/initialTab\s*:/,
  "The native Lab author entry, not GenSrpg DOM overrides, must request the active tab");
 assert.match(owner,/initialTab\s*=\s*["']creature["']/,
  "No query keeps the historical default creature editor");
 assert.match(owner,/setTab\(root,\s*initialTab\)/,
  "The native UI owner must select the requested tab instead of always creature");
 assert.doesNotMatch(entry,/\.click\(\).*\[data-editor-tab\]/,
  "Do not simulate external UI clicks or overwrite a separate editor");
});
