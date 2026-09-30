import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCaptureDatabaseV1
} from "../../src/contracts/capture-database-v1.js";
import {
  exportCaptureDatabaseJsonV1,
  importCaptureDatabaseJsonV1
} from "../../src/adapters/input/capture/capture-database-transfer-v1.js";

function statRegistry() {
  return {
    schema: "capture-stat-registry-v1",
    stats: [
      {
        id: "physical",
        label: "Force",
        damageChannel: "physical",
        resistanceChannel: null,
        damagePctPerPoint: 2,
        resistancePctPerPoint: 0,
        chargeTimeReductionPctPerPoint: 0
      },
      {
        id: "defense",
        label: "Défense",
        damageChannel: null,
        resistanceChannel: null,
        damagePctPerPoint: 0,
        resistancePctPerPoint: 0,
        chargeTimeReductionPctPerPoint: 0,
        damageReductionPctPerPoint: 1
      }
    ]
  };
}

function progressionRules() {
  return {
    schema: "capture-progression-rules-v1",
    maxActiveSkills: 4,
    slotUnlockSchedule: [
      { level: 1, slots: 2 },
      { level: 5, slots: 3 },
      { level: 10, slots: 4 }
    ]
  };
}

function skill(id = "ice-burst") {
  return {
    schema: "capture-skill-editor-draft-v1",
    id,
    description: "Capacité tactique complète.",
    requiredLevel: 8,
    usageScopes: ["capture", "combat"],
    definition: {
      id,
      name: "Explosion glacée",
      category: "offensive",
      form: "projectile",
      element: "water",
      approachMode: "none",
      energyCost: 4,
      preparationMs: 900,
      travelMs: 650,
      recoveryMs: 450,
      cooldownMs: 3000,
      allowedDistances: ["short", "medium", "long"],
      targetRelations: ["enemy"],
      activationRequirements: {
        mode: "all",
        conditions: [
          {
            type: "combat_elapsed_ms",
            threshold: 30000
          }
        ]
      },
      projectileClash: {
        power: 2
      },
      effect: {
        damage: 0,
        heal: 0,
        stunMs: 0,
        interruptsPreparation: false,
        tags: []
      },
      effects: [
        {
          kind: "damage",
          targetScope: "all_enemies",
          amount: 8,
          channel: "water"
        },
        {
          kind: "apply_status",
          targetScope: "target",
          status: {
            id: "frozen-control",
            kind: "stun",
            polarity: "detrimental",
            durationModel: "time_ms",
            durationMs: 1200,
            stacking: "refresh",
            maxStacks: 1,
            tags: ["control"]
          }
        }
      ]
    },
    presentation: {
      id: "skill:" + id,
      version: 1,
      subjectType: "skill",
      subjectId: id,
      visual: {
        icon: {
          assetId: "capture:icon-ice-burst"
        },
        travel: {
          assetId: "capture:fx-ice-burst",
          attachment: "trajectory",
          trigger: "travel-start"
        },
        impact: {
          assetId: "capture:fx-ice-impact",
          attachment: "fixed-target",
          trigger: "impact"
        }
      },
      audio: {
        release: {
          assetId: "core:audio-ice-release",
          volume: 0.8,
          loop: false
        }
      }
    }
  };
}

function creature(id, evolutionTarget = null) {
  return {
    schema: "capture-creature-editor-draft-v3",
    id,
    displayName:
      id === "crea-alpha"
        ? "Alpha"
        : "Beta",
    description: "Créature exportable.",
    level: 10,
    sourceStats: {
      force: 10,
      agility: 11,
      intelligence: 8,
      spirit: 9,
      endurance: 12,
      initiative: 13
    },
    elements: ["water"],
    resistances: [
      {
        kind: "element:water",
        value: 35
      }
    ],
    capture: {
      capturable: true,
      captureRate: 50,
      spawnChance: 20,
      spawnTags: ["water"],
      evolution:
        evolutionTarget === null
          ? null
          : {
              enabled: true,
              condition: "level",
              level: 20,
              targetId: evolutionTarget
            }
    },
    combat: {
      maxHp: 45,
      initialHp: 45,
      maxEnergy: 10,
      initialEnergy: 3,
      energyChargeAmount: 1,
      energyChargeIntervalMs: 2000,
      movementEnergyPerStep: 2,
      chargeTimeModifierPct: 0
    },
    skillIds: ["ice-burst"],
    presentation: {
      id: "creature:" + id,
      version: 2,
      subjectType: "creature",
      subjectId: id,
      profileId: "quadruped",
      displayScale: 1.35,
      position: {
        player: { x: 0.15, y: 0.1 },
        opponent: { x: -0.1, y: 0.05 }
      },
      transformOrigin: {
        x: "50%",
        y: "85%"
      },
      visual: {
        front: {
          assetId: "capture:" + id + ":front"
        },
        back: {
          assetId: "capture:" + id + ":back"
        },
        icon: {
          assetId: "capture:" + id + ":icon"
        }
      },
      sockets: [
        {
          id: "mouth",
          label: "Bouche",
          front: { x: 0.7, y: 0.35 },
          back: { x: 0.3, y: 0.35 }
        }
      ],
      audio: {
        attack: "core:audio-attack",
        hit: "core:audio-hit",
        ko: "core:audio-ko"
      }
    }
  };
}

function statValues(creatureId) {
  return {
    schema: "capture-creature-stat-values-v1",
    creatureId,
    values: {
      physical: 10,
      defense: 5
    }
  };
}

