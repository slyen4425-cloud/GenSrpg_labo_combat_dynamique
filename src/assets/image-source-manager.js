export const DEFAULT_ACCEPTED_IMAGE_TYPES = Object.freeze([
  "image/png",
  "image/webp",
  "image/jpeg"
]);

export function createImageSourceManager({
  createObjectURL = (file) => URL.createObjectURL(file),
  revokeObjectURL = (url) => URL.revokeObjectURL(url),
  acceptedTypes = DEFAULT_ACCEPTED_IMAGE_TYPES
} = {}) {
  if (typeof createObjectURL !== "function") {
    throw new TypeError("createObjectURL must be a function");
  }
  if (typeof revokeObjectURL !== "function") {
    throw new TypeError("revokeObjectURL must be a function");
  }

  const accepted = new Set(acceptedTypes);
  let activeUrl = null;
  let disposed = false;

  function assertUsable() {
    if (disposed) {
      throw new Error("Image source manager has been disposed");
    }
  }

  function validateFile(file) {
    if (!file || typeof file !== "object") {
      throw new TypeError("image file is required");
    }
    if (!accepted.has(file.type)) {
      throw new RangeError(`Unsupported image type: ${file.type || "unknown"}`);
    }
    if (typeof file.size === "number" && file.size <= 0) {
      throw new RangeError("image file must not be empty");
    }
    return file;
  }

  function clear() {
    if (activeUrl !== null) {
      revokeObjectURL(activeUrl);
      activeUrl = null;
    }
  }

  function load(file) {
    assertUsable();
    validateFile(file);
    clear();
    activeUrl = createObjectURL(file);
    if (typeof activeUrl !== "string" || activeUrl === "") {
      activeUrl = null;
      throw new Error("createObjectURL must return a non-empty string");
    }
    return activeUrl;
  }

  function dispose() {
    if (disposed) {
      return;
    }
    clear();
    disposed = true;
  }

  return Object.freeze({
    load,
    clear,
    dispose,
    validateFile,
    get currentUrl() {
      return activeUrl;
    },
    get isDisposed() {
      return disposed;
    }
  });
}
