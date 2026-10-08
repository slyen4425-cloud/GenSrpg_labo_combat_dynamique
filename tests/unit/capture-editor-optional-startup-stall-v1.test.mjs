import test from "node:test";
import assert from "node:assert/strict";

import {
  settleCaptureEditorStartupDependenciesV1
} from "../../src/ui/capture-editor-startup-v1.js";

test("an optional presentation request that never settles cannot indefinitely block creature library startup", async () => {
  const never = new Promise(() => {});
  const timeout = Symbol("library startup still blocked");
  const outcome = await Promise.race([
    settleCaptureEditorStartupDependenciesV1({
      assetCatalogPromise: never,
      privateAudioCatalogPromise: Promise.resolve({ entries: [] }),
      nativeSkillsPromise: Promise.resolve(new Map([["native", { id: "native" }]])),
      captureDataPromise: Promise.resolve({
        registry: { id: "stats" },
        records: [{ draft: { id: "crea_maraileron" } }]
      }),
      progressionRulesPromise: Promise.resolve({ id: "progression" }),
      creatureVisualMetaPromise: Promise.resolve({}),
      optionalPresentationWaitMs: 15
    }),
    new Promise(resolve => setTimeout(() => resolve(timeout), 300))
  ]);
  assert.notEqual(outcome, timeout, "unresponsive optional resource blocked core creature hydration");
  assert.equal(outcome.captureData.records[0].draft.id, "crea_maraileron");
  assert.equal(outcome.availability.assetCatalog, false);
  assert.ok(outcome.warnings.some(message => message.includes("Catalogue visuel")));
  assert.equal(outcome.availability.privateAudioCatalog, true);
});
