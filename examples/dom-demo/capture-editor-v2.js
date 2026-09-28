import {
  mountCaptureEditorHumanV2
} from "../../src/ui/capture-editor-human-v2.js";
import {
  createCaptureEditorPreviewSessionV2
} from "../../src/ui/capture-editor-preview-session-v2.js";
import {
  adaptCaptureExportToNativeVisualSourceV1
} from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";
import {
  mountCaptureCombatPreviewV1
} from "../../src/ui/capture-combat-preview-v1.js";
import {
  GLOBAL_VISUAL_LIBRARY,
  globalVisualAssetUrl
} from "../../src/assets/global-visual-library.js";
import {
  demoPresentationAssets
} from "./demo-assets.js";
import {
  createCaptureSkillPresentationAssetsV2
} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";

const PROFILE_URLS = Object.freeze([
  new URL("../../data/profiles/biped.profile.json", import.meta.url),
  new URL("../../data/profiles/quadruped.profile.json", import.meta.url),
  new URL("../../data/profiles/serpentine.profile.json", import.meta.url),
  new URL("../../data/profiles/drake.profile.json", import.meta.url)
]);

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      "Ressource preview indisponible (" + response.status + ")"
    );
  }
  return response.json();
}

async function loadPreviewVisualContext() {
  const [assetCatalog, ...profiles] = await Promise.all([
    fetchJson(GLOBAL_VISUAL_LIBRARY.catalogUrl),
    ...PROFILE_URLS.map((url) => fetchJson(url))
  ]);

  return Object.freeze({
    assetCatalog,
    profiles: Object.freeze(profiles)
  });
}

const opponentCreatureDraft = {
  schema: "capture-creature-editor-draft-v3",
  id: "crea-enemy",
  displayName: "Braisombre",
  description: "Créature adverse de prévisualisation.",
  level: 1,
  sourceStats: {
    force: 10,
    agility: 10,
    intelligence: 10,
    spirit: 10,
    endurance: 10,
    initiative: 10
  },
  elements: ["fire"],
  resistances: [],
  capture: {
    capturable: true,
    captureRate: 30,
    spawnChance: 10,
    spawnTags: ["fire"],
    evolution: null
  },
  combat: {
    maxHp: 50,
    initialHp: 50,
    maxEnergy: 10,
    initialEnergy: 0,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 2,
    chargeTimeModifierPct: 0
  },
  skillIds: ["enemy-hit"],
  presentation: {
    id: "creature:crea-enemy",
    version: 2,
    subjectType: "creature",
    subjectId: "crea-enemy",
    profileId: "drake",
    displayScale: 1,
    visual: {
      front: {
        assetId: "pack:capture:creature-braisombre-opponent-01"
      },
      back: {
        assetId: "pack:capture:creature-braisombre-player-01"
      },
      icon: {
        assetId: "pack:capture:creature-braisombre-icon-01"
      }
    },
    sockets: [
      {
        id: "projectile",
        label: "Projectile",
        front: { x: 0.2, y: 0.45 },
        back: { x: 0.6, y: 0.38 }
      }
    ],
    audio: {}
  }
};

const opponentSkillDrafts = [
  {
    schema: "capture-skill-editor-draft-v1",
    id: "enemy-hit",
    description: "Attaque adverse simple.",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    definition: {
      id: "enemy-hit",
      name: "Attaque",
      category: "offensive",
      form: "contact",
      element: null,
      approachMode: "ground",
      energyCost: 1,
      preparationMs: 500,
      travelMs: 500,
      recoveryMs: 300,
      cooldownMs: 1000,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      effect: {
        damage: 2
      }
    },
    presentation: null
  }
];

const opponentLoadout = {
  schema: "capture-active-skill-loadout-v1",
  creatureId: "crea-enemy",
  slots: [
    { id: "slot-1", skillId: "enemy-hit" },
    { id: "slot-2", skillId: null },
    { id: "slot-3", skillId: null },
    { id: "slot-4", skillId: null }
  ]
};

const root = document.querySelector(
  "[data-capture-editor-human]"
);
const previewShell = document.querySelector(
  "[data-capture-preview-shell]"
);
const previewHost = document.querySelector(
  "[data-capture-preview-host]"
);
const previewTemplate = document.querySelector(
  "[data-capture-preview-template]"
);
const testButton = document.querySelector(
  "[data-editor-test-combat]"
);
const backButton = document.querySelector(
  "[data-preview-back-editor]"
);
const editorStatus = root?.querySelector(
  "[data-editor-status]"
);

if (
  !root ||
  !previewShell ||
  !previewHost ||
  !previewTemplate ||
  !testButton ||
  !backButton ||
  !editorStatus
) {
  throw new Error("Structure Capture Editor preview incomplète");
}

const editor = mountCaptureEditorHumanV2({
  root,
  opponentCreatureDraft,
  opponentSkillDrafts,
  opponentLoadout
});

let visualContext = null;
const visualContextPromise = loadPreviewVisualContext()
  .then((context) => {
    visualContext = context;
    testButton.disabled = false;
    return context;
  })
  .catch((error) => {
    editorStatus.textContent =
      "Preview combat indisponible : " + error.message;
    editorStatus.dataset.tone = "error";
    throw error;
  });

