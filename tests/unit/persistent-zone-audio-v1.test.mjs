import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeSkillPresentationBindingV1
} from "../../src/contracts/skill-presentation-binding-v1.js";
import {
  createDomCombatAudio
} from "../../src/adapters/audio/dom-combat-audio.js";

test("SkillPresentationBinding accepts a dedicated persistent-zone aura audio slot", () => {
  const binding = normalizeSkillPresentationBindingV1({
    id: "skill:fire-zone",
    version: 1,
    subjectType: "skill",
    subjectId: "fire-zone",
    visual: {},
    audio: {
      aura: {
        assetId: "gensrpg:sound:zone-loop",
        volume: 0.65,
        loop: true
      }
    }
  });

  assert.deepEqual(binding.audio.aura, {
    assetId: "gensrpg:sound:zone-loop",
    volume: 0.65,
    loop: true
  });
});

test("DOM combat audio keeps one aura loop per persistent zone and stops it when the zone disappears", async () => {
  const created = [];
  const stopped = [];

  const audio = createDomCombatAudio({
    presentationForSkill(skillId, context) {
      assert.equal(skillId, "fire-zone");
      assert.equal(context.audioType, "aura");
      return {
        persistentZoneSound: {
          assetId: "gensrpg:sound:zone-loop",
          loop: true
        }
      };
    },
    resolveAudioAsset(assetId) {
      return {
        assetId,
        url: "https://example.test/zone-loop.mp3"
      };
    },
    createAudio(url) {
      const record = {
        url,
        volume: 1,
        loop: false,
        currentTime: 0,
        onended: null,
        onerror: null,
        play() {
          created.push(record);
          return Promise.resolve();
        },
        pause() {
          stopped.push(record);
        }
      };
      return record;
    }
  });

  assert.equal(
    typeof audio.syncPersistentZones,
    "function"
  );

  audio.syncPersistentZones([
    {
      id: "player:fire-zone:flames",
      skillId: "fire-zone",
      sourceActorId: "player",
      targetId: "opponent"
    }
  ]);

  assert.equal(created.length, 1);
  assert.equal(created[0].loop, true);
  assert.equal(audio.activePersistentZoneCount, 1);

  audio.syncPersistentZones([
    {
      id: "player:fire-zone:flames",
      skillId: "fire-zone",
      sourceActorId: "player",
      targetId: "opponent"
    }
  ]);
  assert.equal(
    created.length,
    1,
    "state refresh must not restart the same aura loop"
  );

  audio.syncPersistentZones([]);
  assert.equal(stopped.length, 1);
  assert.equal(audio.activePersistentZoneCount, 0);

  audio.dispose();
});

test("combat UIs sync persistent-zone audio from the same state list as persistent-zone visuals", async () => {
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
      /fx\.syncPersistentZones\([\s\S]*?state\.persistentZones/
    );
    assert.match(
      source,
      /combatAudio\.syncPersistentZones\([\s\S]*?state\.persistentZones/
    );
  }
});

test("human editor exposes a persistent-zone audio selector and persists it as audio.aura", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(html, /data-skill-zone-audio/);
  assert.match(
    html,
    /data-audio-roles="aura"/
  );
  assert.match(source, /zoneAudioAssetId/);
  assert.match(source, /audio\.aura/);
});
