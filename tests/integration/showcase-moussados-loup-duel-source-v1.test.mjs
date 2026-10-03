import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildShowcaseMoussadosLoupDuelSourceV1
} from "../../src/adapters/input/capture/showcase-moussados-loup-duel-source-v1.js";

async function json(path) {
  return JSON.parse(
    await readFile(
      new URL("../../" + path, import.meta.url),
      "utf8"
    )
  );
}

test("showcase duel source preserves Moussados vs Loup volcanique configured presets", async () => {
  const source =
    buildShowcaseMoussadosLoupDuelSourceV1({
      moussadosTransfer: await json(
        "data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json"
      ),
      loupTransfer: await json(
        "data/capture/showcase/crea-loup.capture-creature-transfer-v1.json"
      ),
      showcaseSkillTransfers: await Promise.all([
        "data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json",
        "data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json",
        "data/capture/showcase/fireball.capture-skill-transfer-v1.json",
        "data/capture/showcase/lib_flame_bite.capture-skill-transfer-v1.json"
      ].map(json)),
      nativeSkillCatalog: await json(
        "data/combat/skills/catalog.v1.json"
      ),
      statRegistry: await json(
        "data/capture/monster-capture-stat-registry.v1.json"
      )
    });

  const local = source.battleFormat.actors.find(
    (actor) => actor.actorId === "local-1"
  );
  const enemy = source.battleFormat.actors.find(
    (actor) => actor.actorId === "enemy-1"
  );

  assert.equal(local.creatureId, "crea_mossback");
  assert.equal(local.displayName, "Moussados");
  assert.equal(enemy.creatureId, "crea-loup");
  assert.equal(enemy.displayName, "Loup volcanique");

  assert.deepEqual(
    source.skillIdsByActor["local-1"],
    [
      "lib_earth_guard",
      "claw",
      "lib_quake",
      "lib_rock_slam"
    ]
  );

  assert.deepEqual(
    source.skillIdsByActor["enemy-1"],
    [
      "claw",
      "fireball",
      "cap_fire_special_1",
      "lib_flame_bite",
      "cap_fire_atk_6"
    ]
  );

  const localFighter = source.fighters.find(
    (fighter) => fighter.id === "local-1"
  );
  const enemyFighter = source.fighters.find(
    (fighter) => fighter.id === "enemy-1"
  );

  assert.equal(localFighter.maxHp, 200);
  assert.equal(enemyFighter.maxHp, 150);
  assert.ok(source.skills.fireball);
  assert.ok(source.skills.claw);
  assert.ok(source.skills.lib_earth_guard);
});
