import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("Exploration Combat public adapter page exists and uses convergence revision", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/exploration-encounter.html",
      import.meta.url
    ),
    "utf8"
  );
  const script = await readFile(
    new URL(
      "../../examples/dom-demo/exploration-encounter.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.ok(html.includes("exploration-encounter.js?rev=exploration-native-view-2026-10-15"));
  assert.match(
    script,
    /combat-2v2-test-ui\.js\?rev=exploration-current-combat-2026-10-15/
  );
  assert.match(
    script,
    /exploration-encounter-handoff-v1\.js\?rev=exploration-current-combat-2026-10-15/
  );
  assert.match(
    script,
    /capture-creature-visual-bindings-v1\.js\?rev=exploration-current-combat-2026-10-15/
  );
  assert.match(
    script,
    /demo-assets\.js\?rev=exploration-current-combat-2026-10-15/
  );
  assert.match(
    script,
    /buildExplorationEncounterCombatSourceV1/
  );
  assert.match(
    script,
    /completeExplorationCombatHandoffV1/
  );
  assert.match(
    script,
    /capture-skill-presentation-assets-v2\.js\?rev=exploration-current-combat-2026-10-15/
  );
  assert.equal(
    script.includes(
      "capture-runtime-presentation-assets-v1.js"
    ),
    false
  );
});


test("Exploration Combat bootstrap has no missing local static module import", async () => {
  const entryUrl = new URL(
    "../../examples/dom-demo/exploration-encounter.js",
    import.meta.url
  );
  const source = await readFile(
    entryUrl,
    "utf8"
  );

  const specifiers = [
    ...source.matchAll(
      /from\s+["']([^"']+)["']/g
    )
  ]
    .map((match) => match[1])
    .filter((specifier) =>
      specifier.startsWith(".")
    );

  assert.ok(
    specifiers.length > 0
  );

  for (const specifier of specifiers) {
    const clean =
      specifier.split("?")[0];
    await assert.doesNotReject(
      () =>
        access(
          new URL(
            clean,
            entryUrl
          )
        ),
      "missing bootstrap import: " +
        clean
    );
  }
});

test("Encounter page reuses the authoritative editor Capture presentation and its landscape CSS", async () => {
  const html = await readFile(new URL("../../examples/dom-demo/exploration-encounter.html", import.meta.url), "utf8");
  const script = await readFile(new URL("../../examples/dom-demo/exploration-encounter.js", import.meta.url), "utf8");
  const editor = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8");

  assert.ok(html.includes("capture-editor-v2.css"));
  assert.ok(html.includes("data-capture-preview-host"));
  assert.ok(html.includes('data-landscape-required="true"'));
  assert.equal(html.includes("data-demo-slot="), false,
    "Encounter must not duplicate the authoring combat layout");
  assert.ok(script.includes('fetch("./capture-editor-v2.html"'));
  assert.ok(script.includes("data-capture-preview-template"));
  assert.ok(script.includes("template.content.cloneNode(true)"));
  assert.ok(script.includes("onBattleEnd"));
  for (const marker of [
    'data-demo-slot="local-1"',
    'data-demo-slot="opponent-1"',
    'data-demo-shadow',
    'data-demo-motion',
    'data-demo-image',
    'data-combat-energy-orbs="local-1"',
    'data-combat-skills',
    'data-combat-team-rosters',
    'data-combat-live-status'
  ]) {
    assert.ok(editor.includes(marker), "Authoritative Combat Editor template missing " + marker);
  }
});
