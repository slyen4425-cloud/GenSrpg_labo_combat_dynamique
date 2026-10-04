import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
    /exploration-encounter\.js\?rev=exploration-bridge-convergence-v1/
  );
  assert.match(
    script,
    /combat-2v2-test-ui\.js\?rev=exploration-bridge-convergence-v1/
  );
  assert.match(
    script,
    /exploration-encounter-handoff-v1\.js\?rev=exploration-bridge-convergence-v1/
  );
  assert.match(
    script,
    /buildExplorationEncounterCombatSourceV1/
  );
  assert.match(
    script,
    /completeExplorationCombatHandoffV1/
  );
});
