import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const base = resolve(root, "assets/library/capture/sprites/skills/feuille_tranchante_v3");
const catalog = JSON.parse(readFileSync(resolve(root, "data/assets/catalog/global-visual-assets.v1.json")));
const roles = [["cast", "release", 75, "once"], ["projectile", "travel", 65, "loop"], ["impact", "impact", 85, "once"]];
const sha = (b) => createHash("sha256").update(b).digest("hex");

test("Feuille tranchante V3 uses one authoritative catalog and 3 real 12-frame transparent WebP strips", () => {
  assert.equal(catalog.storage.branch, "global-assets");
  assert.equal(catalog.counts.assets, catalog.assets.length);
  assert.equal(catalog.counts.sprites, catalog.assets.filter(a => a.assetType === "sprite").length);
  assert.equal(new Set(catalog.assets.map(a => a.id)).size, catalog.assets.length);
  const sequences = JSON.parse(readFileSync(resolve(base, "sprite_skill_feuille_tranchante_v3_sequences.json")));
  const provenance = JSON.parse(readFileSync(resolve(base, "provenance.json")));
  assert.equal(provenance.archiveSha256, "1173442cfae9bacaf1a020b62f304a83644d3cca31553444fccafea08b285674");
  assert.deepEqual(Object.keys(sequences.sequences).sort(), roles.map(r => r[0]).sort());
  for (const [role, category, frameMs, mode] of roles) {
    const id = "pack:capture:sprite-feuille-tranchante-" + role + "-03";
    const matches = catalog.assets.filter(a => a.id === id);
    assert.equal(matches.length, 1, id);
    const asset = matches[0], seq = sequences.sequences[role];
    assert.equal(asset.category, category);
    assert.equal(asset.resource.frameCount, 12);
    assert.equal(asset.resource.frameMs, frameMs);
    assert.equal(asset.resource.playbackMode, mode);
    assert.ok(asset.compatibility.uses.includes("editor"));
    assert.ok(asset.compatibility.uses.includes("combat"));
    assert.equal(seq.id, id);
    assert.equal(seq.frame_ms, frameMs);
    assert.equal(seq.playback_mode, mode);
    assert.equal(seq.frames.length, 12);
    assert.equal(seq.atlas.frameWidth, 512);
    assert.equal(seq.atlas.frameHeight, 512);
    const atlasPath = resolve(root, catalog.storage.libraryRoot, asset.resource.file);
    assert.ok(existsSync(atlasPath));
    const atlas = readFileSync(atlasPath);
    assert.equal(atlas.toString("ascii", 0, 4), "RIFF");
    assert.equal(atlas.toString("ascii", 8, 12), "WEBP");
    assert.equal(sha(atlas), provenance.sourceFiles[seq.atlas.file]);
    const frameHashes = new Set();
    for (let i = 1; i <= 12; i++) {
      const rel = role + "/feuille_tranchante_" + role + "_" + String(i).padStart(2, "0") + ".webp";
      assert.equal(seq.frames[i-1], rel);
      const file = readFileSync(resolve(base, rel));
      assert.equal(file.toString("ascii", 0, 4), "RIFF");
      assert.equal(file.toString("ascii", 8, 12), "WEBP");
      assert.equal(sha(file), provenance.sourceFiles[rel]);
      frameHashes.add(sha(file));
    }
    assert.equal(frameHashes.size, 12);
    assert.ok(existsSync(resolve(base, "preview_feuille_tranchante_" + role + ".webp")));
  }
});
