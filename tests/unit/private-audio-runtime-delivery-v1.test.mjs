import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const manifestUrl = new URL(
  "../../data/presentation/audio/private-audio-runtime.v1.json",
  import.meta.url
);
const audioRoot = new URL(
  "../../assets/runtime/audio/",
  import.meta.url
);

test("every private runtime audio manifest entry has a physically delivered MP3", async () => {
  const manifest = JSON.parse(
    await readFile(manifestUrl, "utf8")
  );

  assert.equal(manifest.count, 173);
  assert.equal(manifest.entries.length, 173);

  const missing = [];

  for (const entry of manifest.entries) {
    try {
      await access(
        new URL(entry.runtimeFile, audioRoot)
      );
    } catch {
      missing.push(entry.runtimeFile);
    }
  }

  assert.deepEqual(
    missing,
    [],
    "private runtime audio files missing from laboratory: " +
      missing.join(", ")
  );
});
