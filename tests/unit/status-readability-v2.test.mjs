import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createDomStatusFxRenderer
} from "../../src/adapters/renderer/dom-status-fx.js";

function fakeNode() {
  return {
    className: "",
    dataset: {},
    style: {},
    textContent: "",
    title: "",
    children: [],
    ownerDocument: null,
    append(...children) {
      this.children.push(...children);
    },
    remove() {
      this.removed = true;
    }
  };
}

function fakeDocument() {
  const document = {
    createElement() {
      const node = fakeNode();
      node.ownerDocument = document;
      return node;
    }
  };
  return document;
}

test("tint intensity 1 is a direct full-strength overlay, not color blend", async () => {
  const document = fakeDocument();
  const motion = fakeNode();
  const image = fakeNode();
  motion.ownerDocument = document;
  image.ownerDocument = document;
  image.src = "https://example.test/creature.webp";

  const renderer = createDomStatusFxRenderer({
    targetFor() {
      return { motion, image, statusHost: null };
    },
    statusPresentationFor() {
      return {
        mode: "tint",
        tintColor: "#39b54a",
        tintOpacity: 1,
        sprite: null
      };
    }
  });

  renderer.sync({
    fighters: {
      enemy: {
        statusEffects: [{
          stacks: 1,
          definition: {
            id: "poison",
            polarity: "detrimental"
          }
        }]
      }
    }
  });

  const tint = motion.children.find(
    (node) => node.dataset.statusFx === "tint"
  );
  assert.ok(tint);
  assert.equal(tint.style.opacity, "1");
  assert.equal(tint.style.mixBlendMode, "normal");

  const css = await readFile(
    new URL(
      "../../examples/dom-demo/demo.css",
      import.meta.url
    ),
    "utf8"
  );
  const start = css.indexOf(".status-fx--tint {");
  const end = css.indexOf("}", start);
  const block = css.slice(start, end + 1);
  assert.doesNotMatch(
    block,
    /mix-blend-mode:\s*color/
  );
});

test("active detrimental status creates one HUD icon from the same snapshot and removes it when status disappears", () => {
  const document = fakeDocument();
  const motion = fakeNode();
  const image = fakeNode();
  const statusHost = fakeNode();
  motion.ownerDocument = document;
  image.ownerDocument = document;
  statusHost.ownerDocument = document;
  image.src = "https://example.test/creature.webp";

  const renderer = createDomStatusFxRenderer({
    targetFor(actorId) {
      assert.equal(actorId, "enemy");
      return { motion, image, statusHost };
    },
    statusPresentationFor() {
      return null;
    }
  });

  renderer.sync({
    fighters: {
      enemy: {
        statusEffects: [{
          stacks: 1,
          definition: {
            id: "poison",
            polarity: "detrimental"
          }
        }]
      }
    }
  });

  assert.equal(statusHost.children.length, 1);
  const icon = statusHost.children[0];
  assert.equal(icon.dataset.statusFx, "hud-icon");
  assert.equal(icon.dataset.statusId, "poison");
  assert.equal(icon.dataset.polarity, "detrimental");
  assert.equal(icon.children[0].className, "status-icon__glyph");
  assert.equal(icon.children[0].textContent, "−");

  renderer.sync({
    fighters: {
      enemy: {
        statusEffects: []
      }
    }
  });

  assert.equal(icon.removed, true);
  renderer.dispose();
});

test("status HUD icon reuses configured status sprite and displays real stack count", () => {
  const document = fakeDocument();
  const motion = fakeNode();
  const image = fakeNode();
  const statusHost = fakeNode();
  motion.ownerDocument = document;
  image.ownerDocument = document;
  statusHost.ownerDocument = document;
  image.src = "https://example.test/creature.webp";

  const renderer = createDomStatusFxRenderer({
    targetFor() {
      return { motion, image, statusHost };
    },
    statusPresentationFor() {
      return {
        mode: "sprite",
        tintColor: "#39b54a",
        tintOpacity: 0.5,
        sprite: {
          assetId: "pack:capture:poison",
          url: "https://example.test/poison.webp",
          displayScale: 1,
          opacity: 1
        }
      };
    }
  });

  renderer.sync({
    fighters: {
      ally: {
        statusEffects: [{
          stacks: 3,
          definition: {
            id: "poison",
            polarity: "detrimental"
          }
        }]
      }
    }
  });

  const icon = statusHost.children[0];
  assert.match(
    icon.style.backgroundImage,
    /poison\.webp/
  );
  assert.equal(icon.dataset.stacks, "3");
  assert.equal(icon.children.length, 2);
  assert.equal(icon.children[0].className, "status-icon__glyph");
  assert.equal(icon.children[0].textContent, "");
  assert.equal(icon.children[1].className, "status-icon__stack");
  assert.equal(icon.children[1].textContent, "3");
});

test("buff/debuff HUD hosts exist below HP in both real 1v1 and 2v2 previews", async () => {
  const oneVsOne = await readFile(
    new URL(
      "../../examples/dom-demo/index.html",
      import.meta.url
    ),
    "utf8"
  );
  const twoVsTwo = await readFile(
    new URL(
      "../../examples/dom-demo/coop-2v2.html",
      import.meta.url
    ),
    "utf8"
  );

  for (const actorId of ["player", "opponent"]) {
    assert.match(
      oneVsOne,
      new RegExp(
        'data-combat-status-icons="' + actorId + '"'
      )
    );
  }

  for (const actorId of [
    "player",
    "ally",
    "opponent",
    "opponent-b"
  ]) {
    assert.match(
      twoVsTwo,
      new RegExp(
        'data-combat-status-icons="' + actorId + '"'
      )
    );
  }
});

test("1v1 and 2v2 pass the HP status host to the single DOM status renderer", async () => {
  for (const relative of [
    "src/ui/combat-test-ui.js",
    "src/ui/combat-2v2-test-ui.js"
  ]) {
    const source = await readFile(
      new URL("../../" + relative, import.meta.url),
      "utf8"
    );

    assert.match(
      source,
      /statusHost/
    );
    assert.match(
      source,
      /data-combat-status-icons/
    );
    assert.match(
      source,
      /createDomStatusFxRenderer/
    );
  }
});


test("beneficial status produces a buff icon from the same status snapshot", () => {
  const document = fakeDocument();
  const motion = fakeNode();
  const image = fakeNode();
  const statusHost = fakeNode();
  motion.ownerDocument = document;
  image.ownerDocument = document;
  statusHost.ownerDocument = document;
  image.src = "https://example.test/creature.webp";

  const renderer = createDomStatusFxRenderer({
    targetFor() {
      return { motion, image, statusHost };
    },
    statusPresentationFor() {
      return null;
    }
  });

  renderer.sync({
    fighters: {
      ally: {
        statusEffects: [{
          stacks: 1,
          definition: {
            id: "speed-up",
            polarity: "beneficial"
          }
        }]
      }
    }
  });

  const icon = statusHost.children[0];
  assert.equal(icon.dataset.polarity, "beneficial");
  assert.equal(icon.children[0].textContent, "+");
  renderer.dispose();
});
