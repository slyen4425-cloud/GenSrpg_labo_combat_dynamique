import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildHumanCreatureDraftV3,
  captureEditorAssetMatchesRoleV1
} from "../../src/ui/capture-editor-human-v2.js";
import {
  CREATOR_VISUAL_ROLES_V1
} from "../../src/assets/creator-visual-asset-session-v1.js";
import {
  adaptCaptureExportToNativeVisualSourceV1
} from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";
import {
  playDomCreatureDodgeFxV1
} from "../../src/adapters/renderer/dom-creature-dodge-fx-v1.js";

function creatureFields() {
  return {
    id: "crea-dodge-fx",
    displayName: "Créature Dodge FX",
    description: "Fixture dodge appearance",
    level: 5,
    sourceStats: {
      force: 1,
      agility: 1,
      intelligence: 1,
      spirit: 1,
      endurance: 1,
      initiative: 1
    },
    elements: ["electric"],
    resistances: {},
    capture: {
      capturable: true,
      captureRate: 30,
      spawnChance: 10,
      spawnTags: ["electric"],
      evolution: null
    },
    combat: {
      maxHp: 100,
      maxEnergy: 10,
      initialEnergy: 10,
      energyChargeAmount: 0,
      energyChargeIntervalMs: 1000,
      movementEnergyPerStep: 1,
      chargeTimeModifierPct: 0,
      approachTimeModifierPct: 0
    },
    linkedSkillIds: [],
    profileId: "biped",
    displayScale: 1,
    visual: {
      frontAssetId: "pack:test:front",
      backAssetId: "pack:test:back",
      iconAssetId: "pack:test:icon",
      dodgeAssetId: "pack:test:dodge-electric",
      dodgeDisplayScale: 1.4,
      dodgeOffsetX: 6,
      dodgeOffsetY: -8
    },
    sockets: [],
    audio: {}
  };
}

test("Creature Appearance editor exposes an optional Dodge FX and creator dodge role", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const marker of [
    "data-creature-dodge-fx",
    "data-creature-dodge-scale",
    "data-creature-dodge-offset-x",
    "data-creature-dodge-offset-y"
  ]) {
    assert.match(html, new RegExp(marker));
  }

  assert.match(
    html,
    /<option value=["']dodge["']>/
  );
  assert.equal(
    CREATOR_VISUAL_ROLES_V1.includes("dodge"),
    true
  );
  assert.equal(
    captureEditorAssetMatchesRoleV1(
      {
        assetType: "sprite",
        mediaType: "image",
        category: "dodge",
        tags: ["creator", "dodge"],
        compatibility: {
          uses: ["combat", "capture", "editor"]
        }
      },
      "dodge"
    ),
    true
  );
});

test("Human creature builder stores Dodge FX in versioned Creature Presentation", () => {
  const draft =
    buildHumanCreatureDraftV3(
      creatureFields()
    );

  assert.equal(
    draft.presentation.version,
    3
  );
  assert.deepEqual(
    draft.presentation.visual.dodge,
    {
      assetId: "pack:test:dodge-electric",
      displayScale: 1.4,
      offsetX: 6,
      offsetY: -8
    }
  );
});

function visualExport() {
  return {
    schema: "capture-combat-export-v1",
    battle: {
      id: "dodge-fx-preview",
      localActorId: "local-1",
      skillSpeedMultiplier: 1
    },
    teams: {
      local: ["local-1"],
      enemy: ["opponent-1"]
    },
    actors: [
      {
        actorId: "local-1",
        teamId: "local",
        creatureId: "crea-dodge-fx",
        displayName: "Locale",
        controllerId: "human-local"
      },
      {
        actorId: "opponent-1",
        teamId: "enemy",
        creatureId: "crea-enemy",
        displayName: "Ennemie",
        controllerId: "ai-enemy"
      }
    ],
    creatures: [
      {
        id: "crea-dodge-fx",
        displayName: "Locale",
        combat: {
          maxHp: 100
        },
        elements: ["electric"],
        resistances: [],
        skillIds: [],
        presentationId: "creature:crea-dodge-fx",
        metadata: {}
      },
      {
        id: "crea-enemy",
        displayName: "Ennemie",
        combat: {
          maxHp: 100
        },
        elements: [],
        resistances: [],
        skillIds: [],
        presentationId: "creature:crea-enemy",
        metadata: {}
      }
    ],
    skills: [],
    rosters: [],
    presentation: {
      creatures: {
        "creature:crea-dodge-fx": {
          id: "creature:crea-dodge-fx",
          version: 3,
          subjectType: "creature",
          subjectId: "crea-dodge-fx",
          profileId: "biped",
          displayScale: 1,
          position: { x: 0, y: 0 },
          transformOrigin: {
            x: "50%",
            y: "50%"
          },
          visual: {
            front: {
              assetId: "pack:test:front"
            },
            back: {
              assetId: "pack:test:back"
            },
            icon: {
              assetId: "pack:test:icon"
            },
            dodge: {
              assetId: "pack:test:dodge-electric",
              displayScale: 1.4,
              offsetX: 6,
              offsetY: -8
            }
          },
          sockets: [],
          audio: {}
        },
        "creature:crea-enemy": {
          id: "creature:crea-enemy",
          version: 2,
          subjectType: "creature",
          subjectId: "crea-enemy",
          profileId: "biped",
          displayScale: 1,
          position: { x: 0, y: 0 },
          transformOrigin: {
            x: "50%",
            y: "50%"
          },
          visual: {
            front: {
              assetId: "pack:test:enemy-front"
            }
          },
          sockets: [],
          audio: {}
        }
      }
    },
    metadata: {}
  };
}

