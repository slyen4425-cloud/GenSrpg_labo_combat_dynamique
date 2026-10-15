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

  assert.match(
    html,
    /exploration-encounter\.js\?rev=exploration-current-combat-2026-10-15/
  );
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

test("Encounter page owns all visual model/shadow slots required by modern renderer", async () => {
  const html = await readFile(
    new URL("../../examples/dom-demo/exploration-encounter.html",import.meta.url),
    "utf8"
  );
  const renderedActors = [...html.matchAll(/data-demo-slot="(local-1|enemy-1)"/g)].map(m => m[1]);
  assert.deepEqual(renderedActors, ["local-1", "enemy-1"]);
  assert.equal([...html.matchAll(/data-demo-shadow/g)].length, 2);
  assert.equal([...html.matchAll(/data-demo-motion/g)].length, 2);
  assert.equal([...html.matchAll(/data-demo-image/g)].length, 2);
  assert.match(html, /data-combat-energy-orbs="local-1"/);
  assert.match(html, /data-combat-team-rosters/);
});


test("Exploration Encounter uses the real Capture Editor landscape HUD stylesheet and 16:9 shell", async () => {
  const html = await readFile(new URL("../../examples/dom-demo/exploration-encounter.html", import.meta.url), "utf8");
  const editorHtml = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../../examples/dom-demo/capture-editor-v2.css", import.meta.url), "utf8");

  assert.match(editorHtml, /href="\.\/capture-editor-v2\.css"/);
  assert.match(html, /href="\.\/capture-editor-v2\.css"/);
  assert.match(html, /class="capture-preview-shell" data-landscape-required="true"/);
  assert.match(html, /class="capture-preview-host"/);
  assert.match(html, /data-combat-active-count="1"/);
  assert.ok(css.includes("aspect-ratio: 16 / 9;"));
  assert.ok(css.includes('.capture-preview-shell[data-landscape-required="true"]'));

  // The 1v1 opponent reserves must be a direct arena child; when nested
  // inside the command dock they rendered as an oversized, always-visible row.
  assert.match(html, /<details class="combat-test-enemy-reserves" data-combat-enemy-reserves hidden>/);
  const enemyBench = html.indexOf('class="combat-test-enemy-reserves"');
  const commandDock = html.indexOf('class="coop-command-stack"');
  assert.ok(enemyBench > 0 && enemyBench < commandDock);
  assert.ok(html.includes('.bridge-banner[data-state="ready"] {') && html.includes("display: none;"));
});
