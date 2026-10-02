import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createCombatResolutionPresenter
} from "../../src/adapters/renderer/combat-resolution-presenter.js";

test("approach contact is routed through the same generic Runtime authority as projectiles", async () => {
  const [duel, coop, presenterSource, demoSource] =
    await Promise.all([
      readFile(
        new URL("../../src/ui/combat-test-ui.js", import.meta.url),
        "utf8"
      ),
      readFile(
        new URL("../../src/ui/combat-2v2-test-ui.js", import.meta.url),
        "utf8"
      ),
      readFile(
        new URL(
          "../../src/adapters/renderer/combat-resolution-presenter.js",
          import.meta.url
        ),
        "utf8"
      ),
      readFile(
        new URL("../../src/ui/demo-app.js", import.meta.url),
        "utf8"
      )
    ]);

  for (const source of [duel, coop]) {
    assert.match(
      source,
      /onProjectileContact\(contact\)[\s\S]{0,120}runtime\?\.reportActionContact\(contact\)/
    );
    assert.match(
      source,
      /onActionContact\(contact\)[\s\S]{0,120}runtime\?\.reportActionContact\(contact\)/
    );
    assert.doesNotMatch(
      source,
      /reportProjectileContact/
    );
  }

  assert.match(
    presenterSource,
    /playApproachFor\([\s\S]{0,900}onContact\(contact\)[\s\S]{0,260}onActionContact/
  );
  assert.match(
    demoSource,
    /watchVisibleModelsContact\([\s\S]{0,500}sourceModel:\s*slot\.collisionModel[\s\S]{0,220}targetModel:\s*target\.collisionModel/
  );
});

test("accepted visible contact stops contact approach and returns attacker before target hit completes", async () => {
  const calls = [];
  let releaseContact = null;

  const visuals = {
    playEventFor(slot, type) {
      calls.push(["play", slot, type]);
      return Promise.resolve({ status: "finished" });
    },
    playApproachFor(slot, mode, options) {
      calls.push(["approach", slot, mode]);
      releaseContact = options.onContact;
      return new Promise(() => {});
    },
    finishApproachAtContactFor(slot) {
      calls.push(["finish-contact", slot]);
      return Promise.resolve({ status: "finished" });
    },
    cancelFor(slot) {
      calls.push(["cancel", slot]);
    }
  };

  const contacts = [];
  const presenter = createCombatResolutionPresenter({
    visuals,
    onActionContact(contact) {
      contacts.push(contact);
      return { ok: true };
    }
  });

  presenter.presentRelease({
    action: {
      actionType: "skill",
      actorId: "player",
      targetId: "opponent",
      travelMs: 1500,
      skill: {
        id: "claw",
        name: "Griffe",
        form: "contact",
        approachMode: "ground"
      }
    },
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.equal(typeof releaseContact, "function");
  releaseContact({
    actorId: "player",
    targetId: "opponent"
  });

  assert.deepEqual(contacts, [
    {
      actorId: "player",
      targetId: "opponent",
      skillId: "claw"
    }
  ]);

  const result = presenter.presentOutcome({
    resolution: {
      ok: true,
      actionType: "skill",
      actorId: "player",
      targetId: "opponent",
      outcome: "hit",
      events: [
        {
          type: "skill-release",
          skillId: "claw",
          form: "contact",
          atMs: 0
        },
        {
          type: "skill-arrive",
          skillId: "claw",
          atMs: 420
        },
        {
          type: "hit",
          actorId: "opponent",
          hpBefore: 100,
          hpAfter: 80
        }
      ]
    },
    actorSlot: "player",
    targetSlot: "opponent"
  });

  await result.finished;

  assert.deepEqual(calls, [
    ["approach", "player", "ground"],
    ["finish-contact", "player"],
    ["play", "opponent", "hit"]
  ]);

  presenter.dispose();
});
