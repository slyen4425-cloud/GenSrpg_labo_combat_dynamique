import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ENTRY =
  "examples/dom-demo/capture-editor-v2.js";

async function entrySource() {
  return readFile(
    new URL("../../" + ENTRY, import.meta.url),
    "utf8"
  );
}

test("real browser entry keeps optional combat preview modules out of the static editor bootstrap graph", async () => {
  const source = await entrySource();

  assert.equal(
    /from\s+["']\.\.\/\.\.\/src\/ui\/capture-combat-preview-v1\.js["']/.test(source),
    false,
    "combat preview must not be a static dependency of editor startup"
  );

  assert.equal(
    /from\s+["']\.\.\/\.\.\/src\/adapters\/input\/capture\/capture-export-to-native-visual-source-v1\.js["']/.test(source),
    false,
    "visual preview adapter must not be a static dependency of editor startup"
  );

  assert.match(
    source,
    /loadCaptureEditorPreviewRuntimeV1/
  );
  assert.match(
    source,
    /editor\.ready[\s\S]{0,500}loadCaptureEditorPreviewRuntimeV1/
  );
});

test("creature-library regression guard still exists beside browser-bootstrap isolation", async () => {
  const source = await readFile(
    new URL(
      "../../tests/unit/capture-editor-creature-library-regression-v1.test.mjs",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /configuredCreatures\.size,\s*103/
  );
  assert.match(
    source,
    /historical creature must remain in active library/
  );
});
