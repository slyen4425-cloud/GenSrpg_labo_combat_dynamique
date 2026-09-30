import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureBattleSetupEditorDraftV1
} from "../../src/contracts/capture-battle-setup-editor-draft-v1.js";
import {
  demoPresentationAssets
} from "../../examples/dom-demo/demo-assets.js";

function setup(arenaId = "forest") {
  return {
    schema: "capture-battle-setup-editor-draft-v1",
    id: "arena-selector-probe",
    localActorId: "player",
    arenaId,
    teams: [
      {
        id: "players",
        slots: [{
          actorId: "player",
          creatureId: "crea-player",
          displayName: "Player",
          controllerId: "human-local",
          roster: null
        }]
      },
      {
        id: "enemies",
        slots: [{
          actorId: "opponent",
          creatureId: "crea-enemy",
          displayName: "Opponent",
          controllerId: "ai-enemy",
          roster: null
        }]
      }
    ]
  };
}

test("Battle Setup carries exactly one arena presentation id", () => {
  const value =
    normalizeCaptureBattleSetupEditorDraftV1(
      setup("snow")
    );

  assert.equal(value.arenaId, "snow");
});

test("demo presentation owner exposes the canonical arena choices", () => {
  const options = demoPresentationAssets.arenaOptions();

  assert.deepEqual(
    options.map((option) => option.id),
    ["forest", "cave", "snow", "city", "lava"]
  );

  for (const option of options) {
    assert.equal(typeof option.label, "string");
    assert.ok(option.label.length > 0);
    assert.ok(
      demoPresentationAssets.presentationForArena(
        option.id
      )?.background?.url
    );
  }
});

test("Capture editor selects an arena and preview consumes nativeVisualSource.arenaId", async () => {
  const [html, source] = await Promise.all([
    readFile(
      new URL(
        "../../examples/dom-demo/capture-editor-v2.html",
        import.meta.url
      ),
      "utf8"
    ),
    readFile(
      new URL(
        "../../examples/dom-demo/capture-editor-v2.js",
        import.meta.url
      ),
      "utf8"
    )
  ]);

  assert.match(html, /data-test-arena/);
  assert.match(source, /demoPresentationAssets\.arenaOptions\(\)/);
  assert.match(source, /nativeVisualSource\.arenaId/);
  assert.doesNotMatch(source, /nativeCombatSource\.arenaId/);
  assert.doesNotMatch(
    source,
    /applyPreviewArenaPresentation\(\s*previewRoot,\s*["']city["']\s*\)/
  );
});
