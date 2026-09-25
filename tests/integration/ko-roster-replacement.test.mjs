import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const rosterData = await json("data/combat/rosters/demo-2v2.roster.json");
const maraileron = await json("data/combat/fighters/maraileron.combat.json");
const braisombre = await json("data/combat/fighters/braisombre.combat.json");
const clawRaw = await json("data/combat/skills/claw.skill.json");

test("real combat KO flows into opponent roster replacement", () => {
  const session = createCombatSession({
    distance: "short",
    fighters: [
      { ...maraileron, id: "player", initialEnergy: 10, initialHp: 100 },
      { ...braisombre, id: "opponent", initialEnergy: 10, initialHp: 18 }
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

  const claw = normalizeSkillDefinition(clawRaw);
  const resolution = session.useSkill({
    actorId: "player",
    targetId: "opponent",
    skill: claw
  });

  assert.equal(resolution.outcome, "hit");
  assert.equal(session.snapshot().fighters.opponent.hp, 0);

  const replacement = roster.replaceKnockedOut("opponent");

  assert.equal(replacement.ok, true);
  assert.equal(replacement.outcome, "ko_replaced");
  assert.equal(replacement.defeatedMemberId, "opponent-drakon");
  assert.equal(replacement.replacementMemberId, "opponent-marai");
  assert.equal(replacement.creatureId, "maraileron");
  assert.equal(roster.snapshot().opponent.activeMemberId, "opponent-marai");
  assert.equal(session.snapshot().fighters.opponent.hp, maraileron.initialHp);
});
