import test from "node:test";
import assert from "node:assert/strict";

test("native preview waits for active libraries before reading pending editor fields", async () => {
  let release, validated = false;
  const ready = new Promise(resolve => { release = resolve; });
  const session = createCaptureEditorPreviewSessionV2({
    editor: { ready, validate() { validated = true; return { marker: "ready" }; }, dispose() {} },
    adaptCombatExport: value => value, adaptVisualExport: value => value,
    mountPreview: () => ({ dispose() {} })
  });
  const launch = session.launch();
  await Promise.resolve();
  assert.equal(validated, false);
  release();
  assert.equal((await launch).ok, true);
  session.dispose();
});

import {
  createCaptureEditorPreviewSessionV2
} from "../../src/ui/capture-editor-preview-session-v2.js";

function editorReturning(value, calls) {
  return {
    validate() {
      calls.push("validate");
      return value;
    },
    dispose() {
      calls.push("editor-dispose");
    }
  };
}

test("preview session V2 gives the exact validated export to both native adapters", async () => {
  const calls = [];
  const exported = Object.freeze({
    schema: "capture-combat-export-v1",
    marker: "same-export"
  });
  const nativeCombatSource = Object.freeze({
    battleFormat: { id: "format" }
  });
  const nativeVisualSource = Object.freeze({
    profiles: [],
    creatureMetas: []
  });

  const session = createCaptureEditorPreviewSessionV2({
    editor: editorReturning(exported, calls),
    adaptCombatExport(value) {
      calls.push(value === exported ? "combat:same" : "combat:copy");
      return nativeCombatSource;
    },
    adaptVisualExport(value) {
      calls.push(value === exported ? "visual:same" : "visual:copy");
      return nativeVisualSource;
    },
    async mountPreview(sources) {
      assert.equal(sources.nativeCombatSource, nativeCombatSource);
      assert.equal(sources.nativeVisualSource, nativeVisualSource);
      calls.push("mount:both");
      return {
        dispose() {
          calls.push("preview-dispose");
        }
      };
    },
    onModeChange(mode) {
      calls.push("mode:" + mode);
    }
  });

  const result = await session.launch();

  assert.equal(result.ok, true);
  assert.equal(result.exported, exported);
  assert.equal(result.nativeCombatSource, nativeCombatSource);
  assert.equal(result.nativeVisualSource, nativeVisualSource);
  assert.equal(session.getLastExport(), exported);
  assert.equal(session.previewActive, true);
  assert.deepEqual(calls, [
    "validate",
    "combat:same",
    "visual:same",
    "mount:both",
    "mode:preview"
  ]);
});

test("preview session V2 does not mount combat when visual adaptation fails", async () => {
  const calls = [];
  const exported = Object.freeze({
    schema: "capture-combat-export-v1"
  });

  const session = createCaptureEditorPreviewSessionV2({
    editor: editorReturning(exported, calls),
    adaptCombatExport(value) {
      calls.push("combat");
      return { exported: value };
    },
    adaptVisualExport() {
      calls.push("visual");
      throw new RangeError("missing presentation");
    },
    async mountPreview() {
      calls.push("mount");
      return { dispose() {} };
    }
  });

  await assert.rejects(
    () => session.launch(),
    /missing presentation/i
  );

  assert.deepEqual(calls, [
    "validate",
    "combat",
    "visual"
  ]);
  assert.equal(session.previewActive, false);
});

test("preview session V2 owns only one preview and cleans it on return and final dispose", async () => {
  const calls = [];
  let exportNumber = 0;
  let mountNumber = 0;

  const editor = {
    validate() {
      exportNumber += 1;
      calls.push("validate:" + exportNumber);
      return {
        schema: "capture-combat-export-v1",
        exportNumber
      };
    },
    dispose() {
      calls.push("editor-dispose");
    }
  };

  const session = createCaptureEditorPreviewSessionV2({
    editor,
    adaptCombatExport(value) {
      return { combatFor: value.exportNumber };
    },
    adaptVisualExport(value) {
      return { visualFor: value.exportNumber };
    },
    async mountPreview() {
      mountNumber += 1;
      const current = mountNumber;
      calls.push("mount:" + current);
      return {
        dispose() {
          calls.push("preview-dispose:" + current);
        }
      };
    },
    onModeChange(mode) {
      calls.push("mode:" + mode);
    }
  });

  await session.launch();
  await session.launch();

  assert.ok(
    calls.indexOf("preview-dispose:1") <
      calls.indexOf("mount:2"),
    "old preview must be disposed before replacement"
  );

  session.returnToEditor();
  assert.equal(session.previewActive, false);
  assert.deepEqual(calls.slice(-2), [
    "preview-dispose:2",
    "mode:editor"
  ]);

  await session.launch();
  session.dispose();
  session.dispose();

  assert.equal(
    calls.filter((value) => value === "editor-dispose").length,
    1
  );
  assert.equal(
    calls.filter((value) => value === "preview-dispose:3").length,
    1
  );

  await assert.rejects(
    () => session.launch(),
    /disposed/i
  );
});

test("preview session V2 refuses invalid editor export before either adapter", async () => {
  const calls = [];

  const session = createCaptureEditorPreviewSessionV2({
    editor: editorReturning(null, calls),
    adaptCombatExport() {
      calls.push("combat");
      return {};
    },
    adaptVisualExport() {
      calls.push("visual");
      return {};
    },
    async mountPreview() {
      calls.push("mount");
      return { dispose() {} };
    }
  });

  const result = await session.launch();

  assert.deepEqual(result, {
    ok: false,
    outcome: "invalid_editor_export"
  });
  assert.deepEqual(calls, ["validate"]);
});
