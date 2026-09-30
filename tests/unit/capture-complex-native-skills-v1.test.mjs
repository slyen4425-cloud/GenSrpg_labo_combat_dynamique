import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CAPTURE_USED_ABILITY_CATALOG_V2
} from "../../src/catalogs/capture-used-ability-catalog-v2.js";
import {
  capturePortableNativeSkillDraftsV1
} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {
  captureComplexSkillMigrationEntriesV1
} from "../../src/adapters/input/capture/capture-complex-skill-migration-v1.js";
import {
  createCombatSession
} from "../../src/core/combat/combat-session.js";

test("complex native catalog exposes exactly 33 validated drafts", async () => {
  const {
    captureComplexNativeSkillDraftsV1
  } = await import(
    "../../src/catalogs/capture-complex-native-skill-catalog-v1.js"
  );

  const drafts =
    captureComplexNativeSkillDraftsV1();

  assert.equal(drafts.length, 33);
  assert.equal(
    new Set(drafts.map((draft) => draft.id)).size,
    33
  );
  for (const draft of drafts) {
    assert.equal(
      draft.schema,
      "capture-skill-editor-draft-v1"
    );
    assert.equal(draft.definition.id, draft.id);
  }
});

test("70 portable plus 33 complex native drafts equal the 103 used Capture abilities exactly", async () => {
  const {
    captureComplexNativeSkillDraftsV1
  } = await import(
    "../../src/catalogs/capture-complex-native-skill-catalog-v1.js"
  );

  const portable =
    capturePortableNativeSkillDraftsV1();
  const complex =
    captureComplexNativeSkillDraftsV1();
  const ids = [
    ...portable,
    ...complex
  ].map((draft) => draft.id);

  assert.equal(ids.length, 103);
  assert.equal(new Set(ids).size, 103);
  assert.deepEqual(
    [...ids].sort(),
    CAPTURE_USED_ABILITY_CATALOG_V2.abilities
      .map((ability) => ability.id)
      .sort()
  );
});

test("complex native drafts consume migration tacticalEffects without duplicate legacy damage/heal ownership", async () => {
  const {
    captureComplexNativeSkillDraftsV1
  } = await import(
    "../../src/catalogs/capture-complex-native-skill-catalog-v1.js"
  );

  const draftById = new Map(
    captureComplexNativeSkillDraftsV1().map(
      (draft) => [draft.id, draft]
    )
  );
  const migrationById = new Map(
    captureComplexSkillMigrationEntriesV1().map(
      (entry) => [entry.id, entry]
    )
  );

  for (const [id, draft] of draftById) {
    assert.deepEqual(
      draft.definition.effects,
      migrationById.get(id).tacticalEffects,
      id
    );
    assert.equal(draft.definition.effect.damage, 0);
    assert.equal(draft.definition.effect.heal, 0);
    assert.equal(draft.presentation, null);
  }
});

test("complex native form policy uses structural legacy tokens only", async () => {
  const {
    captureComplexNativeSkillDraftsV1
  } = await import(
    "../../src/catalogs/capture-complex-native-skill-catalog-v1.js"
  );
  const byId = new Map(
    captureComplexNativeSkillDraftsV1().map(
      (draft) => [draft.id, draft]
    )
  );

  assert.equal(
    byId.get("lib_lifesteal_strike").definition.form,
    "contact"
  );
  assert.equal(
    byId.get("lib_lifesteal_strike").definition.approachMode,
    "ground"
  );
  assert.equal(
    byId.get("lib_quake").definition.form,
    "area"
  );
  assert.equal(
    byId.get("lib_regen").definition.form,
    "self"
  );
  assert.equal(
    byId.get("lib_heat_wave").definition.form,
    "projectile"
  );
});

test("complex native drafts keep explicit historical identity and neutral missing dynamic timing", async () => {
  const {
    captureComplexNativeSkillDraftsV1
  } = await import(
    "../../src/catalogs/capture-complex-native-skill-catalog-v1.js"
  );
  const sourceById = new Map(
    CAPTURE_USED_ABILITY_CATALOG_V2.abilities.map(
      (ability) => [ability.id, ability]
    )
  );

  for (const draft of captureComplexNativeSkillDraftsV1()) {
    const source = sourceById.get(draft.id);
    assert.equal(
      draft.definition.name,
      source.name
    );
    assert.equal(
      draft.description,
      source.desc
    );
    assert.equal(
      draft.requiredLevel,
      source.requiredLevel
    );
    assert.equal(
      draft.definition.energyCost,
      Number(source.activeMeta.manaCost)
    );
    assert.equal(draft.definition.preparationMs, 0);
    assert.equal(draft.definition.travelMs, 0);
    assert.equal(draft.definition.recoveryMs, 0);
    assert.equal(draft.definition.cooldownMs, 0);
  }
});

test("a migrated complex native status skill executes through real CombatSession", async () => {
  const {
    captureComplexNativeSkillDraftsV1
  } = await import(
    "../../src/catalogs/capture-complex-native-skill-catalog-v1.js"
  );
  const heat = captureComplexNativeSkillDraftsV1()
    .find((draft) => draft.id === "lib_heat_wave");

  const session = createCombatSession({
    fighters: [
      {
        id: "a",
        maxHp: 100,
        initialHp: 100,
        maxEnergy: 10,
        initialEnergy: 10,
        statValuesById: {
          defense: 10
        },
        statEffectRulesById: {
          defense: {
            damageChannel: null,
            resistanceChannel: null,
            damagePctPerPoint: 0,
            resistancePctPerPoint: 0,
            chargeTimeReductionPctPerPoint: 0,
            damageReductionPctPerPoint: 1
          }
        }
      },
      {
        id: "b",
        maxHp: 100,
        initialHp: 100,
        maxEnergy: 10,
        initialEnergy: 10,
        statValuesById: {
          defense: 10
        },
        statEffectRulesById: {
          defense: {
            damageChannel: null,
            resistanceChannel: null,
            damagePctPerPoint: 0,
            resistancePctPerPoint: 0,
            chargeTimeReductionPctPerPoint: 0,
            damageReductionPctPerPoint: 1
          }
        }
      }
    ]
  });

  const result = session.useSkill({
    actorId: "a",
    targetId: "b",
    skill: heat.definition
  });

  assert.equal(result.ok, true);
  assert.equal(
    session.snapshot().fighters.b.statusEffects[0]
      .definition.statId,
    "defense"
  );
  assert.equal(
    session.snapshot().fighters.b.statusEffects[0]
      .definition.percent,
    -30
  );
});

test("Human Editor hydrates complex native Capture drafts in addition to the portable 70", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /captureComplexNativeSkillDraftsV1/
  );
  assert.match(
    source,
    /103 capacités Capture natives/
  );
});
