import test from "node:test";
import assert from "node:assert/strict";

import {
  CAPTURE_TEST_CREATURE_OPTIONS_V1,
  buildCaptureTestOpponentDraftV1
} from "../../src/catalogs/capture-test-creature-options-v1.js";

function assetCatalogFor(optionId) {
  const option = CAPTURE_TEST_CREATURE_OPTIONS_V1.find(
    (entry) => entry.id === optionId
  );
  if (!option) {
    throw new Error("missing test option");
  }

  return {
    assets: Object.values(option.assets).map((id) => ({ id }))
  };
}

test("selected Capture test creature uses authoritative opponent display scale", () => {
  const draft = buildCaptureTestOpponentDraftV1({
    optionId: "braisombre",
    assetCatalog: assetCatalogFor("braisombre"),
    creatureMeta: {
      id: "braisombre",
      displayScale: {
        player: 1.15,
        opponent: 0.88
      }
    }
  });

  assert.equal(draft.presentation.displayScale, 0.88);
});

test("selected Capture test creature refuses to invent scale when visual metadata is missing", () => {
  assert.throws(
    () =>
      buildCaptureTestOpponentDraftV1({
        optionId: "braisombre",
        assetCatalog: assetCatalogFor("braisombre")
      }),
    /metadata|displayScale/i
  );
});
