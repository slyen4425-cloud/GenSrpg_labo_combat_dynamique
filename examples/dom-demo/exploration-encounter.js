import {
  mountCombatDemo
} from "../../src/ui/demo-app.js";
import {
  mountCoop2v2Test
} from "../../src/ui/combat-2v2-test-ui.js";
import {
  buildExplorationEncounterCombatSourceV1
} from "../../src/adapters/input/capture/exploration-encounter-combat-source-v1.js";
import {
  readExplorationCombatHandoffV1,
  completeExplorationCombatHandoffV1
} from "../../src/ui/exploration-encounter-handoff-v1.js";
import {
  fallbackEncounterCreatureMetaV1,
  bindEncounterCreatureMetaV1
} from "../../src/ui/exploration-encounter-visual-source-v1.js";
import {
  captureCreatureVisualBindingForIdV1
} from "../../src/catalogs/capture-creature-visual-bindings-v1.js";
import {
  globalVisualAssetUrl
} from "../../src/assets/global-visual-library.js";
import {
  demoPresentationAssets
} from "./demo-assets.js";
import {
  createCaptureRuntimePresentationAssetsV1
} from "../../src/adapters/presentation/capture-runtime-presentation-assets-v1.js";
import {
  CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1
} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {
  CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1
} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";

const root =
  document.querySelector("[data-combat-demo]");
const arena =
  document.querySelector("[data-combat-arena]");
const bridgeStatus =
  document.querySelector("[data-bridge-status]");

const PROFILE_URLS = [
  "biped",
  "flying",
  "massive",
  "quadruped",
  "serpentine"
].map(
  (id) =>
    new URL(
      "../../data/profiles/" + id + ".profile.json",
      import.meta.url
    )
);

const CREATURES_URL =
  new URL(
    "../../data/capture/monster-capture-creatures.v1.json",
    import.meta.url
  );

const PLAYER_PARTY_URL =
  new URL(
    "../../data/capture/parties/player-party.v1.json",
    import.meta.url
  );

const CONFIGURED_CREATURE_URLS =
  CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.map(
    (relativePath) =>
      new URL(
        "../../" + relativePath,
        import.meta.url
      )
  );

const NATIVE_SKILL_CATALOG_URL =
  new URL(
    "../../data/combat/skills/catalog.v1.json",
    import.meta.url
  );

const STAT_REGISTRY_URL =
  new URL(
    "../../data/capture/monster-capture-stat-registry.v1.json",
    import.meta.url
  );

const SHOWCASE_SKILL_URLS =
  CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.map(
    (relativePath) =>
      new URL(
        "../../" + relativePath,
        import.meta.url
      )
  );

const ARENA_BY_FAMILY = Object.freeze({
  forest: "forest",
  snow: "snow",
  volcano: "lava",
  mountain: "cave",
  sea: "cave",
  plain: "forest",
  road: "forest",
  sand: "forest"
});

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      "Ressource combat indisponible : " +
        response.status
    );
  }
  return response.json();
}

function setBridgeStatus(
  message,
  state = "ready"
) {
  bridgeStatus.textContent = message;
  bridgeStatus.dataset.state = state;
}

async function visualMetaFor(
  creatureId,
  displayName,
  presentation = null
) {
  const binding =
    captureCreatureVisualBindingForIdV1(
      creatureId
    );

  if (!binding) {
    return fallbackEncounterCreatureMetaV1({
      creatureId,
      displayName
    });
  }

  const metaUrl =
    globalVisualAssetUrl(
      binding.metaFile
    );
  const meta =
    await fetchJson(metaUrl);

  return bindEncounterCreatureMetaV1({
    creatureId,
    displayName,
    sourceMeta: meta,
    presentation,
    assetBaseUrl:
      new URL(".", metaUrl).href
  });
}

