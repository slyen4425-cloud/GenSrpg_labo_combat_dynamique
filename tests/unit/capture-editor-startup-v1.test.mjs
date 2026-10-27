import test from "node:test";
import assert from "node:assert/strict";

test("optional presentation startup failures never block core creature-library dependencies", async () => {
  const {
    settleCaptureEditorStartupDependenciesV1
  } = await import(
    "../../src/ui/capture-editor-startup-v1.js"
  );

  const nativeSkills = new Map([
    ["skill", Object.freeze({ id: "skill" })]
  ]);
  const captureData = Object.freeze({
    registry: Object.freeze({ id: "registry" }),
    records: Object.freeze([
      Object.freeze({ draft: Object.freeze({ id: "creature" }) })
    ])
  });
  const progressionRules =
    Object.freeze({ id: "progression" });

  const result =
    await settleCaptureEditorStartupDependenciesV1({
      assetCatalogPromise:
        Promise.reject(
          new Error("asset catalog unavailable")
        ),
      privateAudioCatalogPromise:
        Promise.reject(
          new Error("audio catalog unavailable")
        ),
      nativeSkillsPromise:
        Promise.resolve(nativeSkills),
      captureDataPromise:
        Promise.resolve(captureData),
      progressionRulesPromise:
        Promise.resolve(progressionRules),
      creatureVisualMetaPromise:
        Promise.reject(
          new Error("visual metadata unavailable")
        )
    });

  assert.equal(result.nativeSkills, nativeSkills);
  assert.equal(result.captureData, captureData);
  assert.equal(
    result.loadedProgressionRules,
    progressionRules
  );
  assert.deepEqual(result.assetCatalog, {
    assets: []
  });
  assert.deepEqual(result.privateAudioCatalog, {
    entries: []
  });
  assert.deepEqual(
    result.creatureVisualMetaById,
    {}
  );
  assert.deepEqual(
    result.availability,
    {
      assetCatalog: false,
      privateAudioCatalog: false,
      creatureVisualMeta: false
    }
  );
  assert.equal(result.warnings.length, 3);
});

test("essential creature-library startup failures remain blocking", async () => {
  const {
    settleCaptureEditorStartupDependenciesV1
  } = await import(
    "../../src/ui/capture-editor-startup-v1.js"
  );

  await assert.rejects(
    () =>
      settleCaptureEditorStartupDependenciesV1({
        assetCatalogPromise:
          Promise.resolve({ assets: [] }),
        privateAudioCatalogPromise:
          Promise.resolve({ entries: [] }),
        nativeSkillsPromise:
          Promise.resolve(new Map()),
        captureDataPromise:
          Promise.reject(
            new Error("monster catalog unavailable")
          ),
        progressionRulesPromise:
          Promise.resolve({}),
        creatureVisualMetaPromise:
          Promise.resolve({})
      }),
    /monster catalog unavailable/
  );
});
