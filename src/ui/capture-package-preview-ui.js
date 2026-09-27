import {
  adaptCaptureCombatPackage
} from "../adapters/input/capture-combat-package-adapter.js";

function requiredElement(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Capture package editor element not found: ${selector}`);
  }
  return element;
}

export function parseCapturePackageText(text) {
  if (typeof text !== "string" || text.trim() === "") {
    throw new TypeError("Le package JSON est vide.");
  }

  let input;
  try {
    input = JSON.parse(text);
  } catch (error) {
    throw new SyntaxError(`JSON invalide : ${error.message}`);
  }

  return adaptCaptureCombatPackage(input);
}

export function mountCapturePackagePreviewEditor({
  root,
  initialPackage,
  onApply
}) {
  if (!root || typeof root.querySelector !== "function") {
    throw new TypeError("root must provide querySelector()");
  }
  if (!initialPackage || typeof initialPackage !== "object") {
    throw new TypeError("initialPackage must be an object");
  }
  if (typeof onApply !== "function") {
    throw new TypeError("onApply must be a function");
  }

  const toggle = requiredElement(
    root,
    "[data-capture-package-toggle]"
  );
  const panel = requiredElement(
    root,
    "[data-capture-package-editor]"
  );
  const textarea = requiredElement(
    root,
    "[data-capture-package-json]"
  );
  const validateButton = requiredElement(
    root,
    "[data-capture-package-validate]"
  );
  const applyButton = requiredElement(
    root,
    "[data-capture-package-apply]"
  );
  const resetButton = requiredElement(
    root,
    "[data-capture-package-reset]"
  );
  const status = requiredElement(
    root,
    "[data-capture-package-status]"
  );

  const initialText = JSON.stringify(initialPackage, null, 2);
  const cleanups = [];
  let disposed = false;

  textarea.value = initialText;
  toggle.hidden = false;

  function listen(element, type, handler) {
    element.addEventListener(type, handler);
    cleanups.push(() => element.removeEventListener(type, handler));
  }

  function setStatus(message, tone = "info") {
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function validate() {
    const model = parseCapturePackageText(textarea.value);
    setStatus(
      `Valide · ${model.packageDefinition.creatures.length} créatures · ${model.packageDefinition.skills.length} compétence(s).`,
      "ok"
    );
    return model;
  }

  async function apply() {
    if (disposed) {
      return Object.freeze({ status: "disposed" });
    }

    try {
      const model = validate();
      applyButton.disabled = true;
      setStatus("Application du package…", "info");
      await onApply(model);
      setStatus(
        `Appliqué · format ${model.battleFormat.id}.`,
        "ok"
      );
      return Object.freeze({ status: "applied", model });
    } catch (error) {
      setStatus(error.message, "warn");
      return Object.freeze({ status: "error", error });
    } finally {
      applyButton.disabled = false;
    }
  }

  function reset() {
    textarea.value = initialText;
    setStatus("Package de démonstration restauré.", "info");
  }

  listen(toggle, "click", () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute(
      "aria-expanded",
      panel.hidden ? "false" : "true"
    );
  });

  listen(validateButton, "click", () => {
    try {
      validate();
    } catch (error) {
      setStatus(error.message, "warn");
    }
  });
  listen(applyButton, "click", () => {
    void apply();
  });
  listen(resetButton, "click", reset);

  return Object.freeze({
    validate,
    apply,
    reset,
    open() {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    },
    close() {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      for (const cleanup of cleanups.splice(0)) {
        cleanup();
      }
    }
  });
}
