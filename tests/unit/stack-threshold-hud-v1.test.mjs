import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const hudPath = new URL("../../src/adapters/renderer/dom-status-fx.js", import.meta.url);
const editorPath = new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url);

test("HUD reads the one native status instance stack count and configured threshold", async()=>{
  const hud = await readFile(hudPath,"utf8");
  assert.match(hud,/instance\?\.definition\?\.onStackThreshold\?\.count/);
  assert.match(hud,/Number\(instance\?\.stacks\)/);
  assert.match(hud,/thresholdCount === null \? String\(stacks\) : stacks \+ "\/" \+ thresholdCount/);
  assert.match(hud,/stacks > 1 \|\| thresholdCount !== null/);
  assert.doesNotMatch(hud,/setInterval|localStorage|stackCounter/);
});

test("human editor has explicit threshold count, consume policy and multiple visible effect controls",async()=>{
  const source=await readFile(editorPath,"utf8");
  for(const selector of ["stackThresholdEnabled","stackThresholdCount","stackThresholdConsume",
    "stackThresholdEffectsHost","stackThresholdEffectKind","stackThresholdEffectScope",
    "stackThresholdStatusKind","stackThresholdAdd"]) {
    assert.ok(source.includes(selector),"missing threshold editor control: "+selector);
  }
  assert.match(source,/readStackThresholdEffectRowsV1/);
  assert.match(source,/buildHumanTacticalSkillEffectsV1\(status\.onStackThreshold\.effects/);
  assert.match(source,/status\.onStackThreshold =/);
  assert.match(source,/appendStackThresholdEffectRowV1\(thresholdEffectsHost/);
});
