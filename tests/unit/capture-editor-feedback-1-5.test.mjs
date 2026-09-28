import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeCreaturePresentationBindingV1
} from "../../src/contracts/creature-presentation-binding-v1.js";

function presentationInput() {
  return {
    id: "creature:test",
    version: 1,
    subjectType: "creature",
    subjectId: "crea-test",
    profileId: "quadruped",
    displayScale: 1.35,
    projectileSocketId: "projectile",
    visual: {
      front: {
        assetId: "capture:test-front"
      },
      back: {
        assetId: "capture:test-back"
      },
      icon: {
        assetId: "capture:test-icon"
      }
    },
    sockets: [
      {
        id: "projectile",
        label: "Projectile",
        front: { x: 0.62, y: 0.31 },
        back: { x: 0.38, y: 0.3 }
      }
    ],
    audio: {}
  };
}

test("CreaturePresentationBinding owns creature scale and projectile socket", () => {
  const value = normalizeCreaturePresentationBindingV1(
    presentationInput()
  );

  assert.equal(value.displayScale, 1.35);
  assert.equal(value.projectileSocketId, "projectile");
  assert.equal(
    value.sockets.find((socket) => socket.id === value.projectileSocketId)?.id,
    "projectile"
  );
});

test("CreaturePresentationBinding rejects unknown projectile socket references", () => {
  const input = presentationInput();
  input.projectileSocketId = "mouth";

  assert.throws(
    () => normalizeCreaturePresentationBindingV1(input),
    /projectileSocketId/i
  );
});

test("private audio metadata catalog exposes all classified sounds without private paths", async () => {
  const raw = await readFile(
    new URL(
      "../../data/presentation/audio/private-audio-catalog.v1.json",
      import.meta.url
    ),
    "utf8"
  );
  const catalog = JSON.parse(raw);

  assert.equal(catalog.schema, "gensrpg-private-audio-metadata-v1");
  assert.equal(catalog.entries.length, 173);
  assert.equal(
    new Set(catalog.entries.map((entry) => entry.assetId)).size,
    173
  );

  for (const entry of catalog.entries) {
    assert.equal(typeof entry.assetId, "string");
    assert.equal(typeof entry.label, "string");
    assert.equal(Array.isArray(entry.roles), true);
    assert.equal(typeof entry.category, "string");
    assert.equal("sourcePath" in entry, false);
    assert.equal("url" in entry, false);
    assert.equal("token" in entry, false);
  }
});

test("native Capture skill catalog contains every programmed lab skill", async () => {
  const raw = await readFile(
    new URL(
      "../../data/combat/skills/catalog.v1.json",
      import.meta.url
    ),
    "utf8"
  );
  const catalog = JSON.parse(raw);

  assert.equal(catalog.schema, "gensrpg-combat-skill-catalog-v1");
  assert.deepEqual(
    catalog.entries.map((entry) => entry.id).sort(),
    [
      "aerial-dive",
      "claw",
      "contact-counter",
      "dodge",
      "fire-immunity",
      "fireball",
      "mirror-shield",
      "stun-bolt",
      "teleport-strike"
    ].sort()
  );
});

test("human editor removes duplicated skill socket and keeps PV in creature panel", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    html.includes("data-skill-socket"),
    false,
    "skill editor must not own a second projectile socket"
  );
  assert.equal(
    html.includes("data-projectile-socket"),
    true,
    "creature editor must own the projectile socket control/surface"
  );

  const creatureStart = html.indexOf('data-editor-panel="creature"');
  const combatStart = html.indexOf('data-editor-panel="combat"');
  const skillsStart = html.indexOf('data-editor-panel="skills"');

  const creatureHtml = html.slice(creatureStart, combatStart);
  const combatHtml = html.slice(combatStart, skillsStart);

  assert.equal(creatureHtml.includes("data-max-hp"), true);
  assert.equal(creatureHtml.includes("data-initial-hp"), true);
  assert.equal(combatHtml.includes("data-max-hp"), false);
  assert.equal(combatHtml.includes("data-initial-hp"), false);

  assert.equal(
    html.includes("data-creature-display-scale"),
    true,
    "creature editor must expose display scale"
  );
  assert.equal(
    html.includes("data-skill-library"),
    true,
    "skill editor must expose native skill library"
  );
});

test("human editor source loads classified audio and native skill catalogs", async () => {
  const source = await readFile(
    new URL(
      "../../src/ui/capture-editor-human-v2.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    source,
    /private-audio-catalog\.v1\.json/
  );
  assert.match(
    source,
    /skills\/catalog\.v1\.json/
  );
  assert.equal(
    source.includes("data-skill-socket"),
    false
  );
});