test("Capture native visual source carries creature-owned Dodge FX without deriving it from element", () => {
  const assets = [
    ["pack:test:front", "front.png"],
    ["pack:test:back", "back.png"],
    ["pack:test:icon", "icon.png"],
    ["pack:test:dodge-electric", "dodge.png"],
    ["pack:test:enemy-front", "enemy.png"]
  ].map(([id, file]) => ({
    id,
    assetType: "sprite",
    mediaType: "image",
    category: "dodge",
    compatibility: {
      uses: ["combat", "capture", "editor"]
    },
    resource: {
      file,
      frameCount:
        id === "pack:test:dodge-electric"
          ? 8
          : 1,
      frameMs:
        id === "pack:test:dodge-electric"
          ? 45
          : undefined,
      format:
        id === "pack:test:dodge-electric"
          ? "sprite-strip"
          : undefined
    }
  }));

  const source =
    adaptCaptureExportToNativeVisualSourceV1({
      exported: visualExport(),
      assetCatalog: {
        version: 1,
        assets
      },
      profiles: [
        {
          id: "biped",
          idle: {},
          attack: {},
          hit: {},
          ko: {}
        }
      ],
      assetUrlForFile(file) {
        return "https://assets.test/" + file;
      }
    });

  const local =
    source.creatureMetas.find(
      (entry) =>
        entry.id === "crea-dodge-fx"
    );

  assert.deepEqual(
    local.dodgeFx,
    {
      assetId: "pack:test:dodge-electric",
      url: "https://assets.test/dodge.png",
      frameCount: 8,
      frameMs: 45,
      format: "sprite-strip",
      displayScale: 1.4,
      offsetX: 6,
      offsetY: -8
    }
  );

  const enemy =
    source.creatureMetas.find(
      (entry) =>
        entry.id === "crea-enemy"
    );
  assert.equal(
    enemy.dodgeFx,
    null,
    "absence of authored Dodge FX must stay absent even if a creature has an element"
  );
});

test("visual controller owns a creature Dodge FX path without adding a gameplay timer", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/demo-app.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /playDodgeAppearanceFx/
  );
  assert.match(
    source,
    /type\s*===\s*["']dodge["']/
  );
  assert.match(
    source,
    /metadata\.durationMs|metadata\?\.durationMs/
  );

  assert.doesNotMatch(
    source,
    /dodgeAppearanceTimer|dodgeFxTimer/
  );
});


test("creature without authored Dodge FX remains Creature Presentation V2", () => {
  const fields = creatureFields();
  fields.visual = {
    frontAssetId: fields.visual.frontAssetId,
    backAssetId: fields.visual.backAssetId,
    iconAssetId: fields.visual.iconAssetId,
    dodgeAssetId: ""
  };

  const draft =
    buildHumanCreatureDraftV3(fields);

  assert.equal(
    draft.presentation.version,
    2
  );
  assert.equal(
    "dodge" in draft.presentation.visual,
    false
  );
});

test("DOM Dodge FX uses the Runtime duration, creature geometry and authored appearance offsets", async () => {
  let appended = null;
  let removed = false;
  let animationOptions = null;
  let cancelled = false;

  const ownerDocument = {
    createElement() {
      return {
        ownerDocument,
        className: "",
        dataset: {},
        style: {},
        remove() {
          removed = true;
        }
      };
    }
  };

  const arena = {
    ownerDocument,
    append(node) {
      appended = node;
    },
    getBoundingClientRect() {
      return {
        left: 10,
        top: 20,
        width: 600,
        height: 340
      };
    }
  };

  const anchor = {
    getBoundingClientRect() {
      return {
        left: 110,
        top: 120,
        width: 80,
        height: 60
      };
    }
  };

  const handle =
    playDomCreatureDodgeFxV1({
      arena,
      anchor,
      visual: {
        assetId:
          "pack:test:dodge-electric",
        url:
          "https://assets.test/dodge.webp",
        frameCount: 8,
        frameMs: 45,
        format: "sprite-strip",
        displayScale: 1.4,
        offsetX: 6,
        offsetY: -8
      },
      durationMs: 500,
      animate(node, keyframes, options) {
        animationOptions = options;
        return {
          finished: Promise.resolve(),
          cancel() {
            cancelled = true;
          }
        };
      }
    });

  assert.equal(handle.status, "running");
  assert.equal(
    appended.dataset.skillFx,
    "creature-dodge"
  );
  assert.equal(
    appended.dataset.assetId,
    "pack:test:dodge-electric"
  );
  assert.equal(appended.style.left, "146px");
  assert.equal(appended.style.top, "122px");
  assert.equal(appended.style.width, "112px");
  assert.equal(appended.style.height, "112px");
  assert.equal(
    appended.style.backgroundSize,
    "800% 100%"
  );
  assert.equal(
    appended.style.animationDuration,
    "500ms",
    "sprite playback must stretch to the Runtime-owned dodge window"
  );
  assert.equal(
    animationOptions.duration,
    500
  );

  const result = await handle.finished;
  assert.equal(result.status, "finished");
  assert.equal(removed, true);
  assert.equal(cancelled, false);
});
