import test from "node:test";
import assert from "node:assert/strict";

test("audio source manager validates creator audio MIME types and owns Object URL cleanup", async () => {
  const { createAudioSourceManagerV1 } =
    await import("../../src/assets/audio-source-manager-v1.js");

  const revoked = [];
  const manager = createAudioSourceManagerV1({
    createObjectURL(file) {
      return "blob:" + file.name;
    },
    revokeObjectURL(url) {
      revoked.push(url);
    }
  });

  for (const [name, type] of [
    ["sound.mp3", "audio/mpeg"],
    ["sound.wav", "audio/wav"],
    ["sound-x.wav", "audio/x-wav"],
    ["sound.ogg", "audio/ogg"]
  ]) {
    const url = manager.load({
      name,
      type,
      size: 16
    });
    assert.equal(url, "blob:" + name);
  }

  assert.throws(
    () => manager.load({
      name: "image.png",
      type: "image/png",
      size: 16
    }),
    /Unsupported audio type/
  );
  assert.throws(
    () => manager.load({
      name: "empty.mp3",
      type: "audio/mpeg",
      size: 0
    }),
    /must not be empty/
  );

  manager.dispose();
  assert.equal(manager.isDisposed, true);
  assert.equal(
    revoked.includes("blob:sound.ogg"),
    true
  );
});

test("creator audio session creates user scoped sound AssetDefinitions and revokes every URL", async () => {
  const { createCreatorAudioAssetSessionV1 } =
    await import("../../src/assets/creator-audio-asset-session-v1.js");

  const revoked = [];
  const ids = ["cast-a", "voice-b"];
  const session = createCreatorAudioAssetSessionV1({
    createObjectURL(file) {
      return "blob:user-" + file.name;
    },
    revokeObjectURL(url) {
      revoked.push(url);
    },
    createId() {
      return ids.shift();
    }
  });

  const cast = session.importAudio({
    file: {
      name: "spell.mp3",
      type: "audio/mpeg",
      size: 64
    },
    label: "Mon sort",
    role: "cast"
  });
  const voice = session.importAudio({
    file: {
      name: "growl.ogg",
      type: "audio/ogg",
      size: 80
    },
    label: "Mon cri",
    role: "voice"
  });

  assert.equal(cast.id, "user:cast-a");
  assert.equal(cast.assetId, "user:cast-a");
  assert.equal(cast.assetType, "sound");
  assert.equal(cast.mediaType, "audio");
  assert.equal(cast.source.scope, "user");
  assert.deepEqual(cast.roles, ["cast"]);
  assert.deepEqual(
    cast.compatibility.uses,
    ["combat", "capture", "editor"]
  );
  assert.equal(
    cast.resource.runtimeUrl,
    "blob:user-spell.mp3"
  );
  assert.deepEqual(
    session.runtimeAsset(cast.id),
    {
      assetId: "user:cast-a",
      url: "blob:user-spell.mp3"
    }
  );
  assert.deepEqual(
    session.list().map(asset => asset.id),
    ["user:cast-a", "user:voice-b"]
  );
  assert.equal(session.asset(voice.id), voice);

  session.dispose();
  assert.deepEqual(
    revoked.sort(),
    [
      "blob:user-growl.ogg",
      "blob:user-spell.mp3"
    ]
  );
  assert.throws(
    () => session.importAudio({
      file: {
        name: "late.mp3",
        type: "audio/mpeg",
        size: 12
      },
      label: "Late",
      role: "impact"
    }),
    /disposed/
  );
});
