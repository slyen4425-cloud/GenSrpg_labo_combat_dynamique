import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  parseCapturePackageText
} from "../../src/ui/capture-package-preview-ui.js";

test("Capture package preview parses the portable fixture through the adapter", async () => {
  const text = await readFile(
    "data/capture/capture-combat-package-preview-v1.json",
    "utf8"
  );
  const model = parseCapturePackageText(text);

  assert.equal(model.battleFormat.id, "capture-package-preview-2v2");
  assert.equal(model.battleFormat.localActorId, "player");
  assert.equal(model.fighters.length, 4);
  assert.deepEqual(
    model.skillsByActor.player.map((skill) => skill.id),
    ["fireball"]
  );
  assert.equal(model.fighters[0].initialEnergy, 6);
  assert.equal(model.skills.fireball.effect.damage, 30);
});

test("Capture package preview rejects malformed JSON before application", () => {
  assert.throws(
    () => parseCapturePackageText("{ nope"),
    /JSON invalide/
  );
});

test("Capture package preview surfaces contract errors instead of repairing data", async () => {
  const input = JSON.parse(
    await readFile(
      "data/capture/capture-combat-package-preview-v1.json",
      "utf8"
    )
  );
  input.skills[0].form = "legacy-fire-magic";

  assert.throws(
    () => parseCapturePackageText(JSON.stringify(input)),
    /Unsupported skill form/
  );
});

test("Capture package preview UI stays an adapter-facing editor only", async () => {
  const source = await readFile(
    "src/ui/capture-package-preview-ui.js",
    "utf8"
  );
  const entry = await readFile(
    "examples/dom-demo/coop-2v2.js",
    "utf8"
  );
  const html = await readFile(
    "examples/dom-demo/coop-2v2.html",
    "utf8"
  );

  assert.match(source, /adaptCaptureCombatPackage/);
  assert.match(source, /JSON\.parse\(text\)/);
  assert.match(source, /await onApply\(model\)/);
  assert.doesNotMatch(
    source,
    /localStorage|sessionStorage|indexedDB|MutationObserver|setInterval|Zombicide-40k/
  );
  assert.doesNotMatch(
    source,
    /effect\.damage\s*=|fighter\.hp\s*=|energy\s*[-+*/]?=/
  );

  assert.match(
    entry,
    /get\("capturePackage"\) === "1"/
  );
  assert.match(
    entry,
    /mountCoop2v2Test\(\{[\s\S]*combatModel/
  );
  assert.match(entry, /combat\?\.dispose\(\)/);
  assert.match(entry, /ensurePreviewVisuals\(combatModel, visuals\)/);

  assert.match(html, /data-capture-package-editor/);
  assert.match(html, /data-capture-package-json/);
  assert.match(html, /data-capture-package-validate/);
  assert.match(html, /data-capture-package-apply/);
  assert.match(html, /data-capture-package-reset/);
});
