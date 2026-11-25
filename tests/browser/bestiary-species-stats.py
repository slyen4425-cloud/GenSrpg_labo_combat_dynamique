"""Exercise the native authoring flow with an isolated, real Combat database."""
import json
import shutil
import threading
import uuid
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[2]
capture = root / "data/capture"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


source = read(capture / "showcase/crea_selachombre.capture-creature-transfer-v1.json")
record = {key: source[key] for key in ("draft", "statValues", "loadout")}
skills = [read(path)["draft"] for path in (capture / "showcase").glob("*skill-transfer-v1.json")]
database = {
    "schema": "capture-database-v1", "version": 1, "metadata": {},
    "statRegistry": read(capture / "monster-capture-stat-registry.v1.json"),
    "progressionRules": read(capture / "monster-capture-progression-rules.v1.json"),
    "creatures": [record],
    "skills": [skill for skill in skills if skill["id"] in record["draft"]["skillIds"]],
}

def check(context, origin):
    page = context.new_page()
    page.set_default_timeout(45000)
    page.on("pageerror", lambda error: print("Chromium:", error, flush=True))
    page.goto(origin + "/data/capture/monster-capture-stat-registry.v1.json")
    project = "unv_" + uuid.uuid4().hex[:16]
    profile = "desktop-1v1" if page.evaluate("matchMedia('(min-width:1100px) and (min-height:650px) and (pointer:fine)').matches") else "touch-1v1"
    # Existing authored V1 data is a migration fixture, not a second editor.
    legacy_layout = {"schema":"capture-hud-layout-v1", "profiles":{profile:{"local-status":{"dx":1,"dy":-1,"scale":100}}}}
    fixture = {**database, "metadata":{"combatHudLayoutV1":legacy_layout}}
    page.evaluate("""async ([id,database])=>{
      const {createCaptureUniverseDatabaseStoreV1}=await import('/src/contracts/capture-universe-database-store-v1.js');
      createCaptureUniverseDatabaseStoreV1({storage:localStorage}).create(id,database);
    }""", [project, fixture])
    species = record["draft"]["id"]
    url = origin + "/examples/dom-demo/bestiary.html?universe=" + project
    page.goto(url + "#" + species, wait_until="domcontentloaded")
    page.locator("[data-bestiary-edit-stats]").click()
    page.wait_for_function("document.activeElement?.id==='creature-stats'")
    health = page.locator('[data-stat-value="health"]')
    before = record["statValues"]["values"]["health"]
    assert float(health.input_value()) == before
    health.fill(str(before + 25))
    page.get_by_role("button", name="Enregistrer le catalogue de cet univers").click()
    notice = page.locator("[data-capture-universe-project-editor] [role=status]")
    page.wait_for_function("document.querySelector('[data-capture-universe-project-editor] [role=status]').dataset.tone")
    assert "révision 2" in notice.inner_text(), notice.inner_text()
    page.goto(url + "#" + species, wait_until="domcontentloaded")
    page.wait_for_function("""value=>document.querySelector('[data-bestiary-measures]')?.innerText.includes(String(value))""", arg=before+25)
    page.goto(url + "&embedded=1#" + species, wait_until="domcontentloaded")
    page.wait_for_function("document.querySelector('[data-bestiary-profile]')?.hidden===false")
    assert not page.locator("[data-bestiary-edit-stats]").is_visible()
    combat = page.evaluate("""async ([id,species])=>{
      const {createCaptureUniverseDatabaseStoreV1}=await import('/src/contracts/capture-universe-database-store-v1.js');
      const {exportCaptureCreatureTransferJsonV1,importCaptureTransferJsonV1}=await import('/src/adapters/input/capture/capture-entity-transfer-v1.js');
      const {buildCaptureEncounterCombatSourceV1}=await import('/src/ui/capture-encounter-combat-source-v1.js');
      const {database}=createCaptureUniverseDatabaseStoreV1({storage:localStorage}).load(id);
      const {readCaptureUniverseEncounterSourceV1}=await import('/src/adapters/input/capture/capture-universe-encounter-source-v1.js');
      const encounter=readCaptureUniverseEncounterSourceV1({storage:localStorage,universeId:id});
      const record=encounter.creatureTransfers.find(c=>c.draft.id===species);
      const options={statRegistry:database.statRegistry};
      const text=exportCaptureCreatureTransferJsonV1(record,options);
      const loaded=importCaptureTransferJsonV1(text,options).value;
      const combatRules={schema:'capture-combat-rules-editor-draft-v1',maxEnergy:10,initialEnergy:10,
        energyChargeAmount:1,energyChargeIntervalMs:2000,movementEnergyPerStep:1,chargeTimeModifierPct:0};
      const result=buildCaptureEncounterCombatSourceV1({configuredCreatures:new Map([[species,loaded]]),
        configuredSkills:new Map(encounter.skillTransfers.map(s=>[s.draft.id,s.draft])),arenaId:'forest',combatRules,
        statRegistry:encounter.statRegistry,progressionRules:encounter.progressionRules,
        local:{speciesId:species,level:1},opponent:{speciesId:species,level:1}});
      return {value:loaded.statValues.values.health,maxHp:result.fighters.find(f=>f.id==='local-1').maxHp,
        factor:database.statRegistry.stats.find(s=>s.id==='health').maxHpPerPoint};
    }""", [project,species])
    assert combat["value"] == before + 25, combat
    assert combat["maxHp"] == combat["value"] * combat["factor"], combat
    print(page.viewport_size, species, before, combat, flush=True)
    # Real editor, same isolated database and same native arena DOM.
    editor_url = origin + "/examples/dom-demo/capture-editor-v2.html?tab=combat&universe=" + project
    page.goto(editor_url, wait_until="domcontentloaded")
    page.locator("[data-combat-hud-layout-editor] > summary").click()
    assert page.locator("[data-hud-layout-profile], [data-hud-layout-x], [data-hud-layout-scale]").count() == 0, "obsolete numeric editor must not exist in the DOM"
    # Native pointer editing, not synthetic style injection. A real editor launch
    # creates the native arena, real species and existing runtime, in author mode.
    page.get_by_role("button", name="Dérouler Équipes du test", exact=True).click()
    page.locator("[data-test-local-team-size]").select_option("2")
    page.locator("[data-test-opponent-team-size]").select_option("2")
    page.locator("[data-active-per-team]").select_option("1")
    page.locator("[data-test-local-creature]").first.select_option(species)
    page.locator("[data-test-opponent-creature]").first.select_option(species)
    page.locator("[data-test-opponent-creature]").nth(1).select_option(species)
    page.wait_for_function("!document.querySelector('[data-editor-test-combat]').disabled")
    draft_fields = page.locator("[data-creature-id], [data-skill-id], [data-creature-library-select], [data-skill-library-select]")
    drafts_before = draft_fields.evaluate_all("els=>els.map(e=>e.value)")
    page.locator("[data-hud-layout-preview]").click()
    toolbar = page.locator("[data-hud-author-toolbar]")
    try:
        toolbar.wait_for(state="visible")
    except Exception as error:
        raise AssertionError("HUD author launch failed: " + page.locator("[data-editor-status]").text_content()) from error
    arena = page.locator("[data-capture-preview-host] [data-combat-arena]")
    hp = arena.locator(".squad-card--local-full")
    hp.wait_for(state="visible")
    assert arena.locator("[data-combat-hud-skill-role]").count() > 0
    assert page.locator("[data-hud-author-overlay]").count() == 1
    # Move the actual editor chrome (not a persisted combat role) on both devices.
    grip = toolbar.locator("[data-hud-author-drag]")
    before_toolbar = toolbar.bounding_box()
    def drag_toolbar(dx,dy):
        b = grip.bounding_box()
        x,y = b["x"]+b["width"]/2,b["y"]+b["height"]/2
        if page.evaluate("navigator.maxTouchPoints>0"):
            cdp = context.new_cdp_session(page)
            cdp.send("Input.dispatchTouchEvent", {"type":"touchStart","touchPoints":[{"x":x,"y":y}]})
            cdp.send("Input.dispatchTouchEvent", {"type":"touchMove","touchPoints":[{"x":x+dx,"y":y+dy}]})
            cdp.send("Input.dispatchTouchEvent", {"type":"touchEnd","touchPoints":[]})
            cdp.detach()
        else:
            page.mouse.move(x,y)
            page.mouse.down()
            page.mouse.move(x+dx,y+dy,steps=4)
            page.mouse.up()
    drag_toolbar(35,65)
    moved = toolbar.bounding_box()
    assert moved["y"] >= before_toolbar["y"]+45, (before_toolbar,moved)
    assert moved["x"] >= 0 and moved["x"]+moved["width"] <= page.viewport_size["width"]+1
    collapse = toolbar.locator("[data-hud-author-collapse]")
    collapse.click()
    assert not toolbar.locator("[data-hud-author-palette]").is_visible()
    assert toolbar.bounding_box()["height"] < moved["height"]
    assert grip.is_visible() and collapse.is_visible()
    collapse.click()
    assert toolbar.locator("[data-hud-author-palette]").is_visible()
    drag_toolbar(before_toolbar["x"]-toolbar.bounding_box()["x"],before_toolbar["y"]-toolbar.bounding_box()["y"])
    assert abs(toolbar.bounding_box()["y"]-before_toolbar["y"]) < 6
    print("Floating toolbar pointer move, collapse and reopen",page.viewport_size,flush=True)
    # Native keyboard activation must not reach the actor or skill handlers
    # while authoring, even when a control is focused programmatically.
    actor = arena.locator('[data-target-actor="local-1"]').first
    actor.evaluate("""el=>{el.dataset.authorActivationCount='0';
      for(const type of ['keydown','click'])el.addEventListener(type,()=>{el.dataset.authorActivationCount=String(Number(el.dataset.authorActivationCount)+1);});}""")
    actor.focus()
    page.keyboard.press("Enter")
    page.keyboard.press("Space")
    actor.evaluate("el=>el.click()")
    assert actor.get_attribute("data-author-activation-count") == "0"
    skill = arena.locator("[data-combat-hud-skill-role]").first
    assert skill.evaluate("el=>!el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))"), "native skill activation must be cancelled"
    # Real bench members, not fabricated portraits. The author controls
    # project the same canonical icons already present in the roster picker.
    for side,selector in [("local","[data-combat-team-menu]"),("opponent","[data-combat-enemy-reserves]")]:
        toggle=toolbar.locator("[data-hud-author-portraits-"+side+"]")
        toggle.click()
        strip=arena.locator(selector+" > summary .hud-reserve-portrait:not([hidden]) img")
        assert strip.count()==1, (side,strip.count())
        assert strip.first.is_visible() and strip.first.get_attribute("src"), side
        assert toggle.get_attribute("aria-pressed") == "true"
        assert "1 portrait" in toolbar.locator("[data-hud-author-reserve-help]").inner_text()
        toggle.click()
        assert not strip.first.is_visible(), side
    print("Native real reserve portraits toggled",page.viewport_size,flush=True)

    # Reset via the native editing chrome, then move by the same safe +1/-1
    # percent offset that was previously certified with the exact profile.
    box = hp.bounding_box()
    x, y = box["x"]+box["width"]/2, box["y"]+box["height"]/2
    page.mouse.click(x,y)
    assert "PV" in toolbar.locator("[data-hud-author-selection]").inner_text()
    toolbar.locator("[data-hud-author-reset]").click()
    page.wait_for_function("!document.querySelector('[data-capture-preview-host] .squad-card--local-full').dataset.hudBox")
    box, bounds = hp.bounding_box(), arena.bounding_box()
    x, y = box["x"]+box["width"]/2, box["y"]+box["height"]/2
    dx, dy = bounds["width"]/100, -bounds["height"]/100
    if context.pages[0].evaluate("navigator.maxTouchPoints>0"):
        cdp = context.new_cdp_session(page)
        cdp.send("Input.dispatchTouchEvent", {"type":"touchStart","touchPoints":[{"x":x,"y":y}]})
        cdp.send("Input.dispatchTouchEvent", {"type":"touchMove","touchPoints":[{"x":x+dx,"y":y+dy}]})
        cdp.send("Input.dispatchTouchEvent", {"type":"touchEnd","touchPoints":[]})
        cdp.detach()
    else:
        page.mouse.move(x,y)
        page.mouse.down()
        page.mouse.move(x+dx,y+dy,steps=3)
        page.mouse.up()
    page.wait_for_function("document.querySelector('[data-capture-preview-host] .squad-card--local-full').dataset.hudBox==='local-status'")
    assert hp.bounding_box()["x"] > box["x"], "direct pointer drag did not move the native HUD"
    toolbar.locator("[data-hud-author-undo]").click()
    page.wait_for_function("!document.querySelector('[data-capture-preview-host] .squad-card--local-full').dataset.hudBox")
    toolbar.locator("[data-hud-author-undo]").click()
    page.wait_for_function("document.querySelector('[data-capture-preview-host] .squad-card--local-full').dataset.hudBox==='local-status'")
    # P2 regression: an authored grid with occupied cells only must not
    # accept a touch layout whose real native skill buttons are too narrow.
    if profile.startswith("touch"):
        toolbar.locator("[data-hud-author-palette]").select_option("command-dock")
        add_column = toolbar.locator("[data-hud-author-add-column]")
        undo = toolbar.locator("[data-hud-author-undo]")
        grid = arena.locator("[data-combat-skills]")
        edits = 0
        add_column.click()
        edits += 1
        while grid.locator("[data-hud-empty-skill]:visible").count():
            toolbar.locator("[data-hud-author-remove-slot]").click()
            edits += 1
            assert edits <= 5, "fixture must have occupied native skill cells"
        for _ in range(6):
            add_column.click()
            edits += 1
        assert grid.locator("[data-hud-empty-skill]:visible").count() == 0
        assert grid.locator("button:visible").evaluate_all(
            "els=>els.some(e=>e.getBoundingClientRect().width<43)"
        ), "fixture must produce a genuinely narrow native button"
        for action in ("apply", "test"):
            toolbar.locator("[data-hud-author-"+action+"]").click()
            assert "Cases tactiles trop étroites" in toolbar.locator("[data-hud-author-status]").text_content()
            assert page.locator("[data-hud-author-overlay]").count() == 1
        for _ in range(edits):
            undo.click()
        assert grid.get_attribute("data-hud-grid-columns") is None
        print("Occupied-only narrow touch grid rejected by Apply and Test", flush=True)
    # Create a real named collapsible panel in the visual editor. It must
    # partition the same native skill nodes, not manufacture alternative buttons.
    group_form = toolbar.locator("[data-hud-author-group-editor]")
    group_form.locator("summary").click()
    group_form.locator("[data-hud-author-group-name]").fill("Attaques rapides")
    group_form.locator("[data-hud-author-group-foldable]").check()
    group_form.locator('input[value="skill-slot-1"]').check()
    group_form.locator('input[value="skill-slot-2"]').check()
    original_roles = arena.locator("[data-combat-hud-skill-role]").evaluate_all("els=>els.map(e=>e.dataset.combatHudSkillRole)")
    arena.locator("[data-combat-hud-skill-role]").evaluate_all("els=>els.forEach(e=>e.dataset.nativeHudProof='same')")
    group_form.locator("[data-hud-author-group-save]").click()
    assert "Groupe enregistré" in toolbar.locator("[data-hud-author-status]").text_content(), toolbar.locator("[data-hud-author-status]").text_content()
    assert group_form.locator("[data-hud-author-group-name]").input_value() == "Attaques rapides", "group form was reset before save"
    group_form.locator("[data-hud-author-group-move]").click()
    try:
        page.wait_for_function("document.querySelector('[data-hud-author-selection]').textContent==='Attaques rapides'")
    except Exception as error:
        raise AssertionError("Named page selection failed: " + toolbar.inner_text()) from error
    assert arena.locator('[data-combat-hud-skill-role="skill-slot-1"]').is_visible()
    assert not arena.locator('[data-combat-hud-skill-role="skill-slot-3"]').is_visible()
    assert arena.locator("[data-combat-hud-skill-role]").evaluate_all("els=>els.map(e=>e.dataset.combatHudSkillRole)") == original_roles
    assert arena.locator("[data-combat-hud-skill-role]").evaluate_all("els=>els.every(e=>e.dataset.nativeHudProof==='same')")
    # A named page is now a real region: resize the native dock itself rather
    # than scaling the two skill buttons. The page keeps those exact nodes.
    dock = arena.locator(".coop-command-stack")
    def gesture(x,y,dx,dy):
        if page.evaluate("navigator.maxTouchPoints>0"):
            cdp = context.new_cdp_session(page)
            cdp.send("Input.dispatchTouchEvent", {"type":"touchStart","touchPoints":[{"x":x,"y":y}]})
            cdp.send("Input.dispatchTouchEvent", {"type":"touchMove","touchPoints":[{"x":x+dx,"y":y+dy}]})
            cdp.send("Input.dispatchTouchEvent", {"type":"touchEnd","touchPoints":[]})
            cdp.detach()
        else:
            page.mouse.move(x,y)
            page.mouse.down()
            page.mouse.move(x+dx,y+dy,steps=3)
            page.mouse.up()
    # Re-select the displayed dock via the palette. The named page, not
    # the principal page, must receive all rectangle and capacity edits.
    toolbar.locator("[data-hud-author-palette]").select_option("command-dock")
    assert toolbar.locator("[data-hud-author-page-select]").input_value()=="hud-group-1:0"
    original_dock = dock.bounding_box()
    handle = arena.locator('[data-hud-resize-edge="n"]')
    handle.wait_for(state="visible")
    b = handle.bounding_box()
    gesture(b["x"]+b["width"]/2,b["y"]+b["height"]/2,0,-40)
    print("Panel north handle",page.viewport_size,original_dock,b,toolbar.locator("[data-hud-author-status]").text_content(),dock.bounding_box(),flush=True)
    assert dock.get_attribute("data-hud-box") == "command-dock", toolbar.locator("[data-hud-author-status]").text_content()
    grown = dock.bounding_box()
    assert grown["height"] >= original_dock["height"]+30, (original_dock,grown)
    assert abs(grown["width"]-original_dock["width"]) < 3, (original_dock,grown)
    # Width is independent, moving the west edge. The south edge stays put.
    b=arena.locator('[data-hud-resize-edge="w"]').bounding_box()
    gesture(b["x"]+b["width"]/2,b["y"]+b["height"]/2,-24,0)
    wider=dock.bounding_box()
    print("Panel west handle",page.viewport_size,grown,wider,toolbar.locator("[data-hud-author-status]").text_content(),flush=True)
    assert wider["width"] >= grown["width"]+15, (grown,wider,toolbar.locator("[data-hud-author-status]").text_content())
    assert abs(wider["height"]-grown["height"]) < 3, (grown,wider)
    toolbar.locator("[data-hud-author-add-slot]").click()
    assert arena.locator("[data-hud-empty-skill]:visible").count() >= 1, toolbar.locator("[data-hud-author-status]").text_content()
    assert arena.locator("[data-combat-hud-skill-role]").evaluate_all("els=>els.every(e=>e.dataset.nativeHudProof==='same')")
    authored_dock=dock.bounding_box()
    print("Native independent panel geometry",page.viewport_size,original_dock,authored_dock,flush=True)
    print("Native geometry details",arena.evaluate("""root=>Object.fromEntries(['.hud__energy','[data-combat-team-menu]','[data-combat-team-summary]','[data-combat-dodge]'].map(s=>{
      const n=root.querySelector(s),r=n?.getBoundingClientRect(),style=n&&getComputedStyle(n);
      return [s,{rect:r?.toJSON(),open:n?.open,display:style?.display,position:style?.position}];
    }))"""),flush=True)
    # Widening may consume the space previously occupied by dodge. The
    # builder must let the author rearrange it before applying the draft.
    dodge=arena.locator("[data-combat-dodge]")
    if dodge.is_visible():
        db=dodge.bounding_box()
        intersects=(db["x"]+db["width"]>authored_dock["x"] and db["x"]<authored_dock["x"]+authored_dock["width"]
                    and db["y"]+db["height"]>authored_dock["y"] and db["y"]<authored_dock["y"]+authored_dock["height"])
        if intersects:
            toolbar.locator("[data-hud-author-palette]").select_option("dodge")
            gesture(db["x"]+db["width"]/2,db["y"]+db["height"]/2,authored_dock["x"]-db["x"]-db["width"]-12,0)
            assert dodge.bounding_box()["x"]+dodge.bounding_box()["width"] < authored_dock["x"]
    toolbar.locator("[data-hud-author-page-select]").select_option("main:0")
    assert not arena.locator('[data-combat-hud-skill-role="skill-slot-1"]').is_visible()
    assert arena.locator('[data-combat-hud-skill-role="skill-slot-3"]').is_visible()
    assert abs(dock.bounding_box()["width"]-original_dock["width"])<4, "main page must keep independent layout"
    toolbar.locator("[data-hud-author-test]").click()
    assert page.locator("[data-hud-author-overlay]").count() == 0, toolbar.locator("[data-hud-author-status]").text_content()
    nav = arena.locator("[data-hud-skill-page-nav]")
    nav.select_option("hud-group-1:0")
    page.wait_for_function("document.querySelector('[data-combat-hud-skill-role=skill-slot-1]').getBoundingClientRect().width>0")
    assert not arena.locator('[data-combat-hud-skill-role="skill-slot-3"]').is_visible()
    nav.select_option("main:0")
    assert arena.is_visible(), "test must retain the same arena"
    actor.focus()
    page.keyboard.press("Enter")
    assert int(actor.get_attribute("data-author-activation-count")) > 0, "native keyboard activation must be restored"

    page.locator("[data-preview-back-editor]").click()
    assert page.locator("[data-hud-author-overlay]").count() == 0
    assert draft_fields.evaluate_all("els=>els.map(e=>e.value)") == drafts_before, "HUD authoring must not save or replace unrelated drafts"
    # Save the same universe metadata; reload and read through the encounter
    # source, which is also consumed by the embedded native combat.
    page.get_by_role("button", name="Enregistrer le catalogue de cet univers").click()
    page.wait_for_function("document.querySelector('[data-capture-universe-project-editor] [role=status]').textContent.includes('révision 3')")
    stored = page.evaluate("""async ([id,profile])=>{
      const {readCaptureUniverseEncounterSourceV1}=await import('/src/adapters/input/capture/capture-universe-encounter-source-v1.js');
      const layout=readCaptureUniverseEncounterSourceV1({storage:localStorage,universeId:id}).hudLayout;
      if(layout.profiles[profile]['local-status'].dx!==1||layout.profiles[profile]['local-status'].dy!==-1)throw Error('Visual placement lost during save');
      return layout.groups[profile][0];
    }""", [project,profile])
    assert stored["label"] == "Attaques rapides" and stored["foldable"] and stored["roles"] == ["skill-slot-1","skill-slot-2"], stored
    assert stored["box"]["w"] > 0 and stored["grid"]["slots"] == 6, stored
    page.goto(editor_url, wait_until="domcontentloaded")
    page.locator("[data-combat-hud-layout-editor] > summary").click()
    page.wait_for_function("!document.querySelector('[data-editor-test-combat]').disabled")
    page.get_by_role("button", name="Dérouler Équipes du test", exact=True).click()
    page.locator("[data-test-local-team-size]").select_option("1")
    page.locator("[data-test-opponent-team-size]").select_option("1")
    page.locator("[data-active-per-team]").select_option("1")
    page.locator("[data-hud-layout-preview]").click()
    toolbar.wait_for(state="visible")
    toolbar.locator("[data-hud-author-page-select]").wait_for(state="visible")
    toolbar.locator("[data-hud-author-page-select]").select_option("hud-group-1:0")
    assert arena.locator('[data-combat-hud-skill-role="skill-slot-1"]').is_visible()
    assert arena.locator("[data-hud-empty-skill]:visible").count() >= 1
    assert abs(dock.bounding_box()["width"]-authored_dock["width"])<4
    page.locator("[data-preview-back-editor]").click()
    # Same native author flow with two active fighters; profiles must stay
    # independent. This is not a new HUD or a fabricated combat runtime.
    page.locator("[data-test-local-team-size]").select_option("2")
    page.locator("[data-test-opponent-team-size]").select_option("2")
    page.locator("[data-active-per-team]").select_option("2")
    page.locator("[data-test-local-creature]").first.select_option(species)
    page.locator("[data-test-opponent-creature]").nth(1).select_option(species)
    page.locator("[data-hud-layout-preview]").click()
    toolbar.wait_for(state="visible")
    page.wait_for_function("document.querySelector('[data-combat-arena]').dataset.combatActiveCount==='2'")
    assert "2v2" in toolbar.locator("[data-hud-author-profile]").text_content()
    assert arena.locator("[data-hud-skill-page-nav]").count() == 0
    group_form.locator("summary").click()
    group_form.locator("[data-hud-author-group-name]").fill("Volet duo")
    group_form.locator("[data-hud-author-group-foldable]").check()
    group_form.locator('input[value="skill-slot-1"]').check()
    group_form.locator('input[value="skill-slot-2"]').check()
    group_form.locator("[data-hud-author-group-save]").click()
    assert "Groupe enregistré" in toolbar.locator("[data-hud-author-status]").text_content(), toolbar.locator("[data-hud-author-status]").text_content()
    group_form.locator("[data-hud-author-group-move]").click()
    assert arena.locator('[data-combat-hud-skill-role="skill-slot-1"]').is_visible()
    assert not arena.locator('[data-combat-hud-skill-role="skill-slot-3"]').is_visible()
    toolbar.locator("[data-hud-author-test]").click()
    arena.locator("[data-hud-skill-page-nav]").select_option("main:0")
    assert arena.locator('[data-combat-hud-skill-role="skill-slot-3"]').is_visible()
    page.locator("[data-preview-back-editor]").click()
    print("Native pointer author / undo / test / group save and reload / 1v1 and 2v2 passed",page.viewport_size,flush=True)
    # Apply the real layout controller to the ONE editor template in a visible
    # preview shell. The native author preview mounts this same controller.
    geometry = page.evaluate("""async ([id,profile])=>{
      const {createCaptureUniverseDatabaseStoreV1}=await import('/src/contracts/capture-universe-database-store-v1.js');
      const {mountCaptureHudLayoutPreviewV1}=await import('/src/ui/capture-hud-layout-preview-v1.js');
      const {updateCaptureHudLayoutV1}=await import('/src/contracts/capture-hud-layout-v1.js');
      const storedLayout=createCaptureUniverseDatabaseStoreV1({storage:localStorage}).load(id).database.metadata.combatHudLayoutV1;
      const {groups,...layout}=storedLayout;
      const {readCaptureUniverseEncounterSourceV1}=await import('/src/adapters/input/capture/capture-universe-encounter-source-v1.js');
      if(JSON.stringify(readCaptureUniverseEncounterSourceV1({storage:localStorage,universeId:id}).hudLayout)!==JSON.stringify(storedLayout))throw Error('Lost HUD in encounter source');
      const shell=document.querySelector('[data-capture-preview-shell]');
      const host=document.querySelector('[data-capture-preview-host]');
      host.replaceChildren(document.querySelector('[data-capture-preview-template]').content.cloneNode(true));
      document.querySelector('[data-capture-editor-human]').hidden=true;
      document.body.dataset.editorView='preview';
      shell.hidden=false;shell.dataset.landscapeRequired='true';document.body.dataset.previewLandscapeActive='true';
      const root=host.querySelector('[data-combat-demo]'),arena=root.querySelector('[data-combat-arena]');
      arena.dataset.combatActiveCount='1';
      for(const node of root.querySelectorAll('[data-preview-actor-ui="local-2"],[data-preview-actor-ui="opponent-2"]'))node.hidden=true;
      const hp=root.querySelector('.squad-card--local-full');
      const grid=root.querySelector('[data-combat-skills]');
      for(let i=0;i<5;i++){const b=document.createElement('button');b.className='action-option action-option--skill';b.textContent='Slot '+(i+1);b.dataset.combatHudSkillRole=i===4?'skill-slot-ultimate':'skill-slot-'+(i+1);grid.append(b);}
      const wait=()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
      await wait();const before=hp.getBoundingClientRect();
      let warning='';const mounted=mountCaptureHudLayoutPreviewV1({root,layout,onStatus:m=>warning=m});
      await wait();const after=hp.getBoundingClientRect(),applied=hp.dataset.hudBox;
      const successWarning=warning;
      mounted.dispose();
      const reset=hp.getBoundingClientRect();
      const bad=updateCaptureHudLayoutV1(layout,profile,'local-status',{dx:-50,dy:0,scale:100});
      const rejected=mountCaptureHudLayoutPreviewV1({root,layout:bad,onStatus:m=>warning=m});
      await wait();const blocked=warning,restored=hp.dataset.hudBox??'';
      rejected.dispose();const skills=grid.children.length;
      host.replaceChildren();shell.hidden=true;
      return {before:before.x,after:after.x,reset:reset.x,applied,successWarning,blocked,restored,skills};
    }""", [project, profile])
    assert geometry["applied"] and geometry["after"] > geometry["before"] and not geometry["successWarning"], geometry
    assert abs(geometry["reset"] - geometry["before"]) < 1, geometry
    assert geometry["blocked"].startswith("Disposition non appliquée") and not geometry["restored"], geometry
    assert geometry["skills"] == 5, geometry
    print("HUD native profile/save/reload/geometry:", page.viewport_size, geometry, flush=True)



with ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(root))) as server:
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as pw:
            chrome = shutil.which("google-chrome") or shutil.which("chromium")
            browser = pw.chromium.launch(executable_path=chrome, args=["--no-sandbox"])
            for width, height, touch in [(1366,768,False), (873,393,True)]:
                context = browser.new_context(viewport={"width":width,"height":height}, has_touch=touch)
                try:
                    check(context, "http://127.0.0.1:" + str(server.server_port))
                finally:
                    context.close()
            browser.close()
    finally:
        server.shutdown()
