import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path){ return readFile(new URL("../../"+path,import.meta.url),"utf8"); }
test("exactly one enemy reserve details control sits beside opponent-1 HP card, not in local skill commands",async()=>{
  const html=await read("examples/dom-demo/capture-editor-v2.html");
  const marker='data-combat-enemy-reserves hidden';
  assert.equal(html.split(marker).length-1,1,"single Roster-owned panel, no duplicate source of truth");
  const opponent=html.match(/<button[^>]*class="squad-card squad-card--opponent"[^>]*>[\s\S]*?<\/button>/);
  const second=html.match(/<button[^>]*class="squad-card squad-card--opponent-b"[^>]*>/);
  const panel=html.match(/<details[^>]*class="combat-test-enemy-reserves"[^>]*>[\s\S]*?<\/details>/);
  assert.ok(opponent&&second&&panel,"two opponent HUD buttons and enemy panel remain present");
  const hp=opponent[0].indexOf('data-combat-hp="opponent-1"');
  assert.ok(hp>=0,"first enemy health bar is still inside the targeting button");
  const opponentEnd=html.indexOf(opponent[0])+opponent[0].length;
  const panelStart=html.indexOf(panel[0]);
  const secondStart=html.indexOf(second[0]);
  assert.ok(opponentEnd < panelStart && panelStart < secondStart,
    "enemy reserve tab must follow first enemy HP card and precede second opponent card");
  assert.ok(panel[0].includes("data-combat-enemy-reserves-list"));
  assert.ok(panel[0].includes("data-combat-enemy-reserves-summary"));
  const localCommands=html.slice(html.indexOf('<div class="coop-command-stack">'));
  assert.ok(!localCommands.includes(marker),"enemy reserve control must not return below local attack bar");
});
test("upper enemy HUD anchor and downward touch panel use landscape-bounded styles",async()=>{
  const css=await read("examples/dom-demo/capture-editor-v2.css");
  const shell=css.match(/\.capture-preview-shell \.arena--coop-2v2 > \.combat-test-enemy-reserves\s*\{([^}]+)\}/);
  assert.ok(shell,"the enemy reserve tab must be directly anchored to the arena HUD");
  assert.match(shell[1],/position:\s*absolute/);
  assert.match(shell[1],/top:\s*0\.45rem/);
  assert.match(shell[1],/right:\s*calc\(/);
  const popup=css.match(/\.combat-test-enemy-reserves__body\s*\{([^}]+)\}/);
  assert.ok(popup);
  assert.match(popup[1],/top:\s*calc\(100% \+ /,"opens downward from the enemy HP tab");
  assert.match(popup[1],/max-height:\s*min\(/);
  assert.ok(css.includes('capture-preview-shell[data-landscape-required="true"] .arena--coop-2v2 > .combat-test-enemy-reserves'),
    "mobile landscape cards have a dedicated adjacent layout");
});
