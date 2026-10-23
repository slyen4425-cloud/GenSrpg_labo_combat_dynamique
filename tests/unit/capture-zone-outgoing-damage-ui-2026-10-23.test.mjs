import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  humanSkillEditorFieldsFromDraftV1,
  buildHumanSkillDraftV1
} from "../../src/ui/capture-editor-human-v2.js";

const root = new URL("../../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const sample = () => JSON.parse(read(
  "data/capture/showcase/Sacrifice_kitsune.capture-skill-transfer-v1.json"
)).draft;

test("Sacrifice Kitsune has an authored 200% outgoing damage modifier in a persistent zone", () => {
  const draft = sample();
  const status = draft.definition.effects
    .filter(x => x.kind === "persistent_zone")
    .find(x => x.tickEffect?.status?.kind === "outgoing_damage_modifier")?.tickEffect?.status;
  assert.ok(status);
  assert.equal(status.modifierPct, 200);
  assert.equal(draft.definition.effects.filter(x => x.kind === "persistent_zone").length, 3);
});

test("Capture zone status editor renders the outgoing damage percentage and reads it before validation", () => {
  const src = read("src/ui/capture-editor-human-v2.js");
  assert.match(src, /zoneStatusNumber\(\s*"Dégâts infligés[^"]*"\s*,\s*"skillZoneStatusOutgoingDamageModifierPct"\s*,\s*zs\.modifierPct\s*\?\?\s*0\s*,\s*\{\s*step:\s*"1"\s*\}\s*,\s*"outgoing_damage_modifier"\s*\)/,
    "the zone form must expose the authored numeric outgoing damage modifier, only for that kind");
  assert.match(src, /zsKind\s*===\s*"outgoing_damage_modifier"\s*\)\s*\{\s*zs\.modifierPct\s*=\s*Number\(row\.querySelector\("\[data-skill-zone-status-outgoing-damage-modifier-pct\]"\)\.value\);\s*\}/,
    "the zone reader must pass the visible numeric value to the existing validator");
  assert.match(src, /node\.hidden = !node\.dataset\.skillZoneStatusConfigKind\.split\(","\)\.includes\(zoneStatusKind\)/,
    "the normal kind-based UI visibility must own the new field");
});

test("Sacrifice Kitsune's three native zones survive active skill edit/serialization without changing combat values", () => {
  const source = sample();
  const fields = humanSkillEditorFieldsFromDraftV1(source);
  assert.equal(fields.effects.length, 4);
  const built = buildHumanSkillDraftV1(fields);
  const originalZones = source.definition.effects.filter(x => x.kind === "persistent_zone");
  const savedZones = built.definition.effects.filter(x => x.kind === "persistent_zone");
  assert.equal(savedZones.length, 3);
  assert.deepEqual(savedZones, originalZones);
  assert.equal(built.definition.effects.filter(x => x.kind === "knockout").length, 1);
  assert.equal(
    savedZones.find(x => x.tickEffect?.status?.kind === "outgoing_damage_modifier")
      ?.tickEffect?.status?.modifierPct,
    200
  );
});
