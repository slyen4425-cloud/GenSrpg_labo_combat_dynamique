import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeSkillDefinition } from "../../src/contracts/skill-definition.js";
import { normalizeCombatVisualEvent } from "../../src/contracts/combat-visual-event.js";
import { normalizeVisualActor } from "../../src/contracts/visual-actor.js";
import { createCombatSession } from "../../src/core/combat/combat-session.js";
import { createCombatRuntime } from "../../src/core/combat/combat-runtime.js";
import { planAnimation } from "../../src/core/animation/plan-animation.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";
import { normalizePersistentZoneSpatialV1, visiblePersistentZoneRelationV1 } from "../../src/contracts/persistent-zone-spatial-v1.js";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { createDomActorRenderer } from "../../src/adapters/renderer/dom-actor-renderer.js";
const json = async path => JSON.parse(await readFile(new URL("../../" + path, import.meta.url), "utf8"));
const fighter = id => ({ id, maxHp: 100, initialHp: 100, maxEnergy: 100, initialEnergy: 100, energyChargeAmount: 0 });
const rect = (left, top, width, height) => ({ left, top, width, height });
async function setup(activations = 1) {
  const { draft } = await json("data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json");
  const storm = normalizeSkillDefinition({ ...draft.definition, energyCost: 0, preparationMs: 0, cooldownMs: 0, activationRequirements: { mode: "all", conditions: [] } });
  const session = createCombatSession({ fighters: [fighter("local"), fighter("enemy")], battleFormat: { actors: [{ actorId: "local" }, { actorId: "enemy" }], teamOf: id => id } });
  for (let i = 0; i < activations; i++) assert.equal(session.useSkill({ actorId: "enemy", targetId: "local", skill: storm }).ok, true);
  let time = 0, scheduled;
  const deltas = [];
  const zone = session.snapshot().persistentZones[0];
  let bounds = rect(0, 0, 100, 100);
  let localBounds = rect(30, 30, 10, 10);
  const runtime = createCombatRuntime({ session, now: () => time, setTimer(fn) { scheduled = fn; return 1; }, clearTimer() {}, onHealthDelta: d => deltas.push(d),
    readZoneSpatialContext() { return { zones: [{ zoneId: zone.id, sourceActorId: "enemy", radius: zone.radius, bounds }], actors: [{ actorId: "local", bounds: localBounds }, { actorId: "enemy", bounds: rect(40, 40, 10, 10) }] }; }
  });
  runtime.start();
  return { session, runtime, deltas, tick(ms) { time = ms; scheduled(); }, moveZone(value) { bounds = value; }, moveLocal(value) { localBounds = value; } };
}
for (const level of [1, 2, 3]) test(`fire zone level ${level} damages an idle visible occupant on consecutive native ticks`, async () => {
  const h = await setup(level);
  h.tick(1000); h.tick(2000);
  assert.equal(h.runtime.activeActions.length, 0);
  assert.equal(h.session.snapshot().fighters.local.hp, 90);
  assert.equal(h.deltas.filter(d => d.actorId === "local").reduce((sum, d) => sum + d.amount, 0), 10);
  h.runtime.dispose();
});
test("medium visible range follows source movement, rejects outside and ellipse corners, and resumes without a target attack", async () => {
  const h = await setup(2);
  h.moveLocal(rect(200, 200, 10, 10)); h.tick(1000);
  assert.equal(h.session.snapshot().fighters.local.hp, 100, "medium radius respects a measured visible boundary");
  h.moveLocal(rect(0, 0, 5, 5)); h.tick(2000);
  assert.equal(h.session.snapshot().fighters.local.hp, 100, "empty corner of the ellipse is outside");
  h.moveZone(rect(-30, -30, 100, 100)); h.tick(3000);
  assert.equal(h.session.snapshot().fighters.local.hp, 95);
  h.moveZone(rect(200, 200, 100, 100)); h.tick(4000);
  assert.equal(h.session.snapshot().fighters.local.hp, 95);
  h.runtime.dispose();
});
test("visual occupancy never revives an expired fire zone", async () => {
  const h = await setup(); h.tick(15000);
  const hp = h.session.snapshot().fighters.local.hp;
  assert.ok(hp < 100); assert.equal(h.session.snapshot().persistentZones.length, 0);
  h.tick(17000); assert.equal(h.session.snapshot().fighters.local.hp, hp);
  h.runtime.dispose();
});
test("recall Animation Core uses command preparation and an interruptible held final pose", async () => {
  const profile = await json("data/profiles/quadruped.profile.json");
  const actor = normalizeVisualActor({ id: "local", creatureId: "wolf", profile: "quadruped", asset: "wolf.png", view: "player" });
  for (const durationMs of [500, 2000, 3500]) {
    const plan = planAnimation({ actor, profile, event: normalizeCombatVisualEvent({ type: "recall", actorId: actor.id, metadata: { durationMs } }) });
    assert.equal(plan.segments.reduce((sum, s) => sum + s.durationMs, 0), durationMs);
    assert.equal(plan.loop, false); assert.equal(plan.restoreBaseState, false);
    assert.ok(plan.segments.at(-1).opacity > 0, "outgoing actor remains visible until the native swap");
    assert.ok(plan.segments.at(-1).transform.scaleX < 1);
  }
});
test("arrival plan is visible immediately and restores normal body and shadow", async () => {
  const profile = await json("data/profiles/quadruped.profile.json");
  const actor = normalizeVisualActor({ id: "local", creatureId: "wolf", profile: "quadruped", asset: "wolf.png", view: "player" });
  const plan = planAnimation({ actor, profile, event: normalizeCombatVisualEvent({ type: "enter", actorId: actor.id }) });
  assert.equal(plan.restoreBaseState, true); assert.equal(plan.loop, false);
  assert.ok(plan.segments.every(s => s.opacity > 0));
  assert.equal(plan.segments.at(-1).transform.scaleX, 1);
  assert.equal(plan.segments.at(-1).ground.scale, 1);
});
test("presenter starts recall from the native command and cancels it on interruption/dispose; arrival does not wait", async () => {
  const calls = [], cancelled = [];
  const presenter = createCombatResolutionPresenter({ visuals: { playEventFor(...args) { calls.push(args); return Promise.resolve({ status: "finished" }); }, cancelFor(id) { cancelled.push(id); } } });
  const action = { actionType: "command", actorId: "local", preparationMs: 3500, command: { kind: "switch" } };
  presenter.presentPreparation({ action, actorSlot: "local" });
  assert.deepEqual(calls[0], ["local", "recall", { metadata: { durationMs: 3500 } }]);
  presenter.cancelActionPresentation("local"); assert.deepEqual(cancelled, ["local"]);
  presenter.presentRosterArrival({ actorSlot: "local", result: { ok: true, outcome: "switched" } });
  assert.equal(calls.at(-1)[1], "enter");
  presenter.dispose(); assert.deepEqual(cancelled, ["local", "local"]);
  const before = calls.length;
  presenter.presentRosterArrival({ actorSlot: "local", result: { ok: true, outcome: "ko_replaced" } });
  assert.equal(calls.length, before);
});
test("spatial contract rejects invalid samples and does not reuse another owner or reinforcement radius", () => {
  const input = { zones: [{ zoneId: "zone", sourceActorId: "enemy", radius: "short", bounds: rect(0, 0, 100, 100) }], actors: [{ actorId: "local", bounds: rect(30, 30, 10, 10) }] };
  const sample = normalizePersistentZoneSpatialV1(input);
  const query = { sample, zoneId: "zone", sourceActorId: "enemy", radius: "short", candidateId: "local" };
  assert.equal(visiblePersistentZoneRelationV1(query), true);
  assert.equal(visiblePersistentZoneRelationV1({ ...query, radius: "medium" }), null);
  assert.equal(visiblePersistentZoneRelationV1({ ...query, sourceActorId: "local" }), null);
  input.actors[0].bounds.left = 200;
  assert.equal(visiblePersistentZoneRelationV1(query), true, "sample is detached from mutable renderer inputs");
  for (const width of [0, -1, Infinity, NaN]) assert.throws(() => normalizePersistentZoneSpatialV1({ ...input, actors: [{ actorId: "local", bounds: rect(0, 0, width, 10) }] }), /bounds/);
  assert.throws(() => normalizePersistentZoneSpatialV1({ ...input, actors: [input.actors[0], input.actors[0]] }), /duplicate/);
});
test("renderer samples current model and zone geometry, follows a moving source and retains sprite playback", () => {
  let position = rect(80, 180, 40, 40), node, animationCount = 0;
  const document = { createElement() { node = { style: {}, dataset: {}, remove() {}, getBoundingClientRect: () => rect(40, 140, 120, 120) }; return node; } };
  const renderer = createDomSkillFxRenderer({ arena: { ownerDocument: document, append() {}, getBoundingClientRect: () => rect(0, 0, 400, 300) }, anchors: { enemy: { getBoundingClientRect: () => position } }, targetAnchors: { enemy: { getBoundingClientRect: () => rect(1000, 1000, 40, 40) } }, presentationForSkill: () => ({ persistentZone: { url: "zone.webp", displayScale: 1, playbackMode: "loop" } }), animate() { animationCount++; return { finished: new Promise(() => {}), cancel() {} }; } });
  const zones = [{ id: "zone", skillId: "fire", sourceActorId: "enemy", radius: "short" }];
  const sample = renderer.sampleZoneSpatialContext(zones);
  assert.deepEqual(sample.actors[0].bounds, position);
  assert.deepEqual(sample.zones[0].bounds, rect(40, 140, 120, 120));
  assert.equal(node.style.left, "100px"); assert.equal(node.style.top, "200px");
  const original = node, count = animationCount;
  position = rect(180, 280, 40, 40); renderer.sampleZoneSpatialContext(zones);
  assert.equal(node, original); assert.equal(animationCount, count);
  assert.equal(node.style.left, "200px"); assert.equal(node.style.top, "300px");
  renderer.dispose(); assert.equal(renderer.sampleZoneSpatialContext(zones), null);
});
test("cancelled recall and replacement restore body and ground opacity before arrival", async () => {
  const profile = await json("data/profiles/quadruped.profile.json");
  const actor = normalizeVisualActor({ id: "local", creatureId: "wolf", profile: "quadruped", asset: "wolf.png", view: "player" });
  const element = { style: {} };
  const shadowElement = { style: {} };
  const animations = [];
  const renderer = createDomActorRenderer({ element, shadowElement, actor, animate() {
    let resolve, reject; const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
    const animation = { finished, resolve, cancel() { const e = new Error("cancelled"); e.name = "AbortError"; reject(e); } };
    animations.push(animation); return animation;
  } });
  const recall = renderer.play(planAnimation({ actor, profile, event: normalizeCombatVisualEvent({ type: "recall", actorId: actor.id, metadata: { durationMs: 2000 } }) }));
  renderer.cancel(); await recall.finished;
  assert.equal(element.style.opacity, "1"); assert.equal(shadowElement.style.opacity, "1");
  const enter = renderer.play(planAnimation({ actor, profile, event: normalizeCombatVisualEvent({ type: "enter", actorId: actor.id }) }));
  animations.slice(-2).forEach(a => a.resolve()); await enter.finished;
  assert.equal(element.style.opacity, "1"); assert.equal(element.style.filter, "none");
  assert.equal(shadowElement.style.opacity, "1"); renderer.dispose();
});
test("an ordinary incoming hit does not erase the recall animation, while a lethal hit still presents KO", async () => {
  const calls = [];
  const presenter = createCombatResolutionPresenter({ visuals: { playEventFor(id, type) { calls.push([id, type]); return Promise.resolve({ status: "finished" }); }, cancelFor() {} } });
  presenter.presentPreparation({ actorSlot: "local", action: { actionType: "command", preparationMs: 2000, command: { kind: "switch" } } });
  const result = hp => ({ ok: true, outcome: "hit", events: [{ type: "hit", actorId: "local", hpAfter: hp }], state: { fighters: { local: { hp } } } });
  await presenter.presentOutcome({ actorSlot: "enemy", targetSlot: "local", resolution: result(90) }).finished;
  assert.deepEqual(calls, [["local", "recall"]], "hit feedback must not cancel a still-valid recall command's visual channel");
  await presenter.presentOutcome({ actorSlot: "enemy", targetSlot: "local", resolution: result(0) }).finished;
  assert.equal(calls.at(-1)[1], "ko"); presenter.dispose();
});
