import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveCombatPreviewFormatV1 } from "../../src/ui/combat-2v2-test-ui.js";

const css=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.css",import.meta.url),"utf8");
const ui=readFileSync(new URL("../../src/ui/combat-2v2-test-ui.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");

const arenaStyles=css.slice(css.indexOf("/* Capture landscape opponent slot placement V1"),css.indexOf("/* Rayon :"));
function format(count) {
  const first=["local-1","enemy-1"], second=["local-2","enemy-2"];
  const actorIds=count===1?first:[...first,...second];
  return {localActorId:"local-1",actors:actorIds.map(actorId=>({actorId})),
    teams:{local:actorIds.filter(id=>id.startsWith("local")),enemy:actorIds.filter(id=>id.startsWith("enemy"))}};
}
test("1v1 and 2v2 derive actual active slot count from authoritative BattleFormat",()=>{
  assert.equal(resolveCombatPreviewFormatV1(format(1)).localActorIds.length,1);
  assert.equal(resolveCombatPreviewFormatV1(format(2)).localActorIds.length,2);
  assert.match(ui,/arena\.dataset\.combatActiveCount\s*=\s*String\(previewFormat\.localActorIds\.length\)/);
  assert.match(html,/class="arena arena--coop-2v2"/,
    "the shared HTML class must not be mistaken for an actual 2v2 battle");
});
test("1v1 retains the *exact* pre-regression landscape positions, independently of the new 2v2 look",()=>{
  assert.match(arenaStyles,/\.arena--coop-2v2\s*\{\s*--arena-coop-far-primary-y:\s*33%;\s*--arena-coop-far-secondary-y:\s*34%;\s*\}/);
  assert.match(arenaStyles,/\.arena--coop-2v2 \.fighter--opponent\s*\{\s*left:\s*77%;\s*\}/);
  assert.match(arenaStyles,/\.arena--coop-2v2 \.fighter--opponent-b\s*\{\s*left:\s*34%;\s*\}/);
});
test("new 2v2 enemy perspective applies to 2 real active slots, never the shared 1v1 class",()=>{
  assert.match(arenaStyles,/\.arena--coop-2v2\[data-combat-active-count="2"\]\s*\{\s*--arena-coop-far-primary-y:\s*26%;\s*--arena-coop-far-secondary-y:\s*28%;\s*\}/);
  assert.match(arenaStyles,/\.arena--coop-2v2\[data-combat-active-count="2"\] \.fighter--opponent\s*\{\s*left:\s*63%;\s*width:\s*min\(24dvh,\s*13rem\);/);
  assert.match(arenaStyles,/\.arena--coop-2v2\[data-combat-active-count="2"\] \.fighter--opponent-b\s*\{\s*left:\s*41%;\s*width:\s*min\(23dvh,\s*12\.5rem\);/);
  assert.doesNotMatch(arenaStyles,/transform\s*:|--creature-display-scale\s*:|--distance-scale\s*:/);
});
