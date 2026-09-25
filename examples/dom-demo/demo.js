import { mountCombatDemo } from "../../src/ui/demo-app.js";
import { mountCombatTest } from "../../src/ui/combat-test-ui.js";
import { demoPresentationAssets } from "./demo-assets.js";

const root = document.querySelector("[data-combat-demo]");
const arena = root?.querySelector("[data-combat-arena]") ?? null;

function applyArenaPresentation(arenaId) {
  if (!arena) {
    return;
  }

  const presentation =
    demoPresentationAssets.presentationForArena?.(arenaId) ?? null;

  if (!presentation?.background?.url) {
    arena.removeAttribute("data-arena-background");
    arena.style.removeProperty("--arena-background-image");
    return;
  }

  arena.dataset.arenaBackground = "image";
  arena.dataset.arenaTheme = arenaId;
  arena.style.setProperty(
    "--arena-background-image",
    `url("${presentation.background.url}")`
  );
}

applyArenaPresentation("forest");

Promise.resolve()
  .then(async () => {
    const visuals = await mountCombatDemo({ root });
    const combat = await mountCombatTest({
      root,
      visuals,
      presentationAssets: demoPresentationAssets
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
