import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Capture editor embedded 2v2 preview exposes status HUD hosts for native actor ids", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const actorId of [
    "local-1",
    "local-2",
    "opponent-1",
    "opponent-2"
  ]) {
    assert.match(
      html,
      new RegExp(
        'data-combat-status-icons="' +
          actorId +
          '"'
      ),
      actorId +
        " status HUD host must exist in editor preview template"
    );
  }
});

test("Capture editor preview relays native status presentation resolver", async () => {
  const source = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  const start = source.indexOf(
    "function buildPreviewPresentationAssets"
  );
  const end = source.indexOf(
    "const session =",
    start
  );
  const block = source.slice(start, end);

  assert.match(
    block,
    /statusPresentationFor\(statusId\)/
  );
  assert.match(
    block,
    /native\.statusPresentationFor\(\s*statusId\s*\)/
  );
});
