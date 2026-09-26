import test from "node:test";
import assert from "node:assert/strict";

import {
  createImageSourceManager,
  DEFAULT_ACCEPTED_IMAGE_TYPES
} from "../../src/assets/image-source-manager.js";

test("accepted image types include PNG and WebP", () => {
  assert.equal(DEFAULT_ACCEPTED_IMAGE_TYPES.includes("image/png"), true);
  assert.equal(DEFAULT_ACCEPTED_IMAGE_TYPES.includes("image/webp"), true);
});

test("loading a second image revokes the previous object URL", () => {
  const revoked = [];
  let index = 0;
  const manager = createImageSourceManager({
    createObjectURL() {
      index += 1;
      return `blob:test-${index}`;
    },
    revokeObjectURL(url) {
      revoked.push(url);
    }
  });

  assert.equal(
    manager.load({ type: "image/png", size: 10 }),
    "blob:test-1"
  );
  assert.equal(
    manager.load({ type: "image/webp", size: 20 }),
    "blob:test-2"
  );

  assert.deepEqual(revoked, ["blob:test-1"]);
  assert.equal(manager.currentUrl, "blob:test-2");
});

test("unsupported file is rejected before object URL creation", () => {
  let created = 0;
  const manager = createImageSourceManager({
    createObjectURL() {
      created += 1;
      return "blob:invalid";
    },
    revokeObjectURL() {}
  });

  assert.throws(
    () => manager.load({ type: "application/pdf", size: 10 }),
    /Unsupported image type/
  );
  assert.equal(created, 0);
});

test("dispose revokes the current URL and prevents later reuse", () => {
  const revoked = [];
  const manager = createImageSourceManager({
    createObjectURL() {
      return "blob:last";
    },
    revokeObjectURL(url) {
      revoked.push(url);
    }
  });

  manager.load({ type: "image/png", size: 5 });
  manager.dispose();

  assert.deepEqual(revoked, ["blob:last"]);
  assert.equal(manager.currentUrl, null);
  assert.equal(manager.isDisposed, true);
  assert.throws(
    () => manager.load({ type: "image/png", size: 5 }),
    /disposed/
  );
});
