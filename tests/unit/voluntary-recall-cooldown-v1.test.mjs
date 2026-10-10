import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createRosterSession } from "../../src/core/combat/roster-session.js";
import { normalizeCaptureGameOptionsV1 } from "../../src/contracts/capture-game-options-v1.js";

const load = async path => JSON.parse(await readFile(path,"utf8"));
const [rosterDefinition, maraileron, braisombre] = await Promise.all([
  load("data/combat/rosters/demo-2v2.roster.json"),
  load("data/combat/fighters/maraileron.combat.json"),
  load("data/combat/fighters/braisombre.combat.json")
]);

function harness(recallCooldownMs) {
  const session = createCombatSession({distance:"medium",fighters:[
    {...maraileron,id:"player",initialEnergy:6,initialHp:80},
    {...braisombre,id:"opponent",initialEnergy:5,initialHp:90}
  ]});
  const roster = createRosterSession({combatSession:session, roster:rosterDefinition, fighterConfigs:{maraileron,braisombre},
    ...(recallCooldownMs === undefined ? {} : {recallCooldownMs})});
  return {session,roster};
}

test("recall anti-spam setting defaults to 45 seconds, permits zero and one minute, rejects invalid values",()=>{
  assert.equal(normalizeCaptureGameOptionsV1().recallCooldownMs,45000);
  assert.equal(normalizeCaptureGameOptionsV1({recallCooldownMs:0}).recallCooldownMs,0);
  assert.equal(normalizeCaptureGameOptionsV1({recallCooldownMs:60000}).recallCooldownMs,60000);
  for (const invalid of [-1,Infinity,NaN]) {
    assert.throws(()=>normalizeCaptureGameOptionsV1({recallCooldownMs:invalid}),/recallCooldownMs/);
  }
});

test("voluntary switch locks recall and another voluntary switch for 45 combat seconds",()=>{
  const {session,roster} = harness();
  assert.equal(roster.previewSwitch("player").ok,true);
  assert.equal(roster.switchMember("player").outcome,"switched");
  assert.equal(roster.previewSwitch("player").outcome,"recall_cooldown");
  assert.equal(roster.previewRecall("player").outcome,"recall_cooldown");
  assert.equal(roster.recall("player").outcome,"recall_cooldown");
  assert.equal(roster.switchMember("player").outcome,"recall_cooldown");
  assert.equal(roster.snapshot().player.voluntarySwitchCooldownRemainingMs,45000);
  session.advanceMs(44000);
  assert.equal(roster.snapshot().player.voluntarySwitchCooldownRemainingMs,1000);
  assert.equal(roster.previewSwitch("player").ok,false);
  session.advanceMs(1000);
  assert.equal(roster.previewSwitch("player").ok,true);
  assert.equal(roster.switchMember("player").ok,true);
  assert.equal(roster.snapshot().player.voluntarySwitchCooldownRemainingMs,45000);
  assert.equal(roster.snapshot().opponent.voluntarySwitchCooldownRemainingMs,0);
});

test("zero-delay removes spam restriction; a separate session starts unlocked",()=>{
  const {roster} = harness(0);
  for (let i=0;i<3;i++) assert.equal(roster.switchMember("player").ok,true);
  assert.equal(roster.snapshot().player.voluntarySwitchCooldownRemainingMs,0);
  const next = harness();
  assert.equal(next.roster.previewSwitch("player").ok,true);
});

test("voluntary recall starts cooldown, summon is still possible and does not bypass it",()=>{
  const {session,roster} = harness(60000);
  assert.equal(roster.recall("player").ok,true);
  assert.equal(roster.summon("player").ok,true);
  assert.equal(roster.previewSwitch("player").outcome,"recall_cooldown");
  session.advanceMs(60000);
  assert.equal(roster.previewSwitch("player").ok,true);
});

test("KO auto replacement skips voluntary cooldown and retains cooldown for next voluntary choice",()=>{
  const {session,roster} = harness();
  assert.equal(roster.switchMember("player").ok,true);
  const active = session.snapshot().fighters.player;
  session.replaceFighter("player",{...active,initialHp:0});
  const result = roster.replaceKnockedOut("player");
  assert.equal(result.ok,true);
  assert.equal(result.outcome,"ko_replaced");
  assert.equal(roster.snapshot().player.voluntarySwitchCooldownRemainingMs,45000);
});

test("HTML game options and human editor expose recall cooldown alongside existing recall preparation", async()=>{
  const [html,js] = await Promise.all([
    readFile("examples/dom-demo/capture-editor-v2.html","utf8"),
    readFile("src/ui/capture-editor-human-v2.js","utf8")
  ]);
  assert.match(html,/data-game-recall-cooldown-seconds/);
  assert.match(js,/\[data-game-recall-cooldown-seconds\]/);
  assert.match(html,/data-recall-seconds/);
});
