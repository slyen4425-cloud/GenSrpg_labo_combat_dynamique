import { mountCombatDemo } from "../../src/ui/demo-app.js";
import { mountCombatTest } from "../../src/ui/combat-test-ui.js";

const root = document.querySelector("[data-combat-demo]");

Promise.resolve()
  .then(async () => {
    const visuals = await mountCombatDemo({ root });
    const combat = await mountCombatTest({ root, visuals });

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
