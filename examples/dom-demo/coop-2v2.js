import { mountCombatDemo } from "../../src/ui/demo-app.js";
import { mountCoop2v2Test } from "../../src/ui/combat-2v2-test-ui.js";
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

applyArenaPresentation("city");

Promise.resolve()
  .then(async () => {
    const visuals = await mountCombatDemo({ root });
    const combat = await mountCoop2v2Test({
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
    const status = document.querySelector("[data-combat-live-status]");
    if (status) {
      status.textContent = error.message;
      status.dataset.tone = "warn";
    }
    console.error(error);
  });
