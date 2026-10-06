import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const base = "assets/library/capture/sprites/skills/ash_smoke/";

function pngHeader(path) {
  const bytes = readFileSync(new URL(path, root));
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType: bytes[25]
  };
}

test("ash smoke pack exposes 56 native RGBA 512 frames", () => {
  const seq = JSON.parse(readFileSync(new URL(base + "sprite_skill_ash_smoke_sequences_01.json", root), "utf8"));
  const prov = JSON.parse(readFileSync(new URL(base + "provenance.json", root), "utf8"));
  assert.deepEqual(seq.frame_size, [512, 512]);

  const expected = { cast: 16, projectile: 12, impact: 12, status_aura: 16 };
  let total = 0;
  for (const [name, count] of Object.entries(expected)) {
    const def = seq.sequences[name];
    assert.equal(def.frame_count, count);
    assert.equal(def.frames.length, count);
    total += count;
    for (const frame of def.frames) {
      const h = pngHeader(base + frame);
      assert.deepEqual([h.width, h.height], [512, 512]);
      assert.equal(h.bitDepth, 8);
      assert.equal(h.colorType, 6, "RGBA PNG required");
    }
    assert.equal(prov.results[name].alpha_extrema.length, count);
    assert.ok(prov.results[name].alpha_extrema.every(([min, max]) => min < 255 && max > 0));
    const atlas = readFileSync(new URL(base + def.atlas, root));
    assert.equal(atlas.toString("ascii", 0, 4), "RIFF");
    assert.equal(atlas.toString("ascii", 8, 12), "WEBP");
  }
  assert.equal(total, 56);
});

test("ash smoke pack is additive and owns exactly four unique catalogue IDs", () => {
  const c = JSON.parse(readFileSync(new URL("data/assets/catalog/global-visual-assets.v1.json", root), "utf8"));
  const wanted = [
    ["pack:capture:sprite-ash-smoke-cast-01", "release", 16],
    ["pack:capture:sprite-ash-smoke-projectile-01", "travel", 12],
    ["pack:capture:sprite-ash-smoke-impact-01", "impact", 12],
    ["pack:capture:sprite-ash-smoke-status-aura-01", "skill", 16]
  ];
  for (const [id, category, count] of wanted) {
    const defs = c.assets.filter(a => a.id === id);
    assert.equal(defs.length, 1);
    assert.equal(defs[0].assetType, "sprite");
    assert.equal(defs[0].category, category);
    assert.equal(defs[0].resource.format, "sprite-strip");
    assert.equal(defs[0].resource.mime, "image/webp");
    assert.equal(defs[0].resource.frameCount, count);
    assert.ok(defs[0].resource.file.startsWith("capture/sprites/skills/ash_smoke/atlases/"));
  }
  assert.equal(c.counts.assets, c.assets.length);
  assert.equal(c.counts.sprites, c.assets.filter(a => a.assetType === "sprite").length);
});
