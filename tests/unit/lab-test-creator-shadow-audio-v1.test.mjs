import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("creator-shadow-audio test launcher delegates to the canonical editor", async () => {
  const source = await readFile(
    new URL(
      "../../examples/dom-demo/lab-test-creator-shadow-audio-v1.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /capture-editor-v2\.html\?validation=creator-shadow-audio-v1/
  );
  assert.match(source, /Importer un PNG\/WebP\/JPEG personnel/);
  assert.match(source, /ombre est proportionnée au modèle/);
  assert.match(source, /Cast \/ Projectile \/ Impact \/ Zone-Aura/);
  assert.match(source, /Boule de feu 2/);

  assert.doesNotMatch(
    source,
    /capture-editor-v2\.js/,
    "launcher must not create a second editor authority"
  );
});
