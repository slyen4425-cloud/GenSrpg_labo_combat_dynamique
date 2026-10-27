import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("skill save UX separates create and update semantics", async () => {
  const module = await import("../../src/ui/capture-editor-skill-save-mode-v1.js");

  assert.equal(
    module.resolveCaptureSkillSaveModeV1({
      intent: "create",
      draftId: "new-skill",
      configuredSkillIds: ["fireball"]
    }).mode,
    "create"
  );

  assert.throws(
    () =>
      module.resolveCaptureSkillSaveModeV1({
        intent: "create",
        draftId: "fireball",
        configuredSkillIds: ["fireball"]
      }),
    /already exists|existe déjà/i
  );

  assert.equal(
    module.resolveCaptureSkillSaveModeV1({
      intent: "update",
      draftId: "fireball",
      configuredSkillIds: ["fireball"]
    }).mode,
    "update"
  );

  assert.throws(
    () =>
      module.resolveCaptureSkillSaveModeV1({
        intent: "update",
        draftId: "unknown",
        configuredSkillIds: ["fireball"]
      }),
    /does not exist|n.existe pas/i
  );
});

test("Capture editor exposes explicit create and update controls", async () => {
  const html = await readFile(
    new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url),
    "utf8"
  );

  assert.match(html, /data-skill-create/);
  assert.match(html, /data-skill-update/);
  assert.doesNotMatch(
    html,
    /data-skill-save(?:[\s=>])/,
    "ambiguous single save action must be removed"
  );
});

test("1v1 actor UI remains hidden even when squad-card has display grid", async () => {
  const css = await readFile(
    new URL("../../examples/dom-demo/capture-editor-v2.css", import.meta.url),
    "utf8"
  );

  assert.match(
    css,
    /\.capture-preview-shell\s+\[data-preview-actor-ui\]\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important/s
  );
});

test("initial Fireball projectile uses the direct Fireball travel sprite", async () => {
  const html = await readFile(
    new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url),
    "utf8"
  );

  const travelSelect =
    html.match(/<select data-skill-travel-fx[\s\S]*?<\/select>/)?.[0] ?? "";

  assert.match(
    travelSelect,
    /value="pack:capture:sprite-fireball-travel-01"[^>]*selected/
  );
});
