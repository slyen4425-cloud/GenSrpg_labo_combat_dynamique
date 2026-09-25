import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("visual controller keeps animation authority in Core and renderer", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(source, /normalizeCombatVisualEvent/);
  assert.match(source, /planAnimation/);
  assert.match(source, /createDomActorRenderer/);
  assert.doesNotMatch(source, /\.animate\s*\(/);
  assert.doesNotMatch(source, /durationMs\s*:/);
  assert.doesNotMatch(source, /translateX\s*:/);
});

test("visual controller can replace a slot creature without owning combat rules", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(source, /function setCreatureFor/);
  assert.match(source, /slot\.setCreature\(meta, displayName\)/);
  assert.match(source, /function setSlotVisible/);
  assert.match(source, /function getCreatureDescriptor/);
  assert.match(source, /runtimePreview\?\.\[view\]/);
  assert.match(source, /startIdleFor\(slotKey\)/);

  assert.doesNotMatch(source, /energyCost/);
  assert.doesNotMatch(source, /movementEnergyPerStep/);
  assert.doesNotMatch(source, /resolveSkill/);
});

test("both visual slots start idle, transient actions return idle, KO does not restart defeated idle", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(source, /startIdleFor\("player"\)/);
  assert.match(source, /startIdleFor\("opponent"\)/);
  assert.match(source, /!\["idle", "ko"\]\.includes\(type\)/);
  assert.match(source, /startIdleFor\(slotKey\)/);
});

test("game page is mobile-first and contains only player-facing combat controls", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");

  assert.match(html, /name="viewport"/);
  assert.match(html, /class="game"/);
  assert.match(html, /data-combat-arena/);
  assert.match(html, /data-combat-skills/);
  assert.match(html, /data-combat-items/);
  assert.match(html, /data-combat-team-actions/);
  assert.match(html, /data-roster-reserve="player"/);
  assert.match(html, /data-roster-reserve="opponent"/);
  assert.match(html, /data-combat-move="short"/);
  assert.match(html, /data-combat-move="medium"/);
  assert.match(html, /data-combat-move="long"/);

  assert.doesNotMatch(html, /Réglages du test/);
  assert.doesNotMatch(html, /Outils visuels du laboratoire/);
  assert.doesNotMatch(html, /data-combat-simulate-stun/);
  assert.doesNotMatch(html, /data-demo-event/);
  assert.doesNotMatch(html, /data-demo-file/);
  assert.doesNotMatch(html, /data-demo-target/);
  assert.doesNotMatch(html, /data-demo-intensity/);
  assert.doesNotMatch(html, /data-combat-reactions/);
  assert.doesNotMatch(html, /data-combat-mover/);
});

