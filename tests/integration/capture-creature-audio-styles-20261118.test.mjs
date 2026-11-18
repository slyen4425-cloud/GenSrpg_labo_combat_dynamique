import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCreaturePresentationBinding } from "../../src/contracts/creature-presentation-binding.js";
import { PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1 } from "../../src/assets/private-audio-runtime-library-v1.js";

const read = path => JSON.parse(readFileSync(new URL("../../" + path, import.meta.url), "utf8"));
const catalog = read("data/presentation/audio/private-audio-catalog.v1.json").entries;
const movementRole = new Map(catalog.map(item => [item.assetId, item.roles ?? []]));
const expected = Object.freeze({
  // The existing Foudrillon moth-wing sound is the canonical insect flap.
  "Ephemus": ["flying", "gensrpg:sound:effect-79dd62d8"],
  "crea_foudrillon": ["flying", "gensrpg:sound:effect-79dd62d8"],
  // Bird/dragon flight uses the separately reviewed air-movement sound.
  "Veldra_crea": ["flying", "gensrpg:sound:genrpg-pack2-9320854b"],
  "crea_ailevent": ["flying", "gensrpg:sound:genrpg-pack2-9320854b"],
  "crea_dracendre": ["flying", "gensrpg:sound:genrpg-pack2-9320854b"],
  // Author-approved clothing rustle: quadruped movement, never air/insect.
  "crea-loup": ["quadruped", "gensrpg:sound:sanctuary-367a77dd"],
  "crea_nat_1": ["quadruped", "gensrpg:sound:sanctuary-367a77dd"],
  "kitsune_lunaire": ["quadruped", "gensrpg:sound:sanctuary-367a77dd"]
});

test("Creature movement sound groups separate insect wings, broad flight and quadruped rustle without duplicate assets", () => {
  for (const [id, [profileId, assetId]] of Object.entries(expected)) {
    const creature = read("data/capture/showcase/" + id + ".capture-creature-transfer-v1.json");
    assert.equal(creature.draft.id, id, id + " keeps the canonical creature ID");
    const normalized = normalizeCreaturePresentationBinding(creature.draft.presentation);
    assert.equal(normalized.profileId, profileId, id + " keeps the native motion profile");
    assert.equal(normalized.audio.movement?.assetId, assetId, id + " movement has the author-approved asset");
    assert.ok(PRIVATE_AUDIO_RUNTIME_ASSET_IDS_V1.includes(assetId), assetId + " is packaged, not a made-up URL");
    assert.ok(movementRole.get(assetId)?.includes("movement"), assetId + " is classified as movement");
    for (const role of ["attack", "hit", "ko", "dodge", "defense"]) {
      assert.equal(normalized.audio[role], undefined, id + " is not given invented sounds in other roles");
    }
  }
});

test("Insect flapping and bird flight do not accidentally reuse the quadruped rustle", () => {
  const insect = expected.Ephemus[1];
  const flight = expected.Veldra_crea[1];
  const quadruped = expected["crea-loup"][1];
  assert.notEqual(insect, flight);
  assert.notEqual(insect, quadruped);
  assert.notEqual(flight, quadruped);
});
