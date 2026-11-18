import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";

const skills = [
  ["ephemus-poussiere-oubli", "travel"],
  ["ephemus-battement-limbes", "travel"],
  ["ephemus-chrysalide-fantome", "cast"],
  ["ephemus-lanterne-ames", "impact"],
  ["ephemus-danse-mille-ames", "travel"]
];

test("Éphémus official media: five distinct catalog icon+sprite bindings survive native normalizer", async () => {
  const all = new Set();
  for (const [slug, slot] of skills) {
    const url = new URL("../../data/capture/showcase/" + slug + ".capture-skill-transfer-v1.json", import.meta.url);
    const transfer = JSON.parse(await readFile(url, "utf8"));
    const canonical = normalizeCaptureSkillTransferV1(transfer);
    const visual = canonical.draft.presentation.visual;
    const iconId = "pack:capture:icon-skill-" + slug + "-v1";
    const spriteId = "pack:capture:sprite-skill-" + slug + "-v1";
    assert.equal(visual.icon?.assetId, iconId, slug + " icon");
    assert.equal(visual[slot]?.assetId, spriteId, slug + " animation");
    assert.equal(canonical.draft.definition.id, slug);
    assert.equal(Object.keys(visual).length, 2, "Only one dedicated animation and icon");
    assert.equal(visual[slot].attachment, slot === "cast" ? "source" : slot === "impact" ? "fixed-target" : "trajectory");
    assert.equal(visual[slot].trigger, slot === "cast" ? "preparation-start" : slot === "impact" ? "impact" : "travel-start");
    all.add(iconId);
    all.add(spriteId);
  }
  assert.equal(all.size, 10, "All ten canonical media asset IDs are unique");
});
test("Éphémus: original skill mechanics unchanged after media-only binding", async () => {
  const norm = [];
  for (const [slug] of skills) {
    const transfer = JSON.parse(await readFile(new URL("../../data/capture/showcase/" + slug + ".capture-skill-transfer-v1.json", import.meta.url), "utf8"));
    norm.push(transfer.draft.definition);
  }
  assert.deepEqual(norm.map(x => x.form), ["projectile","beam","self","area","beam"]);
  assert.equal(norm[0].effects.find(x=>x.kind==="damage").amount,8);
  assert.equal(norm[1].effects.find(x=>x.kind==="damage").amount,10);
  assert.equal(norm[2].effects.find(x=>x.kind==="scheduled_effect").trigger.delayMs,10000);
  assert.equal(norm[3].effects.filter(x=>x.kind==="persistent_zone").length,2);
  assert.equal(norm[4].channeling.maxTicks,6);
});
