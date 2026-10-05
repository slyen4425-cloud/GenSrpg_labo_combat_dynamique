import test from "node:test";
import assert from "node:assert/strict";

import {
  createCreatorVisualAssetSessionV1
} from "../../src/assets/creator-visual-asset-session-v1.js";

test("creator visual asset session imports user images as editor/combat AssetDefinitions and cleans URLs", () => {
  const created = [];
  const revoked = [];
  const ids = ["alpha", "beta"];

  const session = createCreatorVisualAssetSessionV1({
    createObjectURL(file) {
      const url = "blob:test-" + file.name;
      created.push(url);
      return url;
    },
    revokeObjectURL(url) {
      revoked.push(url);
    },
    createId() {
      return ids.shift();
    }
  });

  const creature = session.importImage({
    file: { name: "dragon.png", type: "image/png", size: 128 },
    label: "Mon dragon",
    role: "creature"
  });
  const projectile = session.importImage({
    file: { name: "feu.webp", type: "image/webp", size: 256 },
    label: "Mon projectile feu",
    role: "travel"
  });

  assert.equal(creature.id, "user:alpha");
  assert.equal(creature.assetType, "portrait");
  assert.equal(creature.mediaType, "image");
  assert.equal(creature.category, "creature");
  assert.deepEqual(creature.tags, ["creator", "creature"]);
  assert.deepEqual(creature.compatibility.uses, ["combat", "capture", "editor"]);
  assert.equal(creature.resource.runtimeUrl, "blob:test-dragon.png");
  assert.equal(creature.resource.mime, "image/png");

  assert.equal(projectile.id, "user:beta");
  assert.equal(projectile.assetType, "sprite");
  assert.equal(projectile.category, "travel");
  assert.equal(projectile.resource.runtimeUrl, "blob:test-feu.webp");

  assert.equal(session.asset("user:alpha"), creature);
  assert.deepEqual(session.list().map((asset) => asset.id), ["user:alpha", "user:beta"]);

  assert.throws(
    () => session.importImage({
      file: { name: "bad.svg", type: "image/svg+xml", size: 20 },
      label: "SVG",
      role: "impact"
    }),
    /Unsupported image type/
  );
  assert.throws(
    () => session.importImage({
      file: { name: "x.png", type: "image/png", size: 20 },
      label: "X",
      role: "unknown"
    }),
    /Unsupported creator visual role/
  );

  session.dispose();
  assert.deepEqual(revoked.sort(), created.sort());
  assert.equal(session.isDisposed, true);
  assert.throws(
    () => session.importImage({
      file: { name: "late.png", type: "image/png", size: 20 },
      label: "Late",
      role: "impact"
    }),
    /disposed/
  );
});
