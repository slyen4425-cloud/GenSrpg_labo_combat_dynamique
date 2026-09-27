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

test("all declared visual slots start idle, transient actions return idle, KO does not restart defeated idle", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(
    source,
    /for \(const slotKey of Object\.keys\(slots\)\) \{[\s\S]*startIdleFor\(slotKey\)/
  );
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
  assert.doesNotMatch(html, /data-combat-move=/);

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

test("manual distance controls are removed instead of hidden", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");
  const css = await readFile("examples/dom-demo/demo.css", "utf8");
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.doesNotMatch(html, /data-combat-move=/);
  assert.doesNotMatch(html, /distance-buttons/);
  assert.doesNotMatch(css, /\.distance-buttons/);
  assert.doesNotMatch(source, /movementButtons/);
  assert.doesNotMatch(source, /renderMovement\(/);
  assert.doesNotMatch(source, /session\.move\(\s*"player"/);
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

test("V8 never hides the opponent roster container", async () => {
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(
    css,
    /\.reserve--opponent,\s*\.reserve--player\s*\{[\s\S]*inset:\s*auto/
  );
  assert.doesNotMatch(
    css,
    /\.reserve--opponent\s*\{[^}]*display:\s*none/
  );
});

test("fighter HUD orders name then HP then creature icons and charge starts hidden", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(
    html,
    /combat-card--opponent[\s\S]*data-combat-name="opponent"[\s\S]*data-combat-hp="opponent"[\s\S]*data-roster-reserve="opponent"/
  );
  assert.match(
    html,
    /combat-card--player[\s\S]*data-combat-name="player"[\s\S]*data-combat-hp="player"[\s\S]*data-roster-reserve="player"/
  );
  assert.match(
    html,
    /data-combat-charge-name="player"[\s\S]*data-active="false"/
  );
  assert.match(
    html,
    /data-combat-charge-name="opponent"[\s\S]*data-active="false"/
  );
  assert.match(css, /\.reserve\s*\{[\s\S]*position:\s*static/);
  assert.match(css, /\.reserve__list\s*\{[\s\S]*justify-content:\s*flex-start/);
});

test("defeated roster members derive a red-cross indicator from authoritative HP state", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(source, /const defeated = Number\(member\.hp\) <= 0/);
  assert.match(source, /node\.dataset\.defeated = defeated \? "true" : "false"/);
  assert.match(source, /defeated\s*\?\s*"Vaincu"/);
  assert.match(
    css,
    /\.reserve-card\[data-defeated="true"\]::after\s*\{[\s\S]*content:\s*"×"[\s\S]*color:\s*#ff4f4f/
  );
  assert.match(
    css,
    /\.reserve-card\[data-defeated="true"\] \.reserve-card__icon\s*\{[\s\S]*opacity:/
  );
});


test("fighter HUD is enlarged consistently for player and opponent without hiding HP values on narrow screens", async () => {
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(
    css,
    /\.combat-card\s*\{[\s\S]*min-height:\s*clamp\(5rem, 11vw, 6\.5rem\)/
  );
  assert.match(
    css,
    /\.fighter__hp\s*\{[\s\S]*height:\s*0\.6rem/
  );
  assert.match(
    css,
    /\.reserve-card\s*\{[\s\S]*width:\s*clamp\(1\.65rem, 5vw, 2\.15rem\)/
  );
  assert.match(
    css,
    /@media \(max-width: 430px\)[\s\S]*\.combat-card__hp-row > span\s*\{[\s\S]*display:\s*inline/
  );
  assert.doesNotMatch(
    css,
    /\.combat-card--player[^{]*\{[^}]*min-height/
  );
  assert.doesNotMatch(
    css,
    /\.combat-card--opponent[^{]*\{[^}]*min-height/
  );
});


test("V8 fighter HUD owns roster portraits while spatial fighters remain top-based", async () => {
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(css, /\.combat-card\s*\{[\s\S]*z-index:\s*12/);
  assert.match(css, /\.reserve\s*\{[\s\S]*position:\s*static/);
  assert.match(css, /\.fighter\s*\{[\s\S]*top:\s*50%/);
  assert.match(css, /transform:\s*translate\(-50%,\s*-50%\)\s*scale\(var\(--distance-scale/);
  assert.match(css, /transition:[\s\S]*top 260ms ease/);
});

test("V8 ability dock stays compact and icon-ready on mobile", async () => {
  const css = await readFile("examples/dom-demo/demo.css", "utf8");

  assert.match(css, /\.skill-bar__grid\s*\{[\s\S]*repeat\(4/);
  assert.match(css, /\.action-option--skill\s*\{[\s\S]*aspect-ratio:\s*0\.72/);
  assert.match(css, /\.action-option__icon\s*\{[\s\S]*width:\s*82%[\s\S]*height:\s*82%/);
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

test("ground approach perspective uses measured arena geometry rather than gameplay values", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");
  const planner = await readFile(
    "src/core/animation/plan-animation.js",
    "utf8"
  );

  assert.match(source, /arenaHeight:\s*arenaRect\.height/);
  assert.match(planner, /perspectiveScaleStrength/);
  assert.match(planner, /target\.y\s*\/\s*arenaHeight/);
  assert.doesNotMatch(
    source,
    /energyCost[\s\S]{0,120}arenaHeight/
  );
});

test("miss impact feedback remains a visual FX label only", async () => {
  const css = await readFile("examples/dom-demo/demo.css", "utf8");
  const presenter = await readFile(
    "src/adapters/renderer/combat-resolution-presenter.js",
    "utf8"
  );

  assert.match(css, /\.skill-fx--miss\s*\{/);
  assert.match(presenter, /planSkillOutcomeFx/);
  assert.doesNotMatch(css, /hpAfter|damage/);
});

test("evasion feedback explicitly shows zero damage and projectile targets use stable slots", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(source, /evaded:\s*"Esquive · 0 dégât"/);
  assert.match(source, /targetAnchors:\s*fighterContainers/);
});

test("V9 opponent initiative is driven by Runtime state changes without waiting for player input", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(source, /decision\.status === "saving"/);
  assert.match(
    source,
    /onState\(state\)[\s\S]*opponentAi[\s\S]*!runtime\.hasActiveActionFor\("opponent"\)[\s\S]*runOpponentTurn\(\)/
  );
  assert.doesNotMatch(
    source,
    /onState\(state\)[\s\S]{0,260}aiWaitingForEnergy\s*&&/
  );
  assert.match(source, /aiDecisionInProgress/);
  assert.doesNotMatch(source, /setInterval/);
  assert.doesNotMatch(source, /setTimeout/);
});

test("creature runtime assets are cache-busted by metadata visualRevision", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(source, /function creatureAssetUrl/);
  assert.match(source, /meta\.visualRevision/);
  assert.match(source, /url\.searchParams\.set\("v", meta\.visualRevision\)/);
  assert.match(source, /iconUrl:\s*creatureAssetUrl\(meta, iconAsset\)/);
  assert.match(source, /const runtimeUrl = creatureAssetUrl/);
});


test("KO replacement hides the old bitmap until the new creature asset is ready", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(source, /let assetReady = false/);
  assert.match(source, /image\.hidden = true/);
  assert.match(source, /image\.removeAttribute\("src"\)/);
  assert.match(source, /image\.addEventListener\("load", markReady/);
  assert.match(source, /image\.hidden = !visible \|\| !assetReady/);
  assert.doesNotMatch(
    source,
    /image\.src = runtimeUrl;\s*image\.hidden = false/
  );
});

test("concurrent combat keeps skills actor-local while roster commands stay globally gated", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(
    source,
    /for \(const \{ skill, button \} of skillRefs\.values\(\)\)[\s\S]*button\.disabled =[\s\S]*runtime\.hasActiveActionFor\("player"\)/
  );
  assert.doesNotMatch(source, /function renderMovement\(/);
  assert.doesNotMatch(source, /data-combat-move/);
  assert.match(
    source,
    /itemRef\.button\.disabled =[\s\S]*runtime\.hasActiveAction \|\|/
  );
  assert.match(
    source,
    /if \(!progress\.actionId\)[\s\S]*progress\.actorId[\s\S]*setCharge\(\{ slotId: progress\.actorId \}\)/
  );
  assert.match(
    source,
    /onResolved\(resolution\)[\s\S]*setCharge\(\{ slotId: resolution\.actorId \}\)/
  );
});

test("V9 UI delegates opponent decisions and routes skill visuals by real actor slots", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(source, /createOpponentDecisionController/);
  assert.match(source, /opponentAi\?\.maybeReactToActiveAction\(\)/);
  assert.match(source, /opponentAi\.takeTurn\(\)/);
  assert.match(source, /actorSlot:\s*resolution\.actorId/);
  assert.match(source, /targetSlot:\s*resolution\.targetId/);
  assert.match(source, /progress\.actorId/);
  assert.match(source, /progress\.reaction\.actorId/);
  assert.doesNotMatch(source, /runtime\.react\(/);
  assert.doesNotMatch(source, /setInterval/);
});

test("combat UI delegates gameplay to session runtime roster and presenters", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(source, /createCombatSession/);
  assert.match(source, /createCombatRuntime/);
  assert.match(source, /createRosterSession/);
  assert.match(source, /createCombatResolutionPresenter/);
  assert.match(source, /createDomDistancePresenter/);
  assert.doesNotMatch(source, /session\.previewMovement/);
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

  assert.match(html, /data-roster-reserve="opponent"/);
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

test("creature metadata exposes reusable FX anchors per combat view", async () => {
  for (const creatureId of ["maraileron", "braisombre"]) {
    const meta = JSON.parse(
      await readFile(
        `assets/test/creatures/${creatureId}/${creatureId}.meta.json`,
        "utf8"
      )
    );

    for (const view of ["player", "opponent"]) {
      for (const anchor of [
        "head",
        "mouth",
        "handLeft",
        "handRight",
        "tail"
      ]) {
        assert.ok(meta.fxAnchors?.[view]?.[anchor]);
        assert.ok(meta.fxAnchors[view][anchor].x >= 0);
        assert.ok(meta.fxAnchors[view][anchor].x <= 1);
        assert.ok(meta.fxAnchors[view][anchor].y >= 0);
        assert.ok(meta.fxAnchors[view][anchor].y <= 1);
      }
    }
  }

  const visualController = await readFile("src/ui/demo-app.js", "utf8");
  const combatUi = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(visualController, /function getFxAnchor/);
  assert.match(visualController, /getFxAnchorFor/);
  assert.match(combatUi, /sourceAnchorFor\(slotId, anchorName\)/);
  assert.match(combatUi, /visuals\.getFxAnchorFor\(slotId, anchorName\)/);
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


test("KO replacement is roster-owned and generic for player or opponent slots", async () => {
  const source = await readFile("src/ui/combat-test-ui.js", "utf8");
  const rosterSource = await readFile(
    "src/core/combat/roster-session.js",
    "utf8"
  );

  assert.match(rosterSource, /function replaceKnockedOut/);
  assert.match(source, /roster\.replaceKnockedOut\(slotId\)/);
  assert.match(source, /await presentation\.finished/);
  assert.match(source, /visuals\.setCreatureFor\(\s*slotId/);
  assert.match(source, /visuals\.setSlotVisible\(slotId, false\)/);
  assert.doesNotMatch(source, /replaceOpponentAfterKo/);
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
  assert.doesNotMatch(css, /\.distance-buttons/);
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


test("fireball demo binding uses stable Capture asset IDs and stays outside gameplay data", async () => {
  const source = await readFile("examples/dom-demo/demo-assets.js", "utf8");
  const ui = await readFile("src/ui/combat-test-ui.js", "utf8");

  assert.match(source, /pack:capture:icon-skill-fireball-01/);
  assert.match(source, /pack:capture:sprite-fireball-cast-01/);
  assert.match(source, /pack:capture:sprite-fireball-travel-01/);
  assert.match(source, /pack:capture:sprite-fireball-impact-01/);
  assert.match(source, /castFx:\s*"pack:capture:sprite-fireball-cast-01"/);
  assert.match(source, /castAnchor:\s*"mouth"/);
  assert.match(source, /castLayerBySourceView/);
  assert.match(
    source,
    /player:\s*"behind"[\s\S]*opponent:\s*"front"/
  );
  assert.match(source, /travelSourceAnchor:\s*"mouth"/);
  assert.match(source, /displayScale:\s*2\.8/);
  assert.match(source, /fx_skill_fireball_cast_orb_01\.svg/);
  assert.match(source, /fx_skill_fireball_impact_burst_01\.svg/);
  assert.match(source, /sprite_skill_fireball_travel_rl_atlas_01\.png/);
  assert.match(source, /coreAnchor:\s*Object\.freeze\(\{\s*x:\s*0\.29,\s*y:\s*0\.5\s*\}\)/);
  assert.match(source, /headingRad:\s*Math\.PI/);
  assert.match(source, /presentationForSkill/);
  assert.match(ui, /presentationAssets/);
  assert.match(ui, /action-option__icon/);

  assert.doesNotMatch(source, /energyCost|damage|allowedDistances|preparationMs/);
});


test("demo arena background is presentation-driven and keeps a CSS fallback", async () => {
  const source = await readFile("examples/dom-demo/demo.js", "utf8");
  const css = await readFile("examples/dom-demo/demo.css", "utf8");
  const assets = await readFile("examples/dom-demo/demo-assets.js", "utf8");

  assert.match(source, /presentationForArena/);
  assert.match(source, /applyArenaPresentation\("forest"\)/);
  assert.match(source, /--arena-background-image/);
  assert.match(source, /--arena-background-position/);
  assert.match(source, /--arena-background-size/);
  assert.match(source, /presentation\.backgroundPosition/);
  assert.match(source, /presentation\.backgroundSize/);
  assert.match(assets, /core:arena-forest-01/);
  assert.match(
    assets,
    /arenas\/forest\/arena_forest_01\.png/
  );
  assert.match(
    css,
    /--arena-background-image/
  );
  assert.match(
    css,
    /background-position:\s*var\(--arena-background-position, center\)/
  );
  assert.match(
    css,
    /background-size:\s*var\(--arena-background-size, cover\)/
  );
  assert.match(
    css,
    /\.arena\[data-arena-background="image"\] \.arena__ground/
  );
  assert.doesNotMatch(
    source,
    /damage|energyCost|allowedDistances/
  );
});


test("skill sprite sequences remain presentation-owned and phase-driven", async () => {
  const assets = await readFile(
    "examples/dom-demo/demo-assets.js",
    "utf8"
  );
  const presenter = await readFile(
    "src/adapters/renderer/combat-resolution-presenter.js",
    "utf8"
  );
  const visualController = await readFile(
    "src/ui/demo-app.js",
    "utf8"
  );
  const fxRenderer = await readFile(
    "src/adapters/renderer/dom-skill-fx.js",
    "utf8"
  );

  assert.match(assets, /sprite-claw-impact-01/);
  assert.match(assets, /sprite-teleportation-1/);
  assert.match(assets, /sprite-teleportation-2/);
  assert.match(assets, /phaseFxByLabel/);
  assert.match(assets, /teleport-return-vanish/);

  assert.match(
    presenter,
    /type:\s*"phase"[\s\S]*phase:\s*label/
  );
  assert.match(
    visualController,
    /segment\.label[\s\S]*segment\.durationMs/
  );
  assert.match(
    fxRenderer,
    /Array\.isArray\(visual\?\.frames\)/
  );
  assert.match(
    fxRenderer,
    /presentation\?\.phaseFx\?\.\[phase\]/
  );

  assert.doesNotMatch(assets, /damage\s*:/);
  assert.doesNotMatch(fxRenderer, /hpAfter|energyCost|allowedDistances/);
});


test("automatic combat audio uses runtime asset ids without manual file selection", async () => {
  const html = await readFile("examples/dom-demo/index.html", "utf8");
  const ui = await readFile("src/ui/combat-test-ui.js", "utf8");
  const assets = await readFile("examples/dom-demo/demo-assets.js", "utf8");
  const presenter = await readFile(
    "src/adapters/renderer/combat-resolution-presenter.js",
    "utf8"
  );
  const audioAdapter = await readFile(
    "src/adapters/audio/dom-combat-audio.js",
    "utf8"
  );

  assert.doesNotMatch(html, /data-audio-test-input|Sons 0\/3/);
  assert.doesNotMatch(ui, /createObjectURL|FileReader|audioInput/);

  assert.match(ui, /createDomCombatAudio/);
  assert.match(ui, /presentationAssets\?\.audioAsset/);
  assert.match(presenter, /audio\?\.play/);

  assert.match(assets, /gensrpg:sound:fire-cast-01/);
  assert.match(assets, /gensrpg:sound:melee-impact-01/);
  assert.match(assets, /gensrpg:sound:teleport-01/);
  assert.match(assets, /assets\/runtime\/audio-test/);

  assert.doesNotMatch(
    audioAdapter,
    /damage|energyCost|allowedDistances|hpAfter/
  );
});


test("normal hit presentation cannot replace an active approach or restart stale idle", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(source, /const activeApproachBySlot = new Map\(\)/);
  assert.match(
    source,
    /type === "hit" && activeApproach[\s\S]*activeApproach\.finished/
  );
  assert.match(
    source,
    /approachResult\?\.status !== "finished"/
  );
  assert.match(
    source,
    /result\?\.status === "finished"[\s\S]*startIdleFor\(slotKey\)/
  );
  assert.match(
    source,
    /activeApproachBySlot\.delete\(slotKey\)[\s\S]*slot\.setApproachActive\(false\)[\s\S]*slot\.renderer\.cancel\(\)/
  );
  assert.match(
    source,
    /slot\.setApproachActive\(true, approachDepth\)/
  );
  assert.match(
    source,
    /\.finally\(\(\) => \{[\s\S]*slot\.setApproachActive\(false\)/
  );
});


test("four creature city preview exposes all current capture creatures", async () => {
  const visualSource = await readFile("src/ui/demo-app.js", "utf8");
  const combatSource = await readFile("src/ui/combat-test-ui.js", "utf8");
  const demoSource = await readFile("examples/dom-demo/demo.js", "utf8");
  const roster = JSON.parse(
    await readFile(
      "data/combat/rosters/demo-four-creatures-city.roster.json",
      "utf8"
    )
  );

  assert.match(
    visualSource,
    /capture\/creatures\/golem_moussu\/golem_moussu\.meta\.json/
  );
  assert.match(combatSource, /golem_moussu:\s*golemMoussuConfig/);
  assert.match(demoSource, /previewVariant === "four-city"/);
  assert.match(demoSource, /applyArenaPresentation\("city"\)/);

  assert.equal(
    roster.teams.opponent.activeMemberId,
    "opponent-loup"
  );

  const creatures = new Set(
    roster.teams.player.members.map((member) => member.creatureId)
  );
  assert.deepEqual(
    [...creatures].sort(),
    ["braisombre", "golem_moussu", "loup_volcanique", "maraileron"].sort()
  );
});


test("combat demo does not use work or preview branches as visual asset storage", async () => {
  const source = [
    await readFile("src/assets/global-visual-library.js", "utf8"),
    await readFile("examples/dom-demo/demo-assets.js", "utf8")
  ].join("\n");

  assert.match(source, /branch: BRANCH/);
  assert.match(source, /const BRANCH = "global-assets"/);
  assert.doesNotMatch(
    source,
    /raw\.githubusercontent\.com[^"']*\/(?:work|preview|checkpoint)\//
  );
});


test("creature visuals resolve from global-assets and not assets/test", async () => {
  const source = await readFile("src/ui/demo-app.js", "utf8");

  assert.match(
    source,
    /globalVisualAssetUrl\(\s*"capture\/creatures\/maraileron\/maraileron\.meta\.json"/
  );
  assert.match(
    source,
    /globalVisualAssetUrl\(\s*"capture\/creatures\/braisombre\/braisombre\.meta\.json"/
  );
  assert.match(
    source,
    /globalVisualAssetUrl\(\s*"capture\/creatures\/loup_volcanique\/loup_volcanique\.meta\.json"/
  );
  assert.doesNotMatch(source, /assets\/test\/creatures/);
});

test("loup lava preview stays a presentation/data variant", async () => {
  const demo = await readFile("examples/dom-demo/demo.js", "utf8");
  const combatUi = await readFile("src/ui/combat-test-ui.js", "utf8");
  const roster = JSON.parse(
    await readFile(
      "data/combat/rosters/demo-loup-lava-2v2.roster.json",
      "utf8"
    )
  );

  assert.match(demo, /previewVariant === "loup-lava"/);
  assert.match(demo, /applyArenaPresentation\("lava"\)/);
  assert.match(demo, /demo-loup-lava-2v2\.roster\.json/);
  assert.match(combatUi, /rosterUrl = DATA_URLS\.roster/);
  assert.match(combatUi, /loup_volcanique: loupVolcaniqueConfig/);
  assert.equal(
    roster.teams.player.members[0].creatureId,
    "loup_volcanique"
  );
  assert.equal(
    roster.teams.opponent.members[1].creatureId,
    "loup_volcanique"
  );
});
