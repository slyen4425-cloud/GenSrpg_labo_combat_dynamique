export function createLocalAudioSourceRegistry({
  createObjectURL = globalThis.URL?.createObjectURL?.bind(globalThis.URL),
  revokeObjectURL = globalThis.URL?.revokeObjectURL?.bind(globalThis.URL)
} = {}) {
  if (typeof createObjectURL !== "function") {
    throw new TypeError("createObjectURL is required");
  }
  if (typeof revokeObjectURL !== "function") {
    throw new TypeError("revokeObjectURL is required");
  }

  const sources = new Map();
  let disposed = false;

  function assertActive() {
    if (disposed) {
      throw new Error("audio source registry has been disposed");
    }
  }

  function release(assetId) {
    const current = sources.get(assetId);
    if (!current) {
      return false;
    }
    sources.delete(assetId);
    revokeObjectURL(current.url);
    return true;
  }

  function loadFiles(files, expectedAssets = []) {
    assertActive();

    const expectedByName = new Map(
      expectedAssets
        .filter((item) => item?.assetId && item?.fileName)
        .map((item) => [item.fileName, item])
    );

    let matched = 0;

    for (const file of Array.from(files ?? [])) {
      const expected = expectedByName.get(file?.name);
      if (!expected) {
        continue;
      }

      release(expected.assetId);
      const url = createObjectURL(file);
      sources.set(expected.assetId, Object.freeze({
        assetId: expected.assetId,
        fileName: expected.fileName,
        url
      }));
      matched += 1;
    }

    const loadedAssetIds = expectedAssets
      .filter((item) => sources.has(item.assetId))
      .map((item) => item.assetId);
    const missingAssetIds = expectedAssets
      .filter((item) => !sources.has(item.assetId))
      .map((item) => item.assetId);

    return Object.freeze({
      matched,
      required: expectedAssets.length,
      loaded: loadedAssetIds.length,
      loadedAssetIds: Object.freeze(loadedAssetIds),
      missingAssetIds: Object.freeze(missingAssetIds)
    });
  }

  function clear() {
    for (const assetId of [...sources.keys()]) {
      release(assetId);
    }
  }

  function dispose() {
    if (disposed) {
      return;
    }
    clear();
    disposed = true;
  }

  return Object.freeze({
    loadFiles,
    resolve(assetId) {
      return sources.get(assetId)?.url ?? null;
    },
    has(assetId) {
      return sources.has(assetId);
    },
    clear,
    dispose,
    get size() {
      return sources.size;
    }
  });
}
