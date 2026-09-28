import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildCoop2v2AiControllerSpecs
} from "../../src/ui/combat-2v2-test-ui.js";
import {
  normalizeBattleFormatDefinition
} from "../../src/contracts/battle-format-definition.js";

const format = normalizeBattleFormatDefinition({
  id: "arbitrary-2v2",
  localActorId: "hero-local",
  teams: {
    blue: ["hero-local", "friend-z"],
    red: ["foe-x", "foe-y"]
  },
  actors: [
    {
      actorId: "hero-local",
      teamId: "blue",
      creatureId: "crea-local",
      displayName: "Local",
      fighterConfigId: "crea-local",
      controllerId: "human-local"
    },
    {
      actorId: "friend-z",
      teamId: "blue",
      creatureId: "crea-friend",
      displayName: "Friend",
      fighterConfigId: "crea-friend",
      controllerId: "ai-ally-custom"
    },
    {
      actorId: "foe-x",
      teamId: "red",
      creatureId: "crea-x",
      displayName: "Foe X",
      fighterConfigId: "crea-x",
      controllerId: "ai-enemy-custom"
    },
    {
      actorId: "foe-y",
      teamId: "red",
      creatureId: "crea-y",
      displayName: "Foe Y",
      fighterConfigId: "crea-y",
      controllerId: "ai-enemy-custom"
    }
  ]
});

const skillIdsByActor = {
  "hero-local": ["local-a", "local-b"],
  "friend-z": ["ally-a"],
  "foe-x": ["enemy-x-a", "enemy-x-b"],
  "foe-y": ["enemy-y-a"]
};

test("2v2 AI controller specs come from controllerId, teams and skillIdsByActor", () => {
  const specs = buildCoop2v2AiControllerSpecs({
    format,
    skillIdsByActor
  });

  assert.deepEqual(
    specs.map((item) => item.actorId),
    ["friend-z", "foe-x", "foe-y"]
  );

  assert.deepEqual(specs[0], {
    actorId: "friend-z",
    targetIds: ["foe-x", "foe-y"],
    skillIds: ["ally-a"]
  });

  assert.deepEqual(specs[1], {
    actorId: "foe-x",
    targetIds: ["hero-local", "friend-z"],
    skillIds: ["enemy-x-a", "enemy-x-b"]
  });

  assert.deepEqual(specs[2], {
    actorId: "foe-y",
    targetIds: ["hero-local", "friend-z"],
    skillIds: ["enemy-y-a"]
  });

  assert.equal(
    specs.some((item) => item.actorId === format.localActorId),
    false
  );
});

test("2v2 AI controller specs reject a missing actor loadout instead of inventing skills", () => {
  const broken = { ...skillIdsByActor };
  delete broken["foe-y"];

  assert.throws(
    () => buildCoop2v2AiControllerSpecs({
      format,
      skillIdsByActor: broken
    }),
    /skillIdsByActor.*foe-y|missing.*foe-y/i
  );
});

test("2v2 runtime no longer hardcodes demo actor ids or skill lists inside controller creation", async () => {
  const source = await readFile(
    "src/ui/combat-2v2-test-ui.js",
    "utf8"
  );

  assert.doesNotMatch(
    source,
    /createBattleActorAiController\(\{[\s\S]{0,300}actorId:\s*"ally"/
  );
  assert.doesNotMatch(
    source,
    /createBattleActorAiController\(\{[\s\S]{0,300}actorId:\s*"opponent"/
  );
  assert.doesNotMatch(
    source,
    /skillIds:\s*\["claw",\s*"fireball"/
  );
  assert.match(
    source,
    /buildCoop2v2AiControllerSpecs/
  );
  assert.match(
    source,
    /skillIdsByActor\[format\.localActorId\]/
  );
});
