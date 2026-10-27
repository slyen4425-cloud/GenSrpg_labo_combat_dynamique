import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createProfileRegistry,
  validateCreatureProfile
} from "../../src/core/profiles/profile-registry.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("generic biped and quadruped profiles are complete registry profiles", async () => {
  const biped = await json("data/profiles/biped.profile.json");
  const quadruped = await json("data/profiles/quadruped.profile.json");

  assert.equal(validateCreatureProfile(biped), biped);
  assert.equal(validateCreatureProfile(quadruped), quadruped);

  const registry = createProfileRegistry([
    biped,
    quadruped
  ]);

  assert.deepEqual(registry.ids(), [
    "biped",
    "quadruped"
  ]);
  assert.equal(registry.get("biped").label, "Bipède");
  assert.equal(
    registry.get("quadruped").label,
    "Quadrupède"
  );
});

test("generic profiles expose the movement sections already consumed by Animation Core", async () => {
  for (const path of [
    "data/profiles/biped.profile.json",
    "data/profiles/quadruped.profile.json"
  ]) {
    const profile = await json(path);

    for (const section of [
      "idle",
      "attack",
      "hit",
      "ko",
      "specialMoves"
    ]) {
      assert.equal(
        typeof profile[section],
        "object",
        `${path} must expose ${section}`
      );
    }

    assert.equal(
      typeof profile.specialMoves.ground,
      "object"
    );
    assert.equal(
      typeof profile.specialMoves.aerial,
      "object"
    );
    assert.equal(
      typeof profile.specialMoves.teleport,
      "object"
    );
    assert.equal(
      typeof profile.specialMoves.perspective,
      "object"
    );
  }
});
