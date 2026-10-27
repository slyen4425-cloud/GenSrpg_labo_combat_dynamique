import { mountCombatDemo } from "../../src/ui/demo-app.js";
import { mountCombatTest } from "../../src/ui/combat-test-ui.js";
import { demoPresentationAssets } from "./demo-assets.js";

const root = document.querySelector("[data-combat-demo]");
const arena = root?.querySelector("[data-combat-arena]") ?? null;
const searchParams = new URLSearchParams(window.location.search);
const previewVariant = searchParams.get("variant");
const isLoupLavaPreview = previewVariant === "loup-lava";
const isFourCityPreview = previewVariant === "four-city";

function applyArenaPresentation(arenaId) {
  if (!arena) {
    return;
  }

  const presentation =
    demoPresentationAssets.presentationForArena?.(arenaId) ?? null;

  if (!presentation?.background?.url) {
    arena.removeAttribute("data-arena-background");
    arena.style.removeProperty("--arena-background-image");
    arena.style.removeProperty("--arena-background-position");
    arena.style.removeProperty("--arena-background-size");
    return;
  }

  arena.dataset.arenaBackground = "image";
  arena.dataset.arenaTheme = arenaId;
  arena.style.setProperty(
    "--arena-background-image",
    `url("${presentation.background.url}")`
  );
  arena.style.setProperty(
    "--arena-background-position",
    presentation.backgroundPosition ?? "center"
  );
  arena.style.setProperty(
    "--arena-background-size",
    presentation.backgroundSize ?? "cover"
  );
}

applyArenaPresentation("forest");
if (isLoupLavaPreview) {
  applyArenaPresentation("lava");
} else if (isFourCityPreview) {
  applyArenaPresentation("city");
}

Promise.resolve()
  .then(async () => {
    const visuals = await mountCombatDemo({ root });
    const combat = await mountCombatTest({
      root,
      visuals,
      presentationAssets: demoPresentationAssets,
      rosterUrl: isLoupLavaPreview
        ? new URL(
            "../../data/combat/rosters/demo-loup-lava-2v2.roster.json",
            import.meta.url
          )
        : isFourCityPreview
          ? new URL(
              "../../data/combat/rosters/demo-four-creatures-city.roster.json",
              import.meta.url
            )
          : undefined
    });

    window.addEventListener(
      "pagehide",
      () => {
        combat.dispose();
        visuals.dispose();
      },
      { once: true }
    );
  })
  .catch((error) => {
    const status = document.querySelector("[data-demo-status]");
    if (status) {
      status.textContent = error.message;
      status.dataset.state = "error";
    }
    console.error(error);
  });
