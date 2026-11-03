import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const css=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.css",import.meta.url),"utf8");
const base=css.slice(css.indexOf("/* Keep perceived creature size tied to the short edge"));
const two=css.slice(css.indexOf("/* Capture landscape 2v2 depth V2"));
const rule=(source,selector)=>{
  const escaped=selector.replace(/[.*+?^\u0024{}()|[\]\\]/g,"\\$&");
  const match=source.match(new RegExp(escaped+"\\s*\\{([^}]+)\\}"));
  assert.ok(match,"missing landscape rule "+selector);
  return match[1];
};
const one={
  ".arena--coop-2v2 .fighter--player":16.3125,
  ".arena--coop-2v2 .fighter--ally":15.1875,
  ".arena--coop-2v2 .fighter--opponent":17.4375,
  ".arena--coop-2v2 .fighter--opponent-b":16.875
};
const twoActors={
  '.arena--coop-2v2[data-combat-active-count="2"] .fighter--opponent':13.5,
  '.arena--coop-2v2[data-combat-active-count="2"] .fighter--opponent-b':12.9375
};

test("RED: phone-approved fighter sizes must remain a constant share of the 16:9 arena on PC",()=>{
  for(const [selector,percentage] of Object.entries(one)){
    const declaration=rule(base,selector);
    assert.match(declaration,new RegExp("width:\\s*"+percentage+"%;"),selector);
    assert.doesNotMatch(declaration,/width:\s*min\(|dvh|rem/,selector+" must never cap desktop");
  }
  for(const [selector,percentage] of Object.entries(twoActors)){
    const declaration=rule(two,selector);
    assert.match(declaration,new RegExp("width:\\s*"+percentage+"%;"),selector);
    assert.doesNotMatch(declaration,/width:\s*min\(|dvh|rem/,selector+" must never cap desktop");
  }
});

test("1v1 and 2v2 authored depth positions and 16:9 landscape arena are unchanged",()=>{
  assert.match(css,/aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(css,/--arena-coop-far-primary-y:\s*33%;/);
  assert.match(css,/--arena-coop-far-secondary-y:\s*34%;/);
  assert.match(two,/--arena-coop-far-primary-y:\s*30%;/);
  assert.match(two,/--arena-coop-far-secondary-y:\s*28%;/);
  assert.match(two,/\.fighter--opponent\s*\{\s*left:\s*68%/);
  assert.match(two,/\.fighter--opponent-b\s*\{\s*left:\s*46%/);
});
