// Pure option projection for the existing Capture element/stat owners.
// No element definitions, gameplay rules or persisted registry live in this UI module.
function idOf(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function captureEditorElementChannelChoicesV1({
  nativeElements = [],
  statRegistry = null,
  selectedId = "",
  customStat = null
} = {}) {
  const result = [];
  const seen = new Set();
  function add(id, label) {
    const key = idOf(id);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(Object.freeze({
      id: key,
      label: idOf(label) || key
    }));
  }
  for (const entry of nativeElements) {
    add(entry?.id, entry?.label);
  }
  for (const stat of statRegistry?.stats ?? []) {
    // The element belongs to the live stat configuration, not an editor copy.
    // A user-created stat can use its own ID as the damage/resistance element.
    const label = idOf(stat?.label);
    if (stat?.damageChannel) add(stat.damageChannel, label);
    if (stat?.resistanceChannel) add(stat.resistanceChannel, label);
  }
  if (customStat) add(customStat.id, customStat.label);
  // Imported author channels can pre-date the current registry. Keep them
  // selectable instead of silently blanking or changing the authored value.
  const imported = idOf(selectedId);
  const matchingLabel = result.find(choice =>
    choice.label.toLocaleLowerCase("fr") === imported.toLocaleLowerCase("fr")
  )?.label;
  add(imported, (matchingLabel ?? imported) + " — choix importé");
  return Object.freeze(result);
}

/**
 * Generate a private stable stat ID from the visible French name.
 * Existing stat IDs are never rewritten; collisions only get a new suffix.
 * The player must not be asked to type an internal identifier.
 */
export function captureEditorGeneratedStatIdV1(label, existingStats = []) {
  const base = String(label ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "stat";
  const taken = new Set(existingStats.map(stat =>
    (typeof stat === "string" ? stat : stat?.id) ?? ""
  ));
  let id = base;
  let suffix = 2;
  while (taken.has(id)) id = base + "-" + suffix++;
  return id;
}
