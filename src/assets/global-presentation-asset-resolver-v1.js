function requiredCatalog(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    !Array.isArray(input.assets)
  ) {
    throw new TypeError(
      "assetCatalog.assets must be an array"
    );
  }
  return input;
}

function requiredFunction(value, field) {
  if (typeof value !== "function") {
    throw new TypeError(field + " must be a function");
  }
  return value;
}

export function createGlobalPresentationAssetResolverV1({
  assetCatalog,
  assetUrlForFile
}) {
  const catalog = requiredCatalog(assetCatalog);
  const urlForFile = requiredFunction(
    assetUrlForFile,
    "assetUrlForFile"
  );
  const byId = new Map(
    catalog.assets.map((asset) => [asset?.id, asset])
  );

  return function resolveGlobalPresentationAssetV1(assetId) {
    const asset = byId.get(assetId) ?? null;
    const resource = asset?.resource ?? null;
    const file = resource?.file;

    if (
      typeof file !== "string" ||
      file.trim() === ""
    ) {
      return null;
    }

    const url = urlForFile(file);
    if (
      typeof url !== "string" ||
      url.trim() === ""
    ) {
      throw new TypeError(
        "assetUrlForFile returned no URL for: " + assetId
      );
    }

    const frameCount = Math.max(
      1,
      Math.floor(Number(resource.frameCount) || 1)
    );
    const frameMs =
      Number.isFinite(Number(resource.frameMs)) &&
      Number(resource.frameMs) > 0
        ? Number(resource.frameMs)
        : undefined;

    const playbackMode =
      ["once", "loop", "stretch"].includes(
        resource.playbackMode
      )
        ? resource.playbackMode
        : "once";

    return Object.freeze({
      assetId,
      url,
      frameCount,
      ...(frameMs === undefined ? {} : { frameMs }),
      playbackMode,
      ...(Number.isFinite(Number(resource.headingRad))
        ? { headingRad: Number(resource.headingRad) }
        : {}),
      ...(Number.isFinite(Number(resource.displayScale))
        ? { displayScale: Number(resource.displayScale) }
        : {}),
      ...(Number.isFinite(Number(resource.displayScaleX))
        ? { displayScaleX: Number(resource.displayScaleX) }
        : {}),
      ...(Number.isFinite(Number(resource.displayScaleY))
        ? { displayScaleY: Number(resource.displayScaleY) }
        : {})
    });
  };
}
