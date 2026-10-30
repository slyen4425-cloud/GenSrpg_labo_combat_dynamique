import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const ROOT = new URL("../../", import.meta.url);
async function readShowcase(id, kind = "skill") {
  const file = new URL(`data/capture/showcase/${id}.capture-${kind}-transfer-v1.json`, ROOT);
  const source = await readFile(file);
  const gitBlob = createHash("sha1")
    .update(`blob ${source.byteLength}\0`)
    .update(source)
    .digest("hex");
  return { doc: JSON.parse(source.toString("utf8")), gitBlob };
}

test("author Nature database changes only four existing skill files, byte exact", async () => {
  const expected = new Map([
    ["graine_sansue_cap", "7297d42ed2ca575179d9bb984065eb64c8d9e326"],
    ["Spore_soporifique", "37da9b6408355a96eb232e97fd18ff99439f4a3f"],
    ["liane_venimeuse", "896db3dacdd18066464452e4a04f07c6f284915d"],
    ["explosion_florale", "59b8d4b43b16abebf652f04dcba746a4f74bbb3d"]
  ]);
  for (const [id, sha] of expected) {
    const { doc, gitBlob } = await readShowcase(id);
    assert.equal(gitBlob, sha, id + " must match the exact author database");
    assert.equal(doc.schema, "capture-skill-transfer-v1");
    assert.equal(doc.draft.id, id);
    assert.equal(doc.draft.definition.element, "nature");
  }
  assert.equal(
    (await readShowcase("coupe_feuille")).gitBlob,
    "0b516301eef8e4ccb1c5734f7649159b1434ec6a",
    "unmodified Coupe feuille must remain unchanged"
  );
});

test("author's sounds and icons remain present on the four Nature skills", async () => {
  const skill = async id => (await readShowcase(id)).doc.draft;
  const seed = await skill("graine_sansue_cap");
  const spore = await skill("Spore_soporifique");
  const vine = await skill("liane_venimeuse");
  const flower = await skill("explosion_florale");

  assert.equal(seed.presentation.audio.travel.assetId, "gensrpg:sound:genrpg-pack2-3e95d6c6");
  assert.equal(seed.presentation.audio.impact.assetId, "gensrpg:sound:genrpg-pack2-a3d02c0f");
  assert.equal(spore.presentation.visual.icon.assetId, "pack:capture:icon-skill-spore-soporifique-01");
  assert.equal(spore.presentation.audio.travel.assetId, "gensrpg:sound:genrpg-pack2-879fc11a");
  assert.equal(spore.presentation.audio.impact.assetId, "gensrpg:sound:tower-ccc16d37");
  assert.equal(vine.presentation.audio.travel.assetId, "gensrpg:sound:genrpg-pack2-879fc11a");
  assert.equal(vine.definition.form, "beam");
  assert.deepEqual(vine.definition.targetLocations, ["reserve"]);
  assert.equal(flower.presentation.visual.icon.assetId, "pack:capture:icon-skill-fleuraison-01");
  assert.equal(flower.presentation.audio.impact.assetId, "gensrpg:sound:genrpg-pack2-a3d02c0f");

  const catalog = JSON.parse(await readFile(new URL("data/presentation/audio/private-audio-catalog.v1.json", ROOT), "utf8"));
  const soundIds = new Set(catalog.entries.map(e => e.assetId));
  for (const draft of [seed, spore, vine, flower]) {
    for (const slot of Object.values(draft.presentation.audio ?? {})) {
      assert.ok(soundIds.has(slot.assetId), draft.id + " missing audio: " + slot.assetId);
    }
  }
});

test("Grainou author export unlocks Liane venimeuse as ultimate, without replacing its other skills", async () => {
  const { doc, gitBlob } = await readShowcase("crea_nat_1", "creature");
  assert.equal(gitBlob, "0558908b7fe3ab875946af24d2ce86f009421fcf", "Grainou must match author data exactly");
  assert.equal(doc.draft.id, "crea_nat_1");
  assert.equal(doc.draft.displayName, "Grainou");
  assert.ok(doc.draft.skillIds.includes("liane_venimeuse"));
  assert.deepEqual(doc.loadout.slots.map(s => s.skillId), [
    "coupe_feuille", "graine_sansue_cap", "Spore_soporifique",
    "explosion_florale", "liane_venimeuse"
  ]);
  assert.equal(doc.draft.presentation.visual.dodge.assetId, "pack:capture:sprite-fleur-defense-01");
});
