import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { humanCreatureSelectorGroupsV1 } from "../../src/ui/capture-editor-human-v2.js";
import { mountCaptureEditorCombatTeamControlsV1 } from "../../src/ui/capture-editor-combat-test-v1.js";
import { CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";

const read = async (p) => readFile(new URL("../../" + p, import.meta.url), "utf8");
class Select {
  constructor(v = "") { this.value=v; this.options=[]; this.nodes=[]; this.handlers=new Map(); }
  set textContent(_v) { this.nodes=[]; this.options=[]; this.value=""; }
  append(n) { this.nodes.push(n); }
  addEventListener(n,fn) { this.handlers.set(n,fn); }
  removeEventListener(n,fn) { if(this.handlers.get(n)===fn) this.handlers.delete(n); }
}
test("both combat team dropdowns reuse configured creature element groups and preserve IDs on refresh", () => {
  const c = new Map([
    ["shade", { draft:{id:"shade",displayName:"Noctigriffe",elements:["shadow"]}}],
    ["fire", { draft:{id:"fire",displayName:"Braiseau",elements:["fire"]}}],
    ["water", { draft:{id:"water",displayName:"Aquafin",elements:["water"]}}]
  ]);
  const size=new Select("1"), enemySize=new Select("1"), active=new Select("1");
  const locals=Array.from({length:5},()=>new Select());
  const enemies=Array.from({length:6},()=>new Select());
  const ctrl={"[data-test-local-team-size]":size,"[data-test-opponent-team-size]":enemySize,"[data-active-per-team]":active};
  const createElement=tag=>({tag, label:"", value:"", textContent:"", children:[], append(n){this.children.push(n)}});
  const root={ownerDocument:{createElement}, querySelector:s=>ctrl[s]??null, querySelectorAll:s=>s==="[data-test-local-creature]"?locals:s==="[data-test-opponent-creature]"?enemies:s==="[data-test-team-member]"?[]:[]};
  const controller=mountCaptureEditorCombatTeamControlsV1({root,configuredCreatures:c,getSelectedCreatureId:()=>"shade",groupCreatures:humanCreatureSelectorGroupsV1});
  assert.deepEqual(locals[0].nodes.map(n=>n.label), ["Feu","Eau","Ombre"]);
  assert.deepEqual(enemies[0].nodes.map(n=>n.label), ["Feu","Eau","Ombre"]);
  assert.equal(enemies[0].nodes[2].children[0].value,"shade");
  enemies[0].value="shade";
  c.set("shade", {draft:{id:"shade",displayName:"Noctigriffe II",elements:["shadow"]}});
  controller.refresh();
  assert.equal(enemies[0].value,"shade");
  assert.equal(enemies[0].nodes[2].children[0].textContent,"Noctigriffe II · shade");
  controller.dispose();
});
test("marker charge cost authoring belongs only to Capacités, not Créature", async () => {
  const html=await read("examples/dom-demo/capture-editor-v2.html");
  const markers=[...html.matchAll(/data-marker-cost-card/g)];
  assert.equal(markers.length,1);
  assert.ok(markers[0].index > html.indexOf('data-editor-panel="skills"'));
  assert.ok(markers[0].index < html.indexOf('data-skill-marker-cost-enabled'));
  assert.ok(html.indexOf('data-creature-defensive-reaction') < html.indexOf('data-editor-panel="combat"'));
});
test("Noctigriffe and light barrier are active author exports without extra parallel identity", async () => {
  const c=JSON.parse(await read("data/capture/showcase/crea_ombre_2.capture-creature-transfer-v1.json"));
  const s=JSON.parse(await read("data/capture/showcase/lib_magic_barrier.capture-skill-transfer-v1.json"));
  assert.equal(c.draft.id,"crea_ombre_2");
  assert.equal(c.draft.displayName,"Noctigriffe");
  assert.deepEqual(c.draft.elements,["shadow"]);
  assert.equal(c.draft.presentation.viewOverrides.opponent.displayScale,0.6);
  assert.equal(c.loadout.creatureId,c.draft.id);
  assert.equal(s.draft.id,"lib_magic_barrier");
  assert.deepEqual(s.draft.definition.targetRelations,["enemy","self"]);
  assert.equal(s.draft.presentation.visual.cast.assetId,"pack:capture:sprite-light-shield-cast-01");
  assert.equal(s.draft.presentation.statusVisuals["lib_magic_barrier:0"].sprite.assetId,"pack:capture:sprite-light-shield-barrier-01");
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x.endsWith("crea_ombre_2.capture-creature-transfer-v1.json")).length,1);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x.endsWith("lib_magic_barrier.capture-skill-transfer-v1.json")).length,1);
});
