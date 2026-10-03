import {
  mountCombatDemo
} from "../../src/ui/demo-app.js";
import {
  mountCoop2v2Test
} from "../../src/ui/combat-2v2-test-ui.js";
import {
  buildShowcaseMoussadosLoupDuelSourceV1
} from "../../src/adapters/input/capture/showcase-moussados-loup-duel-source-v1.js";
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

const root =
  document.querySelector("[data-combat-demo]");
const arena =
  document.querySelector("[data-combat-arena]");
const status =
  document.querySelector("[data-duel-status]");

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

const SOURCE_URLS = Object.freeze({
  moussados:
    new URL(
      "../../data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json",
      import.meta.url
    ),
  loup:
    new URL(
      "../../data/capture/showcase/crea-loup.capture-creature-transfer-v1.json",
      import.meta.url
    ),
  nativeSkills:
    new URL(
      "../../data/combat/skills/catalog.v1.json",
      import.meta.url
    ),
  statRegistry:
    new URL(
      "../../data/capture/monster-capture-stat-registry.v1.json",
      import.meta.url
    )
});

const SHOWCASE_SKILL_URLS = [
  "cap_fire_atk_6",
  "cap_fire_special_1",
  "fireball",
  "lib_flame_bite"
].map(
  (id) =>
    new URL(
      "../../data/capture/showcase/" +
        id +
        ".capture-skill-transfer-v1.json",
      import.meta.url
    )
);

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      "Ressource duel indisponible : " +
        response.status
    );
  }
  return response.json();
}

function setStatus(message, state = "ready") {
  status.textContent = message;
  status.dataset.state = state;
}

async function visualMetaFor(
  creatureId,
  displayName
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
    assetBaseUrl:
      new URL(".", metaUrl).href
  });
}

function applyLavaArena() {
  const presentation =
    demoPresentationAssets
      .presentationForArena("lava");

  if (!presentation?.background?.url) {
    return;
  }

  arena.dataset.arenaBackground = "image";
  arena.dataset.arenaTheme = "lava";
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
    const [
      moussadosTransfer,
      loupTransfer,
      nativeSkillCatalog,
      statRegistry,
      ...tail
    ] = await Promise.all([
      fetchJson(SOURCE_URLS.moussados),
      fetchJson(SOURCE_URLS.loup),
      fetchJson(SOURCE_URLS.nativeSkills),
      fetchJson(SOURCE_URLS.statRegistry),
      ...SHOWCASE_SKILL_URLS.map(fetchJson),
      ...PROFILE_URLS.map(fetchJson)
    ]);

    const showcaseSkillTransfers =
      tail.slice(
        0,
        SHOWCASE_SKILL_URLS.length
      );
    const profiles =
      tail.slice(
        SHOWCASE_SKILL_URLS.length
      );

    const nativeCombatSource =
      buildShowcaseMoussadosLoupDuelSourceV1({
        moussadosTransfer,
        loupTransfer,
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

    const creatureMetas =
      await Promise.all([
        visualMetaFor(
          local.creatureId,
          local.displayName
        ),
        visualMetaFor(
          enemy.creatureId,
          enemy.displayName
        )
      ]);

    applyLavaArena();

    mountedVisuals =
      await mountCombatDemo({
        root,
        nativeVisualSource: {
          profiles,
          creatureMetas
        }
      });

    mountedCombat =
      await mountCoop2v2Test({
        root,
        visuals: mountedVisuals,
        nativeCombatSource,
        presentationAssets:
          demoPresentationAssets,
        onBattleEnd({ outcome }) {
          setStatus(
            outcome === "victory"
              ? "Victoire Moussados — duel terminé"
              : "Défaite Moussados — duel terminé"
          );
        }
      });

    const genericCount =
      creatureMetas.filter(
        (meta) =>
          meta.genericFallback === true
      ).length;

    setStatus(
      genericCount > 0
        ? "Duel configuré · visuel générique détecté"
        : "Moussados vs Loup volcanique · presets Showcase actifs"
    );
  })
  .catch((error) => {
    setStatus(
      "Duel impossible : " +
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
