import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const base = "assets/library/capture/creatures/gorille_des_glaces/animations/attack/player";
const catalogPath = "data/assets/catalog/global-visual-assets.v1.json";
const id = "pack:capture:creature-gorille-des-glaces-attack-player-12-charge-v1";
const sha = data => createHash("sha256").update(data).digest("hex");
const read = p => fs.readFileSync(path.join(root, p));

test("approved ice gorilla charge: sole registered player animation with hold-last", () => {
  const cat = JSON.parse(read(catalogPath));
  assert.equal(cat.counts.assets, cat.assets.length);
  assert.equal(new Set(cat.assets.map(a => a.id)).size, cat.assets.length);
  const assets = cat.assets.filter(a => a.id === id);
  assert.equal(assets.length, 1, "missing or duplicated official animation");
  const asset = assets[0];
  assert.equal(asset.assetType, "sprite");
  assert.equal(asset.category, "creature");
  assert.equal(asset.resource.frameCount, 12);
  assert.equal(asset.resource.playbackMode, "once");
  assert.equal(asset.resource.holdLastFrame, true);
  assert.equal(asset.resource.persistentFrameIndex, 11);
  assert.equal(asset.resource.format, "sprite-strip");
  const manifest = JSON.parse(read(base + "/attack.manifest.json"));
  assert.equal(manifest.schema, "capture-creature-animation-v1");
  assert.equal(manifest.creatureId, "gorille_des_glaces");
  assert.equal(manifest.action, "attack");
  assert.equal(manifest.view, "player");
  assert.equal(manifest.assetId, id);
  assert.equal(manifest.frameCount, 12);
  assert.deepEqual(manifest.frameSize, [512, 512]);
  assert.equal(manifest.playbackMode, "once");
  assert.equal(manifest.holdLastFrame, true);
  assert.equal(manifest.persistentFrameIndex, 11);
  assert.equal(manifest.sourceArchiveSha256, "379afd5861977a636059dd8453e67fb3d622fe78d52830a08f58562f6dba390b");
  assert.equal(manifest.frames.length, 12);
  assert.equal(manifest.frameDurationsMs.length, 12);
  const hashes = new Set();
  for (const [i, frame] of manifest.frames.entries()) {
    assert.equal(frame.index, i);
    assert.equal(frame.file, "frames/gorille_des_glaces_charge_player_" + String(i + 1).padStart(2, "0") + ".png");
    const data = read(base + "/" + frame.file);
    assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "PNG signature");
    assert.equal(data.readUInt32BE(16), 512);
    assert.equal(data.readUInt32BE(20), 512);
    assert.equal(data[24], 8);
    assert.equal(data[25], 6, "PNG must be RGBA");
    assert.equal(sha(data), frame.sha256, "frame SHA256 mismatch");
    hashes.add(frame.sha256);
    assert.ok(Math.min(...frame.marginsLTRB) >= 30, "cropped frame");
  }
  assert.equal(hashes.size, 12, "one or more repeated poses");
  const atlas = read(base + "/" + manifest.atlas.file);
  assert.equal(atlas.toString("ascii", 0, 4), "RIFF");
  assert.equal(atlas.toString("ascii", 8, 12), "WEBP");
  assert.equal(sha(atlas), manifest.atlas.sha256);
  assert.equal(manifest.atlas.frameCount, 12);
  assert.equal(manifest.atlas.frameWidth, 512);
  assert.equal(manifest.atlas.frameHeight, 512);
  assert.equal(asset.resource.file, base.replace(/^assets\\/library\\//, "") + "/" + manifest.atlas.file);
  for (const kind of ["canalisation", "planche"]) {
    const name = manifest.previews[kind];
    assert.ok(name && read(base + "/" + name).length > 10000);
  }
  // Unique library asset; no mutation of original Gorilla model records.
  for (const original of ["player-01", "opponent-01", "icon-01"]) {
    assert.ok(cat.assets.some(a => a.id === "pack:capture:creature-gorille-des-glaces-" + original));
  }
});
