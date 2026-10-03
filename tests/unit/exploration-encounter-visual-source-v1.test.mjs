import test from "node:test";
import assert from "node:assert/strict";

import {
  fallbackEncounterCreatureMetaV1,
  bindEncounterCreatureMetaV1
} from "../../src/ui/exploration-encounter-visual-source-v1.js";

test("fallback visual keeps the real creature id and is explicitly generic", () => {
  const meta = fallbackEncounterCreatureMetaV1({
    creatureId: "crea_nat_3",
    displayName: "Ancêtronc"
  });

  assert.equal(meta.id, "crea_nat_3");
  assert.equal(meta.name, "Ancêtronc");
  assert.equal(meta.profile, "biped");
  assert.equal(meta.genericFallback, true);
  assert.match(meta.runtimePreview.opponent, /^data:image\/svg\+xml/);
  assert.match(meta.runtimePreview.player, /^data:image\/svg\+xml/);
});

test("real Capture meta is rebound to canonical creature id without changing its asset paths", () => {
  const meta = bindEncounterCreatureMetaV1({
    creatureId: "crea_maraileron",
    displayName: "Maraileron",
    sourceMeta: {
      id: "maraileron",
      name: "Maraileron",
      profile: "serpentine",
      views: {
        player: "player.webp",
        opponent: "opponent.webp",
        icon: "icon.webp"
      },
      runtimePreview: {
        player: "runtime/player.webp",
        opponent: "runtime/opponent.webp",
        icon: "runtime/icon.webp"
      },
      displayScale: {
        player: 1.1,
        opponent: 0.9
      }
    },
    assetBaseUrl: "https://example.test/creatures/maraileron/"
  });

  assert.equal(meta.id, "crea_maraileron");
  assert.equal(meta.profile, "serpentine");
  assert.equal(meta.assetBaseUrl, "https://example.test/creatures/maraileron/");
  assert.equal(meta.genericFallback, false);
  assert.equal(meta.runtimePreview.player, "runtime/player.webp");
});
