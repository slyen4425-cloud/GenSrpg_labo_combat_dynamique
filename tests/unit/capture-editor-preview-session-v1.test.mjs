import test from "node:test";
import assert from "node:assert/strict";

import {
  createCaptureEditorPreviewSessionV1
} from "../../src/ui/capture-editor-preview-session-v1.js";

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

test("preview session refuses an invalid editor export without mounting combat", async () => {
  const calls = [];
  const session = createCaptureEditorPreviewSessionV1({
    editor: editorReturning(null, calls),
    adaptExport() {
      calls.push("adapt");
      throw new Error("must not adapt invalid export");
    },
    async mountPreview() {
      calls.push("mount");
      return { dispose() {} };
    },
    onModeChange(mode) {
      calls.push("mode:" + mode);
    }
  });

  const result = await session.launch();

  assert.deepEqual(result, {
    ok: false,
    outcome: "invalid_editor_export"
  });
  assert.deepEqual(calls, ["validate"]);
  assert.equal(session.previewActive, false);
});

test("preview session sends the exact validated export to the adapter and mounts its native result", async () => {
  const calls = [];
  const exported = Object.freeze({ schema: "capture-combat-export-v1" });
  const adapted = Object.freeze({
    battleFormat: { id: "format" },
    fighters: [],
    skills: {},
    skillIdsByActor: {}
  });

  const session = createCaptureEditorPreviewSessionV1({
    editor: editorReturning(exported, calls),
    adaptExport(value) {
      calls.push(value === exported ? "adapt:same" : "adapt:copy");
      return adapted;
    },
    async mountPreview(nativeCombatSource) {
      calls.push(
        nativeCombatSource === adapted
          ? "mount:same"
          : "mount:copy"
      );
      return {
        dispose() {
          calls.push("combat-dispose");
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
  assert.equal(result.nativeCombatSource, adapted);
  assert.equal(session.getLastExport(), exported);
  assert.equal(session.previewActive, true);
  assert.deepEqual(
    calls,
    [
      "validate",
      "adapt:same",
      "mount:same",
      "mode:preview"
    ]
  );
});

test("preview session owns exactly one combat preview and disposes it on return", async () => {
  const calls = [];
  let exportNumber = 0;
  const editor = {
    validate() {
      exportNumber += 1;
      calls.push("validate:" + exportNumber);
      return { schema: "capture-combat-export-v1", exportNumber };
    },
    dispose() {
      calls.push("editor-dispose");
    }
  };

  let mountNumber = 0;
  const session = createCaptureEditorPreviewSessionV1({
    editor,
    adaptExport(value) {
      return { nativeFor: value.exportNumber };
    },
    async mountPreview() {
      mountNumber += 1;
      const current = mountNumber;
      calls.push("mount:" + current);
      return {
        dispose() {
          calls.push("combat-dispose:" + current);
        }
      };
    },
    onModeChange(mode) {
      calls.push("mode:" + mode);
    }
  });

  await session.launch();
  await session.launch();

  assert.equal(session.previewActive, true);
  assert.ok(
    calls.indexOf("combat-dispose:1") <
      calls.indexOf("mount:2"),
    "existing preview must be disposed before the next one mounts"
  );

  session.returnToEditor();
  assert.equal(session.previewActive, false);
  assert.deepEqual(calls.slice(-2), [
    "combat-dispose:2",
    "mode:editor"
  ]);

  session.dispose();
  assert.equal(
    calls.filter((item) => item === "editor-dispose").length,
    1
  );
});

test("preview session final dispose cleans editor and active combat only once", async () => {
  const calls = [];
  const session = createCaptureEditorPreviewSessionV1({
    editor: editorReturning(
      { schema: "capture-combat-export-v1" },
      calls
    ),
    adaptExport() {
      return {};
    },
    async mountPreview() {
      return {
        dispose() {
          calls.push("combat-dispose");
        }
      };
    }
  });

  await session.launch();
  session.dispose();
  session.dispose();

  assert.equal(
    calls.filter((item) => item === "combat-dispose").length,
    1
  );
  assert.equal(
    calls.filter((item) => item === "editor-dispose").length,
    1
  );

  await assert.rejects(
    () => session.launch(),
    /disposed/i
  );
});
