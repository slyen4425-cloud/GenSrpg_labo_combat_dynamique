import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createDomDamageFeedbackRenderer} from "../../src/adapters/renderer/dom-damage-feedback.js";

test("desktop HUD overrides stay opt-in and do not touch mobile or combat geometry", async () => {
  const css=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.css",import.meta.url),"utf8");
  const marker="/* PC-only combat legibility.";
  const start=css.indexOf(marker);
  assert.ok(start>0,"PC-only block exists");
  const desktop=css.slice(start);
  assert.match(desktop,/@media \(min-width: 1100px\) and \(min-height: 680px\) and \(pointer: fine\)/);
  for(const selector of [".combat-controls",".combat-card",".squad-card--local-full",".coop-command-stack",".action-option--skill",".action-option__icon"]){
    assert.ok(desktop.includes(selector),"desktop sizing includes "+selector);
  }
  // The preview always inherits the original 16:9, actor offsets and collision plane.
  assert.doesNotMatch(desktop,/\.fighter--player|\.fighter--opponent|\.arena\s*\{|data-combat-arena\]\s*\{/);
  const rules=desktop.split("\n").filter(line=>line.trim().startsWith(".capture-preview-shell"));
  assert.ok(rules.length>=10);
  assert.ok(rules.every(line=>line.includes('[data-landscape-required="true"]')),
    "no unscoped global or smartphone overrides");
});

test("taking damage preserves intentional creature hit blink",async()=>{
  const calls=[];
  const image={animate(frames,options){
    calls.push({frames,options});
    return {finished:Promise.resolve(),cancel(){}};
  }};
  const renderer=createDomDamageFeedbackRenderer({
    targetFor(id){assert.equal(id,"enemy");return {image};}
  });
  const hit=renderer.flash("enemy",{delayMs:120});
  assert.equal(hit.status,"running");
  assert.equal(calls.length,1);
  assert.equal(calls[0].options.delay,120);
  assert.equal(calls[0].options.duration,280);
  assert.deepEqual(calls[0].frames.map(frame=>frame.opacity),
    [1,0.32,1,0.45,1],
    "author-intended damage flash must remain on the creature only");
  assert.ok(calls[0].frames.every(frame=>!Object.hasOwn(frame,"filter")),
    "damage flash must not impose compositor filter animations");
  await hit.finished;
  assert.equal(renderer.activeCount,0);
  renderer.dispose();
});
