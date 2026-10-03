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

test("configured Capture presentation overrides combat scale transform position and sockets without replacing asset paths", () => {
  const meta = bindEncounterCreatureMetaV1({
    creatureId: "crea-loup",
    displayName: "Loup volcanique",
    sourceMeta: {
      id: "loup_volcanique",
      name: "Loup volcanique",
      profile: "quadruped",
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
        player: 0.8,
        opponent: 0.8
      },
      transformOrigin: {
        x: "50%",
        y: "88%"
      },
      offset: {
        x: 0,
        y: 0
      },
      fxAnchors: {
        player: {},
        opponent: {}
      }
    },
    presentation: {
      profileId: "quadruped",
      displayScale: 1.2,
      position: {
        x: 12,
        y: -8
      },
      transformOrigin: {
        x: "50%",
        y: "50%"
      },
      sockets: [
        {
          id: "mouth",
          front: {
            x: 0.9494845183140345,
            y: 0.8984375
          },
          back: {
            x: 0.7751232227546497,
            y: 0.6695311864217123
          }
        }
      ]
    },
    assetBaseUrl: "https://example.test/creatures/loup_volcanique/"
  });

  assert.equal(meta.runtimePreview.player, "runtime/player.webp");
  assert.equal(meta.profile, "quadruped");
  assert.deepEqual(meta.displayScale, {
    player: 1.2,
    opponent: 1.2
  });
  assert.deepEqual(meta.transformOrigin, {
    x: "50%",
    y: "50%"
  });
  assert.deepEqual(meta.offset, {
    x: 12,
    y: -8
  });
  assert.deepEqual(meta.fxAnchors.player.mouth, {
    x: 0.7751232227546497,
    y: 0.6695311864217123
  });
  assert.deepEqual(meta.fxAnchors.opponent.mouth, {
    x: 0.9494845183140345,
    y: 0.8984375
  });
});

