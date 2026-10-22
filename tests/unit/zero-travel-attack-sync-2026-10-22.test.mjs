import test from "node:test";
import assert from "node:assert/strict";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";
import { readFile } from "node:fs/promises";

function harness({ anticipationMs = 250 } = {}) {
  let clock = 0;
  let serial = 0;
  const timers = new Map();
  const events = [];
  const visuals = {
    playEventFor(actorSlot, type, options) {
      events.push({ clock, actorSlot, type, options });
      return Promise.resolve({ status: "finished" });
    },
    cancelFor(actorSlot) {
      events.push({ clock, actorSlot, type: "cancel" });
    }
  };
  const presenter = createCombatResolutionPresenter({
    visuals,
    instantAttackAnticipationMs: anticipationMs,
    setTimer(callback, delayMs) {
      const id = ++serial;
      timers.set(id, { at: clock + delayMs, callback });
      return id;
    },
    clearTimer(id) { timers.delete(id); }
  });
  function advanceTo(targetMs) {
    while (true) {
      const due = [...timers.entries()]
        .filter(([, timer]) => timer.at <= targetMs)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      clock = due[1].at;
      timers.delete(due[0]);
      due[1].callback();
    }
    clock = targetMs;
  }
  return { presenter, events, timers, advanceTo };
}

const seismic = Object.freeze({
  actionType: "skill",
  actorId: "player",
  targetId: "opponent",
  preparationMs: 3500,
  releaseAtMs: 3500,
  travelMs: 0,
  skill: { id: "cap_earth_atk_7", form: "projectile", approachMode: "none", element: "earth" }
});

test("Séisme: attack pose starts before native release/instant damage, never repeats at release", () => {
  const h = harness();
  h.presenter.presentPreparation({ action: seismic, actorSlot: "player" });
  h.advanceTo(3249);
  assert.equal(h.events.filter(e => e.type === "attack").length, 0);
  h.advanceTo(3250);
  const attack = h.events.filter(e => e.type === "attack");
  assert.equal(attack.length, 1);
  assert.equal(attack[0].clock, 3250);
  assert.equal(attack[0].options.metadata.useRangedAppearance, true);
  h.advanceTo(3500);
  h.presenter.presentRelease({ action: seismic, actorSlot: "player", targetSlot: "opponent" });
  assert.equal(h.events.filter(e => e.type === "attack").length, 1);
  assert.equal(h.timers.size, 0);
  h.presenter.dispose();
});

test("stun/interruption before release cancels scheduled or active anticipation", () => {
  const scheduled = harness();
  scheduled.presenter.presentPreparation({ action: seismic });
  assert.equal(scheduled.presenter.cancelActionPresentation("player"), true);
  scheduled.advanceTo(3500);
  assert.equal(scheduled.events.filter(e => e.type === "attack").length, 0);
  scheduled.presenter.dispose();

  const started = harness();
  started.presenter.presentPreparation({ action: seismic });
  started.advanceTo(3250);
  assert.equal(started.presenter.cancelActionPresentation("player"), true);
  assert.equal(started.events.filter(e => e.type === "cancel").length, 1);
  started.advanceTo(3500);
  assert.equal(started.events.filter(e => e.type === "attack").length, 1);
  started.presenter.dispose();
});

test("late presentation timer falls back to one normal release attack", () => {
  const h = harness();
  h.presenter.presentPreparation({ action: seismic });
  // Browser throttling: native action releases before the visual timer can fire.
  h.presenter.presentRelease({ action: seismic });
  h.advanceTo(3500);
  assert.equal(h.events.filter(e => e.type === "attack").length, 1);
  h.presenter.dispose();
});

test("non-instant skills and no-preparation skills keep their original release timing", () => {
  for (const delta of [
    { travelMs: 700 },
    { preparationMs: 0, releaseAtMs: 0 },
    { skill: { ...seismic.skill, approachMode: "ground" } },
    { skill: { ...seismic.skill, form: "contact" } }
  ]) {
    const h = harness();
    const action = { ...seismic, ...delta };
    h.presenter.presentPreparation({ action });
    h.advanceTo(3500);
    assert.equal(h.events.filter(e => e.type === "attack").length, 0);
    // Do not release an approach with mock visuals that lack playApproachFor:
    if (action.skill.approachMode === "none") {
      h.presenter.presentRelease({ action });
      assert.equal(h.events.filter(e => e.type === "attack").length, 1);
    }
    h.presenter.dispose();
  }
});

test("shared 1v1 and 2v2 presenters consume the same startup and release callbacks", async () => {
  for (const file of ["src/ui/combat-test-ui.js", "src/ui/combat-2v2-test-ui.js"]) {
    const source = await readFile(new URL("../../" + file, import.meta.url), "utf8");
    assert.match(source, /presenter\.presentPreparation\(/);
    assert.match(source, /presenter\.presentRelease\(/);
    assert.match(source, /presenter\.cancelActionPresentation\(/);
  }
});
