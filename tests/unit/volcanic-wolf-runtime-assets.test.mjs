import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const RUNTIME_DIR =
  "assets/library/capture/creatures/loup_volcanique/runtime";

async function assertWebp(name) {
  const bytes = await readFile(`${RUNTIME_DIR}/${name}`);
  assert.ok(bytes.length > 12, `${name} must not be empty`);
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
}

test("volcanic wolf runtime views are valid WebP binaries", async () => {
  await assertWebp("loup_volcanique_player.webp");
  await assertWebp("loup_volcanique_opponent.webp");
  await assertWebp("loup_volcanique_icon.webp");
});
