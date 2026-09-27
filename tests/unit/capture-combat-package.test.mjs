import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CAPTURE_COMBAT_PACKAGE_SCHEMA,
  CAPTURE_COMBAT_PACKAGE_VERSION,
  normalizeCaptureCombatPackage
} from "../../src/contracts/capture-combat-package.js";

function packageFixture() {
  return {
    schema: "capture-combat-package",
    version: 1,
    metadata: {
      sourceId: "capture-editor-demo",
      sourceLabel: "Capture editor preview"
    },
    creatures: [
      {
        id: "maraileron",
        displayName: "Maraileron",
        fighterConfigId: "maraileron",
        fighterConfig: {
          id: "maraileron",
          maxHp: 100,
          initialHp: 100,
          maxEnergy: 10,
          initialEnergy: 0,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2000,
          movementEnergyPerStep: 1,
          chargeTimeModifierPct: 0
        },
        skillIds: ["fireball"]
      },
      {
        id: "braisombre",
        displayName: "Braisombre",
        fighterConfigId: "braisombre",
        fighterConfig: {
          id: "braisombre",
          maxHp: 120,
          initialHp: 120,
          maxEnergy: 10,
          initialEnergy: 0,
          energyChargeAmount: 1,
          energyChargeIntervalMs: 2000,
          movementEnergyPerStep: 1,
          chargeTimeModifierPct: 0
        },
        skillIds: ["fireball"]
      }
    ],
    skills: [
      {
        id: "fireball",
        name: "Boule de feu",
        category: "offensive",
        form: "projectile",
        element: "fire",
        approachMode: "none",
        energyCost: 3,
        preparationMs: 2000,
        travelMs: 700,
        recoveryMs: 700,
        allowedDistances: ["short", "medium", "long"],
        targetRelations: ["enemy"],
        projectileClash: {
          mode: "mutual_cancel",
          group: "fire-orb",
          interactsWith: ["fire-orb"]
        },
        effect: {
          damage: 30,
          tags: ["burn-capable"]
        }
      }
    ],
    roster: {
      teams: {
        player: {
          slotId: "player",
          activeMemberId: "player-marai",
          members: [
            {
              id: "player-marai",
              creatureId: "maraileron",
              displayName: "Maraileron",
              fighterConfigId: "maraileron"
            }
          ]
        },
        opponent: {
          slotId: "opponent",
          activeMemberId: "opponent-drakon",
          members: [
            {
              id: "opponent-drakon",
              creatureId: "braisombre",
              displayName: "Braisombre",
              fighterConfigId: "braisombre"
            }
          ]
        }
      }
    },
    battleFormat: {
      id: "capture-preview-1v1",
      localActorId: "player",
      teams: {
        players: ["player"],
        enemies: ["opponent"]
      },
      actors: [
        {
          actorId: "player",
          teamId: "players",
          creatureId: "maraileron",
          displayName: "Maraileron",
          fighterConfigId: "maraileron",
          controllerId: "human-local"
        },
        {
          actorId: "opponent",
          teamId: "enemies",
          creatureId: "braisombre",
          displayName: "Braisombre",
          fighterConfigId: "braisombre",
          controllerId: "ai-enemy"
        }
      ]
    },
    presentation: {
      creatures: {
        maraileron: {
          profileId: "floating",
          frontAssetId: "pack:capture:creature-maraileron-front-01",
          iconAssetId: "pack:capture:creature-maraileron-icon-01"
        }
      },
      skills: {
        fireball: {
          iconAssetId: "pack:capture:icon-skill-fireball-01",
          castFxAssetId: "pack:capture:sprite-fireball-cast-01",
          travelFxAssetId: "pack:capture:sprite-fireball-travel-01",
          impactFxAssetId: "pack:capture:sprite-fireball-impact-01",
          castSoundAssetId: "gensrpg:sound:fire-cast-01",
          impactSoundAssetId: "gensrpg:sound:melee-impact-01",
          castAnchor: "mouth",
          travelSourceAnchor: "mouth",
          castLayer: "front"
        }
      }
    }
  };
}

test("CaptureCombatPackageV1 normalizes a portable editor package", () => {
  const normalized = normalizeCaptureCombatPackage(packageFixture());

  assert.equal(normalized.schema, CAPTURE_COMBAT_PACKAGE_SCHEMA);
  assert.equal(normalized.version, CAPTURE_COMBAT_PACKAGE_VERSION);
  assert.equal(normalized.creatures.length, 2);
  assert.equal(normalized.skills.length, 1);
  assert.equal(normalized.skills[0].projectileClash.mode, "mutual_cancel");
  assert.deepEqual(
    normalized.skills[0].targetRelations,
    ["enemy"],
    "SkillDefinition normalization must remain the gameplay authority"
  );
  assert.equal(normalized.roster.teams.player.activeMemberId, "player-marai");
  assert.equal(normalized.battleFormat.teamOf("opponent"), "enemies");
  assert.equal(
    normalized.presentation.skills.fireball.travelFxAssetId,
    "pack:capture:sprite-fireball-travel-01"
  );
});

