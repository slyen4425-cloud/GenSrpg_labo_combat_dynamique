import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  syncCaptureSkillSocketOptionsV1
} from "../../src/ui/capture-editor-human-v2.js";

test("human editor owns health through the stat surface without duplicate HP controls", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    (html.match(/data-max-hp/g) ?? []).length,
    0
  );
  assert.equal(
    (html.match(/data-initial-hp/g) ?? []).length,
    0
  );
  assert.match(html, /data-stat-values-host/);
  assert.match(html, /Santé \/ PV/);
});

test("skill socket selector contains no hardcoded creature socket ids", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  const match = html.match(
    /<select data-skill-socket>([\s\S]*?)<\/select>/
  );
  assert.ok(match);

  const block = match[1];

  for (const forbidden of [
    'value="mouth"',
    'value="head"',
    'value="right-hand"',
    'value="left-hand"',
    'value="tail"'
  ]) {
    assert.equal(
      block.includes(forbidden),
      false,
      `skill socket selector must not hardcode ${forbidden}`
    );
  }

  assert.match(block, /Centre par défaut/);
});

test("skill socket options derive only from actual creature sockets", () => {
  const existingOptions = [
    { value: "", label: "Centre par défaut" }
  ];

  const result = syncCaptureSkillSocketOptionsV1({
    existingValue: "mouth",
    existingOptions,
    sockets: [
      {
        id: "mouth",
        label: "Bouche",
        front: { x: 0.5, y: 0.25 },
        back: null
      },
      {
        id: "tail",
        label: "Queue",
        front: { x: 0.35, y: 0.75 },
        back: { x: 0.6, y: 0.7 }
      }
    ]
  });

  assert.deepEqual(
    result.options,
    [
      { value: "", label: "Centre par défaut" },
      { value: "mouth", label: "Bouche" },
      { value: "tail", label: "Queue" }
    ]
  );
  assert.equal(result.value, "mouth");

  const stale = syncCaptureSkillSocketOptionsV1({
    existingValue: "head",
    existingOptions,
    sockets: [
      {
        id: "mouth",
        label: "Bouche",
        front: { x: 0.5, y: 0.25 },
        back: null
      }
    ]
  });

  assert.equal(stale.value, "");
});

test("generic Buff / Debuff creation is enabled only through the tactical effects surface", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(
    html,
    /<option value="buff_debuff">Buff \/ Debuff<\/option>/
  );
  assert.match(
    html,
    /data-skill-effects-host/
  );
  assert.match(
    html,
    /data-skill-effect-add/
  );
});

test("ownership cleanup does not add hidden duplicate state", async () => {
  const html = await readFile(
    new URL(
      "../../examples/dom-demo/capture-editor-v2.html",
      import.meta.url
    ),
    "utf8"
  );

  assert.equal(
    /type=["']hidden["'][^>]*(?:data-max-hp|data-initial-hp|data-skill-socket)/.test(
      html
    ),
    false
  );
});
