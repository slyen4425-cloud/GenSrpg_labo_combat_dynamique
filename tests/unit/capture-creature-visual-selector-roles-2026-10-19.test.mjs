import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  captureEditorAssetMatchesRoleV1,
  captureEditorCreatureVisualKindV1
} from "../../src/ui/capture-editor-human-v2.js";
import { createCreatorVisualAssetSessionV1 } from "../../src/assets/creator-visual-asset-session-v1.js";

const compatible = { uses: ["combat", "capture", "editor"] };
const make = (id, category, assetType, tags = []) =>
  ({ id, category, assetType, tags, mediaType: "image", compatibility: compatible });

test("creature movement and attack menus never include skill projectiles or cast/impact VFX", () => {
  const fireball = make("fireball", "travel", "sprite", ["skill", "fire", "projectile"]);
  const cast = make("cast", "release", "sprite", ["skill", "fire", "cast"]);
  const impact = make("impact", "impact", "fx", ["skill", "fire"]);
  const roll = make("roll", "creature", "sprite", ["creature", "scarabacier", "movement", "roll"]);
  const attack = make("attack", "creature", "sprite", ["creature", "scarabacier", "attack", "animated"]);
  const model = make("model", "creature", "sprite", ["creature", "scarabacier", "opponent"]);

  for (const fx of [fireball, cast, impact]) {
    assert.equal(captureEditorAssetMatchesRoleV1(fx, "movement"), false);
    assert.equal(captureEditorAssetMatchesRoleV1(fx, "attack"), false);
  }
  assert.equal(captureEditorAssetMatchesRoleV1(roll, "movement"), true);
  assert.equal(captureEditorAssetMatchesRoleV1(roll, "attack"), false);
  assert.equal(captureEditorAssetMatchesRoleV1(attack, "attack"), true);
  assert.equal(captureEditorAssetMatchesRoleV1(attack, "movement"), false);
  assert.equal(captureEditorAssetMatchesRoleV1(model, "attack"), true, "static fallback");
  assert.equal(captureEditorAssetMatchesRoleV1(model, "movement"), true, "static fallback");
  assert.equal(captureEditorCreatureVisualKindV1(roll), "movement");
  assert.equal(captureEditorCreatureVisualKindV1(attack), "attack");
  assert.equal(captureEditorCreatureVisualKindV1(model), "model");
});

test("creator visual import has independent attack role without breaking older movement imports", () => {
  const session = createCreatorVisualAssetSessionV1({
    createObjectURL: file => "blob:" + file.name,
    revokeObjectURL: () => {},
    createId: (() => { let n = 0; return () => String(++n); })()
  });
  const file = { name: "attack.png", type: "image/png", size: 100 };
  const attack = session.importImage({ file, label: "Attaque", role: "attack" });
  const movement = session.importImage({ file, label: "Déplacement", role: "movement" });
  assert.equal(attack.category, "creature");
  assert.ok(attack.tags.includes("attack"));
  assert.equal(movement.category, "movement");
  assert.equal(captureEditorAssetMatchesRoleV1(attack, "attack"), true);
  assert.equal(captureEditorAssetMatchesRoleV1(movement, "movement"), true);
  session.dispose();
});

test("HTML explicitly assigns different UI selectors and import role", () => {
  const html = readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8");
  assert.match(html, /data-creature-movement-visual data-asset-role="movement"/);
  assert.match(html, /data-creature-ranged-attack-visual data-asset-role="attack"/);
  assert.match(html, /<option value="attack">Animation d’attaque de créature<\/option>/);
});
