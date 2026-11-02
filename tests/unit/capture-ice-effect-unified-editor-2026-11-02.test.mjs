import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {captureEditorAssetMatchesRoleV1} from "../../src/ui/capture-editor-human-v2.js";
import {SKILL_EFFECT_V1_KINDS} from "../../src/contracts/skill-effect-v1.js";
const raw = path => readFileSync(new URL("../../"+path,import.meta.url),"utf8");

test("Ice spike is one original impact asset also usable as Trajet via explicit catalog compatibility",()=>{
  const ice = {
    id:"pack:capture:sprite-pointe-glace-01",assetType:"sprite",
    mediaType:"image",category:"impact",tags:["ice","ground","eruption"],
    compatibility:{uses:["combat","capture","editor"],editorRoles:["travel"]}
  };
  assert.equal(captureEditorAssetMatchesRoleV1(ice,"impact"),true);
  assert.equal(captureEditorAssetMatchesRoleV1(ice,"travel"),true);
  const original={...ice,compatibility:{uses:["combat","capture","editor"]}};
  assert.equal(captureEditorAssetMatchesRoleV1(original,"travel"),false,
    "other impacts must not become projectiles by accident");
  assert.equal(captureEditorAssetMatchesRoleV1({...ice,category:"creature",tags:["creature"]},"travel"),false);
});

test("One effect choice presents the canonical kinds, then opens only corresponding existing controls",()=>{
  const js=raw("src/ui/capture-editor-human-v2.js");
  const html=raw("examples/dom-demo/capture-editor-v2.html");
  assert.ok(SKILL_EFFECT_V1_KINDS.includes("damage"));
  assert.ok(SKILL_EFFECT_V1_KINDS.includes("apply_status"));
  assert.ok(SKILL_EFFECT_V1_KINDS.includes("scheduled_effect"));
  assert.match(js,/for\s*\(const\s+kind\s+of\s+SKILL_EFFECT_V1_KINDS\)/);
  assert.match(js,/syncGuidedEffectPanelsV1/);
  assert.match(html,/data-skill-effect-add-kind/);
  assert.match(html,/data-skill-effect-guide/);
  assert.match(html,/data-skill-charged-panel/);
  assert.match(html,/data-skill-charged-effects-panel/);
  assert.match(html,/data-skill-channeling-section/);
  assert.match(html,/data-skill-contact-hold/);
});

test("Selection does not rewrite historic skill definitions, data imports, or remove effect hosts",()=>{
  const html=raw("examples/dom-demo/capture-editor-v2.html");
  for(const selector of ["data-skill-effects-host","data-skill-channeling-effects-host",
    "data-skill-contact-hold-effects-host","data-skill-charged-enabled",
    "data-skill-channeling-enabled","data-skill-contact-hold-enabled"]){
    assert.ok(html.includes(selector),selector);
  }
});
