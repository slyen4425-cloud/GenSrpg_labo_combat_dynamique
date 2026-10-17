import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeSkillEffectV1 } from "../../src/contracts/skill-effect-v1.js";
import { createCombatState } from "../../src/core/combat/combat-state.js";
import { applyImmediateTacticalEffectsV1 } from "../../src/core/combat/immediate-tactical-effects-v1.js";
import { applyStatusEffectV1 } from "../../src/core/combat/status-effect-runtime-v1.js";
import { markerStatusDefinitionV1 } from "../../src/contracts/capture-marker-v1.js";

const fighter = id => ({
  id, maxHp: 200, initialHp: 200, maxEnergy: 30, initialEnergy: 30,
  energyChargeAmount: 0, energyChargeIntervalMs: 2000, movementEnergyPerStep: 0
});
const venin = {
  id: "venin-static", name: "venin static", polarity: "detrimental",
  permanent: true, maxStacks: 20
};
const cast = (state, effects) => applyImmediateTacticalEffectsV1({
  state, actorId: "a", targetId: "b",
  skill: {id: "choc_venin", category: "buff_debuff", form: "projectile",
    element: "electric", effects}, atMs: 0, combatAtMs: 0
});
const setup = (charges, marker = venin) => {
  let state = createCombatState({fighters: [fighter("a"), fighter("b")]});
  for (let i = 0; i < charges; i += 1) {
    state = applyStatusEffectV1({
      state, sourceActorId: "a", targetActorId: "b",
      sourceSkillId: "lib_paralyze", status: markerStatusDefinitionV1(marker), atMs: 0
    });
  }
  return state;
};
const consume = (options = {}) => normalizeSkillEffectV1({
  kind: "consume_marker", targetScope: "target", markerId: "venin-static",
  count: "all", minimum: 1,
  effects: [{kind: "damage", targetScope: "target", amount: 10, channel: "electric"}],
  ...options
});
const stacks = state => state.fighters.b.statusEffects.find(s => s.definition.id === "marker:venin-static")?.stacks ?? 0;

test("RED: perCharge multiplies Choc damage by the charges actually removed", () => {
  const effect = consume({perCharge: true});
  assert.equal(effect.perCharge, true, "SkillEffectV1 preserves perCharge");
  for (const [n, expected] of [[0,0],[1,10],[3,30],[5,50]]) {
    const output = cast(setup(n), [effect]);
    assert.equal(output.state.fighters.b.hp, 200-expected, n + " removed charges");
    assert.equal(stacks(output.state), 0);
    assert.equal(output.events.filter(x => x.type === "markers-consumed").reduce((sum,x) => sum+x.charges,0),n);
    assert.equal(output.events.filter(x => x.type === "hit").length,n===0?0:1,
      "one combat hit calculated from the combined base, not duplicate independent hits");
  }
});
test("perCharge respects minimum/actual maximum and legacy fixed effect", () => {
  const minimum = consume({perCharge:true,minimum:5});
  const missing = cast(setup(4), [minimum]);
  assert.equal(missing.state.fighters.b.hp,200);
  assert.equal(stacks(missing.state),4);
  const enough = cast(setup(7), [consume({perCharge:true,count:5,minimum:5})]);
  assert.equal(enough.state.fighters.b.hp,150);
  assert.equal(stacks(enough.state),2);
  const legacy = cast(setup(5), [consume()]);
  assert.equal(legacy.state.fighters.b.hp,190,"old skills retain exactly 10 flat damage");
  assert.equal(stacks(legacy.state),0);
});
test("perCharge uses same native damage owner for a shield or immunity", () => {
  const shield={id:"shield",kind:"shield",polarity:"beneficial",durationMs:5000,stacking:"replace",amount:30};
  const immunity={id:"immunity",kind:"immunity",polarity:"beneficial",
    durationMs:5000,stacking:"replace",domains:["damage"]};
  for (const [def,hp] of [[shield,180],[immunity,200]]) {
    let state=setup(5);
    state=applyStatusEffectV1({state,sourceActorId:"b",targetActorId:"b",
      sourceSkillId:"barrier",status:def,atMs:0});
    const result=cast(state,[consume({perCharge:true})]);
    assert.equal(result.state.fighters.b.hp,hp);
    assert.equal(stacks(result.state),0);
  }
});
test("Choc user transfer and Dard static share venin-static identity",async () => {
  const choc=JSON.parse(await readFile(new URL("../../data/capture/showcase/choc_venin.capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft;
  const dard=JSON.parse(await readFile(new URL("../../data/capture/showcase/lib_paralyze.capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft;
  assert.equal(choc.id,"choc_venin");
  assert.equal(choc.requiredLevel,5);
  assert.equal(choc.definition.effects[0].markerId,dard.definition.effects.find(x=>x.kind==="apply_marker").marker.id);
  assert.equal(choc.definition.effects[0].perCharge,true);
  const effect=normalizeSkillEffectV1(choc.definition.effects[0]);
  const state=cast(setup(5,dard.definition.effects[1].marker),[effect]).state;
  assert.equal(state.fighters.b.hp,150);
  assert.equal(stacks(state),0);
});
