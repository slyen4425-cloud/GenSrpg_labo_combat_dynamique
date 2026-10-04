import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createCaptureCombatRosterControllerV1
} from "../../src/ui/capture-combat-roster-controller-v1.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

function fighter(id) {
  return {
    id,
    maxHp: 100,
    initialHp: 100,
    maxEnergy: 12,
    initialEnergy: 2,
    energyChargeAmount: 1,
    energyChargeIntervalMs: 1800,
    movementEnergyPerStep: 2,
    chargeTimeModifierPct: 0
  };
}

function localOnlyRosterHarness() {
  const session = createCombatSession({
    distance: "medium",
    fighters: [
      fighter("local-1"),
      fighter("enemy-1")
    ]
  });

  const controller =
    createCaptureCombatRosterControllerV1({
      session,
      rosterDefinition: {
        teams: {
          "local-1": {
            slotId: "local-1",
            activeMemberId: "member-local",
            members: [
              {
                id: "member-local",
                creatureId: "creature-local",
                displayName: "Local",
                fighterConfigId: "creature-local"
              }
            ]
          }
        }
      },
      fighterConfigs: {
        "creature-local": fighter(
          "creature-local"
        )
      },
      skillIdsByCreature: {
        "creature-local": ["claw"]
      },
      visuals: {
        setCreatureFor() {},
        setSlotVisible() {}
      }
    });

  return { session, controller };
}

test("Roster Controller declares only the actor slots it actually owns", () => {
  const { controller } =
    localOnlyRosterHarness();

  assert.equal(
    controller.ownsSlot("local-1"),
    true
  );
  assert.equal(
    controller.ownsSlot("enemy-1"),
    false
  );

  controller.dispose();
});

test("an unmanaged enemy slot must not be treated as recalled by Combat UI", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/combat-2v2-test-ui.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /!rosterController\.ownsSlot\(actorId\)\s*\|\|\s*rosterController\.isPresent\(actorId\)/
  );
  assert.doesNotMatch(
    source,
    /rosterController === null \|\| rosterController\.isPresent\(actorId\)/
  );
});
