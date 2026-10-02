import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  opaqueMaskFromRgba,
  watchVisibleModelContact
} from "../../src/adapters/renderer/dom-visible-model-contact.js";

function solidMask() {
  const width = 3;
  const height = 3;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    data[index * 4 + 3] = 255;
  }
  return opaqueMaskFromRgba({ width, height, data });
}

function snap(left) {
  return Object.freeze({
    mask: solidMask(),
    origin: Object.freeze({ x: left, y: 0 }),
    axisX: Object.freeze({ x: left + 20, y: 0 }),
    axisY: Object.freeze({ x: left, y: 20 })
  });
}

function sequenceModel(sequence) {
  let index = 0;
  return {
    snapshot() {
      const value =
        sequence[Math.min(index, sequence.length - 1)];
      index += 1;
      return value;
    }
  };
}

test("approach contact watcher reports a continuous model crossing exactly once", () => {
  let frame = null;
  let scheduled = 0;
  let cancelled = 0;
  const contacts = [];

  const sourceModel = sequenceModel([
    snap(0),
    snap(90)
  ]);
  const targetModel = sequenceModel([
    snap(45),
    snap(45)
  ]);

  const handle = watchVisibleModelContact({
    sourceModel,
    targetModel,
    continuous: true,
    requestFrame(callback) {
      frame = callback;
      scheduled += 1;
      return scheduled;
    },
    cancelFrame() {
      cancelled += 1;
    },
    onContact() {
      contacts.push("contact");
    }
  });

  assert.equal(typeof frame, "function");
  frame();

  assert.deepEqual(contacts, ["contact"]);
  assert.equal(handle.active, false);
  assert.equal(scheduled, 1);
  assert.equal(cancelled, 0);
});

test("teleport watcher never sweeps through invisible space and waits for real overlap", () => {
  let frame = null;
  let scheduled = 0;
  const contacts = [];

  const sourceModel = sequenceModel([
    snap(0),
    snap(90),
    snap(45)
  ]);
  const targetModel = sequenceModel([
    snap(45),
    snap(45),
    snap(45)
  ]);

  const handle = watchVisibleModelContact({
    sourceModel,
    targetModel,
    continuous: false,
    requestFrame(callback) {
      frame = callback;
      scheduled += 1;
      return scheduled;
    },
    cancelFrame() {},
    onContact() {
      contacts.push("contact");
    }
  });

  frame();
  assert.equal(contacts.length, 0);
  assert.equal(handle.active, true);

  frame();
  assert.deepEqual(contacts, ["contact"]);
  assert.equal(handle.active, false);
});

test("contact abilities and projectiles converge on one Runtime contact API in both clients", async () => {
  const [presenter, demo, duel, coop] = await Promise.all([
    readFile(
      new URL(
        "../../src/adapters/renderer/combat-resolution-presenter.js",
        import.meta.url
      ),
      "utf8"
    ),
    readFile(
      new URL("../../src/ui/demo-app.js", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../../src/ui/combat-test-ui.js", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../../src/ui/combat-2v2-test-ui.js", import.meta.url),
      "utf8"
    )
  ]);

  assert.match(
    demo,
    /playApproachFor[\s\S]*watchVisibleModelContact[\s\S]*slot\.collisionModel[\s\S]*target\.collisionModel/
  );
  assert.match(
    demo,
    /continuous:\s*approachMode\s*!==\s*"teleport"/
  );

  assert.match(
    presenter,
    /onActionContact[\s\S]*playApproachFor[\s\S]*onContact[\s\S]*skillId/
  );

  for (const source of [duel, coop]) {
    const genericCalls =
      source.match(/runtime\?\.reportActionContact\(contact\)/g) ?? [];
    assert.ok(
      genericCalls.length >= 2,
      "projectile sensor and moving-contact sensor must share reportActionContact()"
    );
    assert.doesNotMatch(
      source,
      /reportProjectileContact/
    );
  }
});
