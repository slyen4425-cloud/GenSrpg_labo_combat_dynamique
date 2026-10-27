function noop() {}

function supportedFunction(value) {
  return typeof value === "function";
}

export function createCapturePreviewDisplayModeV1({
  documentRef = globalThis.document,
  screenRef = globalThis.screen,
  fullscreenHost = documentRef?.documentElement ?? null,
  previewShell = null
} = {}) {
  if (!documentRef || typeof documentRef !== "object") {
    throw new TypeError("documentRef is required");
  }
  if (!previewShell || typeof previewShell !== "object") {
    throw new TypeError("previewShell is required");
  }

  let disposed = false;
  let fullscreenOwned = false;
  let orientationOwned = false;

  function setLandscapeRequired(required) {
    const active = required === true;
    previewShell.dataset.landscapeRequired =
      active ? "true" : "false";

    const body = documentRef.body;
    if (body?.dataset) {
      if (active) {
        body.dataset.previewLandscapeActive = "true";
      } else {
        delete body.dataset.previewLandscapeActive;
      }
    }
  }

  async function enter({ enabled = false } = {}) {
    if (disposed) {
      return Object.freeze({
        enabled: false,
        fullscreen: false,
        orientationLocked: false,
        status: "disposed"
      });
    }

    if (enabled !== true) {
      setLandscapeRequired(false);
      return Object.freeze({
        enabled: false,
        fullscreen: false,
        orientationLocked: false,
        status: "disabled"
      });
    }

    setLandscapeRequired(true);

    const requestFullscreen =
      fullscreenHost?.requestFullscreen;
    let fullscreen = false;

    if (
      documentRef.fullscreenElement ===
        fullscreenHost
    ) {
      fullscreen = true;
      fullscreenOwned = true;
    } else if (
      supportedFunction(requestFullscreen)
    ) {
      try {
        await requestFullscreen.call(
          fullscreenHost
        );
        fullscreen =
          documentRef.fullscreenElement ===
            fullscreenHost ||
          documentRef.fullscreenElement != null;
        fullscreenOwned = fullscreen;
      } catch {
        fullscreen = false;
      }
    }

    let orientationLocked = false;
    const orientation = screenRef?.orientation;
    if (
      orientation &&
      supportedFunction(orientation.lock)
    ) {
      try {
        await orientation.lock("landscape");
        orientationLocked = true;
        orientationOwned = true;
      } catch {
        orientationLocked = false;
      }
    }

    return Object.freeze({
      enabled: true,
      fullscreen,
      orientationLocked,
      status:
        fullscreen && orientationLocked
          ? "fullscreen-landscape"
          : "rotation-gate"
    });
  }

  async function leave() {
    setLandscapeRequired(false);

    const orientation =
      screenRef?.orientation;
    if (
      orientationOwned &&
      orientation &&
      supportedFunction(
        orientation.unlock
      )
    ) {
      try {
        orientation.unlock();
      } catch {
        noop();
      }
    }
    orientationOwned = false;

    if (
      fullscreenOwned &&
      documentRef.fullscreenElement != null &&
      supportedFunction(
        documentRef.exitFullscreen
      )
    ) {
      try {
        await documentRef.exitFullscreen();
      } catch {
        noop();
      }
    }
    fullscreenOwned = false;

    return Object.freeze({
      status: "released"
    });
  }

  return Object.freeze({
    enter,
    leave,
    async dispose() {
      if (disposed) {
        return;
      }
      await leave();
      disposed = true;
    }
  });
}
