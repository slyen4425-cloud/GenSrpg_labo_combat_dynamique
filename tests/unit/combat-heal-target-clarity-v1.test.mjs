import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { normalizeBattleFormatDefinition } from "../../src/contracts/battle-format-definition.js";
import { combatSkillTargetOptionsV1 } from "../../src/ui/combat-2v2-test-ui.js";
import { combatHealthDeltaEventsV1 } from "../../src/core/combat/combat-health-feedback-v1.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";

const format = normalizeBattleFormatDefinition({
  id: "heal-target-test", localActorId: "local-1",
  teams: { us: ["local-1", "local-2"], them: ["enemy-1", "enemy-2"] },
  actors: [
    ...["local-1", "local-2"].map((actorId, i) => ({
      actorId, teamId: "us", creatureId: "crea-local-"+i,
      displayName: actorId, fighterConfigId: "crea-local-"+i,
      controllerId: i === 0 ? "human-local" : "ai-ally"
    })),
    ...["enemy-1", "enemy-2"].map((actorId, i) => ({
      actorId, teamId: "them", creatureId: "crea-enemy-"+i,
      displayName: actorId, fighterConfigId: "crea-enemy-"+i,
      controllerId: "ai-enemy"
    }))
  ]
});

const state = {
  fighters: {
    "local-1": { hp: 70, maxHp: 100 },
    "local-2": { hp: 60, maxHp: 100 },
    "enemy-1": { hp: 80, maxHp: 100 },
    "enemy-2": { hp: 0, maxHp: 100 }
  }
};

test("self and ally heals remain selectable even if an enemy was originally selected", () => {
  const previewSkill = ({ targetId }) => ({ok: targetId !== "local-2"});
  const own = combatSkillTargetOptionsV1({
    format, actorId: "local-1", skill: { targetRelations: ["self"] },
    state, previewSkill
  });
  assert.deepEqual(own.allowedIds, ["local-1"]);
  assert.deepEqual(own.availableIds, ["local-1"]);
  assert.equal(own.availableIds.includes("enemy-1"), false);

  const ally = combatSkillTargetOptionsV1({
    format, actorId: "local-1", skill: { targetRelations: ["ally"] },
    state, previewSkill
  });
  assert.deepEqual(ally.allowedIds, ["local-2"]);
  assert.deepEqual(ally.availableIds, [], "unavailable allies must be shown as legal targets but not castable");

  const enemy = combatSkillTargetOptionsV1({
    format, actorId: "local-1", skill: { targetRelations: ["enemy"] },
    state, previewSkill: () => ({ok:true})
  });
  assert.deepEqual(enemy.availableIds, ["enemy-1"]);
});

test("health feedback identifies actual applied heal, excluding full-HP no-op", () => {
  const hp = (value) => ({elapsedMs: 100, fighters: {"local-1": {hp:value,maxHp:100}}});
  assert.deepEqual(
    combatHealthDeltaEventsV1(hp(70),hp(93)).map(({kind,amount,actorId})=>({kind,amount,actorId})),
    [{kind:"heal",amount:23,actorId:"local-1"}]
  );
  assert.deepEqual(combatHealthDeltaEventsV1(hp(100),hp(100)), []);
});

test("DOM FX displays +HP for a heal, distinct from -damage and on its actual actor", async () => {
  const el=(rect={left:0,top:0,width:30,height:30})=>({
    className:"",dataset:{},style:{},children:[],textContent:"",
    append(child){this.children.push(child);}, remove(){this.removed=true;},
    getBoundingClientRect(){return rect;}
  });
  const arena=el({left:0,top:0,width:400,height:300});
  const target=el({left:100,top:100,width:40,height:40});
  arena.ownerDocument={createElement(){return el();}};
  const fx=createDomSkillFxRenderer({
    arena, anchors: {"local-1": target}, targetAnchors: {"local-1":target},
    animate(){return {finished:Promise.resolve(),cancel(){}};},
    requestFrame(){return null;},cancelFrame(){}
  });
  const result=fx.play({type:"heal",targetSlot:"local-1",amount:23,durationMs:700});
  assert.equal(result.status,"running");
  assert.equal(arena.children[0].dataset.skillFx,"heal");
  assert.equal(arena.children[0].textContent,"+23");
  assert.match(arena.children[0].className,/heal-number/);
  await result.finished;
  fx.dispose();
});

test("Capture combat routes target selection and visual heal to existing owners", async () => {
  const ui=await readFile(new URL("../../src/ui/combat-2v2-test-ui.js",import.meta.url),"utf8");
  const css=await readFile(new URL("../../examples/dom-demo/demo.css",import.meta.url),"utf8");
  assert.match(ui,/data\.skillTargetCandidate|dataset\.skillTargetCandidate/);
  assert.match(ui,/pendingSkillId/);
  assert.match(ui,/combatSkillTargetOptionsV1/);
  assert.match(ui, /\["damage", "heal"\]\.includes\(feedback\.kind\)/);
  assert.match(ui,/type:\s*feedback\.kind/);
  assert.match(ui,/PV déjà au maximum/);
  assert.match(css,/skill-target-candidate/);
  assert.match(css,/skill-fx--heal-number/);
});

test("actual Combat Session applies healing for both tactical and legacy editor healing values", () => {
  const fighter = (id, hp = 40) => ({
    id, maxHp: 100, initialHp: hp, maxEnergy: 50,
    initialEnergy: 50, energyChargeAmount: 0, energyChargeIntervalMs: 2000,
    movementEnergyPerStep: 1, chargeTimeModifierPct: 0
  });
  const skillWith = (id, effect, effects) => normalizeSkillDefinition({
    id, name: id, category: "heal", form: "self",
    targetRelations: ["self"], energyCost: 0,
    preparationMs: 0, travelMs: 0, recoveryMs: 0, cooldownMs: 0,
    effect, effects
  });
  const examples = [
    skillWith("heal-tactical", {heal:0}, [{
      kind:"heal",targetScope:"self",amount:25
    }]),
    skillWith("heal-legacy-editor", {heal:25}, [])
  ];
  for (const skill of examples) {
    const session = createCombatSession({distance:"medium",fighters:[fighter("local"), fighter("enemy", 100)]});
    const result=session.useSkill({actorId:"local",targetId:"local",skill});
    assert.equal(result.ok,true,skill.id);
    assert.equal(session.snapshot().fighters.local.hp,65,skill.id);
    assert.equal(result.events.some(event=>event.type==="heal" && event.applied===25),true,skill.id);
  }
});
