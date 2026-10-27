import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCombatVisualEvent
} from "../../src/contracts/combat-visual-event.js";
import {
  planAnimation
} from "../../src/core/animation/plan-animation.js";
import {
  createCombatResolutionPresenter
} from "../../src/adapters/renderer/combat-resolution-presenter.js";
import {
  importCaptureTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";

const actor = Object.freeze({
  id: "player",
  asset: "test",
  x: 0,
  y: 0,
  facing: "right",
  scale: 1,
  profile: "serpentine",
  state: "idle"
});

const profile = Object.freeze({
  id: "serpentine",
  idle: Object.freeze({ transformOrigin: { x: "50%", y: "94%" } }),
  attack: Object.freeze({}),
  hit: Object.freeze({}),
  ko: Object.freeze({}),
  specialMoves: Object.freeze({
    perspective: Object.freeze({
      perspectiveScaleStrength: 1.25,
      perspectiveScaleMin: 0.7,
      perspectiveScaleMax: 1.35
    })
  })
});

test("CombatVisualEvent accepts generic burrow-attack", () => {
  const event = normalizeCombatVisualEvent({
    type: "burrow-attack",
    actorId: "player",
    targetId: "opponent",
    metadata: {
      targetTranslateX: 180,
      targetTranslateY: -20,
      arenaHeight: 600,
      arenaExitTranslateY: -300,
      travelMs: 650
    }
  });

  assert.equal(event.type, "burrow-attack");
});

test("Animation Core burrow dives hides repositions below target and emerges exactly at Runtime travel time", () => {
  const plan = planAnimation({
    event: {
      type: "burrow-attack",
      actorId: "player",
      targetId: "opponent",
      intensity: 1,
      metadata: {
        targetTranslateX: 180,
        targetTranslateY: -20,
        arenaHeight: 600,
        arenaExitTranslateY: -300,
        travelMs: 650
      }
    },
    actor,
    profile
  });

  assert.deepEqual(
    plan.segments.map((segment) => segment.label),
    [
      "burrow-dive",
      "burrow-hidden",
      "burrow-emerge-impact",
      "burrow-home"
    ]
  );

  const [dive, hidden, emerge, home] =
    plan.segments;

  assert.ok(dive.transform.translateY > 0);
  assert.equal(dive.opacity, 0);

  assert.equal(hidden.opacity, 0);
  assert.equal(hidden.transform.translateX, 180);
  assert.ok(
    hidden.transform.translateY >
      -20,
    "hidden actor must be staged below target before emerging"
  );

  assert.equal(emerge.opacity, 1);
  assert.equal(emerge.transform.translateX, 180);
  assert.equal(emerge.transform.translateY, -20);
  assert.ok(
    hidden.transform.translateY >
      emerge.transform.translateY,
    "emergence must rise upward from below the target"
  );

  assert.equal(
    dive.durationMs +
      hidden.durationMs +
      emerge.durationMs,
    650
  );

  assert.deepEqual(
    {
      x: home.transform.translateX,
      y: home.transform.translateY,
      opacity: home.opacity
    },
    { x: 0, y: 0, opacity: 1 }
  );
});

test("authored Morsure de maree routes burrow through the presenter without DOM contact authority", async () => {
  const transfer = importCaptureTransferJsonV1(
    await readFile(
      new URL(
        "../../data/capture/showcase/cap_water_atk_2.capture-skill-transfer-v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const skill = transfer.value.draft.definition;

  let approach = null;
  let contactCount = 0;
  const presenter =
    createCombatResolutionPresenter({
      visuals: {
        playEventFor() {
          return Promise.resolve({
            status: "finished"
          });
        },
        playApproachFor(
          slot,
          approachMode,
          options
        ) {
          approach = {
            slot,
            approachMode,
            options
          };
          return Promise.resolve({
            status: "finished"
          });
        },
        cancelFor() {}
      },
      onActionContact() {
        contactCount += 1;
      }
    });

  presenter.presentRelease({
    action: {
      actionType: "skill",
      skill,
      travelMs: skill.travelMs
    },
    actorSlot: "player",
    targetSlot: "opponent"
  });

  assert.ok(approach);
  assert.equal(approach.slot, "player");
  assert.equal(
    approach.approachMode,
    "burrow"
  );
  assert.equal(
    approach.options.travelMs,
    650
  );
  assert.equal(
    approach.options.onContact,
    null,
    "burrow must never delegate impact timing to visible DOM contact"
  );
  assert.equal(contactCount, 0);

  presenter.dispose();
});

test("Visual Controller declares burrow as a native approach and suppresses collision watching for it", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/demo-app.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /\["ground",\s*"teleport",\s*"aerial",\s*"burrow"\]/
  );
  assert.match(
    source,
    /burrow-attack/
  );
  assert.match(
    source,
    /approachMode\s*!==\s*"burrow"[\s\S]{0,180}typeof onContact === "function"/
  );
});
