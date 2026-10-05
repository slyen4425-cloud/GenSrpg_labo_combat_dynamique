import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const base = "assets/library/capture/sprites/skills/fireball_2/";

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

test("Boule de feu 2 exposes 12 native RGBA 512 frames for cast projectile and impact", () => {
  const seq = JSON.parse(readFileSync(new URL(base + "sprite_skill_fireball_2_sequences_01.json", root), "utf8"));
  assert.deepEqual(seq.frame_size, [512, 512]);

  for (const name of ["cast", "projectile", "impact"]) {
    const def = seq.sequences[name];
    assert.equal(def.frame_count, 12);
    assert.equal(def.frames.length, 12);
    assert.ok(def.frames.every((f, i) =>
      f === "frames/sprite_skill_fireball_2_" + name + "_" + String(i + 1).padStart(2, "0") + ".png"
    ));
    for (const frame of def.frames) {
      const h = pngHeader(base + frame);
      assert.deepEqual([h.width, h.height], [512, 512]);
      assert.equal(h.bitDepth, 8);
      assert.equal(h.colorType, 6, "RGBA PNG required");
    }
    const atlas = readFileSync(new URL(base + def.atlas, root));
    assert.equal(atlas.toString("ascii", 0, 4), "RIFF");
    assert.equal(atlas.toString("ascii", 8, 12), "WEBP");
  }
});

test("Boule de feu 2 is additive in the global catalogue and leaves old fireball IDs available", () => {
  const c = JSON.parse(readFileSync(new URL("data/assets/catalog/global-visual-assets.v1.json", root), "utf8"));
  const wanted = [
    ["pack:capture:sprite-fireball-2-cast-01", "release", "cast"],
    ["pack:capture:sprite-fireball-2-projectile-01", "travel", "projectile"],
    ["pack:capture:sprite-fireball-2-impact-01", "impact", "impact"]
  ];
  for (const [id, category, name] of wanted) {
    const defs = c.assets.filter(a => a.id === id);
    assert.equal(defs.length, 1);
    const d = defs[0];
    assert.equal(d.label, "Boule de feu 2 — " + name);
    assert.equal(d.assetType, "sprite");
    assert.equal(d.category, category);
    assert.equal(d.resource.format, "sprite-strip");
    assert.equal(d.resource.frameCount, 12);
    assert.equal(d.resource.mime, "image/webp");
    assert.ok(d.resource.file.startsWith("capture/sprites/skills/fireball_2/atlases/"));
    const atlas = readFileSync(new URL("assets/library/" + d.resource.file, root));
    assert.ok(atlas.length > 1000);
  }

  for (const oldId of [
    "pack:capture:sprite-fireball-cast-01",
    "pack:capture:sprite-fireball-travel-01",
    "pack:capture:sprite-fireball-impact-01"
  ]) {
    assert.equal(c.assets.filter(a => a.id === oldId).length, 1, "old Fireball must stay available");
  }

  assert.equal(c.counts.assets, c.assets.length);
  assert.equal(c.counts.sprites, c.assets.filter(a => a.assetType === "sprite").length);
});
