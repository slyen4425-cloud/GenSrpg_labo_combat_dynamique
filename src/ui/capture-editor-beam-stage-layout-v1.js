// Editor-only layout: relocate the exact existing fields, never shadow their state.
// Gameplay, Capture Transfer and Sprite Render stay owned by their existing modules.
const STAGE_FIELDS = Object.freeze([
  ["[data-skill-socket]", "start"],
  ["[data-skill-cast-fx]", "start"],
  ["[data-skill-cast-scale]", "start"],
  ["[data-skill-cast-playback]", "start"],
  ["[data-skill-beam-start-fx]", "start"],
  ["[data-skill-beam-start-scale]", "start"],
  ["[data-skill-cast-audio]", "start"],
  ["[data-skill-travel-fx]", "body"],
  ["[data-skill-travel-scale]", "body"],
  ["[data-skill-travel-playback]", "body"],
  ["[data-skill-travel-audio]", "body"],
  ["[data-skill-impact-fx]", "impact"],
  ["[data-skill-impact-scale]", "impact"],
  ["[data-skill-impact-duration]", "impact"],
  ["[data-skill-impact-audio]", "impact"]
]);

const LAYOUTS = new WeakMap();

export function mountCaptureBeamStageLayoutV1(root) {
  const existing = LAYOUTS.get(root);
  if (existing) return existing;

  const host = root.querySelector("[data-skill-beam-stage-editor]");
  const form = root.querySelector("[data-skill-form]");
  if (!host || !form) {
    return Object.freeze({ sync() {}, dispose() {} });
  }

  const moved = [];
  const stages = ["start", "body", "impact"];
  for (const [selector, stage] of STAGE_FIELDS) {
    const input = root.querySelector(selector);
    const label = input?.closest("label");
    const dest = root.querySelector('[data-beam-stage-fields="' + stage + '"]');
    if (!label || !label.parentNode || !dest) {
      throw new Error("Rayon : contrôle canonique manquant : " + selector);
    }
    // A comment retains the exact original location of this one canonical label.
    const marker = root.ownerDocument.createComment("beam-stage-" + stage);
    label.parentNode.insertBefore(marker, label);
    moved.push({ label, marker, dest });
  }

  const sync = () => {
    const active = form.value === "beam";
    host.dataset.beamActive = active ? "true" : "false";
    for (const { label, marker, dest } of moved) {
      if (active) {
        if (label.parentNode !== dest) dest.append(label);
      } else if (label.parentNode !== marker.parentNode) {
        marker.parentNode.insertBefore(label, marker.nextSibling);
      }
    }
    for (const step of stages) {
      const section = root.querySelector('[data-beam-stage="' + step + '"]');
      if (section) section.hidden = !active;
    }
    const help = root.querySelector("[data-beam-four-stage-help]");
    if (help) {
      help.textContent = active
        ? "Les trois phases ci-dessous sont reliées au même rayon. Tu peux modifier leurs sprites et tailles directement ici ; il faudra ensuite enregistrer la capacité."
        : "Choisis Style : Rayon, ou applique le modèle de rayon d’eau pour configurer les trois phases ici.";
    }
  };

  const dispose = () => {
    for (const { label, marker } of moved) {
      if (marker.parentNode) {
        if (label !== marker.nextSibling) {
          marker.parentNode.insertBefore(label, marker.nextSibling);
        }
        marker.remove();
      }
    }
    LAYOUTS.delete(root);
  };

  const api = Object.freeze({ sync, dispose });
  LAYOUTS.set(root, api);
  sync();
  return api;
}

export function syncCaptureBeamStageLayoutV1(root) {
  LAYOUTS.get(root)?.sync();
}
