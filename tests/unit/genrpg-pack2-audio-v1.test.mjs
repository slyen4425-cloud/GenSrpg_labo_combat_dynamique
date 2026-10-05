import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

import {
  SKILL_PRESENTATION_AUDIO_SLOTS
} from "../../src/contracts/skill-presentation-binding-v1.js";
import {
  createDomCombatAudio
} from "../../src/adapters/audio/dom-combat-audio.js";
import {
  privateAudioRuntimeAssetV1
} from "../../src/assets/private-audio-runtime-library-v1.js";

test("skill presentation owns a dedicated aura audio slot", () => {
  assert.equal(
    SKILL_PRESENTATION_AUDIO_SLOTS.includes("aura"),
    true
  );
});

test("persistent-zone audio is started once per zone and stopped when the zone disappears", () => {
  const created = [];
  const audio = createDomCombatAudio({
    presentationForSkill() {
      return {
        auraSound: {
          assetId: "gensrpg:sound:test-aura",
          loop: true
        }
      };
    },
    resolveAudioAsset() {
      return {
        url: "test-aura.mp3"
      };
    },
    createAudio(url) {
      const media = {
        url,
        volume: 1,
        loop: false,
        currentTime: 0,
        paused: false,
        play() {
          return Promise.resolve();
        },
        pause() {
          this.paused = true;
        }
      };
      created.push(media);
      return media;
    }
  });

  const zone = {
    id: "zone-1",
    skillId: "fire-zone",
    sourceActorId: "player"
  };

  assert.equal(
    audio.syncPersistentZones([zone]).activeCount,
    1
  );
  assert.equal(created.length, 1);
  assert.equal(created[0].loop, true);

  audio.syncPersistentZones([zone]);
  assert.equal(
    created.length,
    1,
    "state rerenders must not restart the same zone loop"
  );

  assert.equal(
    audio.syncPersistentZones([]).activeCount,
    0
  );
  assert.equal(created[0].paused, true);

  audio.dispose();
});

test("genrpg_pack2 publishes 30 catalogued runtime sounds without private source paths", async () => {
  const catalog = JSON.parse(
    readFileSync(
      new URL(
        "../../data/presentation/audio/private-audio-catalog.v1.json",
        import.meta.url
      ),
      "utf8"
    )
  );
  const pack = catalog.entries.filter(
    (entry) =>
      Array.isArray(entry.tags) &&
      entry.tags.includes("genrpg-pack2")
  );

  assert.equal(pack.length, 30);
  assert.equal(catalog.entries.length, 203);
  assert.equal(
    new Set(pack.map((entry) => entry.assetId)).size,
    30
  );

  for (const entry of pack) {
    assert.equal(
      Object.hasOwn(entry, "sourcePath"),
      false,
      entry.assetId + " must not expose private sourcePath"
    );
    const runtime =
      privateAudioRuntimeAssetV1(
        entry.assetId
      );
    assert.ok(runtime?.url, entry.assetId);
    assert.equal(
      existsSync(new URL(runtime.url)),
      true,
      entry.assetId + " runtime file missing"
    );
  }

  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(
    html,
    /data-skill-aura-audio/
  );
  assert.match(
    html,
    /data-audio-roles="aura"/
  );
});
