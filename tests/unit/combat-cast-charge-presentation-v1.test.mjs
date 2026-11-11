import test from "node:test";
import assert from "node:assert/strict";
import {
  projectCombatCastChargeV1,
  createCombatCastChargePresenterV1
} from "../../src/adapters/renderer/combat-cast-charge-presentation-v1.js";

test("cast HUD shows native preparation progress with percent and remaining time", () => {
  assert.deepEqual(projectCombatCastChargeV1({
    active: true, value: 0.625, actionName: "Voile aqueux", remainingMs: 750
  }), {
    active: true,
    progress: 0.625,
    percent: 63,
    readout: "63 % · 0,8 s",
    accessibleLabel: "Préparation : Voile aqueux, 63 %, 0,8 seconde restante"
  });
});

test("cast HUD sanitizes progress and hides on release/interruption", () => {
  const empty = projectCombatCastChargeV1({ active: false, value: 1, remainingMs: 0 });
  assert.equal(empty.active, false);
  assert.equal(empty.progress, 0);
  assert.equal(empty.readout, "");
  assert.equal(projectCombatCastChargeV1({ active: true, value: 8, remainingMs: -20 }).percent, 100);
  assert.equal(projectCombatCastChargeV1({ active: true, value: -1, remainingMs: NaN }).progress, 0);
});

test("combat charge adapter reuses one DOM readout, reports snapshots, and resets cleanly", () => {
  const inserted = [];
  const createElement = () => ({
    className: "", hidden: false, textContent: "", dataset: {},
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; this[name] = value; },
    getAttribute(name) { return this.attributes[name] ?? null; },
    append(...children) { this.children = children; }
  });
  const bar = {
    ownerDocument: { createElement },
    dataset: {}, max: 1, value: 0,
    parentNode: { insertBefore(child, before) { inserted.push({ child, before }); } },
    setAttribute(name, value) { this[name] = value; }
  };
  const presenter = createCombatCastChargePresenterV1({ bar });
  presenter.render({ active: true, value: 0.4, actionName: "Boule de feu", remainingMs: 1250 });
  assert.equal(inserted.length, 2);
  assert.equal(inserted[0].before, bar);
  assert.equal(inserted[1].before, bar);
  assert.equal(bar.value, 0.4);
  assert.equal(bar.dataset.active, "true");
  assert.equal(bar["aria-valuetext"], "Préparation : Boule de feu, 40 %, 1,3 secondes restantes");
  assert.equal(inserted[0].child.textContent, "40 % · 1,3 s");
  assert.equal(inserted[0].child.hidden, false);
  const row=inserted[1].child;
  assert.equal(row.children[1],bar,"same native progress bar is reused");
  assert.equal(row.children[0].hidden,true);
  presenter.render({ active:true, value:0.7, actionName:"Griffe", remainingMs:900,iconUrl:"https://example.test/icon-claw.webp" });
  assert.equal(row.children[0].hidden,false);
  assert.equal(row.children[0].src,"https://example.test/icon-claw.webp");
  assert.equal(row.dataset.hasIcon,"true");
  presenter.render({ active: false });
  assert.equal(inserted.length, 2, "No duplicate status nodes");
  assert.equal(row.children[0].hidden,true);
  assert.equal(row.dataset.hasIcon,"false");
  assert.equal(bar.value, 0);
  assert.equal(bar.dataset.active, "false");
  assert.equal(inserted[0].child.hidden, true);
});
