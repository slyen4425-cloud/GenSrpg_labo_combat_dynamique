import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const audioCatalogUrl = new URL(
  "../../data/presentation/audio/global-audio-metadata.v1.json",
  import.meta.url
);
const skillCatalogUrl = new URL(
  "../../data/combat/skills/skill-catalog.v1.json",
  import.meta.url
);

test("editor audio metadata catalog exposes classified IDs without private source paths", async () => {
  const raw = JSON.parse(await readFile(audioCatalogUrl, "utf8"));

  assert.equal(raw.version, 1);
  assert.equal(raw.catalog, "gensrpg-global-audio-metadata");
  assert.equal(raw.entries.length, 173);

  for (const entry of raw.entries) {
    assert.match(entry.assetId, /^gensrpg:sound:/);
    assert.equal(Array.isArray(entry.roles), true);
    assert.equal("sourcePath" in entry, false);
    assert.equal("runtimePath" in entry, false);
    assert.equal("url" in entry, false);
  }
});

test("editor skill catalog reuses multiple existing SkillDefinition files", async () => {
  const raw = JSON.parse(await readFile(skillCatalogUrl, "utf8"));
  const ids = raw.entries.map((entry) => entry.id);

  assert.equal(ids.includes("fireball"), true);
  assert.equal(ids.includes("claw"), true);
  assert.equal(ids.includes("aerial-dive"), true);
  assert.equal(ids.includes("teleport-strike"), true);
  assert.equal(ids.length > 4, true);
});

test("human editor UI loads audio metadata and the skill catalog without private repository URLs", async () => {
  const source = await readFile(
    new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url),
    "utf8"
  );

  assert.equal(
    source.includes("global-audio-metadata.v1.json"),
    true
  );
  assert.equal(
    source.includes("skill-catalog.v1.json"),
    true
  );
  assert.equal(
    source.includes("GenSrpG_audio_prive"),
    false
  );
  assert.equal(
    source.includes("raw.githubusercontent.com/slyen4425-cloud/GenSrpG_audio_prive"),
    false
  );
});

test("PV controls belong to the creature panel, not the combat panel", async () => {
  const html = await readFile(
    new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url),
    "utf8"
  );

  const creatureStart = html.indexOf('data-editor-panel="creature"');
  const combatStart = html.indexOf('data-editor-panel="combat"');
  const skillsStart = html.indexOf('data-editor-panel="skills"');
  const maxHp = html.indexOf("data-max-hp");
  const initialHp = html.indexOf("data-initial-hp");

  assert.equal(creatureStart >= 0, true);
  assert.equal(combatStart > creatureStart, true);
  assert.equal(skillsStart > combatStart, true);
  assert.equal(maxHp > creatureStart && maxHp < combatStart, true);
  assert.equal(initialHp > creatureStart && initialHp < combatStart, true);
  assert.equal(
    html.slice(combatStart, skillsStart).includes("data-max-hp"),
    false
  );
});

test("skill projectile origin is a reference to configured creature sockets, not a second socket editor", async () => {
  const html = await readFile(
    new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url),
    "utf8"
  );
  const source = await readFile(
    new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url),
    "utf8"
  );

  assert.equal(
    html.includes("data-skill-socket"),
    true
  );
  assert.equal(
    html.includes("Point de départ utilisé"),
    true
  );
  const skillSocketStart = html.indexOf("data-skill-socket");
  const skillSocketEnd = html.indexOf("</select>", skillSocketStart);
  const skillSocketMarkup = html.slice(
    skillSocketStart,
    skillSocketEnd
  );

  assert.equal(
    skillSocketMarkup.includes('<option value="mouth"'),
    false
  );
  assert.equal(
    source.includes("syncSkillSocketOptions"),
    true
  );
});
