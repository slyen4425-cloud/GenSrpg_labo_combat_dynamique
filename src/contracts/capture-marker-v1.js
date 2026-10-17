import { normalizeStatusEffectV1 } from "./status-effect-v1.js";

// A marker is a shared, author-defined specialization of the *existing*
// StatusEffectV1 stack_counter. Its instance, timing and stacking remain owned
// exclusively by Status Effect Runtime.
export const CAPTURE_MARKER_TAG_V1 = "gensrpg:marker:v1";
export const CAPTURE_MARKER_ID_PREFIX_V1 = "marker:";

function requiredId(value) {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(value)) {
    throw new RangeError("Marker ID must be a stable lowercase slug (1..64 characters)");
  }
  return value;
}

export function normalizeCaptureMarkerV1(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Capture marker must be an object");
  }
  const allowed = new Set([
    "id", "name", "polarity", "durationMs", "maxStacks",
    "iconAssetId", "onStackThreshold", "periodic"
  ]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) throw new TypeError("Unknown marker field: " + key);
  }
  const id = requiredId(input.id);
  if (typeof input.name !== "string" || !input.name.trim()) {
    throw new TypeError("Marker name is required");
  }
  const iconAssetId = input.iconAssetId == null ? null : String(input.iconAssetId).trim();
  if (iconAssetId !== null && !iconAssetId) {
    throw new TypeError("Marker iconAssetId cannot be empty");
  }
  const status = normalizeStatusEffectV1({
    id: CAPTURE_MARKER_ID_PREFIX_V1 + id,
    label: input.name.trim(),
    kind: "stack_counter",
    polarity: input.polarity ?? "neutral",
    durationMs: input.durationMs ?? 10000,
    stacking: "stack",
    maxStacks: input.maxStacks ?? 10,
    tags: [CAPTURE_MARKER_TAG_V1, CAPTURE_MARKER_ID_PREFIX_V1 + id],
    ...(input.periodic == null ? {} : {periodic:input.periodic}),
    ...(input.onStackThreshold == null ? {} : {onStackThreshold: input.onStackThreshold})
  });
  return Object.freeze({
    id,
    name: input.name.trim(),
    polarity: status.polarity,
    durationMs: status.durationMs,
    maxStacks: status.maxStacks,
    ...(iconAssetId === null ? {} : {iconAssetId}),
    ...(status.periodic == null ? {} : {periodic: status.periodic}),
    ...(status.onStackThreshold == null ? {} : {onStackThreshold: status.onStackThreshold})
  });
}

export function markerStatusDefinitionV1(marker) {
  const entry = normalizeCaptureMarkerV1(marker);
  return normalizeStatusEffectV1({
    id: CAPTURE_MARKER_ID_PREFIX_V1 + entry.id,
    label: entry.name,
    kind: "stack_counter",
    polarity: entry.polarity,
    durationMs: entry.durationMs,
    stacking: "stack",
    maxStacks: entry.maxStacks,
    tags: [CAPTURE_MARKER_TAG_V1, CAPTURE_MARKER_ID_PREFIX_V1 + entry.id],
    ...(entry.periodic == null ? {} : {periodic:entry.periodic}),
    ...(entry.onStackThreshold == null ? {} : {onStackThreshold: entry.onStackThreshold})
  });
}

export function isCaptureMarkerStatusV1(instance) {
  return instance?.definition?.kind === "stack_counter" &&
    instance.definition.tags?.includes(CAPTURE_MARKER_TAG_V1) === true &&
    typeof instance.definition.id === "string" &&
    instance.definition.id.startsWith(CAPTURE_MARKER_ID_PREFIX_V1);
}

export function normalizeCaptureMarkerLibraryV1(input) {
  if (!Array.isArray(input)) throw new TypeError("Marker library must be an array");
  const result = input.map(normalizeCaptureMarkerV1);
  if (new Set(result.map(marker => marker.id)).size !== result.length) {
    throw new RangeError("Duplicate shared marker ID");
  }
  return Object.freeze(result);
}
