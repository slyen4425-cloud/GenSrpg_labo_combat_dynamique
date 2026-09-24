import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("demo delegates animation authority to Core and renderer", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(source, /normalizeCombatVisualEvent/);
  assert.match(source, /planAnimation/);
  assert.match(source, /createDomActorRenderer/);
  assert.match(source, /createImageSourceManager/);

  assert.doesNotMatch(source, /\.animate\s*\(/);
  assert.doesNotMatch(source, /durationMs\s*:/);
  assert.doesNotMatch(source, /translateX\s*:/);
  assert.doesNotMatch(source, /rotateDeg\s*:/);
});

test("demo loads bundled creatures before optional user replacement", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(source, /runtimePreview/);
  assert.match(source, /new URL\(runtimeAsset, meta\.assetBaseUrl\)/);
  assert.match(source, /rebuildActor\(runtimeUrl\)/);
  assert.match(source, /chargés automatiquement/);
});

test("demo page is mobile-first and keeps optional file inputs", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");

  assert.match(html, /name="viewport"/);
  assert.match(html, /distance \+ énergie \+ capacités typées/i);
  assert.match(html, /optionnel/g);
  assert.match(html, /data-demo-file/g);
  assert.match(html, /data-demo-event="idle"/);
  assert.match(html, /data-demo-event="attack"/);
  assert.match(html, /data-demo-event="hit"/);
  assert.match(html, /data-demo-event="ko"/);
  assert.match(html, /src="\.\/demo\.js"/);
  assert.doesNotMatch(html, /Chargez une vue joueur et une vue adversaire/);
  assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>/);
});

test("runtime preview assets exist in creature metadata", async () => {
  const maraileron = JSON.parse(
    await readFile(
      "assets/test/creatures/maraileron/maraileron.meta.json",
      "utf8"
    )
  );
  const braisombre = JSON.parse(
    await readFile(
      "assets/test/creatures/braisombre/braisombre.meta.json",
      "utf8"
    )
  );

  assert.equal(
    maraileron.runtimePreview.player,
    "runtime/maraileron_player.webp"
  );
  assert.equal(
    braisombre.runtimePreview.opponent,
    "runtime/braisombre_opponent.webp"
  );
  assert.equal(
    maraileron.runtimePreview.opponent,
    "runtime/maraileron_opponent.webp"
  );
  assert.equal(
    maraileron.runtimePreview.icon,
    "runtime/maraileron_icon.webp"
  );
  assert.equal(
    braisombre.runtimePreview.player,
    "runtime/braisombre_player.webp"
  );
  assert.equal(
    braisombre.runtimePreview.icon,
    "runtime/braisombre_icon.webp"
  );
});

test("demo bootstrap disposes the mounted controller on pagehide", async () => {
  const source = await readFile("examples/dom-demo/demo.js", "utf8");

  assert.match(source, /mountCombatDemo/);
  assert.match(source, /mountCombatTest/);
  assert.match(source, /pagehide/);
  assert.match(source, /combat\.dispose\(\)/);
  assert.match(source, /visuals\.dispose\(\)/);
});

test("creature metadata keeps player larger and carries morphology anchors", async () => {
  const maraileron = JSON.parse(
    await readFile(
      "assets/test/creatures/maraileron/maraileron.meta.json",
      "utf8"
    )
  );
  const braisombre = JSON.parse(
    await readFile(
      "assets/test/creatures/braisombre/braisombre.meta.json",
      "utf8"
    )
  );

  assert.ok(maraileron.displayScale.player > maraileron.displayScale.opponent);
  assert.ok(braisombre.displayScale.player > braisombre.displayScale.opponent);
  assert.equal(maraileron.transformOrigin.y, "78%");
  assert.equal(braisombre.transformOrigin.y, "88%");
});

test("demo derives actor scale and anchor from metadata instead of CSS", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(source, /meta\.displayScale\?\.\[view\]/);
  assert.match(source, /transformOrigin: meta\.transformOrigin/);
});


test("combat test UI delegates all rules to the combat session", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(source, /createCombatSession/);
  assert.match(source, /createCombatResolutionPresenter/);
  assert.match(source, /createDomSkillFxRenderer/);
  assert.match(source, /session\.previewMovement/);
  assert.match(source, /session\.previewSkill/);
  assert.match(source, /session\.move/);
  assert.match(source, /session\.useSkill/);

  assert.doesNotMatch(source, /resolveMovement/);
  assert.doesNotMatch(source, /resolveSkill/);
  assert.doesNotMatch(source, /movementEnergyCost/);
  assert.doesNotMatch(source, /distanceSteps/);
  assert.doesNotMatch(source, /movementEnergyPerStep\s*:/);
  assert.doesNotMatch(source, /energyCost\s*:/);
});

test("combat interface exposes distance energy reaction and skill controls", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");

  assert.match(html, /data-combat-distance-value/);
  assert.match(html, /data-combat-energy="maraileron"/);
  assert.match(html, /data-combat-energy="braisombre"/);
  assert.match(html, /data-combat-move="short"/);
  assert.match(html, /data-combat-move="medium"/);
  assert.match(html, /data-combat-move="long"/);
  assert.match(html, /data-combat-reaction/);
  assert.match(html, /data-combat-skills/);
  assert.match(html, /data-combat-advance/);
  assert.match(html, /data-combat-reset/);
});
