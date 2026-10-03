import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildExplorationEncounterCombatSourceV1
} from "../../src/adapters/input/capture/exploration-encounter-combat-source-v1.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

async function records() {
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


async function configuredSource(rawSnapshot = snapshot()) {
  const [
    creatureRecords,
    playerParty,
    loupTransfer,
    mossbackTransfer,
    nativeSkillCatalog,
    statRegistry,
    ...showcaseSkillTransfers
  ] = await Promise.all([
    records(),
    json("data/capture/parties/player-party.v1.json"),
    json("data/capture/showcase/crea-loup.capture-creature-transfer-v1.json"),
    json("data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json"),
    json("data/combat/skills/catalog.v1.json"),
    json("data/capture/monster-capture-stat-registry.v1.json"),
    json("data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json"),
    json("data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json"),
    json("data/capture/showcase/fireball.capture-skill-transfer-v1.json"),
    json("data/capture/showcase/lib_flame_bite.capture-skill-transfer-v1.json")
  ]);

  return buildExplorationEncounterCombatSourceV1({
    snapshot: rawSnapshot,
    creatureRecords,
    partyDefinitions: [playerParty],
    configuredCreatureTransfers: [
      loupTransfer,
      mossbackTransfer
    ],
    showcaseSkillTransfers,
    nativeSkillCatalog,
    statRegistry
  });
}

async function json(relativePath) {
  return JSON.parse(
    await readFile(
      new URL("../../" + relativePath, import.meta.url),
      "utf8"
    )
  );
}

function snapshot(opponentCreatureId = "crea_nat_3") {
  return {
    schema: "capture-encounter-snapshot-v1",
    version: 1,
    encounterId: "encounter-42",
    source: "terrain-random",
    player: {
      partyRef: "capture-party-player-v1"
    },
    opponents: [
      { creatureId: opponentCreatureId }
    ],
    rules: {
      rulesetId: "capture.standard.1v1"
    },
    context: {
      areaId: "forest-exterior",
      terrainFamilyId: "forest",
      elementId: "nature"
    },
    returnToken: "return-42"
  };
}

test("Exploration snapshot builds real 1v1 Combat source with the encountered creature", async () => {
  const source =
    await configuredSource(snapshot());

  assert.equal(
    source.battleFormat.localActorId,
    "local-1"
  );
  assert.deepEqual(
    source.battleFormat.teams["local-team"],
    ["local-1"]
  );
  assert.deepEqual(
    source.battleFormat.teams["enemy-team"],
    ["enemy-1"]
  );

  const enemy =
    source.battleFormat.actors.find(
      (actor) => actor.actorId === "enemy-1"
    );

  assert.equal(enemy.creatureId, "crea_nat_3");
  assert.equal(enemy.displayName, "Ancêtronc");

  const enemyFighter =
    source.fighters.find(
      (fighter) => fighter.id === "enemy-1"
    );

  assert.equal(enemyFighter.maxHp, 70);
  assert.ok(
    source.skillIdsByActor["enemy-1"].length > 0
  );
  assert.ok(
    source.skillIdsByActor["enemy-1"].every(
      (skillId) => skillId.startsWith("cap_earth_")
    )
  );
});

test("player party ref resolves configured active and reserve creatures without copying their definitions", async () => {
  const source =
    await configuredSource(
      snapshot("crea_nat_3")
    );

  const local =
    source.battleFormat.actors.find(
      (actor) => actor.actorId === "local-1"
    );
  const localFighter =
    source.fighters.find(
      (fighter) => fighter.id === "local-1"
    );

  assert.equal(local.creatureId, "crea-loup");
  assert.equal(local.displayName, "Loup volcanique");
  assert.equal(localFighter.maxHp, 150);
  assert.equal(localFighter.statValuesById.speed, 5);
  assert.equal(localFighter.statValuesById.fire, 10);
  assert.equal(
    localFighter.resistancePctByChannel.water,
    -50
  );
  assert.deepEqual(
    source.skillIdsByActor["local-1"],
    [
      "claw",
      "fireball",
      "cap_fire_special_1",
      "lib_flame_bite",
      "cap_fire_atk_6"
    ]
  );

  assert.equal(
    source.skillPresentations.fireball
      .visual.icon.assetId,
    "core:icon-skill-fireball-01"
  );
  assert.equal(
    source.skillPresentations.cap_fire_special_1
      .visual.travel.assetId,
    "pack:capture:sprite-projectile-earth-01"
  );
  assert.equal(
    source.skillPresentations.lib_flame_bite
      .visual.impact.assetId,
    "pack:capture:sprite-impact-physical-01"
  );
  assert.equal(
    source.skillPresentations.cap_fire_atk_6
      .visual.aura.assetId,
    "pack:capture:sprite-fire-zone-loop-01"
  );

  const roster =
    source.roster.teams["local-1"];

  assert.equal(
    roster.activeMemberId,
    "member-loup"
  );
  assert.deepEqual(
    roster.members.map((member) => ({
      id: member.id,
      creatureId: member.creatureId
    })),
    [
      {
        id: "member-loup",
        creatureId: "crea-loup"
      },
      {
        id: "member-moussados",
        creatureId: "crea_mossback"
      }
    ]
  );

  const reserveConfig =
    source.fighterConfigs.crea_mossback;

  assert.ok(reserveConfig);
  assert.equal(reserveConfig.maxHp, 200);
  assert.equal(
    reserveConfig.statValuesById.earth,
    10
  );
  assert.equal(
    reserveConfig.statValuesById.speed,
    2
  );
});

test("bridge rejects unknown party refs instead of inventing a player roster", async () => {
  const raw = snapshot();
  raw.player.partyRef = "unknown-party";
  const sourceRecords = await records();

  assert.throws(
    () =>
      buildExplorationEncounterCombatSourceV1({
        snapshot: raw,
        creatureRecords: sourceRecords
      }),
    /partyRef/
  );
});

test("bridge rejects an unknown encountered creature instead of substituting a demo fighter", async () => {
  await assert.rejects(
    () =>
      configuredSource(
        snapshot("crea_missing")
      ),
    /opponent/
  );
});


test("Exploration ruleset gives the bridged Combat Session usable energy", async () => {
  const source =
    await configuredSource(snapshot());

  const local = source.fighters.find(
    (fighter) => fighter.id === "local-1"
  );
  const enemy = source.fighters.find(
    (fighter) => fighter.id === "enemy-1"
  );

  for (const fighter of [local, enemy]) {
    assert.ok(fighter.maxEnergy > 0);
    assert.ok(fighter.energyChargeAmount > 0);
    assert.ok(fighter.energyChargeIntervalMs > 0);
  }

  const session = createCombatSession({
    distance: "medium",
    battleFormat: source.battleFormat,
    fighters: source.fighters,
    skillSpeedMultiplier: source.skillSpeedMultiplier
  });

  const before =
    session.snapshot().fighters["local-1"].energy;

  session.advanceMs(
    local.energyChargeIntervalMs
  );

  const after =
    session.snapshot().fighters["local-1"].energy;

  assert.ok(after > before);
});

test("Exploration encounter bridge rejects an unknown Combat ruleset", async () => {
  const raw = snapshot();
  raw.rules.rulesetId = "capture.unknown.ruleset";

  assert.throws(
    () =>
      buildExplorationEncounterCombatSourceV1({
        snapshot: raw,
        creatureRecords: []
      }),
    /ruleset/
  );
});


test("Encounter Combat source contains no hardcoded preview party mapping", async () => {
  const source = await readFile(
    new URL(
      "../../src/adapters/input/capture/exploration-encounter-combat-source-v1.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.doesNotMatch(source, /PREVIEW_PARTIES/);
  assert.doesNotMatch(source, /configuredPreviewParty/);
  assert.doesNotMatch(source, /capture-party-preview/);
});
