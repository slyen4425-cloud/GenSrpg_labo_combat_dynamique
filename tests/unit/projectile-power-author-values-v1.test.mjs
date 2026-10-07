import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSkill(path) {
  return JSON.parse(
    await readFile(
      new URL("../../" + path, import.meta.url),
      "utf8"
    )
  );
}

test("author projectile powers are exactly fireball 2, blind ash 1, living drop 1", async () => {
  const [fireball, cendre, goutte] =
    await Promise.all([
      readSkill(
        "data/capture/showcase/fireball.capture-skill-transfer-v1.json"
      ),
      readSkill(
        "data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json"
      ),
      readSkill(
        "data/capture/showcase/cap_water_atk_1.capture-skill-transfer-v1.json"
      )
    ]);

  assert.equal(
    fireball.draft.definition.projectileClash.power,
    2,
    "Boule de feu doit être puissance projectile 2"
  );
  assert.equal(
    cendre.draft.definition.projectileClash.power,
    1,
    "Cendre aveuglante doit être puissance projectile 1"
  );
  assert.equal(
    goutte.draft.definition.projectileClash.power,
    1,
    "Goutte vive doit rester puissance projectile 1"
  );
});
