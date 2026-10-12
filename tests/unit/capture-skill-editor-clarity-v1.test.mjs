import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
const css=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.css",import.meta.url),"utf8");
const section=html.slice(html.indexOf('<article class="card">',html.indexOf('data-skill-fx-unified-flow')));

test("Cast, projectile, layers, impact and zone have first-class accessible phase sections",()=>{
  assert.match(html,/<details[^>]*data-skill-fx-advanced[^>]*open/);
  for(const phase of ["cast","projectile","layers","impact","zone"]){
    const re=new RegExp('<details[^>]*data-skill-fx-phase="'+phase+'"[^>]*>[\\s\\S]*?<summary>[^<]+<\\/summary>');
    assert.match(section,re,phase+" needs a dedicated summary");
  }
  assert.match(css,/\\.skill-fx-phase\\s*>\\s*summary/);
});

test("numeric Glow, trail and smoke fine tuning stays closed until explicitly requested",()=>{
  assert.match(section,/<details[^>]*data-skill-fx-expert(?![^>]*\\bopen\\b)[^>]*>/);
  assert.match(section,/data-skill-fx-expert[\\s\\S]*?data-skill-fx-glow-strength/);
  assert.match(section,/data-skill-fx-expert[\\s\\S]*?data-skill-projectile-trail-count/);
  assert.match(section,/data-skill-fx-expert[\\s\\S]*?data-skill-aftermath-smoke-count/);
  assert.match(section,/data-skill-fx-quick-profile/);
});

test("all existing presentation selectors stay unique and the combat tuning path stays intact",()=>{
  for(const attr of [
    "data-skill-icon","data-skill-socket","data-skill-cast-fx","data-skill-cast-scale",
    "data-skill-travel-fx","data-skill-travel-far-scale","data-skill-trajectory-mode",
    "data-skill-impact-fx","data-skill-impact-duration","data-skill-zone-fx",
    "data-skill-fx-glow-strength","data-skill-projectile-trail-count","data-skill-aftermath-smoke-count"
  ]){
    const matches=html.match(new RegExp('\\\\b'+attr+'(?=[\\\\s=>])','g'))??[];
    assert.equal(matches.length,1,attr+" must not be duplicated or lost");
  }
});
