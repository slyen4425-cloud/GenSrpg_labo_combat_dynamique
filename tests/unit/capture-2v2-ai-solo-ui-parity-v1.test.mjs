import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveCombatPreviewFormatV1 } from "../../src/ui/combat-2v2-test-ui.js";

const css = readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8");
const ui = readFileSync(new URL("../../src/ui/combat-2v2-test-ui.js", import.meta.url), "utf8");
const begin = css.indexOf("/* Combat 2v2 readable mobile HUD and enemy bench V1");
const end = css.indexOf("/* Solo 2v2 controls only: render focus", begin);
const layout = css.slice(begin, end);
const perspective = css.slice(css.indexOf("/* Capture landscape 2v2 depth V2"), css.indexOf("/* Rayon :", css.indexOf("/* Capture landscape 2v2 depth V2")));

function fmt(n) {
 const ids = n === 1 ? ["local-1","opponent-1"] : ["local-1","opponent-1","local-2","opponent-2"];
 return { localActorId:"local-1",actors: ids.map(actorId=>({actorId})),teams:{ local: ids.filter(x=>x.startsWith("local")),enemy:ids.filter(x=>x.startsWith("opponent")) } };
}

test("The real active team count gates shared IA and solo compact 2v2 HUD, never 1v1", () => {
 assert.equal(resolveCombatPreviewFormatV1(fmt(1)).localActorIds.length, 1);
 assert.equal(resolveCombatPreviewFormatV1(fmt(2)).localActorIds.length, 2);
 assert.match(ui, /arena\.dataset\.combatActiveCount\s*=\s*String\(previewFormat\.localActorIds\.length\)/);
 assert.ok(begin > 0 && end > begin);
 assert.doesNotMatch(layout, /\[data-local-control-mode="solo-dual"\] \.coop-command-stack/,
   "AI mode must receive the same compact dock as solo without changing controller ownership");
 assert.match(layout, /\.arena--coop-2v2\[data-combat-active-count="2"\] \.coop-command-stack\s*\{[^}]*width:\s*min\(19rem,\s*34%\)/s);
 assert.match(layout, /\.arena--coop-2v2\[data-combat-active-count="2"\] \.squad-card--command-ally\s*\{[^}]*position:\s*absolute/s);
 assert.match(layout, /\.arena--coop-2v2\[data-combat-active-count="2"\] \.action-option--skill\s*\{[^}]*aspect-ratio:\s*auto/s);
 assert.match(layout, /\.arena--coop-2v2\[data-combat-active-count="2"\] \.combat-dodge-action--arena\s*\{[^}]*right:/s);
 assert.doesNotMatch(layout, /\[data-combat-active-count="1"\]/);
});

test("Both 2v2 enemies shift modestly right, without changing their Y, sizes, or 1v1 fallback",()=>{
 assert.match(perspective, /\.arena--coop-2v2\[data-combat-active-count="2"\] \.fighter--opponent\s*\{\s*left:\s*63%;\s*width:\s*min\(24dvh,\s*13rem\)/);
 assert.match(perspective, /\.arena--coop-2v2\[data-combat-active-count="2"\] \.fighter--opponent-b\s*\{\s*left:\s*41%;\s*width:\s*min\(23dvh,\s*12\.5rem\)/);
 const fallback = css.slice(css.indexOf("/* Capture landscape opponent slot placement V1"),css.indexOf("/* Capture landscape 2v2 depth V2"));
 assert.match(fallback, /--arena-coop-far-primary-y:\s*33%/);
 assert.match(fallback, /\.fighter--opponent\s*\{\s*left:\s*77%/);
 assert.doesNotMatch(perspective, /transform\s*:|--creature-display-scale\s*:/);
});

test("Native allied status card and abilities remain one shared HUD, while solo switch stays optional",()=>{
 assert.match(html, /data-combat-action="local-2"/);
 assert.match(html, /data-combat-hp="local-2"/);
 assert.match(html, /data-combat-actor-charge="local-2"/);
 assert.match(html, /data-combat-enemy-reserves/);
 assert.match(html, /data-combat-dodge/);
 assert.match(html, /data-combat-roster-command="switch"/);
 assert.match(html, /data-combat-skills/);
 assert.match(ui, /root\.dataset\.localControlMode\s*=\s*localControl\.mode/);
 assert.match(css, /\[data-local-control-mode="solo-dual"\] \[data-controlled-actor="true"\]/);
});
