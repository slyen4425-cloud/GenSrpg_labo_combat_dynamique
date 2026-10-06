import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureCreatureEditorDraftV3
} from "../../src/contracts/capture-creature-editor-draft-v3.js";
import {
  adaptCaptureCreatureToFighterConfig
} from "../../src/adapters/input/capture/capture-creature-to-fighter-config.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";
import {
  effectiveApproachTimingMs
} from "../../src/core/combat/combat-timing.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";

const transfer = JSON.parse(
  await readFile(
    new URL(
      "../../data/capture/showcase/crea-loup.capture-creature-transfer-v1.json",
      import.meta.url
    ),
    "utf8"
  )
);

function draftWithTempo(value) {
  return {
    ...transfer.draft,
    combat: {
      ...transfer.draft.combat,
      approachTimeModifierPct: value
    }
  };
}

function skill(approachMode = "ground") {
  return normalizeSkillDefinition({
    id: "mobility-test-" + approachMode,
    name: "Mobility test " + approachMode,
    category: "offensive",
    form: "contact",
    element: null,
    approachMode,
    energyCost: 0,
    preparationMs: 0,
    travelMs: 1000,
    recoveryMs: 0,
    cooldownMs: 0,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    effect: {
      damage: 1,
      heal: 0,
      interruptsPreparation: false,
      stunMs: 0,
      tags: []
    }
  });
}

test("Capture creature draft and adapter preserve explicit approachTimeModifierPct", () => {
  const normalized =
    normalizeCaptureCreatureEditorDraftV3(
      draftWithTempo(-25)
    );

  assert.equal(
    normalized.combat.approachTimeModifierPct,
    -25
  );

  const fighter =
    adaptCaptureCreatureToFighterConfig(
      normalized
    );

  assert.equal(
    fighter.approachTimeModifierPct,
    -25
  );

  const invalid = draftWithTempo(
    Number.POSITIVE_INFINITY
  );
  assert.throws(
    () =>
      normalizeCaptureCreatureEditorDraftV3(
        invalid
      ),
    /approachTimeModifierPct/
  );
});

test("fighter permanent mobility tempo modifies ground aerial and burrow action travel without mutating skill author travelMs", () => {
  for (const approachMode of [
    "ground",
    "aerial",
    "burrow"
  ]) {
    const fast =
      adaptCaptureCreatureToFighterConfig(
        normalizeCaptureCreatureEditorDraftV3(
          draftWithTempo(-25)
        ),
        {
          fighterId: "fast"
        }
      );

    const session = createCombatSession({
      distance: "short",
      fighters: [
        {
          ...fast,
          maxEnergy: 10,
          initialEnergy: 10
        },
        {
          ...fast,
          id: "target",
          approachTimeModifierPct: 0,
          maxEnergy: 10,
          initialEnergy: 10
        }
      ]
    });

    const authoredSkill =
      skill(approachMode);
    const started = session.startSkill({
      actorId: "fast",
      targetId: "target",
      skill: authoredSkill
    });

    assert.equal(started.ok, true);
    assert.equal(
      started.action.travelMs,
      750,
      approachMode
    );
    assert.equal(
      authoredSkill.travelMs,
      1000,
      "author travelMs must remain unchanged"
    );
  }
});

test("slow permanent mobility tempo increases approach duration", () => {
  const slow =
    adaptCaptureCreatureToFighterConfig(
      normalizeCaptureCreatureEditorDraftV3(
        draftWithTempo(50)
      ),
      {
        fighterId: "slow"
      }
    );

  const session = createCombatSession({
    distance: "short",
    fighters: [
      {
        ...slow,
        maxEnergy: 10,
        initialEnergy: 10
      },
      {
        ...slow,
        id: "target",
        approachTimeModifierPct: 0,
        maxEnergy: 10,
        initialEnergy: 10
      }
    ]
  });

  const started = session.startSkill({
    actorId: "slow",
    targetId: "target",
    skill: skill("ground")
  });

  assert.equal(started.ok, true);
  assert.equal(started.action.travelMs, 1500);
});

test("permanent mobility tempo and temporary approach status share one additive timing calculation", () => {
  const result = effectiveApproachTimingMs({
    baseMs: 1000,
    approachMode: "ground",
    permanentPct: -20,
    statusEffects: [
      {
        definition: {
          id: "slow",
          kind: "approach_time_modifier",
          modifierPct: 50,
          durationModel: "time_ms"
        },
        appliedAtMs: 0,
        expiresAtMs: 5000,
        nextTickAtMs: null,
        remainingActionEnds: null,
        sourceActorId: "target",
        sourceSkillId: "slow",
        stacks: 1,
        shieldRemaining: null
      }
    ],
    atMs: 1000,
    speedMultiplier: 1
  });

  assert.equal(result, 1300);
});

test("teleport ignores locomotion tempo because it is not a travelled approach", () => {
  assert.equal(
    effectiveApproachTimingMs({
      baseMs: 1000,
      approachMode: "teleport",
      permanentPct: 50,
      statusEffects: [],
      atMs: 0,
      speedMultiplier: 1
    }),
    1000
  );
});

test("missing mobility tempo remains zero for legacy fighter configs", () => {
  const legacy = adaptCaptureCreatureToFighterConfig(
    normalizeCaptureCreatureEditorDraftV3(
      transfer.draft
    ),
    {
      fighterId: "legacy"
    }
  );

  const session = createCombatSession({
    distance: "short",
    fighters: [
      {
        ...legacy,
        maxEnergy: 10,
        initialEnergy: 10
      },
      {
        ...legacy,
        id: "target",
        maxEnergy: 10,
        initialEnergy: 10
      }
    ]
  });

  assert.equal(
    session.snapshot().fighters.legacy
      .approachTimeModifierPct,
    0
  );

  const started = session.startSkill({
    actorId: "legacy",
    targetId: "target",
    skill: skill("ground")
  });

  assert.equal(started.action.travelMs, 1000);
});
