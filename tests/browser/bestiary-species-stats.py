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
    page.locator("[data-test-local-team-size]").select_option("1")
    page.locator("[data-test-opponent-team-size]").select_option("1")
    page.locator("[data-active-per-team]").select_option("1")
    page.locator("[data-test-opponent-creature]").first.select_option(species)
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

    # Reset via the native editing chrome, then move by the same safe +1/-1
    # percent offset that was previously certified with the exact profile.
    box = hp.bounding_box()
    x, y = box["x"]+box["width"]/2, box["y"]+box["height"]/2
    page.mouse.click(x,y)
    assert "PV" in toolbar.locator("[data-hud-author-selection]").inner_text()
    toolbar.locator("[data-hud-author-reset]").click()
    page.wait_for_function("!document.querySelector('[data-capture-preview-host] .squad-card--local-full').style.translate")
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
    page.wait_for_function("!!document.querySelector('[data-capture-preview-host] .squad-card--local-full').style.translate")
    assert hp.bounding_box()["x"] > box["x"], "direct pointer drag did not move the native HUD"
    toolbar.locator("[data-hud-author-undo]").click()
    page.wait_for_function("!document.querySelector('[data-capture-preview-host] .squad-card--local-full').style.translate")
    toolbar.locator("[data-hud-author-undo]").click()
    page.wait_for_function("!!document.querySelector('[data-capture-preview-host] .squad-card--local-full').style.translate")
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
    group_form.locator("[data-hud-author-group-move]").click()
    page.wait_for_function("document.querySelector('[data-hud-author-selection]').textContent==='Attaques rapides'")
    assert arena.locator('[data-combat-hud-skill-role="skill-slot-1"]').is_visible()
    assert not arena.locator('[data-combat-hud-skill-role="skill-slot-3"]').is_visible()
    assert arena.locator("[data-combat-hud-skill-role]").evaluate_all("els=>els.map(e=>e.dataset.combatHudSkillRole)") == original_roles
    assert arena.locator("[data-combat-hud-skill-role]").evaluate_all("els=>els.every(e=>e.dataset.nativeHudProof==='same')")
    # The selected group is a single gesture on the native arena. Moving it
    # must update both members; undo restores the original canonical offsets.
    first_skill = arena.locator('[data-combat-hud-skill-role="skill-slot-1"]')
    second_skill = arena.locator('[data-combat-hud-skill-role="skill-slot-2"]')
    first_box, second_box, arena_box = first_skill.bounding_box(), second_skill.bounding_box(), arena.bounding_box()
    x, y = first_box["x"] + first_box["width"]/2, first_box["y"] + first_box["height"]/2
    dx = arena_box["width"]/100
    if context.pages[0].evaluate("navigator.maxTouchPoints>0"):
        cdp = context.new_cdp_session(page)
        cdp.send("Input.dispatchTouchEvent", {"type":"touchStart","touchPoints":[{"x":x,"y":y}]})
        cdp.send("Input.dispatchTouchEvent", {"type":"touchMove","touchPoints":[{"x":x+dx,"y":y}]})
        cdp.send("Input.dispatchTouchEvent", {"type":"touchEnd","touchPoints":[]})
        cdp.detach()
    else:
        page.mouse.move(x,y)
        page.mouse.down()
        page.mouse.move(x+dx,y,steps=3)
        page.mouse.up()
    page.wait_for_function("""['skill-slot-1','skill-slot-2'].every(role=>!!document.querySelector('[data-combat-hud-skill-role="'+role+'"]').style.translate)""")
    assert first_skill.bounding_box()["x"] > first_box["x"]
    assert second_skill.bounding_box()["x"] > second_box["x"]
    toolbar.locator("[data-hud-author-undo]").click()
    page.wait_for_function("""['skill-slot-1','skill-slot-2'].every(role=>!document.querySelector('[data-combat-hud-skill-role="'+role+'"]').style.translate)""")
    toolbar.locator("[data-hud-author-page-select]").select_option("main:0")
    assert not arena.locator('[data-combat-hud-skill-role="skill-slot-1"]').is_visible()
    assert arena.locator('[data-combat-hud-skill-role="skill-slot-3"]').is_visible()
    toolbar.locator("[data-hud-author-test]").click()
    assert page.locator("[data-hud-author-overlay]").count() == 0
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
      await wait();const after=hp.getBoundingClientRect(),applied=hp.style.translate;
      const successWarning=warning;
      mounted.dispose();
      const reset=hp.getBoundingClientRect();
      const bad=updateCaptureHudLayoutV1(layout,profile,'local-status',{dx:-50,dy:0,scale:100});
      const rejected=mountCaptureHudLayoutPreviewV1({root,layout:bad,onStatus:m=>warning=m});
      await wait();const blocked=warning,restored=hp.style.translate;
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
