import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p));
const cat = JSON.parse(read("data/assets/catalog/global-visual-assets.v1.json"));
const assets = cat.assets;
const ids = assets.map(a => a.id);
const base = "assets/library/capture/creatures/creature_pourpre/animations";

test("pourpre rear animations are separate from violet and existing static pourpre art", () => {
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes("pack:capture:creature-pourpre-player-01"));
  assert.ok(ids.includes("pack:capture:creature-pourpre-opponent-01"));
  assert.ok(ids.includes("pack:capture:creature-pourpre-icon-01"));
  assert.ok(ids.includes("pack:capture:creature-violette-movement-player-8-v1"));
  assert.ok(ids.includes("pack:capture:creature-violette-attack-player-8-v1"));
  assert.equal(cat.counts.assets, assets.length);
  assert.equal(cat.counts.sprites, assets.filter(a => a.assetType === "sprite").length);
});

for (const [action, ms, playback] of [["movement", 83, "loop"], ["attack", 120, "once"]]) {
  test("pourpre " + action + " is an 8-frame 512px real RGBA asset", () => {
    const id = "pack:capture:creature-pourpre-" + action + "-player-8-v1";
    const rows = assets.filter(a => a.id === id);
    assert.equal(rows.length, 1);
    const a = rows[0];
    assert.equal(a.assetType, "sprite");
    assert.equal(a.category, "creature");
    assert.equal(a.resource.frameCount, 8);
    assert.equal(a.resource.frameWidth, 512);
    assert.equal(a.resource.frameHeight, 512);
    assert.equal(a.resource.frameMs, ms);
    assert.equal(a.resource.playbackMode, playback);
    assert.ok(a.resource.file.startsWith("capture/creatures/creature_pourpre/"));
    assert.deepEqual(a.compatibility.uses, ["combat", "capture", "editor"]);
    const sub = base + "/" + action + "/player";
    const manifest = JSON.parse(read(sub + "/" + action + ".manifest.json"));
    assert.equal(manifest.action, action);
    assert.equal(manifest.creature, "creature_pourpre");
    assert.equal(manifest.frameCount, 8);
    assert.equal(manifest.frameSha256Png.length, 8);
    const hashes = [];
    for(let i=1;i<=8;i++){
      const file = sub + "/frames/creature_pourpre_" + action + "_player_" + String(i).padStart(2,"0") + ".png";
      const raw = read(file);
      assert.equal(raw.subarray(0,8).toString("hex"), "89504e470d0a1a0a");
      assert.equal(raw.readUInt32BE(16), 512);
      assert.equal(raw.readUInt32BE(20), 512);
      assert.equal(raw[25], 6, "RGBA PNG mandatory");
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      assert.equal(hash, manifest.frameSha256Png[i-1]);
      hashes.push(hash);
    }
    assert.equal(new Set(hashes).size,8,"all frames must differ");
    const atlas = read("assets/library/"+a.resource.file);
    assert.equal(atlas.toString("ascii",0,4),"RIFF");
    assert.equal(atlas.toString("ascii",8,12),"WEBP");
    const preview = read(sub + "/previews/creature_pourpre_" + action + "_player_8_preview.webp");
    assert.equal(preview.toString("ascii",0,4),"RIFF");
    assert.equal(preview.toString("ascii",8,12),"WEBP");
  });
}
