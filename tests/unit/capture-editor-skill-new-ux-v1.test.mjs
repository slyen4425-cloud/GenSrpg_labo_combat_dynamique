import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("new skill UX generates a deterministic free id", async () => {
  const module = await import("../../src/ui/capture-editor-skill-save-mode-v1.js");

  assert.equal(
    module.nextCaptureSkillDraftIdV1({
      configuredSkillIds: []
    }),
    "nouvelle-capacite"
  );

  assert.equal(
    module.nextCaptureSkillDraftIdV1({
      configuredSkillIds: [
        "fireball",
        "nouvelle-capacite",
        "nouvelle-capacite-2"
      ]
    }),
    "nouvelle-capacite-3"
  );
});

test("Capture editor exposes a distinct new-draft action before create/update", async () => {
  const html = await readFile(
    new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url),
    "utf8"
  );

  assert.match(html, /data-skill-new/);
  assert.match(html, />\s*Nouvelle capacité\s*</);
  assert.match(html, /data-skill-create/);
  assert.match(html, /data-skill-update/);
});

test("Human Editor owns the new-draft action and does not persist it implicitly", async () => {
  const source = await readFile(
    new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /\[data-skill-new\]/);
  assert.match(source, /nextCaptureSkillDraftIdV1/);
  assert.match(
    source,
    /Nouvelle capacité prête|nouveau brouillon/i
  );
});
