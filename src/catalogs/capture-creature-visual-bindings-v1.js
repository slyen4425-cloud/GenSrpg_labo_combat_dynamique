import {
  canonicalCaptureCreatureIdV1
} from "./capture-canonical-creature-catalog-v1.js";

export const CAPTURE_CREATURE_VISUAL_BINDINGS_V1 =
  Object.freeze([
    Object.freeze({
      creatureId: "crea_maraileron",
      metaId: "maraileron",
      metaFile:
        "capture/creatures/maraileron/maraileron.meta.json"
    }),
    Object.freeze({
      creatureId: "crea_voltik",
      metaId: "voltige",
      metaFile:
        "capture/creatures/voltige/voltige.meta.json"
    }),
    Object.freeze({
      creatureId: "crea_ailevent",
      metaId: "ailevent",
      metaFile:
        "capture/creatures/ailevent/ailevent.meta.json"
    }),
    Object.freeze({
      creatureId: "crea_mossback",
      metaId: "golem_moussu",
      metaFile:
        "capture/creatures/golem_moussu/golem_moussu.meta.json"
    }),
    Object.freeze({
      creatureId: "crea-loup",
      metaId: "loup_volcanique",
      metaFile:
        "capture/creatures/loup_volcanique/loup_volcanique.meta.json"
    }),
    Object.freeze({
      creatureId: "crea_lumilo",
      metaId: "renard_magique_dore",
      metaFile:
        "capture/creatures/renard_magique_dore/renard_magique_dore.meta.json"
    }),
    Object.freeze({
      creatureId: "crea_lucieclair",
      metaId: "guepe_cybernetique",
      metaFile:
        "capture/creatures/guepe_cybernetique/guepe_cybernetique.meta.json"
    })
  ]);

export function captureCreatureVisualBindingForIdV1(
  creatureId
) {
  if (
    typeof creatureId !== "string" ||
    creatureId.trim() === ""
  ) {
    return null;
  }

  const canonicalId =
    canonicalCaptureCreatureIdV1(
      creatureId
    );

  return (
    CAPTURE_CREATURE_VISUAL_BINDINGS_V1.find(
      (entry) =>
        entry.creatureId === canonicalId
    ) ?? null
  );
}
