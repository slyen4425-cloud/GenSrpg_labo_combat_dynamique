import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCreaturePresentationBinding} from "../../src/contracts/creature-presentation-binding.js";
import {PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1} from "../../src/assets/private-audio-runtime-library-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {
  applyCaptureShowcaseCreatureMovementAudioV1,
  showcaseCreatureMovementAudioRulesV1
} from "../../src/catalogs/capture-showcase-creature-movement-audio-v1.js";

const read = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const statRegistry = normalizeCaptureStatRegistryV1(JSON.parse(read("data/capture/monster-capture-stat-registry.v1.json")));
const audioCatalog = JSON.parse(read("data/presentation/audio/private-audio-catalog.v1.json")).entries;
const expected = new Map([
  ["Ephemus", ["flying", "gensrpg:sound:effect-79dd62d8"]],
  ["crea_foudrillon", ["flying", "gensrpg:sound:effect-79dd62d8"]],
  ["Veldra_crea", ["flying", "gensrpg:sound:genrpg-pack2-9320854b"]],
  ["crea_ailevent", ["flying", "gensrpg:sound:genrpg-pack2-9320854b"]],
  ["crea_dracendre", ["flying", "gensrpg:sound:genrpg-pack2-9320854b"]],
  ["crea-loup", ["quadruped", "gensrpg:sound:sanctuary-367a77dd"]],
  ["crea_nat_1", ["quadruped", "gensrpg:sound:sanctuary-367a77dd"]],
  ["kitsune_lunaire", ["quadruped", "gensrpg:sound:sanctuary-367a77dd"]]
]);

test("author originals remain unchanged while Showcase hydration gives 8 sound choices with 3 stable official IDs", () => {
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.length, 22);
  const seen = new Set();
  let changed = 0;
  for (const filename of CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1) {
    const archive = read(filename);
    const original = importCaptureTransferJsonV1(archive, {statRegistry});
    const snapshot = structuredClone(original.value);
    const id = original.value.draft.id;
    assert.ok(!seen.has(id), id + " duplicate official creature ID");
    seen.add(id);
    const applied = applyCaptureShowcaseCreatureMovementAudioV1(original, statRegistry);
    const expectedSound = expected.get(id);
    if (expectedSound === undefined) {
      assert.equal(applied, original, id + " unrelated styles and explicit sounds remain untouched");
      continue;
    }
    assert.equal(original.value.draft.presentation.profileId, expectedSound[0]);
    assert.equal(applied.value.draft.presentation.audio.movement.assetId, expectedSound[1]);
    const idAsset = applied.value.draft.presentation.audio.movement.assetId;
    assert.ok(PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1.includes(idAsset), id + ": sound must be packaged");
    assert.ok(audioCatalog.find(a => a.assetId === idAsset)?.roles.includes("movement"), id + ": sound needs movement role");
    const stillOriginal = importCaptureTransferJsonV1(read(filename), {statRegistry});
    assert.deepEqual(stillOriginal.value, snapshot, id + ": author transfer must remain byte-for-byte unchanged");
    assert.deepEqual(applied.value.statValues, original.value.statValues);
    assert.deepEqual(applied.value.loadout, original.value.loadout);
    const stripped = structuredClone(applied.value.draft);
    const originalStripped = structuredClone(original.value.draft);
    delete stripped.presentation.audio.movement;
    delete originalStripped.presentation.audio.movement;
    assert.deepEqual(stripped, originalStripped, id + ": nothing except movement sound may change");
    const normalized = normalizeCreaturePresentationBinding(applied.value.draft.presentation);
    assert.equal(normalized.audio.movement.assetId, expectedSound[1], id);
    const reapplied = applyCaptureShowcaseCreatureMovementAudioV1(applied, statRegistry);
    assert.equal(reapplied, applied, id + " is idempotent without a second audio owner");
    if (applied !== original) changed++;
  }
  assert.equal(seen.size, 22);
  assert.equal(changed, 7, "Foudrillon retains its exact reviewed original, other seven receive new sounds");
});

test("insect wing, broad air movement and quadruped rustle are separate and no other species gets forced footsteps", () => {
  const group = showcaseCreatureMovementAudioRulesV1();
  assert.equal(group.length, 3);
  assert.deepEqual(group.map(g=>g.style), ["insect-wings", "air-movement", "quadruped-rustle"]);
  assert.equal(new Set(group.map(g=>g.sound.assetId)).size, 3);
  assert.equal(group.flatMap(g=>g.creatureIds).length, 8);
  for (const id of ["crea_selachombre", "veuve-jaune", "crea_vyrame"]) {
    assert.equal(expected.has(id), false);
  }
  const foudrillon = importCaptureTransferJsonV1(read(
    "data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json"
  ), {statRegistry});
  assert.equal(foudrillon.value.draft.presentation.audio.movement.mode, "loop");
  assert.equal(applyCaptureShowcaseCreatureMovementAudioV1(foudrillon,statRegistry), foudrillon);
});

test("single canonical preset hydration uses policy once; 1v1 and 2v2 audio still read only creature presentation", () => {
  const editor = read("src/ui/capture-editor-human-v2.js");
  const adapter = read("src/adapters/input/capture/capture-export-to-native-visual-source-v1.js");
  const demo = read("src/ui/demo-app.js");
  const audio = read("src/adapters/audio/dom-combat-audio.js");
  const entry = read("examples/dom-demo/capture-editor-v2.js");
  const html = read("examples/dom-demo/capture-editor-v2.html");
  assert.match(editor, /return applyCaptureShowcaseCreatureMovementAudioV1\(\s*transfer,\s*statRegistry\s*\)/);
  assert.match(adapter, /audio: binding\.audio/);
  assert.match(demo, /getCreatureAudioFor\(slotKey\)/);
  assert.match(audio, /presentationForCreature\(actorSlot/);
  assert.match(entry, /capture-editor-human-v2\.js\?v=[^"\n]*sound-style-publish-20261118/);
  assert.match(html, /capture-editor-v2\.js\?v=[^"\n]*sound-style-publish-20261118/);
  for (const filename of CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1) {
    assert.doesNotMatch(filename, /audio.*\.json$/, "no separate authored audio data file");
  }
});
