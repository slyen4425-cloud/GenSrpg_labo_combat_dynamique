import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
const cases = [
  ["veldra-plume-solaire", "travel"],
  ["veldra-percee-aurore", "impact"],
  ["veldra-egide-zenith", "cast"],
  ["veldra-rayon-cardinal", "impact"],
  ["veldra-releve-celeste", "cast"]
];
async function transfer(name) {
  return JSON.parse(await readFile(new URL("../../data/capture/showcase/" + name + ".capture-skill-transfer-v1.json", import.meta.url), "utf8"));
}
test("Veldra native: five distinct approved visual icons and 16-frame FX bindings", async () => {
  const all = new Set();
  for (const [skill, phase] of cases) {
    const raw = await transfer(skill);
    const norm = normalizeCaptureSkillTransferV1(raw);
    assert.equal(norm.draft.definition.id, skill);
    const v = norm.draft.presentation.visual;
    const icon = "pack:capture:icon-skill-" + skill + "-v1";
    const sprite = "pack:capture:sprite-skill-" + skill + "-v1";
    assert.equal(v.icon.assetId, icon);
    assert.equal(v[phase].assetId, sprite);
    assert.equal(v[phase].attachment, phase === "impact" ? "fixed-target" : phase === "cast" ? "source" : "trajectory");
    assert.equal(v[phase].trigger, phase === "impact" ? "impact" : phase === "cast" ? "preparation-start" : "travel-start");
    all.add(icon); all.add(sprite);
  }
  assert.equal(all.size, 10);
});
test("Veldra: visual-only update retains aerial attack, light beam and all native mechanics", async () => {
  const [plume, dive, shield, beam, relay] = await Promise.all(cases.map(([id])=>transfer(id)));
  assert.equal(plume.draft.definition.effects[0].amount, 10);
  assert.equal(plume.draft.definition.effects[1].marker.durationMs, 5000);
  assert.equal(dive.draft.definition.approachMode, "aerial");
  assert.equal(dive.draft.definition.effects[0].amount, 12);
  assert.equal(dive.draft.definition.effects[1].status.durationMs, 2000);
  assert.equal(shield.draft.definition.effects[0].amount, 25);
  assert.equal(shield.draft.definition.effects[1].status.deltaPoints, 200);
  assert.equal(shield.draft.definition.effects[2].slowOnly, true);
  assert.equal(beam.draft.definition.channeling.tickIntervalMs, 400);
  assert.equal(beam.draft.definition.channeling.maxTicks, 5);
  assert.equal(beam.draft.definition.channeling.effects[0].amount, 8);
  assert.equal(beam.draft.definition.channeling.finalTickEffects[0].amount, 10);
  assert.equal(beam.draft.presentation.visual.beamStart.assetId, "pack:capture:sprite-electric-yellow-beam-cast-01");
  assert.equal(beam.draft.presentation.visual.travel.assetId, "pack:capture:sprite-electric-yellow-beam-body-01");
  assert.equal(relay.draft.definition.effects[0].kind, "ally_reserve_relay");
  assert.equal(relay.draft.definition.effects[0].healAmount, 100);
  assert.equal(relay.draft.definition.effects[0].outgoingDamagePct, 20);
  assert.equal(relay.draft.definition.effects[0].durationMs, 30000);
});
