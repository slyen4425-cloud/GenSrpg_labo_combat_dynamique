import { mountCombatDemo } from "../../src/ui/demo-app.js";

const root = document.querySelector("[data-combat-demo]");

mountCombatDemo({ root })
  .then((demo) => {
    window.addEventListener("pagehide", () => demo.dispose(), { once: true });
  })
  .catch((error) => {
    const status = document.querySelector("[data-demo-status]");
    if (status) {
      status.textContent = error.message;
      status.dataset.state = "error";
    }
    console.error(error);
  });
