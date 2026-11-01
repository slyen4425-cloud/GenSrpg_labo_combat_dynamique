import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildHumanSkillDraftV1,
  humanSkillEditorFieldsFromDraftV1
} from "../../src/ui/capture-editor-human-v2.js";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {adaptCaptureSkillToSkillDefinition} from "../../src/adapters/input/capture/capture-skill-to-skill-definition.js";

const basic = () => ({
  id: "sangsue-test", name: "Sangsue", description: "Contact prolongé",
  category: "offensive", requiredLevel: 1, usageScopes: ["capture", "combat"],
  form: "contact", approachMode: "ground", element: "shadow",
  energyCost: 4, preparationMs: 180, travelMs: 500, recoveryMs: 350,
  cooldownMs: 5000, projectileClash: {power:0}, targetLocations:["active"],
  effectTags: [], effects: [
    {kind:"damage",targetScope:"target",amount:2,channel:"shadow"}
  ], presentation:{iconAssetId:"core:icon-skill-fireball-01"}
});
const pulse = [
  {kind:"damage",targetScope:"target",amount:7,channel:"shadow"},
  {kind:"heal",targetScope:"self",amount:3},
  {kind:"life_steal",targetScope:"self",percent:30}
];

test("Sangsue export preserves independent direct and pulse effects through editor draft and transfer",()=>{
  const draft=buildHumanSkillDraftV1({
    ...basic(),
    contactHold:{tickIntervalMs:1000,maxDurationMs:0,effects:pulse}
  });
  assert.equal(draft.definition.form,"contact");
  assert.equal(draft.definition.approachMode,"ground");
  assert.equal(draft.definition.contactHold.tickIntervalMs,1000);
  assert.equal(draft.definition.contactHold.maxDurationMs,0);
  assert.deepEqual(draft.definition.contactHold.effects.map(x=>x.kind),["damage","heal","life_steal"]);
  assert.equal(draft.definition.effects.length,1,"direct impact remains independent");
  assert.equal(draft.definition.effects[0].amount,2);
  const fields=humanSkillEditorFieldsFromDraftV1(draft);
  assert.deepEqual(fields.contactHold.effects,draft.definition.contactHold.effects);
  assert.deepEqual(fields.effects,draft.definition.effects);
  const edited=buildHumanSkillDraftV1(fields);
  assert.deepEqual(edited.definition.contactHold,draft.definition.contactHold);
  assert.deepEqual(edited.definition.effects,draft.definition.effects);
  const exported=normalizeCaptureSkillTransferV1({schema:"capture-skill-transfer-v1",version:1,draft:edited});
  assert.deepEqual(exported.draft.definition.contactHold,draft.definition.contactHold);
  const combat=adaptCaptureSkillToSkillDefinition({id:draft.id,definition:exported.draft.definition});
  assert.deepEqual(combat.contactHold,draft.definition.contactHold);
});

test("classic effects and draft remain unchanged when Sangsue is not enabled",()=>{
  const draft=buildHumanSkillDraftV1(basic());
  assert.equal(Object.hasOwn(draft.definition,"contactHold"),false);
  const fields=humanSkillEditorFieldsFromDraftV1(draft);
  assert.equal(fields.contactHold,null);
  assert.deepEqual(buildHumanSkillDraftV1(fields).definition.effects,draft.definition.effects);
});

test("incompatible approach or duplicate scheduler are rejected by core, not silently exported",()=>{
  assert.throws(()=>buildHumanSkillDraftV1({...basic(),form:"projectile",
    contactHold:{tickIntervalMs:1000,effects:pulse}}),/contactHold requires/);
  assert.throws(()=>buildHumanSkillDraftV1({...basic(),approachMode:"teleport",
    contactHold:{tickIntervalMs:1000,effects:pulse}}),/contactHold requires/);
  assert.throws(()=>buildHumanSkillDraftV1({...basic(),
    contactHold:{tickIntervalMs:1000,effects:[{kind:"persistent_zone"}]}}));
  assert.throws(()=>buildHumanSkillDraftV1({...basic(),
    contactHold:{tickIntervalMs:50,effects:pulse}}));
});

test("editor keeps three separate effect hosts and one shared row serializer",()=>{
  const html=readFileSync("examples/dom-demo/capture-editor-v2.html","utf8");
  const js=readFileSync("src/ui/capture-editor-human-v2.js","utf8");
  for(const selector of ["data-skill-contact-hold-enabled","data-skill-contact-hold-interval",
    "data-skill-contact-hold-duration","data-skill-contact-hold-effects-host",
    "data-skill-contact-hold-effect-add"]) {
    assert.match(html,new RegExp(selector));
    assert.match(js,new RegExp(selector));
  }
  assert.equal((html.match(/data-skill-effects-host/g)||[]).length,1);
  assert.equal((html.match(/data-skill-contact-hold-effects-host/g)||[]).length,1);
  assert.equal((html.match(/data-skill-channeling-effects-host/g)||[]).length,1);
  assert.match(js,/one\(root, hostSelector\)\.querySelectorAll/);
  assert.match(js,/for \(const effectsHost of \[skillEffectsHost, contactHoldEffectsHost, channelingEffectsHost\]\)/);
  assert.match(js,/writeHumanContactHoldFieldsV1\(root, null, statRegistry\)/);
});