function loadout(creatureId) {
  return {
    schema: "capture-active-skill-loadout-v1",
    creatureId,
    slots: [
      {
        id: "slot-1",
        skillId: "ice-burst"
      },
      {
        id: "slot-2",
        skillId: null
      },
      {
        id: "slot-3",
        skillId: null
      },
      {
        id: "slot-4",
        skillId: null
      }
    ]
  };
}

function database() {
  return {
    schema: "capture-database-v1",
    version: 1,
    statRegistry: statRegistry(),
    progressionRules: progressionRules(),
    creatures: [
      {
        draft: creature(
          "crea-alpha",
          "crea-beta"
        ),
        statValues:
          statValues("crea-alpha"),
        loadout:
          loadout("crea-alpha")
      },
      {
        draft:
          creature("crea-beta"),
        statValues:
          statValues("crea-beta"),
        loadout:
          loadout("crea-beta")
      }
    ],
    skills: [skill()],
    metadata: {
      producer: "unit-test",
      nested: {
        portable: true
      }
    }
  };
}

test("Capture Database V1 JSON round-trip is exact and idempotent", () => {
  const normalized =
    normalizeCaptureDatabaseV1(
      database()
    );
  const json =
    exportCaptureDatabaseJsonV1(
      normalized
    );
  const imported =
    importCaptureDatabaseJsonV1(
      json
    );

  assert.deepEqual(
    imported,
    normalized
  );
  assert.deepEqual(
    importCaptureDatabaseJsonV1(
      exportCaptureDatabaseJsonV1(
        imported
      )
    ),
    normalized
  );
});

test("Database preserves creature evolution presentation scale sockets audio stats and loadout", () => {
  const value =
    normalizeCaptureDatabaseV1(
      database()
    );
  const alpha =
    value.creatures[0];

  assert.equal(
    alpha.draft.capture.evolution.targetId,
    "crea-beta"
  );
  assert.equal(
    alpha.draft.presentation.displayScale,
    1.35
  );
  assert.equal(
    alpha.draft.presentation.sockets[0].id,
    "mouth"
  );
  assert.equal(
    alpha.draft.presentation.audio.attack,
    "core:audio-attack"
  );
  assert.equal(
    alpha.statValues.values.defense,
    5
  );
  assert.equal(
    alpha.loadout.slots[0].skillId,
    "ice-burst"
  );
});

test("Database preserves complete native skill semantics and presentation", () => {
  const value =
    normalizeCaptureDatabaseV1(
      database()
    );
  const draft=value.skills[0];

  assert.equal(draft.requiredLevel,8);
  assert.equal(
    draft.definition.activationRequirements.conditions[0].threshold,
    30000
  );
  assert.equal(
    draft.definition.projectileClash.power,
    2
  );
  assert.equal(
    draft.definition.effects[0].targetScope,
    "all_enemies"
  );
  assert.equal(
    draft.definition.effects[1].status.kind,
    "stun"
  );
  assert.equal(
    draft.presentation.visual.travel.assetId,
    "capture:fx-ice-burst"
  );
  assert.equal(
    draft.presentation.audio.release.assetId,
    "core:audio-ice-release"
  );
});

test("Database is editor data and never invents battle runtime topology", () => {
  const value =
    normalizeCaptureDatabaseV1(
      database()
    );

  for (const forbidden of [
    "battle",
    "teams",
    "actors",
    "rosters"
  ]) {
    assert.equal(
      forbidden in value,
      false
    );
  }
});

test("Database refuses invalid creature skill loadout and evolution references", () => {
  const missingSkill=database();
  missingSkill.skills=[];
  assert.throws(
    () =>
      normalizeCaptureDatabaseV1(
        missingSkill
      ),
    /skill|capacit/i
  );

  const badLoadout=database();
  badLoadout.creatures[0].loadout.slots[0].skillId =
    "unknown-skill";
  assert.throws(
    () =>
      normalizeCaptureDatabaseV1(
        badLoadout
      ),
    /skill|capacit/i
  );

  const badEvolution=database();
  badEvolution.creatures[0].draft.capture.evolution.targetId =
    "crea-missing";
  assert.throws(
    () =>
      normalizeCaptureDatabaseV1(
        badEvolution
      ),
    /evolution|creature/i
  );
});

test("Database refuses duplicate canonical ids and mismatched creature record ids", () => {
  const duplicate=database();
  duplicate.skills.push(
    skill("ice-burst")
  );
  assert.throws(
    () =>
      normalizeCaptureDatabaseV1(
        duplicate
      ),
    /duplicate.*skill/i
  );

  const mismatch=database();
  mismatch.creatures[0].statValues.creatureId =
    "crea-beta";
  assert.throws(
    () =>
      normalizeCaptureDatabaseV1(
        mismatch
      ),
    /statValues.*creatureId|match/i
  );
});

test("Database transfer rejects invalid JSON explicitly", () => {
  assert.throws(
    () =>
      importCaptureDatabaseJsonV1(
        "{invalid-json"
      ),
    /JSON|invalid/i
  );
});

test("Database contract and transfer stay independent from UI DOM storage network and Runtime", async () => {
  const sources=await Promise.all(
    [
      "../../src/contracts/capture-database-v1.js",
      "../../src/adapters/input/capture/capture-database-transfer-v1.js"
    ].map((relative)=>
      readFile(
        new URL(relative,import.meta.url),
        "utf8"
      )
    )
  );

  for(const source of sources){
    for(const forbidden of [
      "document.",
      "window.",
      "localStorage",
      "sessionStorage",
      "FileReader",
      "Blob(",
      "fetch(",
      "combat-runtime",
      "capture-editor-human"
    ]){
      assert.equal(
        source.includes(forbidden),
        false,
        "Database owner must not depend on "+forbidden
      );
    }
  }
});
