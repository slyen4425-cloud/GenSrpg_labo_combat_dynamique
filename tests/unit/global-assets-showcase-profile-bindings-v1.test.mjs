import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const fixtures = [
  ["voltige", "biped"],
  ["ailevent", "biped"],
  ["maraileron", "serpentine"],
  ["golem_moussu", "massive"],
  ["renard_magique_dore", "biped"],
  ["guepe_cybernetique", "serpentine"]
];

test("global creature visual metadata owns the validated showcase position profile", async () => {
  for (const [id, expectedProfile] of fixtures) {
    const meta = JSON.parse(
      await readFile(
        new URL(
          `../../assets/library/capture/creatures/${id}/${id}.meta.json`,
          import.meta.url
        ),
        "utf8"
      )
    );

    assert.equal(meta.id, id);
    assert.equal(
      meta.profile,
      expectedProfile,
      id + " must carry the validated position profile in its authoritative metadata"
    );
  }
});
