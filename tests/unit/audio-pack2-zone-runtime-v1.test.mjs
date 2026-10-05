import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeSkillPresentationBindingV1
} from "../../src/contracts/skill-presentation-binding-v1.js";
import {
  createPersistentZoneAudioSyncV1
} from "../../src/adapters/audio/persistent-zone-audio-sync-v1.js";

test("skill presentation accepts one canonical aura audio slot", () => {
  const binding = normalizeSkillPresentationBindingV1({
    id: "skill:zone",
    version: 1,
    subjectType: "skill",
    subjectId: "zone",
    visual: {},
    audio: {
      aura: {
        assetId: "gensrpg:sound:genrpg-pack2-test",
        volume: 0.8,
        loop: true,
        trigger: "release"
      }
    }
  });

  assert.equal(
    binding.audio.aura.assetId,
    "gensrpg:sound:genrpg-pack2-test"
  );
  assert.equal(binding.audio.aura.loop, true);
});

test("persistent-zone audio follows zone ownership without a second timer", async () => {
  const plays = [];
  const stops = [];
  const audio = {
    play(command) {
      plays.push(command);
      const handle = {
        status: "running",
        stop() {
          stops.push(command.skillId);
        },
        finished: new Promise(() => {})
      };
      return handle;
    }
  };

  const sync = createPersistentZoneAudioSyncV1({
    audio
  });

  sync.sync([
    {
      id: "local:fire-zone:flames",
      skillId: "fire-zone",
      sourceActorId: "local",
      targetId: "enemy"
    }
  ]);

  assert.deepEqual(plays, [
    {
      type: "aura",
      skillId: "fire-zone",
      actorSlot: "local",
      targetSlot: "enemy"
    }
  ]);

  sync.sync([
    {
      id: "local:fire-zone:flames",
      skillId: "fire-zone",
      sourceActorId: "local",
      targetId: "enemy",
      activations: 2
    }
  ]);
  assert.equal(
    plays.length,
    1,
    "reinforcement must not restart the same zone loop"
  );

  sync.sync([]);
  assert.deepEqual(stops, ["fire-zone"]);

  sync.dispose();
});

test("combat UIs sync zone audio from the same persistentZones state used by visual zones", async () => {
  for (const path of [
    "../../src/ui/combat-test-ui.js",
    "../../src/ui/combat-2v2-test-ui.js"
  ]) {
    const source = await readFile(
      new URL(path, import.meta.url),
      "utf8"
    );
    assert.match(
      source,
      /zoneAudio\.sync\(\s*state\.persistentZones \?\? \[\]\s*\)/
    );
    assert.doesNotMatch(
      source,
      /setInterval\([^\n]*zoneAudio/i
    );
  }
});
