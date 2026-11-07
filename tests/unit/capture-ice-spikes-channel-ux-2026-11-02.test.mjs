import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildHumanSkillDraftV1,humanSkillEditorFieldsFromDraftV1} from "../../src/ui/capture-editor-human-v2.js";
const raw=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const template=()=>JSON.parse(raw("data/capture/showcase/poing_givrant.capture-skill-transfer-v1.json")).draft;
test("canonical channeled ice spike is an area pulse, not a physical projectile, with under-target visual",()=>{
 const fields=humanSkillEditorFieldsFromDraftV1(template());
 const definition=buildHumanSkillDraftV1({...fields,form:"area",category:"offensive",element:"ice",
   effects:[],contactHold:null,chargedAttack:null,chargedEffects:null,
   presentation:{...fields.presentation,travelTrajectoryMode:"under_target"},
   channeling:{tickIntervalMs:1000,maxDurationMs:5000,maxTicks:4,energyCostPerTick:3,
     effects:[{kind:"damage",targetScope:"target",amount:12,channel:"ice"}]}}).definition;
 assert.equal(definition.form,"area");
 assert.equal(definition.channeling.effects[0].amount,12);
 assert.equal(definition.effects.length,0);
 assert.equal(definition.projectileTargeting,"direct");
 assert.throws(()=>buildHumanSkillDraftV1({...fields,form:"projectile",
   channeling:definition.channeling,effects:[],chargedAttack:null,chargedEffects:null,contactHold:null}),
   /channeling cannot combine/,"other projectile attack mechanics remain incompatible");
});
test("RED: author can choose a visible channeled ice-spike setup and understands which sprites run per tick",()=>{
 const html=raw("examples/dom-demo/capture-editor-v2.html");
 assert.match(html,/data-skill-channel-ice-preset/);
 assert.match(html,/Pics de glace canalisés/);
 assert.match(html,/sprite Trajet.*pulsation/s);
 const editor=raw("src/ui/capture-editor-human-v2.js");
 assert.match(editor,/data-skill-channel-ice-preset/);
 assert.match(editor,/data-skill-trajectory-mode/);
});
test("RED: native renderer owns ground-rising pulse; no duplicate projectile collision or timers",()=>{
 const fx=raw("src/adapters/renderer/dom-skill-fx.js");
 assert.match(fx,/channel-pulse/);
 assert.match(fx,/projectileTargetRect\(targetSlot\)\.bottom/);
 const one=raw("src/ui/combat-test-ui.js");
 const two=raw("src/ui/combat-2v2-test-ui.js");
 assert.match(one,/type:"channel-pulse"/);
 assert.match(two,/type:"channel-pulse"/);
});
