import test from "node:test";
import assert from "node:assert/strict";

import {
  createCaptureSkillPresentationAssetsV2
} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {
  createDomCombatAudio
} from "../../src/adapters/audio/dom-combat-audio.js";

test("creator audio asset follows user assetId -> skill presentation -> existing DomCombatAudio", async () => {
  const { createCreatorAudioAssetSessionV1 } =
    await import("../../src/assets/creator-audio-asset-session-v1.js");

  const creatorAudio = createCreatorAudioAssetSessionV1({
    createObjectURL() {
      return "blob:creator-fire-cast";
    },
    revokeObjectURL() {},
    createId() {
      return "fire-cast";
    }
  });

  const imported = creatorAudio.importAudio({
    file: {
      name: "my-fire.mp3",
      type: "audio/mpeg",
      size: 128
    },
    label: "Mon feu",
    role: "cast"
  });

  const presentations =
    createCaptureSkillPresentationAssetsV2({
      skillPresentations: {
        custom: {
          id: "skill:custom",
          version: 1,
          subjectType: "skill",
          subjectId: "custom",
          visual: {},
          audio: {
            cast: {
              assetId: imported.id,
              volume: 0.6,
              loop: false
            }
          }
        }
      },
      assetForId() {
        return null;
      },
      audioAssetForId(assetId) {
        return creatorAudio.runtimeAsset(assetId);
      }
    });

  const played = [];
  const audio = createDomCombatAudio({
    presentationForSkill(skillId, context) {
      return presentations.presentationForSkill(
        skillId,
        context
      );
    },
    resolveAudioAsset(assetId) {
      return presentations.audioAsset(assetId);
    },
    createAudio(url) {
      assert.equal(url, "blob:creator-fire-cast");
      return {
        volume: 1,
        loop: false,
        currentTime: 0,
        onended: null,
        onerror: null,
        play() {
          played.push({
            url,
            volume: this.volume,
            loop: this.loop
          });
          return Promise.resolve();
        },
        pause() {}
      };
    }
  });

  const handle = audio.play({
    type: "cast",
    skillId: "custom",
    actorSlot: "player"
  });

  assert.equal(handle.status, "running");
  assert.equal(handle.assetId, "user:fire-cast");
  assert.equal(played.length, 1);
  assert.equal(played[0].url, "blob:creator-fire-cast");
  assert.equal(played[0].volume, 0.6);
  assert.equal(played[0].loop, false);

  handle.stop();
  creatorAudio.dispose();
});
