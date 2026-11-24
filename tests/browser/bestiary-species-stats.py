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
    page.evaluate("""async ([id,database])=>{
      const {createCaptureUniverseDatabaseStoreV1}=await import('/src/contracts/capture-universe-database-store-v1.js');
      createCaptureUniverseDatabaseStoreV1({storage:localStorage}).create(id,database);
    }""", [project, database])
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
    page.locator("[data-combat-hud-layout-editor] summary").click()
    profile = "desktop-1v1" if page.evaluate("matchMedia('(min-width:1100px) and (min-height:650px) and (pointer:fine)').matches") else "touch-1v1"
    page.locator("[data-hud-layout-profile]").select_option(profile)
    page.locator("[data-hud-layout-role]").select_option("local-status")
    page.locator("[data-hud-layout-x]").fill("1")
    page.locator("[data-hud-layout-y]").fill("-1")
    page.get_by_role("button", name="Enregistrer le catalogue de cet univers").click()
    page.wait_for_function("document.querySelector('[data-capture-universe-project-editor] [role=status]').textContent.includes('révision 3')")
    page.goto(editor_url, wait_until="domcontentloaded")
    page.locator("[data-combat-hud-layout-editor] summary").click()
    page.locator("[data-hud-layout-profile]").select_option(profile)
    page.locator("[data-hud-layout-role]").select_option("local-status")
    assert page.locator("[data-hud-layout-x]").input_value() == "1"
    assert page.locator("[data-hud-layout-y]").input_value() == "-1"
    # Apply the real layout controller to the ONE editor template in a visible
    # preview shell. The native author preview mounts this same controller.
    geometry = page.evaluate("""async ([id,profile])=>{
      const {createCaptureUniverseDatabaseStoreV1}=await import('/src/contracts/capture-universe-database-store-v1.js');
      const {mountCaptureHudLayoutPreviewV1}=await import('/src/ui/capture-hud-layout-preview-v1.js');
      const {updateCaptureHudLayoutV1}=await import('/src/contracts/capture-hud-layout-v1.js');
      const layout=createCaptureUniverseDatabaseStoreV1({storage:localStorage}).load(id).database.metadata.combatHudLayoutV1;
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
      for(let i=0;i<5;i++){const b=document.createElement('button');b.className='action-option action-option--skill';b.textContent='Slot '+(i+1);grid.append(b);}
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