function setMode(mode) {
  const preview = mode === "preview";
  root.hidden = preview;
  previewShell.hidden = !preview;
  document.body.dataset.editorView = mode;
}

function clonePreviewRoot(nativeCombatSource) {
  previewHost.replaceChildren(
    previewTemplate.content.cloneNode(true)
  );

  const previewRoot = previewHost.querySelector(
    "[data-combat-demo]"
  );
  if (!previewRoot) {
    throw new Error("Template combat preview invalide");
  }

  const activeActorIds = new Set(
    nativeCombatSource.battleFormat.actors.map(
      (actor) => actor.actorId
    )
  );

  for (
    const element of previewRoot.querySelectorAll(
      "[data-preview-actor-ui]"
    )
  ) {
    element.hidden = !activeActorIds.has(
      element.dataset.previewActorUi
    );
  }

  return previewRoot;
}

function applyPreviewArenaPresentation(
  previewRoot,
  arenaId = "city"
) {
  const arena = previewRoot.querySelector(
    "[data-combat-arena]"
  );
  if (!arena) {
    throw new Error(
      "Arène de preview introuvable"
    );
  }

  const presentation =
    demoPresentationAssets.presentationForArena(
      arenaId
    );

  if (!presentation?.background?.url) {
    throw new RangeError(
      "Présentation d’arène inconnue : " +
        arenaId
    );
  }

  arena.dataset.arenaBackground = "image";
  arena.dataset.arenaTheme = arenaId;
  arena.style.setProperty(
    "--arena-background-image",
    `url("${presentation.background.url}")`
  );
  arena.style.setProperty(
    "--arena-background-position",
    presentation.backgroundPosition ??
      "center"
  );
  arena.style.setProperty(
    "--arena-background-size",
    presentation.backgroundSize ??
      "cover"
  );
}

function resolvePreviewPresentationAsset(assetId) {
  const demoAsset = demoPresentationAssets.asset(assetId);
  if (demoAsset) {
    return demoAsset;
  }

  const catalogAsset =
    visualContext?.assetCatalog?.assets?.find(
      (asset) => asset.id === assetId
    ) ?? null;
  const file = catalogAsset?.resource?.file;

  if (typeof file !== "string" || file.trim() === "") {
    return null;
  }

  return Object.freeze({
    assetId,
    url: globalVisualAssetUrl(file)
  });
}

function buildPreviewPresentationAssets(
  nativeCombatSource
) {
  const native =
    createCaptureSkillPresentationAssetsV2({
      skillPresentations:
        nativeCombatSource.skillPresentations ?? {},
      assetForId: resolvePreviewPresentationAsset,
      audioAssetForId(assetId) {
        return demoPresentationAssets.audioAsset(assetId);
      }
    });

  return Object.freeze({
    presentationForArena(arenaId) {
      return demoPresentationAssets.presentationForArena(
        arenaId
      );
    },
    presentationForSkill(skillId, context = {}) {
      return (
        native.presentationForSkill(skillId, context) ??
        demoPresentationAssets.presentationForSkill(
          skillId,
          context
        )
      );
    },
    audioAsset(assetId) {
      return (
        native.audioAsset(assetId) ??
        demoPresentationAssets.audioAsset(assetId)
      );
    }
  });
}

const session = createCaptureEditorPreviewSessionV2({
  editor,
  adaptVisualExport(exported) {
    if (!visualContext) {
      throw new Error(
        "Contexte visuel de preview non chargé"
      );
    }

    return adaptCaptureExportToNativeVisualSourceV1({
      exported,
      assetCatalog: visualContext.assetCatalog,
      profiles: visualContext.profiles,
      assetUrlForFile: globalVisualAssetUrl
    });
  },
  async mountPreview({
    nativeCombatSource,
    nativeVisualSource
  }) {
    const previewRoot = clonePreviewRoot(
      nativeCombatSource
    );

    applyPreviewArenaPresentation(
      previewRoot,
      "city"
    );

    const mounted = await mountCaptureCombatPreviewV1({
      root: previewRoot,
      nativeCombatSource,
      nativeVisualSource,
      presentationAssets:
        buildPreviewPresentationAssets(
          nativeCombatSource
        )
    });

    let disposed = false;
    return Object.freeze({
      dispose() {
        if (disposed) {
          return;
        }
        disposed = true;
        mounted.dispose();
        previewHost.replaceChildren();
      }
    });
  },
  onModeChange: setMode
});

testButton.disabled = true;
setMode("editor");

testButton.addEventListener("click", async () => {
  testButton.disabled = true;

  try {
    await visualContextPromise;
    const result = await session.launch();

    if (!result.ok) {
      testButton.disabled = false;
      return;
    }
  } catch (error) {
    editorStatus.textContent =
      "Impossible de lancer le combat : " + error.message;
    editorStatus.dataset.tone = "error";
    setMode("editor");
    testButton.disabled = visualContext === null;
  }
});

backButton.addEventListener("click", () => {
  session.returnToEditor();
  testButton.disabled = visualContext === null;
});

window.addEventListener(
  "pagehide",
  () => session.dispose(),
  { once: true }
);
