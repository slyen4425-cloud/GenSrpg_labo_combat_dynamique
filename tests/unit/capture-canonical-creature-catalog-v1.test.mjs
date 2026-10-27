import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_CREATURE_CANONICAL_ALIASES_V1,
  canonicalCaptureCreatureIdV1,
  canonicalCaptureCreatureRecordsV1
} from "../../src/catalogs/capture-canonical-creature-catalog-v1.js";
import {
  CAPTURE_CREATURE_VISUAL_BINDINGS_V1,
  captureCreatureVisualBindingForIdV1
} from "../../src/catalogs/capture-creature-visual-bindings-v1.js";

const EXPECTED_ALIASES = Object.freeze({
  crea_embercub: "crea_braiseau",
  crea_galewing: "crea_ailevent",
  crea_lumipup: "crea_lumilo",
  crea_nightfang: "crea_noctecroc",
  crea_rockhorn: "crea_rocorne",
  crea_sparkmoth: "crea_lucieclair",
  crea_miragecat: "crea_mirachat",
  crea_ashdrake: "crea_dracendre"
});

async function historicalEntries() {
  const raw = JSON.parse(
    await readFile(
      new URL(
        "../../data/capture/monster-capture-creatures.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );

  return raw.entries;
}

test("historical source stays intact at 110 entries while eight explicit aliases are declared", async () => {
  const entries = await historicalEntries();

  assert.equal(entries.length, 110);
  assert.deepEqual(
    CAPTURE_CREATURE_CANONICAL_ALIASES_V1,
    EXPECTED_ALIASES
  );
});

test("canonical Capture creature projection contains 102 unique ids and names", async () => {
  const records =
    canonicalCaptureCreatureRecordsV1(
      await historicalEntries()
    );

  assert.equal(records.length, 102);
  assert.equal(
    new Set(records.map((entry) => entry.id)).size,
    102
  );

  const normalizedNames = records.map(
    (entry) =>
      String(entry.name)
        .trim()
        .toLocaleLowerCase("fr")
  );
  assert.equal(
    new Set(normalizedNames).size,
    102
  );
});

test("legacy duplicate ids are removed and modern Capture ids remain canonical", async () => {
  const records =
    canonicalCaptureCreatureRecordsV1(
      await historicalEntries()
    );
  const ids =
    new Set(
      records.map((entry) => entry.id)
    );

  for (
    const [legacyId, canonicalId] of
    Object.entries(EXPECTED_ALIASES)
  ) {
    assert.equal(
      ids.has(legacyId),
      false,
      legacyId + " must not be exposed"
    );
    assert.equal(
      ids.has(canonicalId),
      true,
      canonicalId + " must remain exposed"
    );
  }
});

test("legacy ids resolve deterministically without name inference", () => {
  for (
    const [legacyId, canonicalId] of
    Object.entries(EXPECTED_ALIASES)
  ) {
    assert.equal(
      canonicalCaptureCreatureIdV1(
        legacyId
      ),
      canonicalId
    );
  }

  assert.equal(
    canonicalCaptureCreatureIdV1(
      "crea_unknown"
    ),
    "crea_unknown"
  );
  assert.equal(
    canonicalCaptureCreatureIdV1(
      "Ailevent"
    ),
    "Ailevent",
    "display names must never be treated as aliases"
  );
});

test("canonical projection refuses any undeclared duplicate display name", () => {
  assert.throws(
    () =>
      canonicalCaptureCreatureRecordsV1([
        {
          id: "crea_a",
          name: "Même nom"
        },
        {
          id: "crea_b",
          name: "Même nom"
        }
      ]),
    /duplicate.*name|nom.*dupliqu/i
  );
});

test("Human Editor hydrates the canonical projection before importing creature records", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /canonicalCaptureCreatureRecordsV1/
  );
});


test("visual bindings keep one canonical owner while legacy ids resolve through the alias map", () => {
  const visualIds = new Set(
    CAPTURE_CREATURE_VISUAL_BINDINGS_V1.map(
      (entry) => entry.creatureId
    )
  );

  for (
    const [legacyId] of
    Object.entries(EXPECTED_ALIASES)
  ) {
    assert.equal(
      visualIds.has(legacyId),
      false,
      legacyId +
        " must not own a duplicate visual binding"
    );
  }

  assert.equal(
    captureCreatureVisualBindingForIdV1(
      "crea_galewing"
    )?.creatureId,
    "crea_ailevent"
  );
  assert.equal(
    captureCreatureVisualBindingForIdV1(
      "crea_lumipup"
    )?.creatureId,
    "crea_lumilo"
  );
  assert.equal(
    captureCreatureVisualBindingForIdV1(
      "crea_sparkmoth"
    )?.creatureId,
    "crea_lucieclair"
  );
});
