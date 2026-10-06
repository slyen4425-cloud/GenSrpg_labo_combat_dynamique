import {
  mountCaptureEditorHumanV2
} from "../../src/ui/capture-editor-human-v2.js";
import {
  createCreatorVisualAssetSessionV1
} from "../../src/assets/creator-visual-asset-session-v1.js";
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
import {
  privateAudioRuntimeAssetV1
} from "../../src/assets/private-audio-runtime-library-v1.js";
import {
  createPrivateAudioPreviewControllerV1
} from "../../src/ui/private-audio-preview-controller-v1.js";
import {
  createCapturePreviewDisplayModeV1
} from "../../src/ui/capture-preview-display-mode-v1.js";
const PROFILE_URLS = Object.freeze([
  new URL("../../data/profiles/biped.profile.json", import.meta.url),
  new URL("../../data/profiles/quadruped.profile.json", import.meta.url),
  new URL("../../data/profiles/serpentine.profile.json", import.meta.url),
  new URL("../../data/profiles/flying.profile.json", import.meta.url),
  new URL("../../data/profiles/massive.profile.json", import.meta.url)
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
  const [assetCatalog, profiles] = await Promise.all([
    fetchJson(GLOBAL_VISUAL_LIBRARY.catalogUrl),
    Promise.all(PROFILE_URLS.map(url => fetchJson(url)))
  ]);
  return Object.freeze({ assetCatalog, profiles: Object.freeze(profiles) });
}

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
const arenaSelect = root?.querySelector(
  "[data-test-arena]"
);
const landscapeMode = root?.querySelector(
  "[data-preview-landscape-mode]"
);

if (
  !root ||
  !previewShell ||
  !previewHost ||
  !previewTemplate ||
  !testButton ||
  !backButton ||
  !editorStatus ||
  !arenaSelect ||
  !landscapeMode
) {
  throw new Error("Structure Capture Editor preview incomplète");
}

arenaSelect.textContent = "";
for (
  const option of
  demoPresentationAssets.arenaOptions()
) {
  const element = document.createElement("option");
  element.value = option.id;
  element.textContent = option.label;
  arenaSelect.append(element);
}
arenaSelect.value = "city";

const creatorVisualAssets =
  createCreatorVisualAssetSessionV1();

const editor = mountCaptureEditorHumanV2({
  root,
  creatorVisualAssets
});

const audioPreviewController =
  createPrivateAudioPreviewControllerV1({
    root,
    resolveAudioAsset:
      privateAudioRuntimeAssetV1
  });

const previewDisplayMode =
  createCapturePreviewDisplayModeV1({
    documentRef: document,
    screenRef: globalThis.screen,
    fullscreenHost:
      document.documentElement,
    previewShell
  });

let visualContext = null;
const visualContextPromise = loadPreviewVisualContext()
  .then((context) => {
    visualContext = context;
    return context;
  })
  .catch((error) => {
    editorStatus.textContent =
      "Preview combat indisponible : " + error.message;
    editorStatus.dataset.tone = "error";
    throw error;
  });

Promise.all([visualContextPromise, editor.ready]).then(() => {
  testButton.disabled = false;
}).catch(error => {
  editorStatus.textContent = "Combat de test indisponible : " + error.message;
  editorStatus.dataset.tone = "error";
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

  const actorById = new Map(
    nativeCombatSource.battleFormat.actors.map(
      (actor) => [actor.actorId, actor]
    )
  );

  for (
    const element of previewRoot.querySelectorAll(
      "[data-preview-actor-ui]"
    )
  ) {
    const actorId =
      element.dataset.previewActorUi;
    const actor = actorById.get(actorId);
    element.hidden = !activeActorIds.has(actorId);

    if (actor) {
      for (
        const label of element.querySelectorAll(
          "[data-demo-label], strong"
        )
      ) {
        label.textContent = actor.displayName;
      }
    }
  }

  return previewRoot;
}

function applyPreviewArenaPresentation(
  previewRoot,
  arenaId
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

  const creatorAsset =
    creatorVisualAssets.asset(assetId);
  if (creatorAsset) {
    return Object.freeze({
      assetId,
      url: creatorAsset.resource.runtimeUrl,
      frameCount: 1,
      playbackMode: "once"
    });
  }

  const catalogAsset =
    visualContext?.assetCatalog?.assets?.find(
      (asset) => asset.id === assetId
    ) ?? null;
  const resource = catalogAsset?.resource ?? null;
  const file = resource?.file;

  if (typeof file !== "string" || file.trim() === "") {
    return null;
  }

  return Object.freeze({
    assetId,
    url: globalVisualAssetUrl(file),
    frameCount: Math.max(
      1,
      Math.floor(Number(resource?.frameCount) || 1)
    ),
    frameMs:
      Number.isFinite(Number(resource?.frameMs)) &&
      Number(resource.frameMs) > 0
        ? Number(resource.frameMs)
        : undefined,
    playbackMode:
      resource?.playbackMode === "loop"
        ? "loop"
        : "once"
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
        return (
          privateAudioRuntimeAssetV1(assetId) ??
          demoPresentationAssets.audioAsset(assetId)
        );
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
    statusPresentationFor(statusId, context = {}) {
      return native.statusPresentationFor(statusId, context);
    },
    audioAsset(assetId) {
      return (
        native.audioAsset(assetId) ??
        privateAudioRuntimeAssetV1(assetId) ??
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
      assetCatalog: {
        ...visualContext.assetCatalog,
        assets: [
          ...(visualContext.assetCatalog.assets ?? []),
          ...creatorVisualAssets.list()
        ]
      },
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
      nativeVisualSource.arenaId
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

  const displayModePromise =
    previewDisplayMode.enter({
      enabled: landscapeMode.checked
    });

  try {
    await visualContextPromise;
    await displayModePromise;
    const launchResult =
      await session.launch();

    if (launchResult?.ok !== true) {
      await previewDisplayMode.leave();
    }
  } catch (error) {
    await previewDisplayMode.leave();
    editorStatus.textContent =
      "Impossible de lancer le combat : " + error.message;
    editorStatus.dataset.tone = "error";
    setMode("editor");
  } finally {
    testButton.disabled =
      visualContext === null ||
      session.previewActive;
  }
});

backButton.addEventListener("click", () => {
  session.returnToEditor();
  testButton.disabled =
    visualContext === null;
  void previewDisplayMode.leave();
});

window.addEventListener(
  "pagehide",
  () => {
    audioPreviewController.dispose();
    session.dispose();
    void previewDisplayMode.dispose();
  },
  { once: true }
);


globalThis.addEventListener(
  "pagehide",
  () => {
    creatorVisualAssets.dispose();
  },
  { once: true }
);
