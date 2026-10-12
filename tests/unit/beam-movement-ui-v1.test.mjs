import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
const css=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.css",import.meta.url),"utf8");
const beamJs=await readFile(new URL("../../src/ui/capture-editor-beam-stage-layout-v1.js",import.meta.url),"utf8");

test("the one existing beam three-phase editor belongs to Visuals, never a numbered 4 bis card",()=>{
  const movement=html.indexOf("<h2>Mouvement</h2>");
  const visuals=html.indexOf("<h2>Effets visuels</h2>");
  const beam=html.indexOf('data-skill-beam-stage-editor');
  const audio=html.indexOf("<h2>Audio de la capacité</h2>");
  assert.ok(0<movement && movement<visuals && visuals<beam && beam<audio);
  assert.doesNotMatch(html,/class="step">4 bis/);
  assert.equal((html.match(/data-skill-beam-stage-editor/g)||[]).length,1);
  assert.match(html,/<section[^>]*data-skill-beam-stage-editor[^>]*data-beam-active="false"/);
  assert.match(css,/\[data-skill-beam-stage-editor\]\[data-beam-active="false"\]/);
  for(const stage of ["start","body","impact"]){
    assert.equal((html.match(new RegExp('data-beam-stage="'+stage+'"','g'))||[]).length,1);
    assert.equal((html.match(new RegExp('data-beam-stage-fields="'+stage+'"','g'))||[]).length,1);
  }
});

test("beam reuses the exact canonical field instances: no second socket, beam head, travel or impact",()=>{
  for(const attr of ["data-skill-socket","data-skill-beam-start-fx","data-skill-beam-start-scale","data-skill-travel-fx","data-skill-impact-fx"]){
    assert.equal((html.match(new RegExp("\\b"+attr+"\\b","g"))||[]).length,1,attr);
    assert.ok(beamJs.includes('"['+attr+']"'),attr+" must be moved, not duplicated");
  }
  assert.match(beamJs,/dest\.append\(label\)/);
});

test("mobile Movement targets and presence choices are compact checkbox-before-label rows",()=>{
  const start=html.indexOf("<h2>Mouvement</h2>");
  const end=html.indexOf("<h2>Timing</h2>",start);
  const movement=html.slice(start,end);
  assert.equal((movement.match(/class="editor-choice-group skill-movement-choices"/g)||[]).length,2);
  assert.equal((movement.match(/<label class="check">/g)||[]).length,5);
  for(const a of ["data-skill-hit-presence-enabled","data-skill-hit-presence","data-skill-location-scope","data-skill-dodgeable"]){
    assert.ok(movement.includes(a));
  }
  assert.match(css,/\.skill-movement-choices\s*>\s*label\.check\s*\{[^}]*display:\s*flex/s);
  assert.match(css,/\.skill-movement-choices\s*>\s*label\.check\s*input\[type="checkbox"\]\s*\{[^}]*width:\s*1\./s);
});
