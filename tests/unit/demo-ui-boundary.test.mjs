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
});

test("both creatures enter idle by default and transient actions return to idle", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(source, /function startIdleFor/);
  assert.match(source, /startIdleFor\("player"\)/);
  assert.match(source, /startIdleFor\("opponent"\)/);
  assert.match(source, /type !== "idle"[\s\S]*startIdleFor\(slotKey\)/);
});

test("demo page is mobile-first and keeps optional laboratory file inputs", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");

  assert.match(html, /name="viewport"/);
  assert.match(html, /data-combat-arena/);
  assert.match(html, /data-demo-file="player"/);
  assert.match(html, /data-demo-file="opponent"/);
  assert.match(html, /data-demo-event="idle"/);
  assert.match(html, /data-demo-event="attack"/);
  assert.match(html, /data-demo-event="hit"/);
  assert.match(html, /data-demo-event="ko"/);
  assert.match(html, /src="\.\/demo\.js"/);
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

test("demo bootstrap disposes combat and visual controllers on pagehide", async () => {
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

test("combat test UI delegates rules and timing to session/runtime", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(source, /createCombatSession/);
  assert.match(source, /createCombatRuntime/);
  assert.match(source, /createCombatResolutionPresenter/);
  assert.match(source, /createDomSkillFxRenderer/);
  assert.match(source, /createDomDistancePresenter/);
  assert.match(source, /session\.previewMovement/);
  assert.match(source, /session\.previewSkill/);
  assert.match(source, /session\.move/);
  assert.match(source, /runtime\.startSkill/);
  assert.match(source, /runtime\.react/);

  assert.doesNotMatch(source, /resolveMovement/);
  assert.doesNotMatch(source, /resolveSkill/);
  assert.doesNotMatch(source, /movementEnergyCost/);
  assert.doesNotMatch(source, /distanceSteps/);
  assert.doesNotMatch(source, /energyChargeIntervalMs\s*:/);
  assert.doesNotMatch(source, /chargeTimeModifierPct\s*:/);
});

test("live combat interface keeps arena abilities energy and reactions together while test settings stay below", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");

  assert.match(html, /class="combat-live"/);
  assert.match(html, /class="arena"/);
  assert.match(html, /class="combat-dock"/);
  assert.match(html, /data-combat-energy="maraileron"/);
  assert.match(html, /data-combat-energy="braisombre"/);
  assert.match(html, /data-combat-move="short"/);
  assert.match(html, /data-combat-move="medium"/);
  assert.match(html, /data-combat-move="long"/);
  assert.match(html, /data-combat-skills/);
  assert.match(html, /data-combat-reactions/);
  assert.match(html, /data-combat-live-status/);
  assert.match(html, /class="test-settings"/);
  assert.match(html, /data-combat-mover/);
  assert.match(html, /data-combat-reset/);

  const dockStart = html.indexOf('class="combat-dock"');
  const settingsStart = html.indexOf('class="test-settings"');
  const moverStart = html.indexOf("data-combat-mover");
  assert.ok(dockStart >= 0);
  assert.ok(settingsStart > dockStart);
  assert.ok(moverStart > settingsStart);

  assert.doesNotMatch(html, /data-combat-distance-value/);
  assert.doesNotMatch(html, /data-combat-band/);
  assert.doesNotMatch(html, /data-combat-advance/);
  assert.doesNotMatch(html, /data-combat-reaction="/);
});

test("every generated ability card owns a visible charge progress bar", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(source, /skill-card__charge/);
  assert.match(source, /charge\.max = 1/);
  assert.match(source, /charge\.value = 0/);
  assert.match(source, /progress\.chargeProgress/);
  assert.match(source, /progress\.reaction\.progress/);
});

test("CSS no longer moves both fighters from a shared distance selector", async () => {
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.doesNotMatch(css, /arena\[data-combat-distance/);
  assert.match(css, /\.fighter\s*\{[\s\S]*transition:\s*left/);
});


test("prominent fighter charge bars mirror runtime progress below creature names", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(html, /data-combat-actor-charge="maraileron"/);
  assert.match(html, /data-combat-actor-charge="braisombre"/);
  assert.match(html, /fighter__caption[\s\S]*data-demo-label[\s\S]*data-combat-actor-charge="maraileron"/);
  assert.match(source, /function setActorCharge/);
  assert.match(source, /progress\.chargeProgress/);
  assert.match(source, /progress\.reaction\.progress/);
  assert.match(source, /setActorCharge\(\s*"maraileron"/);
  assert.match(source, /setActorCharge\(\s*"braisombre"/);
  assert.match(source, /onRelease[\s\S]*setActorCharge\("maraileron", 0, false\)/);
});

test("scene scale is owned by distance presenter through one CSS variable", async () => {
  const source = await readFile(
    "src/adapters/renderer/dom-distance-presenter.js",
    "utf8"
  );
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(source, /--distance-scale/);
  assert.match(source, /short:[\s\S]*scale: 1\.00/);
  assert.match(source, /medium:[\s\S]*scale: 0\.96/);
  assert.match(source, /long:[\s\S]*scale: 0\.90/);
  assert.match(css, /scale\(var\(--distance-scale, 0\.96\)\)/);
  assert.doesNotMatch(css, /arena\[data-combat-distance/);
});
