import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pack = path.join(
  root,
  "assets/library/capture/sprites/skills/pressurized_jet"
);
const catalogPath = path.join(
  root,
  "data/assets/catalog/global-visual-assets.v1.json"
);

function pngSize(file) {
  const buffer = fs.readFileSync(file);
  assert.equal(
    buffer.subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a"
  );
  return [
    buffer.readUInt32BE(16),
    buffer.readUInt32BE(20)
  ];
}

test("pressurized jet pack owns 56 512x512 frames and four atlas bindings", () => {
  const manifest = fs
    .readFileSync(
      path.join(pack, "manifest.csv"),
      "utf8"
    )
    .trim()
    .split(/\r?\n/);

  assert.equal(manifest.length, 57);

  for (const [role, count] of [
    ["cast", 20],
    ["beam_start", 12],
    ["beam_body", 12],
    ["impact", 12]
  ]) {
    for (let index = 1; index <= count; index += 1) {
      const file = path.join(
        pack,
        "frames",
        `sprite_skill_pressurized_jet_${role}_${String(index).padStart(2, "0")}.png`
      );
      assert.deepEqual(
        pngSize(file),
        [512, 512],
        file
      );
    }

    const atlas = path.join(
      pack,
      "atlases",
      `sprite_skill_pressurized_jet_${role}_atlas_01.webp`
    );
    assert.equal(
      fs
        .readFileSync(atlas)
        .subarray(0, 4)
        .toString("ascii"),
      "RIFF"
    );
  }

  const sequences = JSON.parse(
    fs.readFileSync(
      path.join(
        pack,
        "sprite_skill_pressurized_jet_sequences_01.json"
      ),
      "utf8"
    )
  );

  assert.equal(
    sequences.sequences.cast.frame_count,
    20
  );
  assert.equal(
    sequences.sequences.beam_start.frame_count,
    12
  );
  assert.equal(
    sequences.sequences.beam_body.frame_count,
    12
  );
  assert.equal(
    sequences.sequences.beam_body.playback_mode,
    "loop"
  );
  assert.equal(
    sequences.sequences.impact.frame_count,
    12
  );
});

test("pressurized jet uses additive ids in the unique global visual catalogue", () => {
  const catalog = JSON.parse(
    fs.readFileSync(catalogPath, "utf8")
  );
  const ids = catalog.assets.map(
    (asset) => asset.id
  );

  assert.equal(
    new Set(ids).size,
    ids.length
  );

  for (const id of [
    "pack:capture:sprite-pressurized-jet-cast-01",
    "pack:capture:sprite-pressurized-jet-beam-start-01",
    "pack:capture:sprite-pressurized-jet-beam-body-01",
    "pack:capture:sprite-pressurized-jet-impact-01"
  ]) {
    assert.ok(
      catalog.assets.find(
        (asset) => asset.id === id
      ),
      id
    );
  }

  assert.ok(
    catalog.assets.find(
      (asset) =>
        asset.id ===
        "pack:capture:sprite-frost-bolt-projectile-01"
    ),
    "previous frost bolt asset must remain"
  );

  assert.equal(
    catalog.counts.assets,
    catalog.assets.length
  );
  assert.equal(
    catalog.counts.sprites,
    catalog.assets.filter(
      (asset) => asset.assetType === "sprite"
    ).length
  );
});
