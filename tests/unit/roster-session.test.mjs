import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";
import { withFighterEnergy, withFighterHp } from "../../src/core/combat/combat-state.js";

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const rosterData = await json("data/combat/rosters/demo-2v2.roster.json");
const maraileron = await json("data/combat/fighters/maraileron.combat.json");
const braisombre = await json("data/combat/fighters/braisombre.combat.json");

function createHarness() {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      { ...maraileron, id: "player", initialEnergy: 6, initialHp: 80 },
      { ...braisombre, id: "opponent", initialEnergy: 5, initialHp: 90 }
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

  return { session, roster };
}

test("demo roster starts Marai vs Drakon with one reserve each", () => {
  const { roster } = createHarness();
  const state = roster.snapshot();

  assert.equal(state.player.activeMemberId, "player-marai");
  assert.equal(state.opponent.activeMemberId, "opponent-drakon");

  const playerReserve = state.player.members.find((member) => !member.active);
  const opponentReserve = state.opponent.members.find((member) => !member.active);

  assert.equal(playerReserve.displayName, "Drakon");
  assert.equal(opponentReserve.displayName, "Marai");
});

test("recall preserves active fighter hp and energy in roster snapshot", () => {
  const { session, roster } = createHarness();

  let state = session.snapshot();
  state = withFighterHp(state, "player", 37);
  state = withFighterEnergy(state, "player", 4);
  session.replaceFighter("player", {
    ...state.fighters.player,
    initialHp: 37,
    initialEnergy: 4
  });

  const result = roster.recall("player");
  assert.equal(result.ok, true);
  assert.equal(result.memberId, "player-marai");

  const rosterState = roster.snapshot();
  assert.equal(rosterState.player.activeMemberId, null);

  const recalled = rosterState.player.members.find(
    (member) => member.id === "player-marai"
  );
  assert.equal(recalled.hp, 37);
  assert.equal(recalled.energy, 4);
});

test("summon selected reserve replaces player combat slot with its own fighter config", () => {
  const { session, roster } = createHarness();

  roster.recall("player");
  const selected = roster.selectReserve("player", "player-drakon");
  assert.equal(selected.ok, true);

  const summoned = roster.summon("player");
  assert.equal(summoned.ok, true);
  assert.equal(summoned.memberId, "player-drakon");
  assert.equal(summoned.creatureId, "braisombre");

  const fighter = session.snapshot().fighters.player;
  assert.equal(fighter.id, "player");
  assert.equal(fighter.movementEnergyPerStep, braisombre.movementEnergyPerStep);

  const rosterState = roster.snapshot();
  assert.equal(rosterState.player.activeMemberId, "player-drakon");
  assert.equal(rosterState.player.selectedReserveMemberId, "player-marai");
});

test("summoning a recalled member restores its saved hp and energy", () => {
  const { session, roster } = createHarness();

  session.replaceFighter("player", {
    ...session.snapshot().fighters.player,
    initialHp: 41,
    initialEnergy: 3
  });

  roster.recall("player");
  roster.selectReserve("player", "player-marai");
  roster.summon("player");

  const restored = session.snapshot().fighters.player;
  assert.equal(restored.hp, 41);
  assert.equal(restored.energy, 3);
});

test("player roster operations never mutate opponent active member", () => {
  const { roster } = createHarness();
  const before = roster.snapshot().opponent;

  roster.recall("player");
  roster.selectReserve("player", "player-drakon");
  roster.summon("player");

  const after = roster.snapshot().opponent;
  assert.equal(after.activeMemberId, before.activeMemberId);
  assert.deepEqual(
    after.members.map((member) => member.id),
    before.members.map((member) => member.id)
  );
});

test("completed recall and summon command resolutions delegate to roster owner", () => {
  const { roster } = createHarness();

  const recallResult = roster.applyCommandResolution("player", {
    ok: true,
    outcome: "completed",
    commandKind: "recall"
  });
  assert.equal(recallResult.outcome, "recalled");

  roster.selectReserve("player", "player-drakon");

  const summonResult = roster.applyCommandResolution("player", {
    ok: true,
    outcome: "completed",
    commandKind: "summon"
  });
  assert.equal(summonResult.outcome, "summoned");
  assert.equal(summonResult.memberId, "player-drakon");
});


test("KO opponent is replaced automatically from reserve and defeated snapshot is kept", () => {
  const { session, roster } = createHarness();

  session.replaceFighter("opponent", {
    ...session.snapshot().fighters.opponent,
    initialHp: 0,
    initialEnergy: 2
  });

  const result = roster.replaceKnockedOut("opponent");

  assert.equal(result.ok, true);
  assert.equal(result.outcome, "ko_replaced");
  assert.equal(result.defeatedMemberId, "opponent-drakon");
  assert.equal(result.replacementMemberId, "opponent-marai");
  assert.equal(result.creatureId, "maraileron");

  const rosterState = roster.snapshot();
  assert.equal(rosterState.opponent.activeMemberId, "opponent-marai");

  const defeated = rosterState.opponent.members.find(
    (member) => member.id === "opponent-drakon"
  );
  assert.equal(defeated.hp, 0);
  assert.equal(defeated.energy, 2);

  const active = session.snapshot().fighters.opponent;
  assert.equal(active.hp, maraileron.initialHp);
  assert.equal(
    active.movementEnergyPerStep,
    maraileron.movementEnergyPerStep
  );
});

test("KO replacement returns team_defeated after both opponent members reach zero", () => {
  const { session, roster } = createHarness();

  session.replaceFighter("opponent", {
    ...session.snapshot().fighters.opponent,
    initialHp: 0
  });

  const first = roster.replaceKnockedOut("opponent");
  assert.equal(first.outcome, "ko_replaced");
  assert.equal(first.replacementMemberId, "opponent-marai");

  session.replaceFighter("opponent", {
    ...session.snapshot().fighters.opponent,
    initialHp: 0
  });

  const second = roster.replaceKnockedOut("opponent");
  assert.equal(second.ok, true);
  assert.equal(second.outcome, "team_defeated");
  assert.equal(roster.snapshot().opponent.activeMemberId, null);
});
