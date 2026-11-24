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
