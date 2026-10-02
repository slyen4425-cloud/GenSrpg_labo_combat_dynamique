import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  adaptCaptureCombatExportStackV1
} from "../../src/adapters/input/capture/capture-export-adapter-stack-v1.js";
import {
  loadCoop2v2CombatSource
} from "../../src/ui/combat-2v2-test-ui.js";
import {
  normalizeSkillDefinition
} from "../../src/contracts/skill-definition.js";

function nativeSkill(id = "zone-fire") {
  return {
    id,
    name: "Tempête test",
    category: "offensive",
    form: "area",
    loadoutSlot: "ultimate",
    element: "fire",
    approachMode: "none",
    energyCost: 5,
    preparationMs: 2000,
    travelMs: 0,
    recoveryMs: 0,
    cooldownMs: 3500,
    maxUsesPerCombat: 6,
    allowedDistances: ["short", "medium", "long"],
    targetRelations: ["enemy"],
    activationRequirements: {
      mode: "all",
      conditions: [
        {
          type: "combat_elapsed_ms",
          threshold: 25000
        }
      ]
    },
    effect: {
      damage: 0
    },
    effects: [
      {
        kind: "persistent_zone",
        targetScope: "target",
        zoneId: "fire-zone",
        radius: "medium",
        durationMs: 7000,
        tickIntervalMs: 1000,
        reactivation: "reinforce",
        maxActivations: 3,
        radiusGrowthSteps: 2,
        tickEffect: {
          kind: "damage",
          targetScope: "all_enemies",
          amount: 5,
          channel: "fire"
        }
      }
    ]
  };
}

function exportedCapture() {
  return {
    schema: "capture-combat-export-v1",
    battle: {
      id: "details-test",
      localActorId: "local",
      skillSpeedMultiplier: 1
    },
    teams: {
      local: ["local"],
      enemy: ["enemy"]
    },
    actors: [
      {
        actorId: "local",
        teamId: "local",
        creatureId: "local-creature",
        displayName: "Locale",
        controllerId: "human-local"
      },
      {
        actorId: "enemy",
        teamId: "enemy",
        creatureId: "enemy-creature",
        displayName: "Ennemie",
        controllerId: "ai-enemy"
      }
    ],
    creatures: [
      {
        id: "local-creature",
        displayName: "Locale",
        combat: {
          maxHp: 100,
          maxEnergy: 10,
          initialEnergy: 10
        },
        elements: [],
        resistances: [],
        skillIds: ["zone-fire"],
        presentationId: null,
        metadata: {}
      },
      {
        id: "enemy-creature",
        displayName: "Ennemie",
        combat: {
          maxHp: 100,
          maxEnergy: 10,
          initialEnergy: 10
        },
        elements: [],
        resistances: [],
        skillIds: ["zone-fire"],
        presentationId: null,
        metadata: {}
      }
    ],
    skills: [
      {
        id: "zone-fire",
        definition: nativeSkill(),
        presentationId: null,
        metadata: {
          editor: {
            description:
              "Crée une tempête de flammes persistante.",
            requiredLevel: 20,
            usageScopes: ["capture", "combat"]
          }
        }
      }
    ],
    rosters: [],
    presentation: {},
    metadata: {}
  };
}

test("Capture native combat adapter transports editor skill metadata without changing SkillDefinition", () => {
  const adapted =
    adaptCaptureCombatExportStackV1(
      exportedCapture()
    );

  assert.deepEqual(
    adapted.skillMetadata["zone-fire"],
    {
      description:
        "Crée une tempête de flammes persistante.",
      requiredLevel: 20
    }
  );

  assert.equal(
    Object.hasOwn(
      adapted.skills["zone-fire"],
      "requiredLevel"
    ),
    false
  );
  assert.equal(
    Object.hasOwn(
      adapted.skills["zone-fire"],
      "description"
    ),
    false
  );
});

test("2v2 native source keeps skill metadata beside normalized combat skills", async () => {
  const adapted =
    adaptCaptureCombatExportStackV1(
      exportedCapture()
    );
  const source =
    await loadCoop2v2CombatSource({
      nativeCombatSource: adapted,
      fetchImpl: async () => {
        throw new Error("must not fetch");
      }
    });

  assert.deepEqual(
    source.skillMetadataById["zone-fire"],
    {
      description:
        "Crée une tempête de flammes persistante.",
      requiredLevel: 20
    }
  );
  assert.equal(
    source.skillsById["zone-fire"].name,
    "Tempête test"
  );
});

test("combat skill detail formatter derives readable conditions and persistent-zone effects from real data", async () => {
  const {
    buildCombatSkillDetailsV1
  } = await import(
    "../../src/adapters/renderer/combat-skill-details-v1.js"
  );

  const details =
    buildCombatSkillDetailsV1({
      skill:
        normalizeSkillDefinition(
          nativeSkill()
        ),
      metadata: {
        description:
          "Crée une tempête de flammes persistante.",
        requiredLevel: 20
      }
    });

  assert.equal(details.name, "Tempête test");
  assert.equal(
    details.description,
    "Crée une tempête de flammes persistante."
  );
  assert.equal(details.requiredLevel, 20);
  assert.equal(details.slotLabel, "Ultime");
  assert.match(
    details.conditions.join(" "),
    /25 s de combat/i
  );
  assert.match(
    details.effects.join(" "),
    /5 dégâts/i
  );
  assert.match(
    details.effects.join(" "),
    /toutes les 1 s/i
  );
  assert.match(
    details.effects.join(" "),
    /pendant 7 s/i
  );
  assert.match(
    details.effects.join(" "),
    /3 activations/i
  );
  assert.deepEqual(
    details.facts.map((entry) => entry.id),
    [
      "level",
      "slot",
      "energy",
      "preparation",
      "cooldown",
      "uses",
      "targets"
    ]
  );
});

test("combat preview hosts expose a details panel and the UI keeps info interaction separate from skill launch", async () => {
  const [standaloneHtml, editorHtml, source] =
    await Promise.all([
      readFile(
        new URL(
          "../../examples/dom-demo/coop-2v2.html",
          import.meta.url
        ),
        "utf8"
      ),
      readFile(
        new URL(
          "../../examples/dom-demo/capture-editor-v2.html",
          import.meta.url
        ),
        "utf8"
      ),
      readFile(
        new URL(
          "../../src/ui/combat-2v2-test-ui.js",
          import.meta.url
        ),
        "utf8"
      )
    ]);

  assert.match(
    standaloneHtml,
    /data-combat-skill-details/
  );
  assert.match(
    editorHtml,
    /data-combat-skill-details/
  );
  assert.match(
    source,
    /data-combat-skill-info/
  );
  assert.match(
    source,
    /pointerenter/
  );
  assert.match(
    source,
    /focus/
  );
  assert.match(
    source,
    /buildCombatSkillDetailsV1/
  );
  assert.match(
    source,
    /runtime\.startSkill/
  );
});
