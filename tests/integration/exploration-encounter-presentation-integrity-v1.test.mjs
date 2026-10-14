import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  demoPresentationAssets
} from "../../examples/dom-demo/demo-assets.js";
import {
  captureCreatureVisualBindingForIdV1
} from "../../src/catalogs/capture-creature-visual-bindings-v1.js";
import {
  CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1
} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

async function json(relativePath) {
  return JSON.parse(
    await readFile(
      new URL(
        "../../" + relativePath,
        import.meta.url
      ),
      "utf8"
    )
  );
}

function visualAssetIds(presentation) {
  const ids = [];

  function visit(value) {
    if (
      !value ||
      typeof value !== "object"
    ) {
      return;
    }

    if (
      typeof value.assetId === "string" &&
      value.assetId.trim() &&
      !value.assetId.startsWith(
        "gensrpg:sound:"
      )
    ) {
      ids.push(
        value.assetId.trim()
      );
    }

    for (
      const nested of
      Object.values(value)
    ) {
      visit(nested);
    }
  }

  visit(presentation?.visual ?? null);
  visit(
    presentation?.statusVisuals ??
      null
  );

  return [
    ...new Set(ids)
  ];
}

test("Exploration bridge resolves every configured skill visual asset through the canonical presentation resolver", async () => {
  const missing = [];

  for (
    const relativePath of
      CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1
  ) {
    const transfer =
      await json(relativePath);
    const ids =
      visualAssetIds(
        transfer.draft?.presentation
      );

    for (const assetId of ids) {
      if (
        !demoPresentationAssets.asset(
          assetId
        )
      ) {
        missing.push({
          skillId:
            transfer.draft?.id,
          assetId
        });
      }
    }
  }

  assert.deepEqual(
    missing,
    [],
    "Every configured visual asset must resolve before browser mount"
  );
});

test("every configured player-party creature resolves a real combat visual binding", async () => {
  const party =
    await json(
      "data/capture/parties/player-party.v1.json"
    );

  const missing =
    party.members
      .map(
        (member) =>
          member.creatureId
      )
      .filter(
        (creatureId) =>
          !captureCreatureVisualBindingForIdV1(
            creatureId
          )
      );

  assert.deepEqual(
    missing,
    [],
    "Player party must never silently fall back to generic creature art"
  );
});
