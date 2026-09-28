import {
  adaptCaptureCombatExportStackV1
} from "../adapters/input/capture/capture-export-adapter-stack-v1.js";

function requiredEditor(editor) {
  if (
    !editor ||
    typeof editor !== "object" ||
    typeof editor.validate !== "function" ||
    typeof editor.dispose !== "function"
  ) {
    throw new TypeError(
      "editor must provide validate() and dispose()"
    );
  }
  return editor;
}

function requiredFunction(value, field) {
  if (typeof value !== "function") {
    throw new TypeError(`${field} must be a function`);
  }
  return value;
}

export function createCaptureEditorPreviewSessionV1({
  editor,
  adaptExport = adaptCaptureCombatExportStackV1,
  mountPreview,
  onModeChange = () => {}
}) {
  const editorController = requiredEditor(editor);
  const adapt = requiredFunction(
    adaptExport,
    "adaptExport"
  );
  const mount = requiredFunction(
    mountPreview,
    "mountPreview"
  );
  const modeChanged = requiredFunction(
    onModeChange,
    "onModeChange"
  );

  let disposed = false;
  let preview = null;
  let lastExport = null;

  function disposePreview() {
    if (!preview) {
      return;
    }

    const current = preview;
    preview = null;
    current.dispose?.();
  }

  async function launch() {
    if (disposed) {
      throw new Error(
        "CaptureEditorPreviewSessionV1 is disposed"
      );
    }

    const exported = await Promise.resolve(
      editorController.validate()
    );

    if (!exported) {
      return Object.freeze({
        ok: false,
        outcome: "invalid_editor_export"
      });
    }

    const nativeCombatSource = adapt(exported);

    disposePreview();

    const mounted = await mount(nativeCombatSource);

    if (
      !mounted ||
      typeof mounted !== "object" ||
      typeof mounted.dispose !== "function"
    ) {
      mounted?.dispose?.();
      throw new TypeError(
        "mountPreview must return an object with dispose()"
      );
    }

    preview = mounted;
    lastExport = exported;
    modeChanged("preview");

    return Object.freeze({
      ok: true,
      outcome: "preview_started",
      exported,
      nativeCombatSource
    });
  }

  function returnToEditor() {
    if (disposed) {
      return;
    }

    disposePreview();
    modeChanged("editor");
  }

  function dispose() {
    if (disposed) {
      return;
    }

    disposed = true;
    disposePreview();
    editorController.dispose();
  }

  return Object.freeze({
    launch,
    returnToEditor,
    getLastExport() {
      return lastExport;
    },
    get previewActive() {
      return preview !== null;
    },
    dispose
  });
}
