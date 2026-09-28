import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1,
  capturePortableNativeSkillDraftsV1
} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {
  normalizeCaptureSkillEditorDraftV1
} from "../../src/contracts/capture-skill-editor-draft-v1.js";

test("portable Capture catalog exposes exactly the 70 runtime-equivalent damage abilities", () => {
  const entries = CAPTURE_PORTABLE_NATIVE_SKILL_CATALOG_V1.entries;
  assert.equal(entries.length, 70);
  assert.equal(
    entries.filter((entry) => entry.id.startsWith("cap_")).length,
    56
  );
  assert.equal(
    entries.filter((entry) => entry.id.startsWith("lib_")).length,
    14
  );
  assert.equal(
    new Set(entries.map((entry) => entry.id)).size,
    70
  );

  for (const entry of entries) {
    assert.equal(entry.migrationState, "portable-basic-effects");
    assert.equal(entry.sourceId, entry.id);
    assert.equal(
      ["buff", "debuff", "dot", "hot"].some((kind) =>
        entry.legacyEffects.some((effect) => effect.kind === kind)
      ),
      false
    );
  }
});

test("portable Capture catalog builds valid CaptureSkillEditorDraftV1 without copying historical records", () => {
  const drafts = capturePortableNativeSkillDraftsV1();
  assert.equal(drafts.length, 70);

  for (const draft of drafts) {
    const normalized = normalizeCaptureSkillEditorDraftV1(draft);
    assert.equal(normalized.id, draft.id);
    assert.equal(normalized.definition.id, draft.id);
    assert.equal(normalized.presentation, null);
  }

  const fire = drafts.find((draft) => draft.id === "cap_fire_atk_1");
  assert.ok(fire);
  assert.equal(fire.definition.element, "fire");
  assert.equal(fire.definition.effect.damage, 3);
  assert.equal(fire.requiredLevel, 1);
});

test("human editor hydrates portable Capture skills alongside the nine laboratory-native skills", async () => {
  const source = await readFile(
    new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url),
    "utf8"
  );

  assert.equal(
    source.includes("capturePortableNativeSkillDraftsV1"),
    true
  );
  assert.equal(
    source.includes("70 capacités Capture natives"),
    true
  );
  assert.equal(
    source.includes("9 capacités natives"),
    true
  );
});
