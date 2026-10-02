import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildHumanTacticalSkillEffectsV1,
  buildHumanSkillDraftV1
} from "../../src/ui/capture-editor-human-v2.js";

function debuffSkillFields() {
  return {
    id: "morsure-bourdon",
    name: "Morsure bourdon",
    description: "",
    requiredLevel: 1,
    usageScopes: ["capture", "combat"],
    loadoutSlot: "standard",
    category: "buff_debuff",
    form: "contact",
    element: "poison",
    approachMode: "ground",
    energyCost: 2,
    preparationMs: 300,
    travelMs: 250,
    recoveryMs: 200,
    cooldownMs: 1200,
    maxUsesPerCombat: null,
    activationRequirements: {
      mode: "all",
      conditions: []
    },
    reaction: {
      blockForms: [],
      reflectForms: [],
      immuneElements: [],
      counterForms: [],
      evadeForms: [],
      evadeApproaches: []
    },
    evasion: {
      window: null,
      incomingForms: []
    },
    projectileClash: {
      power: 0
    },
    effectTags: [],
    effects: [
      {
        kind: "apply_status",
        targetScope: "target",
        status: {
          id: "venin-bourdon",
          kind: "damage_over_time",
          polarity: "detrimental",
          durationSeconds: 6,
          stacking: "refresh",
          amount: 2,
          tickSeconds: 1,
          channel: null
        }
      }
    ],
    presentation: {}
  };
}

test("DoT can inherit the owning skill element when no override is selected", () => {
  const effects =
    buildHumanTacticalSkillEffectsV1(
      debuffSkillFields().effects,
      {
        defaultDamageChannel: "poison"
      }
    );

  assert.equal(
    effects[0].status.channel,
    "poison"
  );
});

test("skill draft resolves DoT 'same element' from SkillDefinition.element", () => {
  const draft =
    buildHumanSkillDraftV1(
      debuffSkillFields()
    );

  assert.equal(
    draft.definition.element,
    "poison"
  );
  assert.equal(
    draft.definition.effects[0]
      .status.channel,
    "poison"
  );
});

test("DoT editor reuses the canonical element selector instead of free text", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /tacticalDamageElementSelectV1\(\s*"skillStatusChannel"/
  );
  assert.match(
    source,
    /"Même élément que la capacité"/
  );
  assert.doesNotMatch(
    source,
    /tacticalTextInputV1\(\s*"skillStatusChannel"/
  );
});

test("apply-status tags are hidden from the simple editor but legacy tags are preserved", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /tacticalTextInputV1\(\s*"skillStatusTags"/
  );
  assert.match(
    source,
    /skillStatusStoredTags/
  );
  assert.match(
    source,
    /status\.tags/
  );
  assert.match(
    source,
    /Tags à cibler/,
    "cleanse/dispel selective tags must remain available"
  );
});
