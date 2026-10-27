// Versioned, renderer-independent soundtrack authoring contract.
// Asset IDs are references, never URLs or private-repository paths.
export const SOUNDTRACK_CATALOG_SCHEMA_V1 = "gensrpg-soundtrack-catalog-v1";
export const SOUNDTRACK_PROJECT_SCHEMA_V1 = "gensrpg-soundtrack-project-v1";
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,159}$/;
const CHANNELS = ["music", "ambience"];
const own = (v, k) => Object.prototype.hasOwnProperty.call(v, k);
function object(v, name) {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new TypeError(name + " must be an object");
  return v;
}
function id(v, name) {
  if (typeof v !== "string" || !ID.test(v)) throw new TypeError(name + " must be an asset/scene identifier");
  return v;
}
function number(v, name, min, max) {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) {
    throw new RangeError(name + " must be between " + min + " and " + max);
  }
  return v;
}
function exactKeys(v, keys, name) {
  for (const k of Object.keys(v)) if (!keys.includes(k)) throw new TypeError(name + ": unknown field " + k);
}
export function normalizeSoundtrackCatalogV1(raw) {
  object(raw, "catalog");
  exactKeys(raw, ["schema","version","assets"], "catalog");
  if (raw.schema !== SOUNDTRACK_CATALOG_SCHEMA_V1 || raw.version !== 1 || !Array.isArray(raw.assets)) {
    throw new TypeError("SoundtrackCatalogV1 expected");
  }
  const ids = new Set();
  const assets = raw.assets.map((item, i) => {
    object(item, "asset");
    exactKeys(item, ["assetId","kind","origin","title","licenseRef"], "asset");
    const assetId = id(item.assetId, "assetId");
    if (ids.has(assetId)) throw new TypeError("duplicate audio assetId " + assetId);
    ids.add(assetId);
    if (!["music","ambience","sfx"].includes(item.kind)) throw new TypeError("unknown asset kind");
    if (!["app","user","project"].includes(item.origin)) throw new TypeError("unknown asset origin");
    if (typeof item.title !== "string" || !item.title.trim()) throw new TypeError("asset title expected");
    if (item.licenseRef !== undefined && (typeof item.licenseRef !== "string" || !item.licenseRef.trim())) {
      throw new TypeError("licenseRef must be a non-empty string");
    }
    return Object.freeze({...item});
  });
  return Object.freeze({schema:SOUNDTRACK_CATALOG_SCHEMA_V1,version:1,assets:Object.freeze(assets)});
}
function normalizeChannel(raw, catalog, channel) {
  if (raw == null) return null;
  object(raw, "channel " + channel);
  exactKeys(raw, ["tracks","order","volume","fadeMs","repeat"], "channel");
  if (!Array.isArray(raw.tracks) || raw.tracks.length > 100) throw new TypeError("tracks must be an array of up to 100 IDs");
  const tracks = raw.tracks.map(track => {
    const assetId = id(track, "track");
    const found = catalog.assets.find(x => x.assetId === assetId);
    if (!found) throw new RangeError("unknown soundtrack asset: " + assetId);
    if (found.kind !== channel) throw new TypeError("asset kind does not match " + channel);
    return assetId;
  });
  const order = raw.order ?? "sequence";
  if (!["sequence","shuffle"].includes(order)) throw new TypeError("unknown playlist order");
  const volume = number(raw.volume ?? 1, "volume", 0, 1);
  const fadeMs = number(raw.fadeMs ?? 700, "fadeMs", 0, 10000);
  if (!Number.isInteger(fadeMs)) throw new TypeError("fadeMs must be an integer");
  const repeat = raw.repeat ?? true;
  if (typeof repeat !== "boolean") throw new TypeError("repeat must be boolean");
  return Object.freeze({tracks:Object.freeze(tracks),order,volume,fadeMs,repeat});
}
export function normalizeSoundtrackProjectV1(raw, catalogInput) {
  const catalog = normalizeSoundtrackCatalogV1(catalogInput);
  object(raw, "project");
  exactKeys(raw, ["schema","version","projectId","scenes"], "project");
  if (raw.schema !== SOUNDTRACK_PROJECT_SCHEMA_V1 || raw.version !== 1) {
    throw new TypeError("SoundtrackProjectV1 expected");
  }
  const projectId = id(raw.projectId, "projectId");
  object(raw.scenes, "scenes");
  const scenes = Object.create(null);
  for (const [key, entry] of Object.entries(raw.scenes)) {
    id(key, "scene");
    object(entry, "scene");
    exactKeys(entry, CHANNELS, "scene");
    scenes[key] = Object.freeze({
      music:normalizeChannel(entry.music, catalog, "music"),
      ambience:normalizeChannel(entry.ambience, catalog, "ambience")
    });
  }
  return Object.freeze({schema:SOUNDTRACK_PROJECT_SCHEMA_V1,version:1,projectId,scenes:Object.freeze(scenes)});
}
export function setSoundtrackSceneV1(project, catalog, sceneId, scene) {
  id(sceneId, "sceneId");
  const current = normalizeSoundtrackProjectV1(project, catalog);
  // A scene absent from the input remains absent; editing one mode cannot overwrite another.
  return normalizeSoundtrackProjectV1({...current, scenes:{...current.scenes,[sceneId]:scene}}, catalog);
}
export function createEmptySoundtrackProjectV1(projectId) {
  return Object.freeze({schema:SOUNDTRACK_PROJECT_SCHEMA_V1,version:1,projectId:id(projectId,"projectId"),scenes:Object.freeze({})});
}
