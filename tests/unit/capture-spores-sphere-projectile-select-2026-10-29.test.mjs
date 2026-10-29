import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const catalog = JSON.parse(readFileSync(resolve(root, "data/assets/catalog/global-visual-assets.v1.json"),"utf8"));
const mediaBase = resolve(root,"assets/library/capture/sprites/skills/spores_spheriques_v2");
const id = "pack:capture:sprite-spores-expansives-projectile-sphere-02";

test("Approved radial expanding spore cloud is selectable in existing LIVE editor Projectile chooser without becoming a traveling projectile", () => {
  const matching = catalog.assets.filter(asset => asset.id === id);
  assert.equal(matching.length, 1, "One canonical ID, not a duplicate workaround");
  const asset = matching[0];

  // Capture's published editor role filter: skill-expanding effects may be picked
  // as 'travel' visual despite being radial. Checked against gh-pages
  // src/ui/capture-editor-human-v2.js::captureEditorAssetMatchesRoleV1.
  assert.equal(asset.category, "skill", "The radial effect must NOT be relabeled as a traveling projectile");
  assert.ok(asset.compatibility.uses.includes("editor"));
  assert.equal(asset.assetType, "sprite");
  assert.equal(asset.mediaType, "image");
  assert.ok(asset.tags.includes("expanding"), "Missing expanding tag hid this FX from Projectile selector");
  const role = "travel";
  const allowedForProjectileChooser = role !== "travel" ||
    asset.category === "travel" ||
    (asset.category === "skill" && asset.tags.includes("expanding"));
  assert.equal(allowedForProjectileChooser,true);

  assert.equal(asset.resource.file,"capture/sprites/skills/spores_spheriques_v2/spores_spheriques_autour_creature_atlas_12f.webp");
  assert.deepEqual([asset.resource.frameCount, asset.resource.frameMs, asset.resource.playbackMode],[12,100,"once"]);
  const seq = JSON.parse(readFileSync(resolve(mediaBase,"sprite_skill_spores_spheriques_sequence_v2.json"),"utf8"));
  assert.equal(seq.id,id);
  assert.equal(seq.presentationType,"radial-caster-cloud");
  assert.equal(seq.centerOnCaster,true);
  assert.equal(seq.travelsToTarget,false);
  assert.equal(seq.frames.length,12);
  assert.equal(catalog.counts.assets,catalog.assets.length);
  assert.equal(new Set(catalog.assets.map(x=>x.id)).size,catalog.assets.length);
});