function applyArena(
  terrainFamilyId
) {
  const arenaId =
    ARENA_BY_FAMILY[terrainFamilyId] ??
    "forest";
  const presentation =
    demoPresentationAssets
      .presentationForArena(arenaId);

  if (!presentation?.background?.url) {
    return;
  }

  arena.dataset.arenaBackground = "image";
  arena.dataset.arenaTheme = arenaId;
  arena.style.setProperty(
    "--arena-background-image",
    'url("' +
      presentation.background.url +
      '")'
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

let mountedVisuals = null;
let mountedCombat = null;

Promise.resolve()
  .then(async () => {
    const handoff =
      readExplorationCombatHandoffV1(
        sessionStorage
      );

    const [
      creatureData,
      playerParty,
      nativeSkillCatalog,
      statRegistry,
      ...tail
    ] = await Promise.all([
      fetchJson(CREATURES_URL),
      fetchJson(PLAYER_PARTY_URL),
      fetchJson(NATIVE_SKILL_CATALOG_URL),
      fetchJson(STAT_REGISTRY_URL),
      ...CONFIGURED_CREATURE_URLS.map(fetchJson),
      ...SHOWCASE_SKILL_URLS.map(fetchJson),
      ...PROFILE_URLS.map(fetchJson)
    ]);

    const configuredCreatureTransfers =
      tail.slice(
        0,
        CONFIGURED_CREATURE_URLS.length
      );
    const skillStart =
      CONFIGURED_CREATURE_URLS.length;
    const skillEnd =
      skillStart +
      SHOWCASE_SKILL_URLS.length;
    const showcaseSkillTransfers =
      tail.slice(
        skillStart,
        skillEnd
      );
    const profiles =
      tail.slice(skillEnd);

    const nativeCombatSource =
      buildExplorationEncounterCombatSourceV1({
        snapshot: handoff.snapshot,
        creatureRecords:
          creatureData.entries,
        partyDefinitions: [
          playerParty
        ],
        configuredCreatureTransfers,
        showcaseSkillTransfers,
        nativeSkillCatalog,
        statRegistry
      });

    const actorById =
      new Map(
        nativeCombatSource
          .battleFormat
          .actors
          .map((actor) => [
            actor.actorId,
            actor
          ])
      );

    const local =
      actorById.get("local-1");
    const enemy =
      actorById.get("enemy-1");

    const configuredPlayerMetas =
      await Promise.all(
        configuredCreatureTransfers.map(
          (transfer) =>
            visualMetaFor(
              transfer.draft.id,
              transfer.draft.displayName,
              transfer.draft.presentation
            )
        )
      );

    const enemyMeta =
      await visualMetaFor(
        enemy.creatureId,
        enemy.displayName
      );

    const creatureMetas =
      [
        ...new Map(
          [
            ...configuredPlayerMetas,
            enemyMeta
          ].map((meta) => [
            meta.id,
            meta
          ])
        ).values()
      ];

    applyArena(
      handoff.snapshot.context
        .terrainFamilyId
    );

    mountedVisuals =
      await mountCombatDemo({
        root,
        nativeVisualSource: {
          profiles,
          creatureMetas
        }
      });

    const runtimePresentationAssets =
      createCaptureRuntimePresentationAssetsV1({
        baseAssets:
          demoPresentationAssets,
        skillPresentations:
          nativeCombatSource
            .skillPresentations
      });

    mountedCombat =
      await mountCoop2v2Test({
        root,
        visuals: mountedVisuals,
        nativeCombatSource,
        presentationAssets:
          runtimePresentationAssets,
        onBattleEnd({ outcome }) {
          const completed =
            completeExplorationCombatHandoffV1({
              storage: sessionStorage,
              outcome
            });

          setBridgeStatus(
            outcome === "victory"
              ? "Victoire — retour à l’exploration…"
              : "Défaite — retour à l’exploration…"
          );

          window.location.assign(
            completed.returnUrl
          );
        }
      });

    const genericCount =
      creatureMetas.filter(
        (meta) =>
          meta.genericFallback === true
      ).length;

    setBridgeStatus(
      genericCount > 0
        ? "Combat réel · visuel générique pour une créature sans asset combat"
        : "Combat réel · assets Capture raccordés"
    );
  })
  .catch((error) => {
    setBridgeStatus(
      "Combat impossible : " +
        error.message,
      "error"
    );
    console.error(error);
  });

window.addEventListener(
  "pagehide",
  () => {
    mountedCombat?.dispose?.();
    mountedVisuals?.dispose?.();
  },
  { once: true }
);
