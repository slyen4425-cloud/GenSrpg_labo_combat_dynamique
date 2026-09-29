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
      creatureId: "crea_galewing",
      metaId: "ailevent",
      metaFile:
        "capture/creatures/ailevent/ailevent.meta.json"
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

  return (
    CAPTURE_CREATURE_VISUAL_BINDINGS_V1.find(
      (entry) =>
        entry.creatureId === creatureId.trim()
    ) ?? null
  );
}