test("CaptureCombatPackageV1 keeps creature presentation in one top-level owner", () => {
  const input = packageFixture();
  input.creatures[0].presentation = {
    iconAssetId: "pack:capture:duplicate-owner"
  };

  assert.throws(
    () => normalizeCaptureCombatPackage(input),
    /use presentation\.creatures/
  );
});

test("CaptureCombatPackageV1 rejects duplicate creatures and skills", () => {
  const duplicateCreature = packageFixture();
  duplicateCreature.creatures.push({
    ...duplicateCreature.creatures[0],
    fighterConfigId: "maraileron-copy",
    fighterConfig: {
      ...duplicateCreature.creatures[0].fighterConfig,
      id: "maraileron-copy"
    }
  });
  assert.throws(
    () => normalizeCaptureCombatPackage(duplicateCreature),
    /duplicate creature id/
  );

  const duplicateSkill = packageFixture();
  duplicateSkill.skills.push({ ...duplicateSkill.skills[0] });
  assert.throws(
    () => normalizeCaptureCombatPackage(duplicateSkill),
    /duplicate skill id/
  );
});

test("CaptureCombatPackageV1 rejects unknown creature skill references", () => {
  const input = packageFixture();
  input.creatures[0].skillIds = ["missing-skill"];

  assert.throws(
    () => normalizeCaptureCombatPackage(input),
    /references unknown skill/
  );
});

test("CaptureCombatPackageV1 delegates skill semantics to SkillDefinition", () => {
  const input = packageFixture();
  input.skills[0].form = "unknown-form";

  assert.throws(
    () => normalizeCaptureCombatPackage(input),
    /Unsupported skill form/
  );
});

test("CaptureCombatPackageV1 rejects roster references outside package ownership", () => {
  const unknownCreature = packageFixture();
  unknownCreature.roster.teams.player.members[0].creatureId = "missing";
  assert.throws(
    () => normalizeCaptureCombatPackage(unknownCreature),
    /references unknown creature/
  );

  const mismatchedConfig = packageFixture();
  mismatchedConfig.roster.teams.player.members[0].fighterConfigId =
    "braisombre";
  assert.throws(
    () => normalizeCaptureCombatPackage(mismatchedConfig),
    /must match creature maraileron/
  );
});

test("CaptureCombatPackageV1 delegates battle shape to BattleFormatDefinition", () => {
  const input = packageFixture();
  input.battleFormat.localActorId = "missing";

  assert.throws(
    () => normalizeCaptureCombatPackage(input),
    /localActorId must reference a declared actor/
  );
});

test("CaptureCombatPackageV1 accepts stable asset IDs and rejects URLs or paths", () => {
  const urlInput = packageFixture();
  urlInput.presentation.skills.fireball.iconAssetId =
    "https://example.test/fireball.png";
  assert.throws(
    () => normalizeCaptureCombatPackage(urlInput),
    /stable assetId/
  );

  const pathInput = packageFixture();
  pathInput.presentation.creatures.maraileron.frontAssetId =
    "assets/capture/maraileron.png";
  assert.throws(
    () => normalizeCaptureCombatPackage(pathInput),
    /stable assetId/
  );
});

test("CaptureCombatPackageV1 produces immutable normalized structures", () => {
  const normalized = normalizeCaptureCombatPackage(packageFixture());

  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(Object.isFrozen(normalized.creatures), true);
  assert.equal(Object.isFrozen(normalized.creatures[0]), true);
  assert.equal(Object.isFrozen(normalized.creatures[0].fighterConfig), true);
  assert.equal(Object.isFrozen(normalized.skills), true);
  assert.equal(Object.isFrozen(normalized.roster), true);
  assert.equal(Object.isFrozen(normalized.roster.teams), true);
  assert.equal(Object.isFrozen(normalized.presentation.skills), true);
});

test("CaptureCombatPackageV1 source stays independent from GenSrpG runtime surfaces", async () => {
  const source = await readFile(
    "src/contracts/capture-combat-package.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /Zombicide-40k|\bwindow\b|\bdocument\b|localStorage|sessionStorage|indexedDB|MutationObserver|XMLHttpRequest|\bfetch\s*\(/
  );
  assert.doesNotMatch(
    source,
    /https?:\/\/|\.\.\/\.\.\/.*Zombicide|assets\/gensrpg\/capture/
  );
});
