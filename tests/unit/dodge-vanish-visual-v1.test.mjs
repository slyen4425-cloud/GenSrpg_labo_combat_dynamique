import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCombatVisualEvent
} from "../../src/contracts/combat-visual-event.js";
import {
  normalizeVisualActor
} from "../../src/contracts/visual-actor.js";
import {
  planAnimation
} from "../../src/core/animation/plan-animation.js";
import {
  createProfileRegistry
} from "../../src/core/profiles/profile-registry.js";
import {
  animationPlanToDomTimeline
} from "../../src/adapters/renderer/dom-keyframes.js";

const biped = JSON.parse(
  await readFile(
    "data/profiles/biped.profile.json",
    "utf8"
  )
);
const profiles = createProfileRegistry([biped]);

function actor() {
  return normalizeVisualActor({
    id: "player-actor",
    creatureId: "creature-test",
    profile: "biped",
    asset: "test.png",
    view: "player",
    facing: "right",
    position: { x: 0, y: 0 },
    scale: 1
  });
}

test("dodge visual path disappears for the Runtime-owned active window and restores the actor", () => {
  const current = actor();
  const durationMs = 500;
  const event = normalizeCombatVisualEvent({
    type: "dodge",
    actorId: current.id,
    metadata: {
      durationMs
    }
  });

  const plan = planAnimation({
    event,
    actor: current,
    profile: profiles.get("biped")
  });

  assert.equal(plan.eventType, "dodge");
  assert.deepEqual(
    plan.segments.map((segment) => segment.label),
    [
      "dodge-vanish",
      "dodge-hidden",
      "dodge-return"
    ]
  );
  assert.equal(
    plan.segments.reduce(
      (sum, segment) =>
        sum + segment.durationMs,
      0
    ),
    durationMs,
    "visual duration must be exactly the Runtime active window"
  );
  assert.equal(
    plan.segments[0].opacity,
    0
  );
  assert.equal(
    plan.segments[1].opacity,
    0
  );
  assert.equal(
    plan.segments.at(-1).opacity,
    1
  );

  const timeline =
    animationPlanToDomTimeline(
      plan,
      current
    );
  assert.equal(
    timeline.keyframes.some(
      (frame) =>
        Number(frame.opacity) === 0
    ),
    true
  );
  assert.equal(
    Number(
      timeline.keyframes.at(-1).opacity
    ),
    1
  );
  assert.equal(
    timeline.shadowKeyframes.some(
      (frame) =>
        Number(frame.opacity) === 0
    ),
    true,
    "the existing renderer must hide the ground shadow with the actor"
  );
});

test("dodge visual requires the positive Runtime active-window duration", () => {
  const current = actor();

  assert.throws(
    () =>
      planAnimation({
        event:
          normalizeCombatVisualEvent({
            type: "dodge",
            actorId: current.id,
            metadata: {
              durationMs: 0
            }
          }),
        actor: current,
        profile:
          profiles.get("biped")
      }),
    /durationMs/i
  );
});

test("combat Dodge activation projects the successful Runtime window to the existing visual owner", async () => {
  const source = await readFile(
    "src/ui/combat-2v2-test-ui.js",
    "utf8"
  );

  assert.match(
    source,
    /const visualDurationMs[\s\S]{0,300}result\.window\?\.remainingMs/
  );
  assert.match(
    source,
    /playEventFor\([\s\S]{0,500}["']dodge["'][\s\S]{0,700}durationMs\s*:\s*visualDurationMs/
  );

  for (const forbidden of [
    "dodgeVisualTimer",
    "setTimeout(() => dodge",
    "dodgeWindowTimer"
  ]) {
    assert.equal(
      source.includes(forbidden),
      false
    );
  }
});
