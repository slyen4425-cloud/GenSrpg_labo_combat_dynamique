import { mountCombatDemo } from "../../src/ui/demo-app.js";
import { mountCombatTest } from "../../src/ui/combat-test-ui.js";
import { demoPresentationAssets } from "./demo-assets.js";

const root = document.querySelector("[data-combat-demo]");
const arena = root?.querySelector("[data-combat-arena]") ?? null;
const arenaBackgroundImage =
  arena?.querySelector("[data-arena-background-image]") ?? null;
const searchParams = new URLSearchParams(window.location.search);
const previewVariant = searchParams.get("variant");
const isLoupLavaPreview = previewVariant === "loup-lava";

function applyArenaPresentation(arenaId) {
  if (!arena || !arenaBackgroundImage) {
    return;
  }

  const presentation =
    demoPresentationAssets.presentationForArena?.(arenaId) ?? null;

  if (!presentation?.background?.url) {
    arena.removeAttribute("data-arena-background");
    arenaBackgroundImage.hidden = true;
    arenaBackgroundImage.removeAttribute("src");
    return;
  }

  arena.dataset.arenaBackground = "image";
  arena.dataset.arenaTheme = arenaId;
  arenaBackgroundImage.hidden = false;
  arenaBackgroundImage.src = presentation.background.url;
}

applyArenaPresentation("forest");
if (isLoupLavaPreview) {
  applyArenaPresentation("lava");
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
