import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const rosterData = await json("data/combat/rosters/demo-2v2.roster.json");
const maraileron = await json("data/combat/fighters/maraileron.combat.json");
const braisombre = await json("data/combat/fighters/braisombre.combat.json");
const fireball = normalizeSkillDefinition(
  await json("data/combat/skills/fireball.skill.json")
);

test("real KO flow resolves damage, presents KO, then replaces opponent from roster", async () => {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      {
        ...maraileron,
        id: "player",
        initialEnergy: 10,
        initialHp: 100
      },
      {
        ...braisombre,
        id: "opponent",
        initialEnergy: 10,
        initialHp: 30
      }
    ]
  });

  const roster = createRosterSession({
    combatSession: session,
    roster: rosterData,
    fighterConfigs: {
      maraileron,
      braisombre
    }
  });

  const visualCalls = [];
  const visuals = {
    playEventFor(slot, type) {
      visualCalls.push([slot, type]);
      return Promise.resolve({ status: "finished" });
    },
    cancelFor() {}
  };

  const presenter = createCombatResolutionPresenter({ visuals });

  const resolution = session.useSkill({
    actorId: "player",
    targetId: "opponent",
    skill: fireball
  });

  assert.equal(resolution.outcome, "hit");
  assert.equal(session.snapshot().fighters.opponent.hp, 0);

  const presentation = presenter.presentOutcome({
    resolution,
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.equal(presentation.ko, true);
  assert.equal(presentation.koActorId, "opponent");

  await presentation.finished;

  assert.deepEqual(visualCalls, [
    ["opponent", "hit"],
    ["opponent", "ko"]
  ]);

  const replacement = roster.replaceKnockedOut("opponent");
  assert.equal(replacement.ok, true);
  assert.equal(replacement.outcome, "ko_replaced");
  assert.equal(replacement.creatureId, "maraileron");
  assert.equal(
    roster.snapshot().opponent.activeMemberId,
    "opponent-marai"
  );
  assert.equal(session.snapshot().fighters.opponent.hp, maraileron.initialHp);

  presenter.dispose();
});
