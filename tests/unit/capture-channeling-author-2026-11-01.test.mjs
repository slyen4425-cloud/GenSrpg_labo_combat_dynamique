import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const text=(path)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const html=text("examples/dom-demo/capture-editor-v2.html");
const ui=text("src/ui/capture-editor-human-v2.js");
const bestiary=text("src/ui/capture-skill-explanation-v1.js");

test("channeling author controls include interval, cost, limits, interruptions and native effects",()=>{
  for(const attribute of [
    "data-skill-channel-enabled","data-skill-channel-settings",
    "data-skill-channel-interval","data-skill-channel-duration",
    "data-skill-channel-max-ticks","data-skill-channel-energy-per-tick",
    "data-skill-channel-stop-damage","data-skill-channel-stop-stun",
    "data-skill-channel-stop-silence","data-skill-channel-effects-host",
    "data-skill-channel-effect-add"
  ]) assert.match(html,new RegExp(attribute+"(?:[=\\s>])"),attribute);
});

test("authoring hydrates, reads, builds and resets the unique channeling contract",()=>{
  assert.match(ui,/channeling:\s*definition\.channeling\s*\?\?\s*null/);
  assert.match(ui,/fields\.channeling\s*\?\s*\{/);
  assert.match(ui,/writeHumanChannelingFieldsV1\(root,\s*fields\.channeling/);
  assert.match(ui,/writeHumanChannelingFieldsV1\(root,\s*null/);
  assert.match(ui,/data-skill-channel-effects-host/);
  assert.match(ui,/readHumanSkillEffectsV1\(root,\s*"\[data-skill-channel-effects-host\]"/);
});

test("bestiaire describes per-tick effects and energy as part of the actual native channeling definition",()=>{
  assert.match(bestiary,/if\(d\.channeling\)/);
  assert.match(bestiary,/energyCostPerTick/);
  assert.match(bestiary,/tickIntervalMs/);
  assert.match(bestiary,/descriptions\(.*effects/);
});
