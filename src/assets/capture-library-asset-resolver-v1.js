// A read-only adapter: the canonical global-assets catalog owns every physical asset.
// The demo resolver may supply richer typed presentation metadata, never new IDs.
export function createCaptureLibraryAssetResolverV1({
  catalog,
  assetForId = () => null,
  assetUrlForFile
}) {
  if (!Array.isArray(catalog?.assets)) throw new TypeError("global visual catalog assets are required");
  if (typeof assetForId !== "function" || typeof assetUrlForFile !== "function") {
    throw new TypeError("visual asset resolution functions are required");
  }
  const records = new Map();
  for (const record of catalog.assets) {
    if (records.has(record.id)) throw new RangeError("duplicate global visual asset: " + record.id);
    records.set(record.id, record);
  }
  return function resolveCaptureLibraryAssetV1(assetId) {
    const typed = assetForId(assetId);
    if (typed) return typed;
    const resource = records.get(assetId)?.resource;
    if (!resource || typeof resource.file !== "string" || !resource.file.trim()) return null;
    return Object.freeze({
      assetId,
      url: assetUrlForFile(resource.file),
      frameCount: Math.max(1, Math.floor(Number(resource.frameCount) || 1)),
      ...(Number(resource.frameMs) > 0 ? {frameMs: Number(resource.frameMs)} : {}),
      playbackMode: resource.playbackMode === "loop" ? "loop" : "once"
    });
  };
}
