import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  skillSocketChoicesFromCreatureSocketsV1
} from "../../src/ui/capture-editor-human-v2.js";

test("skill socket choices are derived only from creature sockets", () => {
  assert.deepEqual(
    skillSocketChoicesFromCreatureSocketsV1([
      {
        id: "mouth",
        label: "Bouche",
        front: { x: 0.5, y: 0.2 },
        back: null
      },
      {
        id: "tail",
        label: "Queue",
        front: { x: 0.3, y: 0.7 },
        back: { x: 0.7, y: 0.7 }
      }
    ]),
    [
      { id: "", label: "Centre par défaut" },
      { id: "mouth", label: "Bouche" },
      { id: "tail", label: "Queue" }
    ]
  );
});

test("skill socket choices never invent predefined creature sockets", () => {
  assert.deepEqual(
    skillSocketChoicesFromCreatureSocketsV1([]),
    [{ id: "", label: "Centre par défaut" }]
  );
});

test("human editor places HP controls only in the creature panel", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  const creatureStart = html.indexOf('data-editor-panel="creature"');
  const combatStart = html.indexOf('data-editor-panel="combat"');
  const skillsStart = html.indexOf('data-editor-panel="skills"');

  assert.ok(creatureStart >= 0);
  assert.ok(combatStart > creatureStart);
  assert.ok(skillsStart > combatStart);

  const creaturePanel = html.slice(creatureStart, combatStart);
  const combatPanel = html.slice(combatStart, skillsStart);

  assert.equal(
    (html.match(/data-max-hp/g) ?? []).length,
    1,
    "max HP must have one UI owner"
  );
  assert.equal(
    (html.match(/data-initial-hp/g) ?? []).length,
    1,
    "initial HP must have one UI owner"
  );

  assert.equal(creaturePanel.includes("data-max-hp"), true);
  assert.equal(creaturePanel.includes("data-initial-hp"), true);
  assert.equal(combatPanel.includes("data-max-hp"), false);
  assert.equal(combatPanel.includes("data-initial-hp"), false);
});

test("human editor skill socket select does not hardcode creature socket ids", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  const marker = "data-skill-socket";
  const start = html.indexOf(marker);
  assert.ok(start >= 0);

  const selectStart = html.lastIndexOf("<select", start);
  const selectEnd = html.indexOf("</select>", start);
  const fragment = html.slice(selectStart, selectEnd);

  assert.equal(fragment.includes('value="mouth"'), false);
  assert.equal(fragment.includes('value="head"'), false);
  assert.equal(fragment.includes('value="right-hand"'), false);
  assert.equal(fragment.includes('value="left-hand"'), false);
  assert.equal(fragment.includes('value="tail"'), false);
});

test("generic Buff / Debuff creation is explicit but unavailable until Status Effect exists", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    html,
    /option[^>]+value="buff_debuff"[^>]+disabled[^>]+data-requires-status-effect/
  );
  assert.match(html, /Status Effect/i);
});
