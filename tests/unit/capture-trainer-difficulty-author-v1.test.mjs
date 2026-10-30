import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  normalizeCaptureTrainerDifficultyAuthorFieldsV1,
  mountCaptureTrainerDifficultyAuthorV1
} from "../../src/ui/capture-trainer-difficulty-author-v1.js";

const rows = [
  {hpMultiplier:"1",outgoingDamagePctBonus:"0"},
  {hpMultiplier:"1.2",outgoingDamagePctBonus:"5"},
  {hpMultiplier:"1.5",outgoingDamagePctBonus:"10"},
  {hpMultiplier:"2",outgoingDamagePctBonus:"20"}
];
test("RED contract: no default coefficients; exactly four authored, distinct levels", () => {
  assert.throws(() => normalizeCaptureTrainerDifficultyAuthorFieldsV1(rows.map(() => ({hpMultiplier:"",outgoingDamagePctBonus:""}))), /Renseigne/);
  assert.throws(() => normalizeCaptureTrainerDifficultyAuthorFieldsV1(rows.slice(1)), /Quatre/);
  assert.throws(() => normalizeCaptureTrainerDifficultyAuthorFieldsV1(rows.map(() => ({hpMultiplier:"1",outgoingDamagePctBonus:"0"}))), /distinct|measurable/i);
  assert.throws(() => normalizeCaptureTrainerDifficultyAuthorFieldsV1([{hpMultiplier:"0",outgoingDamagePctBonus:"0"},...rows.slice(1)]), /positive/i);
  assert.equal(normalizeCaptureTrainerDifficultyAuthorFieldsV1(rows).levels[3].hpMultiplier, 2);
});
test("native author form imports only a valid policy and requires consent before overwriting", () => {
  const handlers = new Map();
  const input = () => ({value:""});
  const fieldRows = Array.from({length:4}, () => {
    const hp = input(), damage = input();
    return {querySelector: selector => selector.includes("-hp]") ? hp : damage};
  });
  const button = {addEventListener:(event,cb)=>handlers.set(event,cb),removeEventListener:(event)=>handlers.delete(event)};
  const upload = {...button,files:[],value:""};
  const replace = {checked:false}, status = {textContent:"",dataset:{}};
  const root = {
    querySelectorAll:()=>fieldRows,
    querySelector: selector => selector.includes("-export]") ? button :
      selector.includes("-import]") ? upload :
      selector.includes("-replace]") ? replace : status
  };
  const editor = mountCaptureTrainerDifficultyAuthorV1({root});
  assert.throws(() => editor.read(), /Renseigne/);
  const policy = normalizeCaptureTrainerDifficultyAuthorFieldsV1(rows);
  editor.apply(policy);
  assert.deepEqual(editor.read(),policy);
  assert.throws(() => editor.apply(policy), /remplacement explicite/);
  assert.deepEqual(editor.apply(policy,{replace:true}),policy);
  editor.dispose();
  assert.equal(handlers.size,0);
  assert.throws(() => editor.apply(policy,{replace:true}), /fermé/);
});
test("the actual Combat Lab editor owns the UI, with blank author fields and explicit separate export", () => {
  const html = readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const js = readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.js",import.meta.url),"utf8");
  assert.match(html,/data-trainer-difficulty-author/);
  assert.equal((html.match(/data-trainer-difficulty-row/g)??[]).length,4);
  assert.match(html,/data-trainer-difficulty-replace/);
  assert.doesNotMatch(html,/data-trainer-difficulty-hp[^>]*value=/);
  assert.doesNotMatch(html,/data-trainer-difficulty-damage[^>]*value=/);
  assert.match(js,/mountCaptureTrainerDifficultyAuthorV1\(/);
});