test("V8 keeps the complete player HUD inside a fullscreen combat arena", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(
    html,
    /<section class="arena"[^>]*data-combat-arena[\s\S]*data-combat-skills[\s\S]*data-combat-items[\s\S]*data-combat-team-actions[\s\S]*<\/section>/
  );
  assert.match(html, /data-combat-name="player"/);
  assert.match(html, /data-combat-name="opponent"/);
  assert.match(html, /class="combat-controls"/);

  assert.match(css, /\.game\s*\{[\s\S]*height:\s*100svh/);
  assert.match(css, /\.arena\s*\{[\s\S]*height:\s*100%/);
  assert.match(css, /\.combat-controls\s*\{[\s\S]*position:\s*absolute/);
  assert.match(css, /\.combat-card--opponent\s*\{[\s\S]*top:/);
  assert.match(css, /\.combat-card--player\s*\{[\s\S]*bottom:/);
});

test("V8 simplified HUD removes decorative clutter and collapses idle-only surfaces", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.doesNotMatch(html, /combat-topbar/);
  assert.match(html, /class="combat-controls__actions"/);
  assert.match(css, /\.fighter__charge-info\[data-active="false"\][\s\S]*display:\s*none/);
  assert.match(css, /\.fighter__charge-info\[data-active="false"\]\s*\+\s*\.fighter__charge[\s\S]*display:\s*none/);
  assert.match(css, /\.reserve__title\s*\{[\s\S]*display:\s*none/);
  assert.match(css, /\.reserve-card__text\s*\{[\s\S]*display:\s*none/);
  assert.match(css, /\.skill-bar__title\s*\{[\s\S]*display:\s*none/);
  assert.match(css, /\.action-bar--utility\s*\{[\s\S]*grid-template-rows:\s*repeat\(2/);
});

test("V8 reserve portraits stay above HUD cards and fighters use top-based spatial anchors", async () => {
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(css, /\.combat-card\s*\{[\s\S]*z-index:\s*12/);
  assert.match(css, /\.reserve\s*\{[\s\S]*z-index:\s*13/);
  assert.match(css, /\.fighter\s*\{[\s\S]*top:\s*50%/);
  assert.match(css, /transform:\s*translate\(-50%,\s*-50%\)\s*scale\(var\(--distance-scale/);
  assert.match(css, /transition:[\s\S]*top 260ms ease/);
});

test("V8 ability dock stays compact and icon-ready on mobile", async () => {
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(css, /\.skill-bar__grid\s*\{[\s\S]*repeat\(4/);
  assert.match(css, /\.action-option--skill\s*\{[\s\S]*aspect-ratio:\s*1/);
  assert.match(css, /\.action-option--skill span,[\s\S]*display:\s*none/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.combat-controls\s*\{[\s\S]*width:\s*min\(/);
  assert.doesNotMatch(
    css,
    /@media \(max-width: 680px\)[\s\S]*\.skill-bar__grid\s*\{[\s\S]*repeat\(2/
  );
});

test("V8 exposes abilities as permanent game keys while retaining runtime availability", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(html, /class="skill-bar"[\s\S]*data-combat-skills/);
  assert.match(source, /className:\s*"action-option--skill"/);
  assert.match(source, /runtime\.startSkill/);
  assert.match(source, /session\.previewSkill/);
  assert.match(css, /\.action-option--skill/);
  assert.match(css, /touch-action:\s*manipulation/);
});

test("V8 fighter names are projected from roster active members rather than hard-coded combat state", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(html, /data-combat-name="player"/);
  assert.match(html, /data-combat-name="opponent"/);
  assert.match(source, /const fighterNameRefs/);
  assert.match(source, /activeMemberId/);
  assert.match(source, /displayName/);
  assert.doesNotMatch(source, /fighterNameRefs\.player\.textContent\s*=\s*"Marai"/);
  assert.doesNotMatch(source, /fighterNameRefs\.opponent\.textContent\s*=\s*"Drakon"/);
});

test("abilities stay directly visible while items and team remain compact menus", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");

  const menuCount = (html.match(/data-action-menu/g) ?? []).length;
  assert.equal(menuCount, 2);

  assert.match(
    html,
    /<section class="skill-bar"[\s\S]*?data-combat-skills/
  );
  assert.doesNotMatch(
    html,
    /<summary>Capacités<\/summary>/
  );
  assert.match(
    html,
    /<summary>Objets<\/summary>[\s\S]*?data-combat-items/
  );
  assert.match(
    html,
    /<summary>Équipe<\/summary>[\s\S]*?data-combat-team-actions/
  );
});

test("combat UI delegates gameplay to session runtime roster and presenters", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(source, /createCombatSession/);
  assert.match(source, /createCombatRuntime/);
  assert.match(source, /createRosterSession/);
  assert.match(source, /createCombatResolutionPresenter/);
  assert.match(source, /createDomDistancePresenter/);
  assert.match(source, /session\.previewMovement/);
  assert.match(source, /session\.previewSkill/);
  assert.match(source, /runtime\.startSkill/);
  assert.match(source, /runtime\.startCommand/);
  assert.match(source, /roster\.applyCommandResolution/);
  assert.match(source, /visuals\.setCreatureFor/);
  assert.match(source, /visuals\.setSlotVisible/);

  assert.doesNotMatch(source, /resolveMovement/);
  assert.doesNotMatch(source, /resolveSkill/);
  assert.doesNotMatch(source, /resolveCommandStart/);
  assert.doesNotMatch(source, /resolveCommandCompletion/);
  assert.doesNotMatch(source, /movementEnergyCost/);
});

test("recall and summon are real roster changes rather than log-only commands", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");
  const rosterSource = await readFile(
    "src/core/combat/roster-session.js",
    "utf8"
  );

  assert.match(
    source,
    /\["recall", "summon"\]\.includes\([\s\S]*resolution\.commandKind/
  );
  assert.match(source, /roster\.applyCommandResolution/);
  assert.match(source, /visuals\.setSlotVisible\("player", false\)/);
  assert.match(source, /visuals\.setCreatureFor/);

  assert.match(rosterSource, /function recall/);
  assert.match(rosterSource, /function summon/);
  assert.match(rosterSource, /combatSession\.replaceFighter/);
  assert.match(rosterSource, /savedFighter/);
});

test("demo roster is Marai and Drakon versus Drakon and Marai", async () => {
  const roster = JSON.parse(
    await readFile(
      "data/combat/rosters/demo-2v2.roster.json",
      "utf8"
    )
  );

  assert.deepEqual(
    roster.teams.player.members.map((member) => member.displayName),
    ["Marai", "Drakon"]
  );
  assert.deepEqual(
    roster.teams.opponent.members.map((member) => member.displayName),
    ["Drakon", "Marai"]
  );
  assert.equal(
    roster.teams.player.activeMemberId,
    "player-marai"
  );
  assert.equal(
    roster.teams.opponent.activeMemberId,
    "opponent-drakon"
  );
});

test("opponent roster is visible but has no player action controller", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(html, /Réserve adverse/);
  assert.match(source, /reserveCard\(member, "opponent"\)/);
  assert.doesNotMatch(html, /Réactions/);
  assert.doesNotMatch(source, /runtime\.react\(/);
  assert.doesNotMatch(source, /data-combat-reactions/);
});

test("HP energy and charge remain state-driven", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(html, /data-combat-hp="player"/);
  assert.match(html, /data-combat-hp="opponent"/);
  assert.match(html, /data-combat-energy="player"/);
  assert.match(html, /data-combat-actor-charge="player"/);

  assert.match(source, /fighter\.hp/);
  assert.match(source, /fighter\.maxHp/);
  assert.match(source, /fighter\.energy/);
  assert.match(source, /progress\.chargeProgress/);
  assert.doesNotMatch(source, /hp\s*=\s*100/);
});

test("distance presenter keeps explicit diagonal anchors and player z-order", async () => {
  const presenter = await readFile(
    "src/adapters/renderer/dom-distance-presenter.js",
    "utf8"
  );
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(presenter, /ANCHOR_BY_SLOT_AND_DISTANCE/);
  assert.match(
    presenter,
    /player:[\s\S]*long:[\s\S]*x: 0\.16, y: 0\.72[\s\S]*medium:[\s\S]*x: 0\.28, y: 0\.64[\s\S]*short:[\s\S]*x: 0\.39, y: 0\.56/
  );
  assert.match(
    presenter,
    /opponent:[\s\S]*short:[\s\S]*x: 0\.61, y: 0\.40[\s\S]*medium:[\s\S]*x: 0\.72, y: 0\.32[\s\S]*long:[\s\S]*x: 0\.84, y: 0\.24/
  );
  assert.match(css, /\.fighter--player\s*\{[\s\S]*?z-index:\s*4/);
  assert.match(css, /\.fighter--opponent\s*\{[\s\S]*?z-index:\s*3/);
});

test("demo bootstrap disposes combat and visual controllers on pagehide", async () => {
  const source = await readFile("examples/dom-demo/demo.js", "utf8");

  assert.match(source, /mountCombatDemo/);
  assert.match(source, /mountCombatTest/);
  assert.match(source, /pagehide/);
  assert.match(source, /combat\.dispose\(\)/);
  assert.match(source, /visuals\.dispose\(\)/);
});

test("creature metadata keeps runtime player/opponent/icon views", async () => {
  for (const creatureId of ["maraileron", "braisombre"]) {
    const meta = JSON.parse(
      await readFile(
        `assets/test/creatures/${creatureId}/${creatureId}.meta.json`,
        "utf8"
      )
    );

    assert.ok(meta.runtimePreview.player);
    assert.ok(meta.runtimePreview.opponent);
    assert.ok(meta.runtimePreview.icon);
    assert.ok(meta.displayScale.player > meta.displayScale.opponent);
  }
});


test("KO opponent replacement is roster-owned and updates the visual slot after KO presentation", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");
  const rosterSource = await readFile(
    "src/core/combat/roster-session.js",
    "utf8"
  );

  assert.match(rosterSource, /function replaceKnockedOut/);
  assert.match(source, /roster\.replaceKnockedOut\("opponent"\)/);
  assert.match(source, /await presentation\.finished/);
  assert.match(
    source,
    /visuals\.setCreatureFor\(\s*"opponent"/
  );
  assert.match(
    source,
    /visuals\.setSlotVisible\("opponent", false\)/
  );
});

test("visual controller computes target geometry for teleport and aerial moves without gameplay authority", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(source, /function playApproachFor/);
  assert.match(source, /getBoundingClientRect\(\)/);
  assert.match(source, /"teleport-attack"/);
  assert.match(source, /"aerial-attack"/);
  assert.match(source, /targetTranslateX/);
  assert.match(source, /targetTranslateY/);
  assert.doesNotMatch(source, /effect\.damage/);
  assert.doesNotMatch(source, /hpAfter/);
});

test("combat arena is taller while keeping direct reflex ability controls", async () => {
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(css, /min-height:\s*min\(59svh, 35rem\)/);
  assert.match(css, /\.skill-bar__grid\s*\{[\s\S]*repeat\(4/);
  assert.match(css, /\.distance-buttons\s*\{[\s\S]*repeat\(3/);
  assert.match(css, /\.action-bar\s*\{[\s\S]*repeat\(2/);
});


test("primary charge display shows runtime action name and authoritative remaining time", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");
  const runtime = await readFile("src/core/combat/combat-runtime.js", "utf8");
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(html, /data-combat-charge-name="player"/);
  assert.match(html, /data-combat-charge-time="player"/);
  assert.match(runtime, /actionName/);
  assert.match(runtime, /remainingPreparationMs/);
  assert.match(source, /progress\.actionName/);
  assert.match(source, /progress\.remainingPreparationMs/);
  assert.match(css, /\.fighter__charge\s*\{[\s\S]*height:\s*0\.56rem/);
  assert.doesNotMatch(source, /Date\.now/);
  assert.doesNotMatch(source, /setInterval/);
});

test("ground aerial and teleport approaches all use visual target geometry", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");
  const presenter = await readFile(
    "src/adapters/renderer/combat-resolution-presenter.js",
    "utf8"
  );

  assert.match(source, /\["ground", "teleport", "aerial"\]\.includes\(approachMode\)/);
  assert.match(source, /arenaExitTranslateY/);
  assert.match(source, /"ground-attack"/);
  assert.match(presenter, /\["ground", "teleport", "aerial"\]\.includes\(approachMode\)/);
});
